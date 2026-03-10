
import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppException } from "../core/exception";
import { logger } from "../core/logger";

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppException) {
    logger.warn({ err: error.message, statusCode: error.statusCode }, `${request.method} ${request.url}`);
    return reply.status(error.statusCode).send(error.toJSON());
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error_code: "error.validation.invalid-input",
      message: "Validation failed",
      details: { fields: error.issues },
    });
  }

  const fastifyError = error as FastifyError;
  if (fastifyError.validation) {
    return reply.status(400).send({
      error_code: "error.validation.invalid-input",
      message: "Validation failed",
      details: { fields: fastifyError.validation },
    });
  }

  logger.error({ err: error.message, stack: error.stack }, `${request.method} ${request.url}`);

  return reply.status(fastifyError.statusCode || 500).send({
    error_code: "error.internal.unexpected",
    message: "An unexpected error occurred",
    ...(env.NODE_ENV === "development" && { details: { stack: error.stack } }),
  });
}
