import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

const { mockFs, mockProcessTemplate } = vi.hoisted(() => {
  const mockProcessTemplate = vi.fn().mockResolvedValue([]);
  const mockFs = {
    exists: vi.fn().mockReturnValue(true),
    removeDir: vi.fn().mockResolvedValue(undefined),
    ensureDir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(""),
    copyFile: vi.fn().mockResolvedValue(undefined),
    getAllFiles: vi.fn().mockResolvedValue([]),
  };
  return { mockFs, mockProcessTemplate };
});

vi.mock("../../core/file-system", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FileSystem: vi.fn().mockImplementation(function (this: any) { return mockFs; }),
}));

vi.mock("../../core/template-engine", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TemplateEngine: vi.fn().mockImplementation(function (this: any) {
    return { processTemplate: mockProcessTemplate };
  }),
}));

import { NodePlugin } from "../../plugins/node";
import { PythonPlugin } from "../../plugins/python";

describe("claude-code addon — NodePlugin", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new NodePlugin();
  });

  it("includes claude-code in addon list", () => {
    expect(plugin.addons).toContain("claude-code");
  });

  it("generate() applies claude-code addon when claudeCode=true", async () => {
    await plugin.generate("my-app", {
      language: "node",
      claudeCode: true,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    const claudeCodeCall = calls.find((p) => p.includes("claude-code"));
    expect(claudeCodeCall).toBeDefined();
    expect(claudeCodeCall).toContain(path.join("addons", "claude-code"));
  });

  it("generate() skips claude-code addon when claudeCode=false", async () => {
    await plugin.generate("my-app", {
      language: "node",
      claudeCode: false,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    const claudeCodeCall = calls.find((p) => p.includes("claude-code"));
    expect(claudeCodeCall).toBeUndefined();
  });

  it("generate() skips claude-code addon when claudeCode is undefined", async () => {
    await plugin.generate("my-app", {
      language: "node",
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.find((p) => p.includes("claude-code"))).toBeUndefined();
  });
});

describe("claude-code addon — PythonPlugin", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("includes claude-code in addon list", () => {
    expect(plugin.addons).toContain("claude-code");
  });

  it("generate() applies claude-code addon when claudeCode=true", async () => {
    await plugin.generate("my-app", {
      language: "python",
      claudeCode: true,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    const claudeCodeCall = calls.find((p) => p.includes("claude-code"));
    expect(claudeCodeCall).toBeDefined();
    expect(claudeCodeCall).toContain(path.join("addons", "claude-code"));
  });

  it("generate() skips claude-code addon when claudeCode=false", async () => {
    await plugin.generate("my-app", {
      language: "python",
      claudeCode: false,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.find((p) => p.includes("claude-code"))).toBeUndefined();
  });
});

describe("cursor addon — NodePlugin", () => {
  let plugin: NodePlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new NodePlugin();
  });

  it("includes cursor in addon list", () => {
    expect(plugin.addons).toContain("cursor");
  });

  it("generate() applies cursor addon when cursor=true", async () => {
    await plugin.generate("my-app", {
      language: "node",
      cursor: true,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    const cursorCall = calls.find((p) => p.includes(path.join("addons", "cursor")));
    expect(cursorCall).toBeDefined();
  });

  it("generate() skips cursor addon when cursor=false", async () => {
    await plugin.generate("my-app", {
      language: "node",
      cursor: false,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.find((p) => p.includes(path.join("addons", "cursor")))).toBeUndefined();
  });

  it("generate() applies both claude-code and cursor when both=true", async () => {
    await plugin.generate("my-app", {
      language: "node",
      claudeCode: true,
      cursor: true,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.find((p) => p.includes("claude-code"))).toBeDefined();
    expect(calls.find((p) => p.includes(path.join("addons", "cursor")))).toBeDefined();
  });
});

describe("cursor addon — PythonPlugin", () => {
  let plugin: PythonPlugin;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessTemplate.mockResolvedValue([]);
    mockFs.exists.mockReturnValue(true);
    plugin = new PythonPlugin();
  });

  it("includes cursor in addon list", () => {
    expect(plugin.addons).toContain("cursor");
  });

  it("generate() applies cursor addon when cursor=true", async () => {
    await plugin.generate("my-app", {
      language: "python",
      cursor: true,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.find((p) => p.includes(path.join("addons", "cursor")))).toBeDefined();
  });

  it("generate() skips cursor addon when cursor=false", async () => {
    await plugin.generate("my-app", {
      language: "python",
      cursor: false,
      outputDir: "/tmp/my-app",
    });

    const calls = mockProcessTemplate.mock.calls.map((c) => c[0] as string);
    expect(calls.find((p) => p.includes(path.join("addons", "cursor")))).toBeUndefined();
  });
});
