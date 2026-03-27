import prompts from "prompts";
import { logger } from "../core/logger";
import { GenerateOptions } from "../types";

export async function promptMissingOptions(
  _projectName: string,
  options: GenerateOptions,
): Promise<GenerateOptions> {
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

  // Database is Node.js-only — skip if language is already python, or if prompted language ends up python
  if (!options.database) {
    const fixedLang = options.language;
    questions.push({
      type: (_prev, values) => {
        const lang = fixedLang ?? (values as GenerateOptions).language;
        return lang === "node" ? "select" : null;
      },
      name: "database",
      message: "Select a database:",
      choices: [
        { title: "MySQL / MariaDB", value: "mysql" },
        { title: "PostgreSQL", value: "postgresql" },
      ],
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

  return { ...options, ...answers };
}
