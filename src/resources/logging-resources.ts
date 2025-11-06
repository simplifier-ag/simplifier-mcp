import {SimplifierClient} from "../client/simplifier-client.js";
import {McpServer, ResourceTemplate} from "@modelcontextprotocol/sdk/server/mcp.js";
import {wrapResourceResult} from "./resourcesresult.js";
import {trackingResourcePrefix} from "../client/matomo-tracking";

export function registerLoggingResources(server: McpServer, simplifier: SimplifierClient): void {

  const noListCallback = { list: undefined }

  const DEFAULT_PAGE_SIZE = 50


  // Main discoverable logging resource - shows up in resources/list
  // Returns recent log entries without filtering
  const resourceNameLoggingList = "logging-list"
  server.resource(resourceNameLoggingList, "simplifier://logging", {
      title: "Simplifier Log Entries",
      mimeType: "application/json",
      description: `# Get recent log entries from Simplifier

This resource provides access to the ${DEFAULT_PAGE_SIZE} most recent log entries from the Simplifier logging system.

**Note:** For filtered access to logs (by level, time range, pagination), use the \`logging-list\` tool instead.

**Log Levels:**
- 0 = Debug
- 1 = Info
- 2 = Warning
- 3 = Error
- 4 = Critical

**See also:**
- simplifier://logging/entry/{id} - Detailed log entry with full stack trace.
  Will only contain additional info, if "hasDetails" was true in the listing of the log item.
`
    },
    async (uri: URL) => {
      return wrapResourceResult(uri, async () => {
        const trackingKey = trackingResourcePrefix + resourceNameLoggingList;
        const response = await simplifier.listLogEntriesPaginated(0, DEFAULT_PAGE_SIZE, trackingKey, {});
        const pageCount = await simplifier.getLogPages(DEFAULT_PAGE_SIZE, {})

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
          page: 0,
          pageSize: DEFAULT_PAGE_SIZE,
          totalPages: pageCount.pages,
          note: "For filtered access to logs (by level, time range, pagination), use the logging-list tool"
        };
      });
    }
  );


  // Resource template for specific log entry details
  const resourceNameLogEntryDetails = "log-entry-details"
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

        const trackingKey = trackingResourcePrefix + resourceNameLogEntryDetails;
        const logEntry = await simplifier.getLogEntry(entryId, trackingKey);

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
