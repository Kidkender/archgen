import { Worker, Job } from "bullmq";
import { env } from "../config/env";

const connection = { url: env.REDIS_URL };

export interface ExampleJobData {
  message: string;
  userId?: number;
}

export const exampleWorker = new Worker<ExampleJobData>(
  "example",
  async (job: Job<ExampleJobData>) => {
    console.log(`[Worker] Processing job ${job.id}: ${job.data.message}`);
    // TODO: replace with real job logic
    await new Promise((res) => setTimeout(res, 100));
    return { processed: true };
  },
  { connection },
);

exampleWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

exampleWorker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});
