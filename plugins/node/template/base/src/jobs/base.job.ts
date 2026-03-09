import { ScheduledTask } from "node-cron";
import { logger } from "../core/logger";

export abstract class BaseJob {
  protected task: ScheduledTask | null = null;
  abstract readonly cronExpression: string;
  abstract readonly jobName: string;

  abstract execute(): Promise<void>;

  start(): void {
    const cron = require("node-cron");
    this.task = cron.schedule(this.cronExpression, async () => {
      try {
        await this.execute();
      } catch (error) {
        logger.error(`[${this.jobName}] Error:`, error);
      }
    });
    logger.info(`[${this.jobName}] started with cron: ${this.cronExpression}`);
  }

  stop(): void {
    this.task?.stop();
    logger.info(`[${this.jobName}] stopped`);
  }
}
