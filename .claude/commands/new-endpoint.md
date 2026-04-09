# Create a New HTTP Endpoint

You are scaffolding a new Lambda HTTP endpoint in the `serverless-blueprint` project.
Read `CLAUDE.md` for the full project conventions before proceeding.

The user's request: $ARGUMENTS

---

## Step 1 — Gather information

Extract or ask the user for:

| Field | Description | Example |
|-------|-------------|---------|
| `actionName` | kebab-case action name | `create-order` |
| `handlerFnName` | camelCase function name | `createOrder` |
| `domainFolder` | domain group under `handlers/` | `orders` |
| `httpMethod` | GET \| POST \| PUT \| DELETE \| PATCH | `POST` |
| `apiPath` | Full API path with `{param}` syntax | `/v1/orders` |
| `description` | One-line description for Serverless config | `Creates a new order.` |
| `requestFields` | List of fields with type, source, and required flag | see below |
| `responseType` | What the handler returns (describe the shape) | `{ data: Order }` |

For `requestFields`, determine for each field:
- **name** — camelCase field name
- **type** — TypeScript type (`string`, `number`, `boolean`, `string[]`, etc.)
- **source** — `##path##`, `##query##`, `##body##`, or `##header##`
- **required** — true / false
- **constraints** — min, max, minLength, maxLength, enum values, etc.

If the user's description is clear enough, proceed without asking.
If any field is ambiguous, ask one clarifying question.

---

## Step 2 — Create the interface file

Create `handlers/<domainFolder>/<actionName>/interfaces/<actionName>.interface.ts`:

```typescript
import {Request} from '../../../../common/interfaces/request.interface';

/** Request interface for `<METHOD> <apiPath>`. */
export interface <InterfaceName>Request extends Request {
  // For each field with source ##path## or ##query##:
  /**
   * @TJS-description <##source##> <field description>.
   * @TJS-type <type>          // for number fields
   * @TJS-minimum <n>          // if applicable
   */
  fieldName: type;             // required fields — no ?
  optionalField?: type;        // optional fields — add ?
}
```

Rules:
- Always extend `Request` from `../../../../common/interfaces/request.interface`
- Use `@TJS-description ##source##` annotations — the schema generator reads these
- Path params and required body fields: no `?`
- Optional fields: add `?`
- Import `PaginationParams` from the request interface if the endpoint supports pagination

---

## Step 3 — Create the JSON schema (only for POST / PUT / PATCH)

Create `handlers/<domainFolder>/<actionName>/schema/schemaValidator.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "<InterfaceName>Request",
  "additionalProperties": true,
  "required": ["requiredField1", "requiredField2"],
  "properties": {
    "fieldName": {
      "type": "string|number|boolean|array",
      "description": "##body## Human-readable description.",
      "minLength": 1,
      "maxLength": 255
    }
  }
}
```

Rules:
- Only include `##body##` fields in the schema (not path/query/header)
- Match all constraints from the interface (minLength, minimum, maximum, enum)
- Use `"additionalProperties": true` to allow the headers object to pass through
- Omit the `schema/` folder entirely for GET and DELETE endpoints

---

## Step 4 — Create the business logic file

Create `handlers/<domainFolder>/<actionName>/<actionName>.ts`:

```typescript
import {HandlerError, Logger} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {ErrorMessages} from '../../../common/enums/error-messages.enum';
import {<InterfaceName>Request} from './interfaces/<actionName>.interface';

const logger = new Logger();

/**
 * <One-line description of what this function does.>
 */
async function <handlerFnName>(request: <InterfaceName>Request): Promise<<ReturnType>> {
  logger.info('[<handlerFnName>] <Starting message>', {/* relevant fields */});

  // TODO: implement business logic

  logger.info('[<handlerFnName>] <Completion message>');
  return result;
}

export default <handlerFnName>;
```

Rules:
- Log prefix format: `[functionName]`
- Use `HandlerError` for expected failures — pass `false, false` for 404s (no stack, no SNS alert)
- Never use `console.*` — always `logger.*`
- Import error messages from `ErrorMessages` enum; add new ones to the enum if needed

---

## Step 5 — Create the handler entry point

