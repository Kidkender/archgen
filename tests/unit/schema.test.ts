import { describe, it, expect } from "vitest";
import { validateGenerateOptions } from "../../core/schema";
import { ArchGenError } from "../../core/errors";
import { GenerateOptions } from "../../types";

describe("validateGenerateOptions", () => {
  it("returns options unchanged when valid", () => {
    const options: GenerateOptions = { language: "node", database: "mysql", docker: true };
    expect(validateGenerateOptions(options)).toMatchObject(options);
  });

  it("throws VALIDATION_ERROR when language is missing", () => {
    const options = { language: "" } as GenerateOptions;
    expect(() => validateGenerateOptions(options)).toThrow(ArchGenError);
    expect(() => validateGenerateOptions(options)).toThrow(/language/i);
  });

  it("throws VALIDATION_ERROR with code set on the error", () => {
    try {
      validateGenerateOptions({ language: "" } as GenerateOptions);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ArchGenError);
      expect((error as ArchGenError).code).toBe("VALIDATION_ERROR");
    }
  });

  it("throws when a boolean flag receives a non-boolean value", () => {
    const options = { language: "node", docker: "yes" } as unknown as GenerateOptions;
    expect(() => validateGenerateOptions(options)).toThrow(ArchGenError);
  });

  it.each([
    ["node", "mysql"],
    ["node", "postgresql"],
    ["python", "postgresql"],
    ["python", "sqlite"],
    ["go", "postgresql"],
  ])("accepts %s + %s as a valid database pairing", (language, database) => {
    expect(() => validateGenerateOptions({ language, database })).not.toThrow();
  });

  it.each([
    ["node", "sqlite"],
    ["python", "mysql"],
    ["go", "mysql"],
  ])("rejects %s + %s as an invalid database pairing", (language, database) => {
    expect(() => validateGenerateOptions({ language, database })).toThrow(ArchGenError);
    expect(() => validateGenerateOptions({ language, database })).toThrow(/database/i);
  });

  it("skips database validation for unknown languages (registry check happens later)", () => {
    expect(() => validateGenerateOptions({ language: "ruby", database: "mongodb" })).not.toThrow();
  });

  it("allows omitting database entirely", () => {
    expect(() => validateGenerateOptions({ language: "node" })).not.toThrow();
  });
});
