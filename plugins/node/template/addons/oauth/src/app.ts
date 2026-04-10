
import { env } from "./config/env";
import { logger } from "./core/logger";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from "fastify-type-provider-zod";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cookie from "@fastify/cookie";
import oauth2 from "@fastify/oauth2";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import prismaPlugin from "./plugins/prisma.plugin";
import responsePlugin from "./plugins/response.plugin";
import oauthRoutes from "./modules/oauth/oauth.routes";
import { oauthEnv } from "./config/oauth";

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "{{PROJECT_NAME}}",
        version: "1.0.0"
      }
    },
    transform: jsonSchemaTransform
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  // @fastify/cookie is required by @fastify/oauth2 v8 for state cookie management
  await app.register(cookie);

  await app.register(oauth2, {
    name: "googleOAuth2",
    credentials: {
      client: { id: oauthEnv.GOOGLE_CLIENT_ID, secret: oauthEnv.GOOGLE_CLIENT_SECRET },
      auth: (oauth2 as any).GOOGLE_CONFIGURATION,
    },
    callbackUri: `${oauthEnv.APP_URL}/api/v1/oauth/google/callback`,
    scope: ["profile", "email"],
  });

  await app.register(oauth2, {
    name: "githubOAuth2",
    credentials: {
      client: { id: oauthEnv.GITHUB_CLIENT_ID, secret: oauthEnv.GITHUB_CLIENT_SECRET },
      auth: (oauth2 as any).GITHUB_CONFIGURATION,
    },
    callbackUri: `${oauthEnv.APP_URL}/api/v1/oauth/github/callback`,
    scope: ["user:email"],
  });

  await app.register(responsePlugin);
  await app.register(prismaPlugin);
  await app.register(oauthRoutes, { prefix: "/api/v1/oauth" });
  await app.register(routes, { prefix: "/api/v1" });

  app.setErrorHandler(errorHandler);
  return app;
}
