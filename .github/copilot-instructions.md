# Copilot Instructions — serverless-blueprint

This project is a production-ready AWS Serverless starter built on
`@vifros/aws-serverless-core`. Use these instructions to generate code that
matches project conventions exactly.

---

## Stack

- **Runtime**: Node.js 22, TypeScript 5, strict mode
- **Framework**: Serverless Framework v3 + `serverless-offline`
- **Handler base**: `@vifros/aws-serverless-core` — `APIHandler`, `HandlerResponse`, `HandlerError`, `Logger`
- **Validation**: AJV via JSON Schema (auto-generated from TypeScript interfaces by `typescript-json-schema`)
- **Docs**: OpenAPI 3.0 (auto-generated from function YAML configs)

---

## Directory structure

```
src/
├── api/              ← HTTP Lambdas (API Gateway connected)
│   ├── {domain}/     ← one folder per bounded context (items, orders, etc.)
│   │   └── {action}/
│   │       ├── spec/
│   │       │   ├── request.interface.ts   ← SDD: source of truth for input shape
│   │       │   └── schemaValidator.json   ← generated from request.interface.ts
│   │       ├── handler.ts                 ← thin entry point, no business logic
│   │       └── {action}.ts               ← business logic only
│   └── docs/         ← Swagger UI + JSON spec endpoints
├── events/           ← Event-driven Lambdas (NOT HTTP)
│   └── system/       ← infrastructure events (warm-up, etc.)
│       └── {event}/
│           └── handler.ts
└── shared/           ← Code shared across all domains
    ├── enums/
    ├── interfaces/
    └── store/

config/
├── env/              ← Stage environment variables (local.yml, dev.yml)
└── functions/        ← Serverless function definitions, one file per domain
    ├── {domain}.yml  ← e.g. items.yml, orders.yml
    ├── docs.yml
    └── system.yml

docs/
├── openapi/          ← Generated OpenAPI spec (swagger-v1.json) — commit this
└── postman/          ← Postman collection + environment — import to test
```

---

## The two Lambda types

### `src/api/` — HTTP endpoint Lambdas

Always three files per action:

**`handler.ts`** — entry point only, no logic:
```typescript
import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {MyActionRequest} from './spec/request.interface';
import myActionSchema from './spec/schemaValidator.json'; // only if body validation needed
import myAction from './my-action';

async function initHandler(request: MyActionRequest): Promise<HandlerResponse> {
  const result = await myAction(request);
  return new HandlerResponse(result, StatusCodes.OK);
}

export const handler = new APIHandler(initHandler, {
  schemaValidator: myActionSchema, // omit if no body validation
}).lambdaHandler;
```

**`my-action.ts`** — business logic only:
```typescript
import {Logger} from '@vifros/aws-serverless-core';
import {MyActionRequest} from './spec/request.interface';

const logger = new Logger();

async function myAction(request: MyActionRequest): Promise<ResponseType> {
  logger.info('[myAction] Processing', {relevantField: request.someField});
  // ... logic
  return result;
}

export default myAction;
```

**`spec/request.interface.ts`** — input contract:
```typescript
import {Request} from '../../../../shared/interfaces/request.interface';

export interface MyActionRequest extends Request {
  /**
   * @TJS-description ##body## Field description.
   * @TJS-minLength 1
   */
  fieldName: string;
}
```

### `src/events/` — Event-driven Lambdas

Single `handler.ts` per event — no `APIHandler`, no schema, no request interface required:
```typescript
import {ScheduledEvent, Context, Callback} from 'aws-lambda';
import {Logger} from '@vifros/aws-serverless-core';

const logger = new Logger();

export async function handler(event: ScheduledEvent, _context: Context, callback: Callback): Promise<void> {
  logger.info('[myEvent] Processing event');
  // ... logic
  callback(null, 'done');
}
```

---

## Core classes

