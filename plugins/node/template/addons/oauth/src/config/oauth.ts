import { z } from "zod";

const oauthSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

export const oauthEnv = oauthSchema.parse(process.env);
