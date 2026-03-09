import { BaseJob } from "./base.job";
import { ExampleJob } from "./example.job";

const jobs: BaseJob[] = [
  new ExampleJob(),
];

export function startJobs(): void {
  jobs.forEach((job) => job.start());
}

export function stopJobs(): void {
  jobs.forEach((job) => job.stop());
}

export * from "./base.job";
export * from "./example.job";
