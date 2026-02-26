import z from "zod";


export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8)
})

export const tokenResponseSchema = z.object({
  accessToken: z.string(),
  userId: z.number()
})

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
