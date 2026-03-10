
import { buildApp } from "./app";
import { env } from "./config/env";
import { logger } from "./core/logger";

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    })

    logger.info(`Server started on port ${env.PORT}`);
    logger.info(`API Docs: http://localhost:${env.PORT}/docs`);

    process.on("SIGINT", async () => {
      logger.info("SIGINT received, shutting down...")
      await app.prisma.$disconnect();
      process.exit(0)
    })

    process.on("SIGTERM", async () => {
      logger.info(`SIGTERM received, shutdown...`)
      await app.prisma.$disconnect();
      process.exit(0)
    })
  } catch (error) {
    logger.error(error as Error);
    process.exit(1)
  }
}

start()
