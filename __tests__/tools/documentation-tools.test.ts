import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock resourceprovider to avoid `import.meta` issues in the CJS test runtime
// and to isolate this test from the on-disk .md files.
jest.mock("../../src/resourceprovider.js", () => ({
  readFile: (path: string) => `# Mocked content for ${path}\n\nLorem ipsum dolor sit amet.`
}));

import { registerDocumentationTools, DOCUMENTATION_TOPIC_NAMES } from "../../src/tools/documentation-tools.js";

describe("registerDocumentationTools", () => {
  let mockServer: jest.Mocked<McpServer>;

  beforeEach(() => {
    mockServer = { tool: jest.fn() } as any;
  });

  it("registers a single documentation-get tool", () => {
    registerDocumentationTools(mockServer);
    expect(mockServer.tool).toHaveBeenCalledTimes(1);
    expect(mockServer.tool.mock.calls[0][0]).toBe("documentation-get");
  });

  it("is marked read-only, idempotent and closed-world", () => {
    registerDocumentationTools(mockServer);
    const annotations = mockServer.tool.mock.calls[0][3] as any;
    expect(annotations.readOnlyHint).toBe(true);
    expect(annotations.destructiveHint).toBe(false);
    expect(annotations.idempotentHint).toBe(true);
    expect(annotations.openWorldHint).toBe(false);
  });

  it("exposes the expected set of topics", () => {
    expect(DOCUMENTATION_TOPIC_NAMES).toEqual(expect.arrayContaining([
      "server-businessobjects-guide",
      "user-api",
      "logging-api",
      "util-api",
      "connector-api",
      "connector/rest",
      "connector/soap",
      "connector/rfc",
      "connector/sql",
      "loginmethod/usercredentials",
      "loginmethod/oauth2",
      "loginmethod/token",
      "loginmethod/sapsso"
    ]));
  });

  it("validates that only known topics are accepted", () => {
    registerDocumentationTools(mockServer);
    const schema = mockServer.tool.mock.calls[0][2] as any;
    expect(() => schema.topic.parse("user-api")).not.toThrow();
    expect(() => schema.topic.parse("connector/rest")).not.toThrow();
    expect(() => schema.topic.parse("does-not-exist")).toThrow();
  });

  describe("handler behaviour", () => {
    it("returns non-empty markdown for every known topic", async () => {
      registerDocumentationTools(mockServer);
      const handler = mockServer.tool.mock.calls[0][4] as Function;

      for (const topic of DOCUMENTATION_TOPIC_NAMES) {
        const result = await handler({ topic });
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe("text");
        expect(typeof result.content[0].text).toBe("string");
        // Each doc should be non-trivial and starts with a markdown heading
        expect(result.content[0].text.length).toBeGreaterThan(50);
        expect(result.isError).toBeFalsy();
      }
    });

    it("server-businessobjects-guide contains the guide heading", async () => {
      registerDocumentationTools(mockServer);
      const handler = mockServer.tool.mock.calls[0][4] as Function;
      const result = await handler({ topic: "server-businessobjects-guide" });
      expect(result.content[0].text).toContain("Business Objects Development Guide");
    });
  });
});
