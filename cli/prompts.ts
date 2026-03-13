import prompts from "prompts";
import { GenerateOptions } from "../types";

export async function promptMissingOptions(
  projectName: string,
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

  if (questions.length === 0) return options;

  const answers = await prompts(questions, {
    onCancel: () => {
      console.log("\nCancelled.");
      process.exit(0);
    },
  });

  const isCancelled = questions.some((q) => answers[q.name as string] === undefined);
  if (isCancelled) {
    console.log("\nCancelled.");
    process.exit(0);
  }

  return { ...options, ...answers };
}
