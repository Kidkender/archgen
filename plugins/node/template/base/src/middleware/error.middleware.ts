import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../config/env";


export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: error.errors
    })
  }

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: error.validation
    })
  }


  request.log.error(error);

  return reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message,
    ...(env.NODE_ENV === "development" && { stack: error.stack })
  })
}
