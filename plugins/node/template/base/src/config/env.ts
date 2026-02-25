import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', "production", "test"]).default("development"),
  PORT: z.string().default("3000").transform(Number),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1d"),

  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.string().default("100").transform(Number).optional(),
  RATE_LIMIT_WINDOW: z.string().default("60000").transform(Number).optional(),
})

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env)
