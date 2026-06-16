import { PluginConfig } from "../../types";

export const goConfig: PluginConfig = {
  name: "Go",
  description: "Go · chi · GORM · PostgreSQL · golang-migrate · slog",
  addons: ["docker", "testing", "ci", "jwt"],
};
