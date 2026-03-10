
import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "../config/env";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const adapter = new PrismaMariaDb(env.DATABASE_URL);

  const prisma = new PrismaClient({
    adapter,
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });

  // prisma.$on("query" as never, (e: any) => {
  //   fastify.log.debug({
  //     query: e.query,
  //     params: e.params,
  //     duration: `${e.duration}ms`,
  //   });
  // });

  prisma.$on("error" as never, (e: any) => {
    fastify.log.error(e, "Prisma error");
  });

  prisma.$on("warn" as never, (e: any) => {
    fastify.log.warn(e, "Prisma warning");
  });

  await prisma.$connect();

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});

export default prismaPlugin;
