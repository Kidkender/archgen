import { describe, it, expect } from "vitest";
import { getNameError } from "../../core/validation";

describe("getNameError", () => {
  it("returns error for empty name", () => {
    expect(getNameError("")).not.toBeNull();
    expect(getNameError("   ")).not.toBeNull();
  });

  it("returns error for name over 214 chars", () => {
    expect(getNameError("a".repeat(215))).not.toBeNull();
  });

  it("returns null for name exactly 214 chars", () => {
    expect(getNameError("a".repeat(214))).toBeNull();
  });

  it("returns error for name starting with dot", () => {
    expect(getNameError(".hidden")).not.toBeNull();
  });

  it("returns error for name starting with dash", () => {
    expect(getNameError("-myapp")).not.toBeNull();
  });

  it("returns error for name starting with underscore", () => {
    expect(getNameError("_private")).not.toBeNull();
  });

  it("returns error for uppercase letters", () => {
    expect(getNameError("MyApp")).not.toBeNull();
  });

  it("returns error for spaces", () => {
    expect(getNameError("my app")).not.toBeNull();
  });

  it("returns null for valid names", () => {
    expect(getNameError("my-app")).toBeNull();
    expect(getNameError("my_app")).toBeNull();
    expect(getNameError("myapp123")).toBeNull();
    expect(getNameError("app")).toBeNull();
  });
});
