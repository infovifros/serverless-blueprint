Scaffold a new HTTP API endpoint following the project's SDD (Spec-Driven Development) pattern.

The user will describe what they want in plain English. Read `CLAUDE.md` and `.github/copilot-instructions.md` for the full conventions.

Ask the user for any missing details, then execute all steps below without pausing.

---

## What to ask if not provided

- **Domain** (e.g. `items`, `orders`) — which `src/api/{domain}/` folder?
- **Action name** (e.g. `create-order`) — kebab-case
- **HTTP method** (GET / POST / PUT / PATCH / DELETE)
- **Path** (e.g. `/v1/orders` or `/v1/orders/{id}`)
- **Request fields** — name, type (string / number / boolean), source (body / path / query), required or optional, any length/value constraints
- **Response status** (default: 200 for GET, 201 for POST, 204 for DELETE)

---

## Steps

### 1. Create `src/api/{domain}/{action}/spec/request.interface.ts`

```typescript
import {Request} from '../../../../shared/interfaces/request.interface';

/** Request interface for `{METHOD} {path}`. */
export interface {ActionPascalCase}Request extends Request {
  /**
   * @TJS-description ##{source}## {description}
   * @TJS-minLength 1   // add constraints as needed
   */
  {fieldName}: {type};
}
```

- Use `##body##`, `##path##`, `##query##` annotations
- Path params and query params are always `string` in the interface (parsed from URL)
- Body number fields: add `@TJS-type number` and `@TJS-minimum` / `@TJS-maximum`
- Optional fields: `field?: type`

### 2. Create `src/api/{domain}/{action}/handler.ts`

```typescript
import {APIHandler, HandlerResponse} from '@vifros/aws-serverless-core';
import {StatusCodes} from 'http-status-codes';
import {ActionPascalCaseRequest} from './spec/request.interface';
// Only add this import if there is a request body to validate:
import actionNameSchema from './spec/schemaValidator.json';
import actionName from './{action}';

async function initHandler(request: ActionPascalCaseRequest): Promise<HandlerResponse> {
  const result = await actionName(request);
  return new HandlerResponse(result, StatusCodes.OK); // adjust status code
}

export const handler = new APIHandler(initHandler, {
  // Only add schemaValidator if there is a request body:
  schemaValidator: actionNameSchema,
}).lambdaHandler;
```

### 3. Create `src/api/{domain}/{action}/{action}.ts`

```typescript
import {Logger} from '@vifros/aws-serverless-core';
import {ActionPascalCaseRequest} from './spec/request.interface';
// import store, response types, error enums as needed

const logger = new Logger();

async function actionName(request: ActionPascalCaseRequest): Promise<ResponseType> {
  logger.info('[actionName] Processing request', {/* relevant fields */});
  // ... business logic
  return result;
}

export default actionName;
```

### 4. Add to `config/functions/{domain}.yml`

```yaml
{action}:
  handler: src/api/{domain}/{action}/handler.handler
  description: {One-line description of what the endpoint does.}
  events:
    - httpApi:
        path: /v1/{resource}
        method: {method}
```

### 5. Update `scripts/schema-generator.sh` (only if POST / PUT / PATCH with body)

Add a line to the `SCHEMAS` array:
```bash
"src/api/{domain}/{action}/spec/request.interface.ts:ActionPascalCaseRequest:src/api/{domain}/{action}/spec/schemaValidator.json"
```

### 6. Update `scripts/generate-swagger.js` (only if schema was added in step 5)

Add an entry to `SCHEMA_MAP`:
```javascript
'src/api/{domain}/{action}/handler.handler': 'src/api/{domain}/{action}/spec/schemaValidator.json',
```

### 7. Update warm-up list

In `src/events/system/warm-up/handler.ts`, add `'{action}'` to `FUNCTIONS_TO_WARM`.

### 8. Regenerate schemas and Swagger spec

```bash
npm run schema && npm run swagger
```

### 9. Update Postman collection

In `docs/postman/serverless-blueprint.collection.json`, add a new request entry for the endpoint.

### 10. Verify

Run `npm start` and confirm the new route appears in `http://localhost:4000/v1/swagger`.
