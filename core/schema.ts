import { z } from "zod";
import { GenerateOptions } from "../types";
import { ArchGenError } from "./errors";

const DATABASE_BY_LANGUAGE: Record<string, string[]> = {
  node: ["mysql", "postgresql"],
  python: ["postgresql", "sqlite"],
  go: ["postgresql"],
};

export const generateOptionsSchema = z
  .object({
    language: z.string().min(1, "language is required"),
    docker: z.boolean().optional(),
    testing: z.boolean().optional(),
    ci: z.boolean().optional(),
    husky: z.boolean().optional(),
    websocket: z.boolean().optional(),
    oauth: z.boolean().optional(),
    apiDocs: z.boolean().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    force: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    database: z.string().optional(),
    skipGit: z.boolean().optional(),
    output: z.string().optional(),
    claudeCode: z.boolean().optional(),
    cursor: z.boolean().optional(),
    email: z.boolean().optional(),
    s3: z.boolean().optional(),
    queue: z.boolean().optional(),
    preCommit: z.boolean().optional(),
    observability: z.boolean().optional(),
    sentry: z.boolean().optional(),
    modulePath: z.string().optional(),
    jwt: z.boolean().optional(),
    outputDir: z.string().optional(),
  })
  .superRefine((options, ctx) => {
    if (!options.database) return;
    const validDatabases = DATABASE_BY_LANGUAGE[options.language];
    if (validDatabases && !validDatabases.includes(options.database)) {
      ctx.addIssue({
        code: "custom",
        path: ["database"],
        message: `Invalid database "${options.database}" for ${options.language}. Must be one of: ${validDatabases.join(", ")}`,
      });
    }
  });

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "options"}: ${issue.message}`).join("; ");
}

/** Validates GenerateOptions at the CLI/library boundary so bad input fails fast, before any file is touched. */
export function validateGenerateOptions(options: GenerateOptions): GenerateOptions {
  const result = generateOptionsSchema.safeParse(options);
  if (!result.success) {
    throw new ArchGenError("VALIDATION_ERROR", formatZodError(result.error));
  }
  return result.data as GenerateOptions;
}
