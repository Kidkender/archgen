import { z } from "zod";

const emailSchema = z.object({
  MAIL_HOST: z.string().min(1, "MAIL_HOST is required"),
  MAIL_PORT: z.coerce.number().int().default(587),
  MAIL_USERNAME: z.string().min(1, "MAIL_USERNAME is required"),
  MAIL_PASSWORD: z.string().min(1, "MAIL_PASSWORD is required"),
  MAIL_FROM_ADDRESS: z.string().email("MAIL_FROM_ADDRESS must be a valid email"),
  MAIL_FROM_NAME: z.string().default("{{PROJECT_NAME}}"),
});

export const emailEnv = emailSchema.parse(process.env);
