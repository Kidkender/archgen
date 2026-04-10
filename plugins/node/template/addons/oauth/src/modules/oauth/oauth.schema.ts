import { z } from "zod";

export const oauthCallbackQuery = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export type OAuthCallbackQuery = z.infer<typeof oauthCallbackQuery>;

export interface OAuthUserProfile {
  provider: "google" | "github";
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
