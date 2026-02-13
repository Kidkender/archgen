import { PluginConfig } from "../../types";

export const nodeConfig: PluginConfig = {
  name: "node-typescript",
  description: "Node.js Typescript backend with Express",
  addons: ["docker", "testing"],
};
