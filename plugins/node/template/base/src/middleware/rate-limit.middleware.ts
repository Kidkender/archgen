import { FastifyReply, FastifyRequest } from "fastify";
import redis from "../config/redis";
import { env } from "../config";
import { ERROR_RATE_LIMIT_EXCEEDED } from "../constants";


export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!redis) {
    return
  }

  let clientId = request.ip;

  const apiKey = request.headers["x-api-key"];
  if (apiKey) {
    clientId = `api_key:${apiKey}`;
  }

  const now = Math.floor(Date.now() / 60000);
  const rateKey = `rate_limit:${clientId}:${now}`

  try {
    const current = await redis.get(rateKey)

    if (current && parseInt(current) >= (env.RATE_LIMIT_MAX || 100)) {
      return reply.status(429).send({
        success: false,
        error: ERROR_RATE_LIMIT_EXCEEDED
      })
    }

    if (current) {
      await redis.incr(rateKey)
    } else {
      await redis.set(rateKey, "1", "EX", 60);
    }
  } catch (error) {
    request.log.error({ error }, "Rate limit check failed")
  }
}
