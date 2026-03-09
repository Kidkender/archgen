import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";


let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL);

  redis.on("connect", () => {
    logger.info("Redis connected");
  });

  redis.on("error", (error) => {
    logger.error("Redis error", error);
  });


}

export default redis;
