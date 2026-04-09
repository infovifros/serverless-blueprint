Scaffold a new domain service — a bounded context with its own set of API endpoints and/or event handlers under `src/api/{domain}/` and `src/events/{domain}/`.

The user will describe the new service in plain English. Read `CLAUDE.md` and `.github/copilot-instructions.md` for the full conventions.

Ask the user for any missing details, then execute all steps below without pausing.

---

## What to ask if not provided

- **Domain name** (kebab-case, e.g. `orders`, `products`, `notifications`)
- **First endpoint or event** — at minimum one action to scaffold as an example
- **Data model** — what does the main resource look like? (fields, types)
- **Store type** — in-memory (for now), DynamoDB, RDS?

---

## Steps

### 1. Define the data model

Create the model and store in `src/shared/store/` (or a domain-specific store if large):

```typescript
// src/shared/store/{domain}.store.ts
import {v4 as uuidv4} from 'uuid';

export interface {Model} {
  id: string;
  // ... domain fields
  createdAt: string;
  updatedAt: string;
}
```

Or for larger services, create `src/api/{domain}/store/{domain}.store.ts`.

### 2. Add domain error messages

In `src/shared/enums/error-messages.enum.ts`, add:
```typescript
{ModelName}NotFound = '{Model name} not found',
```

### 3. Scaffold the first endpoint

Follow `/project:new-endpoint` steps for the first action (usually `list-{domain}` or `create-{domain}`).

### 4. Create `config/functions/{domain}.yml`

```yaml
# ─── {Domain} endpoints ────────────────────────────────────────────────────────

list-{domain}:
  handler: src/api/{domain}/list-{domain}/handler.handler
  description: Returns all {domain} resources.
  events:
    - httpApi:
        path: /v1/{domain}
        method: get
```

### 5. Register the new function config in `serverless.yml`

Add to the `functions` list:
```yaml
functions:
  - ${file(config/functions/items.yml)}
  - ${file(config/functions/{domain}.yml)}   # ← add this
  - ${file(config/functions/docs.yml)}
  - ${file(config/functions/system.yml)}
```

### 6. Add new endpoints to the warm-up list

In `src/events/system/warm-up/handler.ts`, add each new function name to `FUNCTIONS_TO_WARM`:
```typescript
const FUNCTIONS_TO_WARM: string[] = [
  // existing...
  'list-{domain}',
  'get-{domain}',
  // etc.
];
```

### 7. Regenerate schemas and Swagger spec

```bash
npm run schema && npm run swagger
```

### 8. Add Postman requests

In `docs/postman/serverless-blueprint.collection.json`, add a new folder for the domain with requests for each endpoint.

### 9. Update `CLAUDE.md` Swagger tags section

In `scripts/generate-swagger.js`, add a tag for the new domain:
```javascript
tags: [
  {name: 'Items', description: '...'},
  {name: '{Domain}', description: '...'},  // ← add this
],
```

And update `buildOperation()` to assign the correct tag to the new domain's functions.

### 10. Verify

Run `npm start` and confirm all new routes appear in `http://localhost:4000/v1/swagger`.
