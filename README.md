# serverless-blueprint

Production-ready AWS Serverless starter built on [`@vifros/aws-serverless-core`](https://github.com/infovifros/aws-serverless-core).

Ships with a fully-functional in-memory CRUD API (entity: **Item**) that demonstrates the recommended patterns for the platform.  When starting a real service, replace the in-memory store with your database of choice.

---

## Quick start

```bash
git clone <your-repo-url>
cd serverless-blueprint
npm install
npm start
# → API running at http://localhost:4000
```

Open Swagger UI: [http://localhost:4000/v1/swagger](http://localhost:4000/v1/swagger)

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/items` | List all items (optional `?page=1&limit=20`) |
| `GET` | `/v1/items/:id` | Get a single item by UUID |
| `POST` | `/v1/items` | Create a new item |
| `PUT` | `/v1/items/:id` | Partially update an item |
| `DELETE` | `/v1/items/:id` | Delete an item (returns 204) |
| `GET` | `/v1/swagger` | Interactive Swagger UI |
| `GET` | `/v1/swagger.json` | Raw OpenAPI 3.0 spec |

The store is seeded with 3 demo items on startup.

---

## Test with Postman

Import both files from the `postman/` folder:

1. `postman/serverless-blueprint.collection.json` — 7 ready-to-use requests
2. `postman/serverless-blueprint.environment.json` — sets `baseUrl = http://localhost:4000`

Run requests in order: **List → Create → Get → Update → Delete**.
The Create request auto-stores the returned `id` in the `itemId` environment variable.

---

## Create a new endpoint with Claude Code

Open this project in Claude Code and run:

```
/project:new-endpoint
```

Describe what you need in plain English:

> *"I want a POST endpoint at `/v1/orders` called `create-order` that accepts `productId` (UUID, required), `quantity` (integer ≥ 1), and `notes` (string, optional)."*

Claude will create all required files and update all configuration automatically.

---

## Project structure

```
serverless-blueprint/
├── common/
│   ├── enums/            Shared error message enums
│   ├── interfaces/       Base request / response interfaces
│   └── store/            In-memory store singleton (replace with real DB)
├── config/
│   ├── env/              Stage env vars: local.yml, dev.yml
│   └── functions/        Serverless function definitions per domain
├── event-handlers/
│   └── warm-lambdas/     Keeps functions warm on a schedule
├── handlers/
│   ├── items/            CRUD handlers (list, get, create, update, delete)
│   └── swagger/          Swagger UI + JSON spec handlers
├── postman/              Collection + environment — import to test
├── scripts/
│   ├── schema-generator.sh   Generates JSON schemas from TS interfaces
│   └── generate-swagger.js   Generates swagger-v1.json
└── swagger-v1.json       Generated OpenAPI spec — commit this file
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start serverless-offline on port 4000 (local stage) |
| `npm run start:dev` | Start with dev environment variables |
| `npm run lint` | ESLint across all source files |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run schema` | Regenerate JSON schemas from TypeScript interfaces |
| `npm run swagger` | Regenerate `swagger-v1.json` from function configs |

---

## Adding a new endpoint (manually)

1. Create `handlers/<domain>/<action-name>/` with:
   - `handler.ts` — Lambda entry point (thin, no business logic)
   - `<action-name>.ts` — Business logic function
   - `interfaces/<action-name>.interface.ts` — Request type
   - `schema/schemaValidator.json` — AJV schema (POST/PUT/PATCH only)

2. Add the function to `config/functions/<domain>.yml`

3. If new domain: add `${file(config/functions/<domain>.yml)}` to `serverless.yml`

4. Update `scripts/schema-generator.sh` (POST/PUT/PATCH only)

5. Add the function name to `FUNCTIONS_TO_WARM` in `event-handlers/warm-lambdas/handler.ts`

6. Run `npm run swagger` to regenerate the OpenAPI spec

Or just use `/project:new-endpoint` in Claude Code — it does all of this automatically.

---

## Deploy to AWS

```bash
# Deploy to dev stage
npm run deploy:dev

# Make sure you have AWS credentials configured:
aws configure
```

Update `config/env/dev.yml` with your actual AWS resource ARNs before deploying.

---

## Schema generation note

JSON schema files in `schema/schemaValidator.json` are committed to source control.
They can be regenerated from TypeScript interfaces by running `npm run schema`.
The `postinstall` script attempts regeneration automatically but skips gracefully
if the generator encounters compatibility issues — the committed files are always used as fallback.
