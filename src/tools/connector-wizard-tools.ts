import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";
import { RFCWizardSearchOptions } from "../client/types.js";

const PAGE_SIZE = 50;

/**
 * Read-only tool mirror for the RFC connector wizard search resource.
 *
 * Exists so that MCP clients without the `resources/*` capability can
 * still search for callable RFC functions on an SAP backend. Clients
 * that support resources should prefer the corresponding
 * `simplifier://connector-wizard/{connectorName}/search/{term}/{page}`
 * resource.
 */
export function registerConnectorWizardTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolName = "connector-wizard-rfc-search";
  server.tool(toolName,
    `# Search RFC functions available to an RFC connector

Searches for SAP RFC functions available to the given RFC connector whose names contain the given \`term\`.
At most ${PAGE_SIZE} results are returned per page; use \`page\` (0-based) to navigate further pages.

Equivalent to reading the \`simplifier://connector-wizard/{connectorName}/search/{term}/{page}\` resource;
prefer the resource in clients that support MCP Resources.`,
    {
      connectorName: z.string().describe("Name of an existing RFC connector"),
      term: z.string().describe("Search term (matched case-insensitively against function names)"),
      page: z.number().int().nonnegative().optional().default(0).describe("0-based page index (defaults to 0)")
    },
    {
      title: "Search RFC connector functions",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ connectorName, term, page }) => {
      return wrapToolResult(`search RFC functions for connector ${connectorName}`, async () => {
        const trackingKey = trackingToolPrefix + toolName;
        const filter: RFCWizardSearchOptions = {
          searchOptions: {
            searchValue: term
          },
          retrievalOptions: {
            filter: `%${term}%`,
            filterMode: "Simple"
          }
        };
        const matches = await simplifier.searchPossibleRFCConnectorCalls(connectorName, filter, trackingKey);
        const pageNo = page ?? 0;
        return {
          matches: matches.slice(pageNo * PAGE_SIZE, (pageNo + 1) * PAGE_SIZE),
          searchTerm: term,
          page: pageNo,
          totalPages: Math.ceil(matches.length / PAGE_SIZE),
          totalMatches: matches.length
        };
      });
    });
}
