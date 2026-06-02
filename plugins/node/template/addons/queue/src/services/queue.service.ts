import { FastifyInstance } from "fastify";
import { JobsOptions } from "bullmq";
import { ExampleJobData } from "../workers/example.worker";

export class QueueService {
  constructor(private readonly fastify: FastifyInstance) {}

  async addExampleJob(data: ExampleJobData, opts?: JobsOptions): Promise<string> {
    const queue = this.fastify.queues.getQueue("example");
    const job = await queue.add("process", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 50,
      ...opts,
    });
    return job.id ?? "unknown";
  }

  async getQueueStats(name: string) {
    const queue = this.fastify.queues.getQueue(name);
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    return { name, waiting, active, completed, failed };
  }
}
