import { PluginConfig } from "../../types";


export const pythonConfig: PluginConfig = {
  name: "python-fastapi",
  description: "Python FastAPI backend with full production features",
  addons: ["docker", "testing", "ci", "claude-code", "cursor", "email", "s3", "oauth", "api-docs", "websocket", "queue", "pre-commit", "observability"]
}
