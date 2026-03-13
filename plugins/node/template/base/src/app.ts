
import { env } from "./config/env";
import { logger } from "./core/logger";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from "fastify-type-provider-zod";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import prismaPlugin from "./plugins/prisma.plugin";
import responsePlugin from "./plugins/response.plugin";

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
  })


  await app.register(helmet)

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
  })

  await app.register(responsePlugin)
  await app.register(prismaPlugin)
  await app.register(routes, { prefix: "/api/v1" })

  app.setErrorHandler(errorHandler)
  return app;
}
