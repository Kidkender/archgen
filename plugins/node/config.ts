import { PluginConfig } from "../../types";

export const nodeConfig: PluginConfig = {
  name: "node-typescript",
  description: "Node.js Typescript backend with Fastify",
  addons: ["docker", "testing", "ci", "husky", "websocket", "oauth", "api-docs", "claude-code", "cursor"],
};
