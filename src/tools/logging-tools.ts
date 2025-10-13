import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SimplifierClient} from "../client/simplifier-client.js";
import {SimplifierLogListOptions, SimplifierLogEntry} from "../client/types.js";
import {wrapToolResult} from "./toolresult.js";
import {z} from "zod";

function getLevelName(level: number): string {
  const levels = ['Debug', 'Info', 'Warning', 'Error', 'Critical'];
  return levels[level] || 'Unknown';
}

export function registerLoggingTools(server: McpServer, simplifier: SimplifierClient): void {

  const DEFAULT_PAGE_SIZE = 50;

  /* Note: this could be turned into a resource, if https://github.com/modelcontextprotocol/typescript-sdk/issues/149 is fixed */
  server.tool("logging-list",
    `# Get recent log entries from Simplifier

This tool provides access to the Simplifier logging system. You can filter logs by level and time range.
If no filters are used, it returns the ${DEFAULT_PAGE_SIZE} most recent log entries.

**Log Levels:**
- 0 = Debug
- 1 = Info
- 2 = Warning
- 3 = Error
- 4 = Critical

**Parameters:**
- pageSize: number of log entries to return in one request, defaults to ${DEFAULT_PAGE_SIZE}.
- page: if more than "pageSize" entries are available, this can be used for accessing later pages. Starts at 0, defaults to 0.
- logLevel: Filter by minimum log level (0-4)
- since: ISO timestamp for entries since this time
- from/until: ISO timestamps for a time range (must be used together)

**Examples:**
- Default: Get 50 most recent entries
- logLevel=3: Only errors and critical
- since="2025-01-01T00:00:00Z": Entries since date
`,
    {
      pageSize: z.number().optional().default(DEFAULT_PAGE_SIZE)
        .describe(`Number of log entries to return, defaults to ${DEFAULT_PAGE_SIZE}`),
      page: z.number().optional().default(0)
        .describe('Page number for pagination, starts at 0'),
      logLevel: z.number().min(0).max(4).optional()
        .describe('Filter by minimum log level (0=Debug, 1=Info, 2=Warning, 3=Error, 4=Critical)'),
      since: z.string().optional()
        .describe('ISO timestamp - get entries since this time'),
      from: z.string().optional()
        .describe('ISO timestamp - start of time range (must be used with until)'),
      until: z.string().optional()
        .describe('ISO timestamp - end of time range (must be used with from)')
    },
    {
      title: "List Simplifier Log Entries",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ pageSize, page, logLevel, since, from, until }) => {
      return wrapToolResult('list log entries', async () => {
        const options: SimplifierLogListOptions = {};
        if (logLevel !== undefined) options.logLevel = logLevel;
        if (since) options.since = since;
        if (from && until) {
          options.from = from;
          options.until = until;
        }

        const response = await simplifier.listLogEntriesPaginated(page, pageSize, options);
        const pageCount = await simplifier.getLogPages(pageSize, options);

        const logEntryResources = response.list.map((entry: SimplifierLogEntry) => ({
          uri: `simplifier://logging/entry/${entry.id}`,
          id: entry.id,
          date: entry.entryDate,
          level: entry.level,
          levelName: getLevelName(entry.level),
          category: entry.category,
          messageKey: entry.messageKey,
          hasDetails: entry.hasDetails
        }));

        return {
          logs: logEntryResources,
          totalCount: response.list.length,
          page: page,
          pageSize: pageSize,
          totalPages: pageCount.pages,
          filters: {
            logLevel: options.logLevel,
            since: options.since,
            from: options.from,
            until: options.until
          }
        };
      });
    }
  );
}
