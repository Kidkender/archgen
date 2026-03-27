import { describe, it, expect, vi, afterEach } from "vitest";

const mockExistsSync = vi.hoisted(() => vi.fn<(p: string) => boolean>());
const mockReadFileSync = vi.hoisted(() => vi.fn<(p: string, enc: string) => string>());

vi.mock("fs-extra", () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
  },
}));

import { detectProjectLanguage } from "../../core/detector";

afterEach(() => {
  vi.clearAllMocks();
});

describe("detectProjectLanguage", () => {
  it("returns 'node' when package.json contains fastify dependency", () => {
    mockExistsSync.mockImplementation((p) => p.endsWith("package.json"));
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ dependencies: { fastify: "^5.0.0" } })
    );
    expect(detectProjectLanguage("/some/project")).toBe("node");
  });

  it("returns 'node' when fastify is in devDependencies", () => {
    mockExistsSync.mockImplementation((p) => p.endsWith("package.json"));
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ devDependencies: { fastify: "^5.0.0" } })
    );
    expect(detectProjectLanguage("/some/project")).toBe("node");
  });

  it("returns null when package.json exists but no fastify", () => {
    mockExistsSync.mockImplementation((p) => p.endsWith("package.json"));
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ dependencies: { express: "^4.0.0" } })
    );
    expect(detectProjectLanguage("/some/project")).toBeNull();
  });

  it("returns 'python' when pyproject.toml exists", () => {
    mockExistsSync.mockImplementation((p) => p.endsWith("pyproject.toml"));
    expect(detectProjectLanguage("/some/project")).toBe("python");
  });

  it("returns 'python' when main.py exists", () => {
    mockExistsSync.mockImplementation((p) => p.endsWith("main.py"));
    expect(detectProjectLanguage("/some/project")).toBe("python");
  });

  it("returns null when no known project files found", () => {
    mockExistsSync.mockReturnValue(false);
    expect(detectProjectLanguage("/some/empty")).toBeNull();
  });

  it("returns null when package.json is not valid JSON", () => {
    mockExistsSync.mockImplementation((p) => p.endsWith("package.json"));
    mockReadFileSync.mockReturnValue("not valid json {{{");
    expect(detectProjectLanguage("/some/project")).toBeNull();
  });

  it("prefers node detection over python when both package.json (fastify) and main.py exist", () => {
    mockExistsSync.mockReturnValue(true); // all files "exist"
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ dependencies: { fastify: "^5.0.0" } })
    );
    expect(detectProjectLanguage("/some/project")).toBe("node");
  });
});
