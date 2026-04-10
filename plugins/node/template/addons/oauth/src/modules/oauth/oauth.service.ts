import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { OAuthUserProfile } from "./oauth.schema";
import type { StringValue } from "ms";

export class OAuthService {
  constructor(private app: FastifyInstance) {}

  async handleCallback(profile: OAuthUserProfile): Promise<{ accessToken: string; userId: number }> {
    const prisma = this.app.prisma;

    // Find or create user based on OAuth provider
    let user = await prisma.user.findFirst({
      where: { email: profile.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          username: profile.name.toLowerCase().replace(/\s+/g, "_"),
          password: "", // OAuth users have no password
        },
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as StringValue },
    );

    return { accessToken, userId: user.id };
  }

  buildGoogleProfile(tokenData: Record<string, unknown>): OAuthUserProfile {
    const user = tokenData as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };
    return {
      provider: "google",
      providerId: user.sub,
      email: user.email,
      name: user.name,
      avatarUrl: user.picture,
    };
  }

  buildGithubProfile(tokenData: Record<string, unknown>): OAuthUserProfile {
    const user = tokenData as {
      id: number;
      email: string;
      name: string;
      avatar_url?: string;
    };
    return {
      provider: "github",
      providerId: String(user.id),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
    };
  }
}
