import { describe, it, expect } from "vitest";
import { TemplateEngine } from "../../core/template-engine";

describe("TemplateEngine.replaceInString", () => {
  const engine = new TemplateEngine();

  it("replaces a single placeholder", () => {
    expect(engine.replaceInString("Hello {{PROJECT_NAME}}!", { PROJECT_NAME: "myapp" }))
      .toBe("Hello myapp!");
  });

  it("replaces multiple occurrences", () => {
    expect(engine.replaceInString("{{PROJECT_NAME}} / {{PROJECT_NAME}}", { PROJECT_NAME: "x" }))
      .toBe("x / x");
  });

  it("replaces multiple different placeholders", () => {
    expect(engine.replaceInString("{{PROJECT_NAME}} by {{AUTHOR}}", {
      PROJECT_NAME: "myapp",
      AUTHOR: "Duck",
    })).toBe("myapp by Duck");
  });

  it("replaces undefined variable with empty string", () => {
    expect(engine.replaceInString("{{AUTHOR}}", { PROJECT_NAME: "x", AUTHOR: undefined }))
      .toBe("");
  });

  it("leaves unknown placeholders unchanged", () => {
    expect(engine.replaceInString("{{UNKNOWN}}", { PROJECT_NAME: "x" }))
      .toBe("{{UNKNOWN}}");
  });

  it("returns original string with no placeholders", () => {
    expect(engine.replaceInString("no placeholders here", { PROJECT_NAME: "x" }))
      .toBe("no placeholders here");
  });
});
