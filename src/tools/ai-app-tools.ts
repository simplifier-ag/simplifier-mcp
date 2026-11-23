import { SimplifierClient } from "../client/simplifier-client.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wrapToolResult } from "./toolresult.js";
import { z } from "zod";
import { trackingToolPrefix } from "../client/matomo-tracking.js";

export function registerAiAppTools(server: McpServer, simplifier: SimplifierClient): void {

  const toolNameDeploy = "ai-app-deploy";
  server.tool(toolNameDeploy,
    `# Deploy an AI App

Builds an AI App (created with the AI App Editor) and makes it live, replacing what is currently served.

- Without \`branch\`, the app's working directory is built, including uncommitted changes.
- With \`branch\`, the latest commit of that local branch of the app's git repository is built in a temporary
  checkout. The working directory and its uncommitted changes are untouched. This takes longer, as the UI5 framework
  is built fully.

Only one deploy per app can run at a time. A later deploy (also from the AI App Editor) replaces this one; use
\`ai-app-deployed-source-get\` to check what is live.`,
    {
      appName: z.string().describe("Technical name of the AI App"),
      branch: z.string().regex(/^[A-Za-z0-9._\/-]+$/).optional()
        .describe("Local branch to deploy instead of the working directory, e.g. 'feature/new-dashboard'. Plain branch names only, no tags, commit ids or revision syntax. Omit to deploy the working directory."),
      deployToBtp: z.boolean().default(false)
        .describe("Also copy the build to the app's SAP BTP deployment directory (no-op if no BTP deployment is configured)")
    },
    {
      title: "Deploy an AI App",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ appName, branch, deployToBtp }) => {
      return wrapToolResult(`deploy AI App ${appName}${branch ? ` (branch ${branch})` : ""}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameDeploy;
        return simplifier.deployAiApp(appName, branch, deployToBtp, trackingKey);
      });
    });

  const toolNameSource = "ai-app-deployed-source-get";
  server.tool(toolNameSource,
    `# Get the deployed source of an AI App

Returns branch, commit, dirty flag, origin (editor, api, transport), user and time of the last successful deploy,
and the branch checked out in the app's working directory. \`source\` is null if no deploy was recorded.`,
    {
      appName: z.string().describe("Technical name of the AI App")
    },
    {
      title: "Get deployed source of an AI App",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    },
    async ({ appName }) => {
      return wrapToolResult(`get deployed source of AI App ${appName}`, async () => {
        const trackingKey = trackingToolPrefix + toolNameSource;
        return simplifier.getAiAppDeployedSource(appName, trackingKey);
      });
    });
}