Create `handlers/<domainFolder>/<actionName>/handler.ts`:

```typescript
import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {<InterfaceName>Request} from './interfaces/<actionName>.interface';
// import schema from './schema/schemaValidator.json'; // POST/PUT/PATCH only
import <handlerFnName> from './<actionName>';

/** Lambda entry point for `<METHOD> <apiPath>`. */
async function initHandler(request: <InterfaceName>Request): Promise<HandlerResponse> {
  const response = await <handlerFnName>(request);
  return new HandlerResponse(response, StatusCodes.OK); // adjust status code
}

export const handler = new APIHandler(initHandler, {
  // schemaValidator: schema,  // POST/PUT/PATCH only
}).lambdaHandler;
```

Status code guide:
- GET (single / list) → `StatusCodes.OK` (200)
- POST (create) → `StatusCodes.CREATED` (201)
- PUT / PATCH (update) → `StatusCodes.OK` (200)
- DELETE → `StatusCodes.NO_CONTENT` (204), return `new HandlerResponse(null, StatusCodes.NO_CONTENT)`

---

## Step 6 — Add the function definition

If `config/functions/<domainFolder>.yml` does not exist, create it.
Add the new function entry:

```yaml
<actionName>:
  handler: handlers/<domainFolder>/<actionName>/handler.handler
  description: <description>
  events:
    - httpApi:
        path: <apiPath>
        method: <method>
```

If you created a new domain YAML file, add it to `serverless.yml` under `functions:`:

```yaml
functions:
  - ${file(config/functions/<domainFolder>.yml)}
```

---

## Step 7 — Update the schema generator (POST / PUT / PATCH only)

Add a new entry to the `SCHEMAS` array in `scripts/schema-generator.sh`:

```bash
"./handlers/<domainFolder>/<actionName>/interfaces/<actionName>.interface.ts:<InterfaceName>Request:handlers/<domainFolder>/<actionName>/schema/schemaValidator.json"
```

---

## Step 8 — Update the warm-lambdas handler

Add the new function's short name to `FUNCTIONS_TO_WARM` in
`event-handlers/warm-lambdas/handler.ts`:

```typescript
const FUNCTIONS_TO_WARM: string[] = [
  // existing entries...
  '<actionName>',  // ← add this
];
```

---

## Step 9 — Regenerate Swagger

After creating all files, tell the user to run:

```bash
npm run swagger
```

Or, if the Swagger generator script can be run now, execute it.

---

## Step 10 — Verification checklist

After creating all files, confirm:

- [ ] `handlers/<domainFolder>/<actionName>/interfaces/<actionName>.interface.ts` — created
- [ ] `handlers/<domainFolder>/<actionName>/schema/schemaValidator.json` — created (POST/PUT/PATCH only)
- [ ] `handlers/<domainFolder>/<actionName>/<actionName>.ts` — created
- [ ] `handlers/<domainFolder>/<actionName>/handler.ts` — created
- [ ] `config/functions/<domainFolder>.yml` — function entry added
- [ ] `serverless.yml` — new domain YAML referenced (if new domain)
- [ ] `scripts/schema-generator.sh` — schema entry added (POST/PUT/PATCH only)
- [ ] `event-handlers/warm-lambdas/handler.ts` — function added to warm list
- [ ] `swagger-v1.json` — regenerated (`npm run swagger`)

---

## Example — full walkthrough

**User input:** "I want a POST endpoint at `/v1/orders` called `create-order` that accepts `productId` (string UUID, required), `quantity` (integer ≥ 1, required), and `notes` (string, optional, max 300 chars)."

**Files to create:**
```
handlers/orders/create-order/interfaces/create-order.interface.ts
handlers/orders/create-order/schema/schemaValidator.json
handlers/orders/create-order/create-order.ts
handlers/orders/create-order/handler.ts
config/functions/orders.yml                           ← new file
```

**Files to modify:**
```
serverless.yml                                        ← add orders.yml reference
scripts/schema-generator.sh                           ← add schema entry
event-handlers/warm-lambdas/handler.ts                ← add 'create-order'
swagger-v1.json                                       ← regenerate
```
