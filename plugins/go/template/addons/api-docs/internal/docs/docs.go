package docs

import (
	"encoding/json"
	"net/http"
)

const spec = `{
  "openapi": "3.0.3",
  "info": {
    "title": "{{PROJECT_NAME}}",
    "description": "{{DESCRIPTION}}",
    "version": "1.0.0"
  },
  "paths": {
    "/health": {
      "get": {
        "summary": "Health check",
        "responses": { "200": { "description": "OK" } }
      }
    }
  }
}`

const uiPage = `<!DOCTYPE html>
<html>
  <head>
    <title>{{PROJECT_NAME}} — API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
      };
    </script>
  </body>
</html>`

// Spec serves the raw OpenAPI 3.0 document.
func Spec(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var doc map[string]interface{}
	_ = json.Unmarshal([]byte(spec), &doc)
	_ = json.NewEncoder(w).Encode(doc)
}

// UI serves a Swagger UI page pointed at /openapi.json.
func UI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(uiPage))
}
