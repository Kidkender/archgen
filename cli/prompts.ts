import prompts from "prompts";
import { logger } from "../core/logger";
import { GenerateOptions } from "../types";

export async function promptMissingOptions(
  _projectName: string,
  options: GenerateOptions,
): Promise<GenerateOptions> {
  // Non-interactive mode: skip prompts, apply defaults for unset options
  if (!process.stdin.isTTY) {
    return {
      docker: false,
      testing: false,
      ci: false,
      husky: false,
      claudeCode: false,
      cursor: false,
      preCommit: false,
      observability: false,
      sentry: false,
      ...options,
      language: options.language ?? "node",
    };
  }

  const questions: prompts.PromptObject[] = [];

  if (!options.language) {
    questions.push({
      type: "select",
      name: "language",
      message: "Select a language:",
      choices: [
        { title: "Node.js (TypeScript + Fastify)", value: "node" },
        { title: "Python (FastAPI)", value: "python" },
      ],
    });
  }

  if (!options.database) {
    const fixedLang = options.language;
    questions.push({
      type: (_prev, values) => {
        const lang = fixedLang ?? (values as GenerateOptions).language;
        return lang === "node" || lang === "python" ? "select" : null;
      },
      name: "database",
      message: "Select a database:",
      choices: (_prev, values) => {
        const lang = fixedLang ?? (values as GenerateOptions).language;
        if (lang === "python") {
          return [
            { title: "PostgreSQL (default)", value: "postgresql" },
            { title: "SQLite (no server needed)", value: "sqlite" },
          ];
        }
        return [
          { title: "MySQL / MariaDB", value: "mysql" },
          { title: "PostgreSQL", value: "postgresql" },
        ];
      },
    });
  }

  if (!options.docker) {
    questions.push({
      type: "confirm",
      name: "docker",
      message: "Include Docker setup?",
      initial: false,
    });
  }

  if (!options.testing) {
    questions.push({
      type: "confirm",
      name: "testing",
      message: "Include testing setup?",
      initial: false,
    });
  }

  if (!options.ci) {
    questions.push({
      type: "confirm",
      name: "ci",
      message: "Include GitHub Actions CI workflow?",
      initial: false,
    });
  }

  if (options.husky === undefined && options.language !== "python") {
    const fixedLang = options.language;
    questions.push({
      type: (_prev, values) => {
        const lang = fixedLang ?? (values as GenerateOptions).language;
        return lang === "node" ? "confirm" : null;
      },
      name: "husky",
      message: "Include Husky + lint-staged setup?",
      initial: false,
    });
  }

  if (options.claudeCode === undefined && options.cursor === undefined) {
    questions.push({
      type: "multiselect",
      name: "aiAgents",
      message: "Include AI agent setup? (Space to select, Enter to confirm)",
      choices: [
        { title: "Claude Code  (CLAUDE.md + .claude/skills/)", value: "claude", selected: false },
        { title: "Cursor       (.cursor/skills/)", value: "cursor", selected: false },
      ],
      hint: "none to skip",
    });
  }

  const extraAddons = ["websocket", "oauth", "apiDocs", "email", "s3", "queue", "observability", "preCommit"] as const;
  const anyExtraSet = extraAddons.some((k) => options[k] !== undefined);
  if (!anyExtraSet) {
    const fixedLang = options.language;
    questions.push({
      type: (_prev, values) => {
        const lang = fixedLang ?? (values as GenerateOptions).language;
        return lang === "node" || lang === "python" ? "multiselect" : null;
      },
      name: "extraAddons",
      message: "Include extra addons? (Space to select, Enter to confirm)",
      choices: (_prev, values) => {
        const lang = fixedLang ?? (values as GenerateOptions).language;
        const nodeOnly = lang === "node";
        const pythonOnly = lang === "python";
        const all = [
          { title: "WebSocket", value: "websocket", selected: false },
          { title: "OAuth2 (Google + GitHub)", value: "oauth", selected: false },
          { title: "API Docs", value: "apiDocs", selected: false },
          { title: "Email (SMTP)", value: "email", selected: false },
          { title: "Storage (S3 / R2 / MinIO)", value: "s3", selected: false },
          { title: "Queue (BullMQ / arq)", value: "queue", selected: false },
          { title: "Observability (OTel + Prometheus)", value: "observability", selected: false },
          { title: "Husky + lint-staged", value: "husky", selected: false, disabled: !nodeOnly },
          { title: "pre-commit hooks (ruff + black + mypy)", value: "preCommit", selected: false, disabled: !pythonOnly },
        ];
        if (nodeOnly) return all.filter((c) => c.value !== "preCommit");
        return all.filter((c) => c.value !== "husky");
      },
      hint: "none to skip",
    });
  }

  if (questions.length === 0) return options;

  const answers = await prompts(questions, {
    onCancel: () => {
      logger.info("\nCancelled.");
      process.exit(0);
    },
  });

  const isCancelled = questions.some((q) => {
    const name = q.name as string;
    return typeof q.type !== "function" && answers[name] === undefined;
  });
  if (isCancelled) {
    logger.info("\nCancelled.");
    process.exit(0);
  }

  const raw = { ...options, ...answers } as Record<string, unknown>;
  if (Array.isArray(raw.aiAgents)) {
    raw.claudeCode = (raw.aiAgents as string[]).includes("claude");
    raw.cursor = (raw.aiAgents as string[]).includes("cursor");
    delete raw.aiAgents;
  }
  if (Array.isArray(raw.extraAddons)) {
    const selected = raw.extraAddons as string[];
    raw.websocket = selected.includes("websocket");
    raw.oauth = selected.includes("oauth");
    raw.apiDocs = selected.includes("apiDocs");
    raw.email = selected.includes("email");
    raw.s3 = selected.includes("s3");
    raw.queue = selected.includes("queue");
    if (selected.includes("husky")) raw.husky = true;
    if (selected.includes("observability")) raw.observability = true;
    if (selected.includes("preCommit")) raw.preCommit = true;
    delete raw.extraAddons;
  }
  return raw as unknown as GenerateOptions;
}
