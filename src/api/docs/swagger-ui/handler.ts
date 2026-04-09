/**
 * Serves the interactive Swagger UI at `GET /v1/swagger`.
 * The UI loads the OpenAPI spec from the sibling `GET /v1/swagger.json` endpoint.
 */
export const handler = async () => ({
  statusCode: 200,
  headers: {'content-type': 'text/html'},
  body: SWAGGER_UI_HTML,
});

const SWAGGER_UI_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>serverless-blueprint — API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: window.location.origin + '/v1/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
        });
      };
    </script>
  </body>
</html>`;