### `APIHandler`
```typescript
new APIHandler(initHandlerFn, {
  schemaValidator: jsonSchema,          // optional — enables AJV body validation
  resourcesToLoad: [Resources.LOGGER],  // optional — inject shared resources
}).lambdaHandler
```

### `HandlerResponse`
```typescript
return new HandlerResponse(data, StatusCodes.CREATED);   // 201
return new HandlerResponse(null, StatusCodes.NO_CONTENT); // 204
```

### `HandlerError`
```typescript
throw new HandlerError('Item not found', StatusCodes.NOT_FOUND, false, false);
//                      message           statusCode          stack  alert
```

### `Logger`
Never use `console.*` — always use `Logger`:
```typescript
const logger = new Logger();
logger.info('[myAction] Message', {key: 'value'});
logger.warn('[myAction] Warning', {itemId});
logger.error('[myAction] Error', error);
```
Log prefix convention: `[fileName.methodName]` or `[fileName] action description`

---

## SDD annotations for schema generation

In `spec/request.interface.ts`, annotate each field to tell the Swagger generator
where it comes from and to drive AJV validation:

| Annotation       | Source                   | Example use               |
|------------------|--------------------------|---------------------------|
| `##body##`       | JSON request body        | POST/PUT payload fields   |
| `##path##`       | URL path param (`{id}`)  | `id`, `orderId`, etc.     |
| `##query##`      | URL query string         | `page`, `limit`, filters  |
| `##header##`     | HTTP header              | custom headers            |

Additional JSDoc annotations supported by `typescript-json-schema`:
- `@TJS-minLength` / `@TJS-maxLength`
- `@TJS-minimum` / `@TJS-maximum`
- `@TJS-type` (e.g. `integer`, `number`)
- `@TJS-pattern` (regex)

---

## Adding a new HTTP endpoint

1. Create `src/api/{domain}/{action}/` with `handler.ts`, `{action}.ts`, `spec/request.interface.ts`
2. Add a `schemaValidator.json` placeholder in `spec/` (or run `npm run schema` after creating the interface)
3. Add the function to `config/functions/{domain}.yml`
4. Update `scripts/schema-generator.sh` SCHEMAS array if body/query validation needed
5. Update `scripts/generate-swagger.js` SCHEMA_MAP if schema is added
6. Add warm-up entry in `src/events/system/warm-up/handler.ts` FUNCTIONS_TO_WARM
7. Run `npm run schema && npm run swagger`

## Adding a new event-driven handler

1. Create `src/events/{domain}/{event-name}/handler.ts`
2. Add the function to `config/functions/system.yml` (or a new domain-specific file)
3. Register new function configs in `serverless.yml` if a new yml file was created

## Adding a new domain/service

1. Create `src/api/{domain}/` with the first endpoint
2. Create `config/functions/{domain}.yml`
3. Add `${file(config/functions/{domain}.yml)}` to `serverless.yml` functions list

---

## Naming conventions

| Thing                   | Convention          | Example                    |
|-------------------------|---------------------|----------------------------|
| Domain/service folder   | `kebab-case`        | `items/`, `orders/`        |
| Action folder           | `kebab-case`        | `create-item/`             |
| Business logic file     | `kebab-case`        | `create-item.ts`           |
| Interface name          | `PascalCase Request`| `CreateItemRequest`        |
| Serverless function key | `kebab-case`        | `create-item`              |
| API path                | `/v1/resource`      | `/v1/items`                |
| Log prefix              | `[file.method]`     | `[createItem] Creating`    |
| Error enum key          | `PascalCase`        | `ItemNotFound`             |

---

## Rules

- **No `any` types** — use `unknown` or proper TypeScript types
- **No `console.*`** — always use `Logger`
- **No logic in `handler.ts`** — entry point only, delegate to `{action}.ts`
- **All comments and variable names in English**
- **Descriptive variable names** — `createdItem` not `item`, `itemId` not `id`
- Import from `shared/` — never from `common/` (that folder no longer exists)
