import chalk from "chalk";

type LogLevel = "quiet" | "normal" | "verbose";

let level: LogLevel = "normal";

export const logger = {
  setLevel(newLevel: LogLevel): void {
    level = newLevel;
  },

  info: (msg: string) => {
    if (level !== "quiet") console.log(chalk.blue("i"), msg);
  },
  success: (msg: string) => {
    if (level !== "quiet") console.log(chalk.green("✓"), msg);
  },
  error: (msg: string) => {
    console.log(chalk.red("x"), msg);
  },
  warn: (msg: string) => {
    if (level !== "quiet") console.log(chalk.yellow("!"), msg);
  },
  debug: (msg: string) => {
    if (level === "verbose") console.log(chalk.gray("d"), msg);
  },
  step: (msg: string) => {
    if (level !== "quiet") console.log(chalk.cyan("→"), msg);
  },
};
