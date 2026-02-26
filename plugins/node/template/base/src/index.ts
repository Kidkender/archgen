import { buildApp } from "./app";
import prisma from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    })

    logger.info(`Server started on port ${env.PORT}`);
    logger.info(`API Docs: http://localhost:${env.PORT}/docs`);
  } catch (error) {
    logger.error(error as Error);
    process.exit(1)
  }
}

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...")
  await prisma.$disconnect();
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info(`SIGTERM received, shutdown...`)
  await prisma.$disconnect();
  process.exit(0)
})

start()
