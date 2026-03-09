import { logger } from "../core/logger";
import { BaseJob } from "./base.job";

export class ExampleJob extends BaseJob {
  readonly cronExpression = "*/2 * * * *"; // every 2 minutes
  readonly jobName = "ExampleJob";

  async execute(): Promise<void> {
    logger.info(`[${this.jobName}] executed at ${new Date().toISOString()}`);
  }
}
