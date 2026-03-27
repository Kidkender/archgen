import { Command } from "commander";
import { execSync } from "child_process";
import chalk from "chalk";

interface Check {
  name: string;
  run: () => string | null;
  required: boolean;
}

function probe(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

const checks: Check[] = [
  {
    name: "Node.js (>= 18)",
    required: true,
    run: () => {
      const v = probe("node --version");
      if (!v) return null;
      const major = parseInt(v.replace("v", "").split(".")[0]);
      return major >= 18 ? v : null;
    },
  },
  {
    name: "npm",
    required: true,
    run: () => probe("npm --version"),
  },
  {
    name: "git",
    required: false,
    run: () => probe("git --version"),
  },
  {
    name: "Docker",
    required: false,
    run: () => probe("docker --version"),
  },
  {
    name: "docker compose",
    required: false,
    run: () => probe("docker compose version") ?? probe("docker-compose --version"),
  },
  {
    name: "Python (>= 3.10)",
    required: false,
    run: () => {
      const v = probe("python --version") ?? probe("python3 --version");
      if (!v) return null;
      const parts = v.replace("Python ", "").split(".");
      const major = parseInt(parts[0]);
      const minor = parseInt(parts[1]);
      return major > 3 || (major === 3 && minor >= 10) ? v : null;
    },
  },
];

export const doctorCommand = new Command("doctor")
  .description("Check that required tools are installed")
  .action(() => {
    console.log(chalk.bold("\narchgen doctor — environment check\n"));

    let allRequired = true;

    for (const check of checks) {
      const result = check.run();
      const ok = result !== null;

      if (!ok && check.required) allRequired = false;

      const icon = ok ? chalk.green("✓") : check.required ? chalk.red("✗") : chalk.yellow("–");
      const label = chalk.white(check.name.padEnd(22));
      const value = ok ? chalk.dim(result!) : check.required ? chalk.red("not found") : chalk.dim("not found (optional)");

      console.log(`  ${icon}  ${label} ${value}`);
    }

    console.log();

    if (allRequired) {
      console.log(chalk.green("  All required tools are available. Ready to use archgen."));
    } else {
      console.log(chalk.red("  Some required tools are missing. Please install them before using archgen."));
      process.exit(1);
    }

    console.log();
  });
