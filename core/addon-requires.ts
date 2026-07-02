import { ArchGenError } from "./errors";

/** Throws when a flag is set but the addon/condition it depends on is not satisfied. */
export function assertAddonRequires(flag: boolean | undefined, satisfied: boolean, message: string): void {
  if (flag && !satisfied) {
    throw new ArchGenError("ADDON_REQUIRES_MISSING", message);
  }
}
