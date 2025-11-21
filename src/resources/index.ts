import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SimplifierClient } from "../client/simplifier-client.js";
import { registerServerBusinessObjectResources } from "./server-businessobject-resources.js";
import { registerDataTypesResources } from "./datatypes-resources.js";
import { registerConnectorResources } from "./connector-resources.js";
import { registerLoginMethodResources } from "./loginmethod-resources.js";
import { registerOAuth2ClientResources } from "./oauthclient-resources.js";
import { registerLoggingResources } from "./logging-resources.js";
import { registerUserApiDocumentation } from "./documentation/businessobjects/user-api-documentation.js";
import { registerLoggingApiDocumentation } from "./documentation/businessobjects/logging-api-documentation.js";
import { registerUtilApiDocumentation } from "./documentation/businessobjects/utils-api-documentation.js";
import { registerConnectorApiDocumentation } from "./documentation/businessobjects/connector-api-documentation.js";
import { registerServerEnvironmentResources } from "./server-environment-resources.js";
import { registerSapSystemResources } from "./sapsystem-resources.js";
import { registerConnectorDocumentation } from "./documentation/connectors/connector-documentation.js";
import { registerLoginMethodDocumentation } from "./documentation/loginmethods/loginmethod-documentation.js";
import { registerServerBusinessObjectGuide } from "./documentation/businessobjects/guide.js";

/**
 * Resources for Simplifier Low Code Platform integration
 */
export function registerResources(server: McpServer, simplifier: SimplifierClient) {
  registerServerBusinessObjectResources(server, simplifier);
  registerDataTypesResources(server, simplifier);
  registerConnectorResources(server, simplifier);
  registerLoginMethodResources(server, simplifier);
  registerOAuth2ClientResources(server, simplifier);
  registerLoggingResources(server, simplifier);
  registerServerEnvironmentResources(server, simplifier);
  registerSapSystemResources(server, simplifier);

  registerServerBusinessObjectGuide(server);
  registerUserApiDocumentation(server);
  registerLoggingApiDocumentation(server);
  registerUtilApiDocumentation(server);
  registerConnectorApiDocumentation(server);

  registerConnectorDocumentation(server);
  registerLoginMethodDocumentation(server);

}
