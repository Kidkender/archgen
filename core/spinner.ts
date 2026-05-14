import ora, { Ora } from "ora";

let level: "quiet" | "normal" | "verbose" = "normal";

export function setSpinnerLevel(newLevel: typeof level): void {
  level = newLevel;
}

export function createSpinner(text: string): Ora {
  if (level === "quiet") {
    return ora({ text, isSilent: true });
  }
  return ora({ text, spinner: "dots" });
}
