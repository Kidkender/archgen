import chalk from "chalk";

export const logger = {
  info: (msg: string) => {
    console.log(chalk.blue("i"), msg);
  },
  success: (msg: string) => {
    console.log(chalk.green("✓"), msg);
  },
  error: (msg: string) => {
    console.log(chalk.red("x"), msg);
  },
  warn: (msg: string) => {
    console.log(chalk.yellow("!"), msg);
  },
  debug: (msg: string) => {
    console.log(chalk.gray("d"), msg);
  },
  step: (msg: string) => {
    console.log(chalk.cyan("→"), msg);
  },
};
