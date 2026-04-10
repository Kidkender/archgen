import { FastifyInstance } from "fastify";
import { OAuthService } from "./oauth.service";
import { oauthEnv } from "../../config/oauth";

export default async function oauthRoutes(app: FastifyInstance) {
  const service = new OAuthService(app);

  // ─── Google OAuth ────────────────────────────────────────────────────────────

  app.get("/google", async (_req, reply) => {
    const url = (app as any).googleOAuth2.generateAuthorizationUri({
      state: "google",
    });
    return reply.redirect(url);
  });

  app.get("/google/callback", async (req, reply) => {
    const token = await (app as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token.token.access_token as string}`,
    );
    const userData = (await res.json()) as Record<string, unknown>;
    const profile = service.buildGoogleProfile(userData);
    const { accessToken } = await service.handleCallback(profile);
    return reply.redirect(`${oauthEnv.APP_URL}/auth/callback?token=${accessToken}`);
  });

  // ─── GitHub OAuth ─────────────────────────────────────────────────────────────

  app.get("/github", async (_req, reply) => {
    const url = (app as any).githubOAuth2.generateAuthorizationUri({
      state: "github",
    });
    return reply.redirect(url);
  });

  app.get("/github/callback", async (req, reply) => {
    const token = await (app as any).githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token.token.access_token as string}` },
    });
    const userData = (await res.json()) as Record<string, unknown>;
    const profile = service.buildGithubProfile(userData);
    const { accessToken } = await service.handleCallback(profile);
    return reply.redirect(`${oauthEnv.APP_URL}/auth/callback?token=${accessToken}`);
  });
}
