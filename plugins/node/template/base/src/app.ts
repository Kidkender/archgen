import { env } from "./config/env";
import { logger } from "./config/logger";
import Fastify from "fastify";

export async function buildApp() {
  const app = Fastify({
    logger
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })


  await app.register(helmet)

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "{PROJECT_NAME}",
        version: "1.0.0"
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs"
  })

  await app.register(routes, { prefix: "/api/v1" })

  app.setErrorHandler(errorHandler)
  return app;
}
