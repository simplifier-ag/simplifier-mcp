import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "../resourceprovider.js";
import { SERVER_BUSINESSOBJECTS_GUIDE_MARKDOWN } from "../resources/documentation/businessobjects/guide.js";
import { USER_API_DOCUMENTATION_MARKDOWN } from "../resources/documentation/businessobjects/user-api-documentation.js";
import { LOGGING_API_DOCUMENTATION_MARKDOWN } from "../resources/documentation/businessobjects/logging-api-documentation.js";
import { UTIL_API_DOCUMENTATION_MARKDOWN } from "../resources/documentation/businessobjects/utils-api-documentation.js";
import { CONNECTOR_API_DOCUMENTATION_MARKDOWN } from "../resources/documentation/businessobjects/connector-api-documentation.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Table of documentation topics available through the `documentation-get` tool.
 * Each entry corresponds exactly to an existing `simplifier://documentation/...` resource,
 * so tool and resource surfaces stay in sync.
 */
const DOCUMENTATION_TOPICS = {
  "server-businessobjects-guide": {
    resource: "simplifier://documentation/server-businessobjects/guide",
    get: (): string => SERVER_BUSINESSOBJECTS_GUIDE_MARKDOWN
  },
  "user-api": {
    resource: "simplifier://documentation/server-businessobjects/api/User",
    get: (): string => USER_API_DOCUMENTATION_MARKDOWN
  },
  "logging-api": {
    resource: "simplifier://documentation/server-businessobjects/api/Logging",
    get: (): string => LOGGING_API_DOCUMENTATION_MARKDOWN
  },
  "util-api": {
    resource: "simplifier://documentation/server-businessobjects/api/Util",
    get: (): string => UTIL_API_DOCUMENTATION_MARKDOWN
  },
  "connector-api": {
    resource: "simplifier://documentation/server-businessobjects/api/Connector",
    get: (): string => CONNECTOR_API_DOCUMENTATION_MARKDOWN
  },
  "connector/rest": {
    resource: "simplifier://documentation/connector-type/rest",
    get: (): string => readFile("resources/documentation/connectors/rest.md")
  },
  "connector/soap": {
    resource: "simplifier://documentation/connector-type/soap",
    get: (): string => readFile("resources/documentation/connectors/soap.md")
  },
  "connector/rfc": {
    resource: "simplifier://documentation/connector-type/rfc",
    get: (): string => readFile("resources/documentation/connectors/rfc.md")
  },
  "connector/sql": {
    resource: "simplifier://documentation/connector-type/sql",
    get: (): string => readFile("resources/documentation/connectors/sql.md")
  },
  "loginmethod/usercredentials": {
    resource: "simplifier://documentation/loginmethod-type/usercredentials",
    get: (): string => readFile("resources/documentation/loginmethods/usercredentials.md")
  },
  "loginmethod/oauth2": {
    resource: "simplifier://documentation/loginmethod-type/oauth2",
    get: (): string => readFile("resources/documentation/loginmethods/oauth2.md")
  },
  "loginmethod/token": {
    resource: "simplifier://documentation/loginmethod-type/token",
    get: (): string => readFile("resources/documentation/loginmethods/token.md")
  },
  "loginmethod/sapsso": {
    resource: "simplifier://documentation/loginmethod-type/sapsso",
    get: (): string => readFile("resources/documentation/loginmethods/sapsso.md")
  }
} as const;

type DocumentationTopic = keyof typeof DOCUMENTATION_TOPICS;

const topicNames = Object.keys(DOCUMENTATION_TOPICS) as DocumentationTopic[];

/**
 * Read-only tool mirror for the Simplifier documentation resources.
 *
 * Tool descriptions in this MCP server frequently link to
 * `simplifier://documentation/...` resources for deeper context.
 * Clients that do not implement the `resources/*` capability cannot
 * follow those links, so this tool provides an equivalent way to
 * retrieve the same markdown documents. All content is served from
 * the exact same source that the corresponding resources use — there
 * is no content duplication.
 */
export function registerDocumentationTools(server: McpServer): void {

  const topicsList = topicNames
    .map(name => `- \`${name}\` → ${DOCUMENTATION_TOPICS[name].resource}`)
    .join("\n");

  const description = `# Get Simplifier documentation

Returns the markdown content of one of the documentation topics bundled with this MCP server.
Intended for MCP clients that do not support the \`resources/*\` capability; clients that DO
support resources should read the corresponding \`simplifier://documentation/...\` URI directly.

## Available topics

${topicsList}
`;

  server.tool("documentation-get",
    description,
    {
      topic: z.enum(topicNames as [DocumentationTopic, ...DocumentationTopic[]])
        .describe("The documentation topic to retrieve")
    },
    {
      title: "Get Simplifier documentation",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ topic }): Promise<CallToolResult> => {
      try {
        const text = DOCUMENTATION_TOPICS[topic].get();
        return {
          content: [{
            type: "text",
            text
          }]
        };
      } catch (e) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ error: `Tool documentation-get failed for topic ${topic}: ${e}` })
          }],
          isError: true
        };
      }
    });
}

/** Exported for testing purposes. */
export const DOCUMENTATION_TOPIC_NAMES: readonly DocumentationTopic[] = topicNames;
