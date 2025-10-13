import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import { SimplifierLogListOptions } from "../client/types.js";

export function registerLoggingResources(server: McpServer, simplifier: SimplifierClient): void {

  const noListCallback = { list: undefined }

  const DEFAULT_PAGE_SIZE = 50

  // Main discoverable logging resource - shows up in resources/list
  // Uses ResourceTemplate with query parameters for filtering
  const loggingListTemplate = new ResourceTemplate("simplifier://logging{?logLevel,since,from,until,pageSize,page}", noListCallback);

  server.resource("logging-list", loggingListTemplate, {
      title: "Simplifier Log Entries",
      mimeType: "application/json",
      description: `# Get recent log entries from Simplifier

This resource provides access to the Simplifier logging system. You can filter logs by level and time range using query
parameters. If no filters are used, it returns the ${DEFAULT_PAGE_SIZE} most recent log entries.

**Log Levels:**
- 0 = Debug
- 1 = Info
- 2 = Warning
- 3 = Error
- 4 = Critical

**Query Parameters:**
- pageSize: number of log entries to return in one request, defaults to ${DEFAULT_PAGE_SIZE}.
- page: if more than "pageSize" entries are available, this can be used for accessing later pages. Starts at 0, defaults to 0.
- logLevel: Filter by minimum log level (0-4)
- since: ISO timestamp for entries since this time
- from/until: ISO timestamps for a time range (must be used together)

**Resource Patterns:**
- simplifier://logging - Recent log entries
- simplifier://logging?logLevel=3 - Only errors and critical
- simplifier://logging?since=2025-01-01T00:00:00Z - Entries since date
- simplifier://logging/entry/{id} - Detailed log entry with full stack trace.
  Will only contain additional info, if "hasDetails" was true in the listing of the log item.
`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const logLevel = uri.searchParams.get('logLevel');
        const since = uri.searchParams.get('since');
        const from = uri.searchParams.get('from');
        const until = uri.searchParams.get('until');
        const pageSizeStr = uri.searchParams.get('pageSize');
        const pageStr = uri.searchParams.get('page');

        const options: SimplifierLogListOptions = {};
        if (logLevel !== null) options.logLevel = parseInt(logLevel, 10);
        if (since) options.since = since;
        if (from && until) {
            options.from = from;
            options.until = until;
        }

        const pageSize = pageSizeStr !== null ? parseInt(pageSizeStr, 10) : DEFAULT_PAGE_SIZE;
        const page = pageStr !== null ? parseInt(pageStr, 10) : 0;

        const response = await simplifier.listLogEntriesPaginated(page, pageSize, options);
        const pageCount = await simplifier.getLogPages(pageSize, options)

        const logEntryResources = response.list.map(entry => ({
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

  // Resource template for specific log entry details
  const logEntryDetailsTemplate = new ResourceTemplate("simplifier://logging/entry/{id}", noListCallback);

  server.resource("log-entry-details", logEntryDetailsTemplate, {
      title: "Log Entry Details",
      mimeType: "application/json",
      description: `# Get detailed information about a specific log entry

Returns complete log entry information including:
- Full error message and stack trace (if available)
- Timestamp and log level
- Category and message key
- Additional context information`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const pathParts = uri.pathname.split('/').filter(p => p);
        const entryId = pathParts[1]; // entry/{id}

        if (!entryId) {
          throw new Error('Log entry ID is required');
        }

        const logEntry = await simplifier.getLogEntry(entryId);

        return {
          id: logEntry.id,
          date: logEntry.entryDate,
          level: logEntry.level,
          levelName: getLevelName(logEntry.level),
          category: logEntry.category,
          messageKey: logEntry.messageKey,
          messageParams: logEntry.messageParams,
          hasDetails: logEntry.hasDetails,
          details: logEntry.details,
          context: logEntry.context
        };
      });
    }
  );
}

/**
 * Convert numeric log level to human-readable name
 */
function getLevelName(level: number): string {
  const levels: Record<number, string> = {
    0: "Debug",
    1: "Info",
    2: "Warning",
    3: "Error",
    4: "Critical"
  };
  return levels[level] || "Unknown";
}
