import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

export const updateUserSchema = createUserSchema.partial();

export const getUserQuerySchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('10').transform(Number),
});

export const userResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserQuery = z.infer<typeof getUserQuerySchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
