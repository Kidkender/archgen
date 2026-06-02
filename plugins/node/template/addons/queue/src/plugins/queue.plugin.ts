import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Queue, Worker, QueueEvents } from "bullmq";
import { env } from "../config/env";

interface QueueRegistry {
  getQueue(name: string): Queue;
  close(): Promise<void>;
}

declare module "fastify" {
  interface FastifyInstance {
    queues: QueueRegistry;
  }
}

const queuePlugin: FastifyPluginAsync = fp(async (fastify) => {
  const connection = { url: env.REDIS_URL };
  const registry = new Map<string, Queue>();

  const queues: QueueRegistry = {
    getQueue(name: string): Queue {
      if (!registry.has(name)) {
        registry.set(name, new Queue(name, { connection }));
      }
      return registry.get(name)!;
    },
    async close(): Promise<void> {
      await Promise.all([...registry.values()].map((q) => q.close()));
    },
  };

  fastify.decorate("queues", queues);

  fastify.addHook("onClose", async () => {
    await queues.close();
  });

  fastify.log.info("Queue plugin initialized (BullMQ)");
});

export { Queue, Worker, QueueEvents };
export default queuePlugin;
