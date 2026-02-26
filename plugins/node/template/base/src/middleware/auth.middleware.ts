import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken"
import { env } from "../config/env";

interface JWTPayload {
  userId: number;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JWTPayload
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return reply.status(401).send({
        success: false,
        error: "Missing or invalid authorization header"
      })
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: "Invalid or expired token"
    })
  }
}
