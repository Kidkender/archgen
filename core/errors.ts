export type ArchGenErrorCode =
  | "INVALID_PATH"
  | "NAME_ERROR"
  | "DIR_EXISTS"
  | "UNSUPPORTED_LANGUAGE"
  | "GENERATE_FAILED"
  | "NO_PLUGIN"
  | "NO_ADDON_SUPPORT"
  | "ADDON_FAILED"
  | "ADDON_REQUIRES_MISSING"
  | "OUTPUT_DIR_NOT_FOUND";

export class ArchGenError extends Error {
  code: ArchGenErrorCode;

  constructor(code: ArchGenErrorCode, message: string) {
    super(message);
    this.name = "ArchGenError";
    this.code = code;
  }
}
