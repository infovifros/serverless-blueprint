#!/usr/bin/env node
// ─── Swagger / OpenAPI 3.0 generator ─────────────────────────────────────────
//
// Reads function definition YAML files, pairs each httpApi event with its JSON
// schema (when one exists), and writes a complete OpenAPI 3.0 spec to
// swagger-v1.json.
//
// Usage: node scripts/generate-swagger.js
// Called automatically by the `postinstall` npm script.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'swagger-v1.json');

const FUNCTION_CONFIG_FILES = [
  path.join(ROOT_DIR, 'config/functions/items.yml'),
  path.join(ROOT_DIR, 'config/functions/functions.yml'),
];

/** Maps a handler path to the location of its schemaValidator.json (if any). */
const SCHEMA_MAP = {
  'handlers/items/create-item/handler.handler': 'handlers/items/create-item/schema/schemaValidator.json',
  'handlers/items/update-item/handler.handler': 'handlers/items/update-item/schema/schemaValidator.json',
};

// ─── Base OpenAPI spec ────────────────────────────────────────────────────────

const baseSpec = {
  openapi: '3.0.3',
  info: {
    title: 'serverless-blueprint',
    description:
      'Production-ready AWS Serverless starter — Items CRUD API.' +
      '\n\nAll endpoints that accept a request body validate the payload ' +
      'against a JSON Schema before invoking the business-logic function.',
    version: '1.0.0',
    contact: {email: 'your-email@example.com'},
  },
  servers: [
    {url: 'http://localhost:4000', description: 'Local (serverless-offline)'},
    {url: 'https://your-api-id.execute-api.us-east-1.amazonaws.com', description: 'AWS dev stage'},
  ],
  tags: [
    {name: 'Items', description: 'In-memory CRUD operations on Item resources'},
    {name: 'Docs', description: 'API documentation endpoints'},
  ],
  paths: {},
  components: {schemas: {}},
};

// ─── HTTP method → status code for successful responses ──────────────────────

const SUCCESS_STATUS = {get: '200', post: '201', put: '200', delete: '204', patch: '200'};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadSchema(handlerPath) {
  const schemaRelPath = SCHEMA_MAP[handlerPath];
  if (!schemaRelPath) return null;
  const fullPath = path.join(ROOT_DIR, schemaRelPath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function schemaToRequestBody(schema) {
  if (!schema) return undefined;

  const bodyProperties = {};
  const requiredFields = [];

  for (const [key, value] of Object.entries(schema.properties || {})) {
    if ((value.description || '').includes('##body##')) {
      const {description: _desc, ...rest} = value;
      bodyProperties[key] = rest;
      if ((schema.required || []).includes(key)) requiredFields.push(key);
    }
  }

  if (Object.keys(bodyProperties).length === 0) return undefined;

  return {
    required: requiredFields.length > 0,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          ...(requiredFields.length > 0 && {required: requiredFields}),
          properties: bodyProperties,
        },
      },
    },
  };
}

function schemaToQueryParams(schema) {
  if (!schema) return [];

  return Object.entries(schema.properties || {})
    .filter(([, value]) => (value.description || '').includes('##query##'))
    .map(([key, value]) => ({
      name: key,
      in: 'query',
      required: (schema.required || []).includes(key),
      schema: {type: value.type || 'string'},
      description: (value.description || '').replace('##query##', '').trim(),
    }));
}

function extractPathParams(apiPath) {
  const matches = apiPath.match(/\{([^}]+)\}/g) || [];
  return matches.map((match) => ({
    name: match.slice(1, -1),
    in: 'path',
    required: true,
    schema: {type: 'string', format: 'uuid'},
  }));
}

function buildOperation(fnName, fnConfig, method, schema) {
  const pathParams = extractPathParams(fnConfig.events[0].httpApi.path);
  const queryParams = schemaToQueryParams(schema);
  const requestBody = schemaToRequestBody(schema);
  const successStatus = SUCCESS_STATUS[method] || '200';

  const operation = {
    summary: fnConfig.description || fnName,
    tags: ['Items'],
    operationId: fnName,
    parameters: [...pathParams, ...queryParams],
    responses: {
      [successStatus]: {description: successStatus === '204' ? 'No Content' : 'Success'},
      400: {description: 'Bad Request — validation error'},
      404: {description: 'Not Found'},
      500: {description: 'Internal Server Error'},
    },
  };

  if (requestBody) operation.requestBody = requestBody;
  if (['swagger-ui', 'swagger-json'].some((s) => fnName.includes(s))) {
    operation.tags = ['Docs'];
  }

  return operation;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const spec = JSON.parse(JSON.stringify(baseSpec));

for (const configFile of FUNCTION_CONFIG_FILES) {
  if (!fs.existsSync(configFile)) continue;
  const functions = YAML.parse(fs.readFileSync(configFile, 'utf8'));

  for (const [fnName, fnConfig] of Object.entries(functions)) {
    const httpApiEvent = (fnConfig.events || []).find((e) => e.httpApi);
    if (!httpApiEvent) continue;

    const apiPath = httpApiEvent.httpApi.path.replace(/{/g, '{');
    const method = httpApiEvent.httpApi.method.toLowerCase();
    const schema = loadSchema(fnConfig.handler);

    if (!spec.paths[apiPath]) spec.paths[apiPath] = {};
    spec.paths[apiPath][method] = buildOperation(fnName, fnConfig, method, schema);
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(spec, null, 2));
console.log(`→ Swagger spec written to ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
