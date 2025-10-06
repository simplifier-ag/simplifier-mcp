import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {SimplifierClient} from "../client/simplifier-client.js";
import {registerServerBusinessObjectResources} from "./server-businessobject-resources.js";
import {registerDataTypesResources} from "./datatypes-resources.js";
import {registerConnectorResources} from "./connector-resources.js";
import {registerUserApiDocumentation} from "./documentation/user-api-documentation.js";
import {registerLoggingApiDocumentation} from "./documentation/logging-api-documentation.js";
import {registerUtilsApiDocumentation} from "./documentation/utils-api-documentation.js";
import { registerConnectorApiDocumentation } from "./documentation/connector-api-documentation.js";

/**
 * Resources for Simplifier Low Code Platform integration
 */
export function registerResources(server: McpServer, simplifier: SimplifierClient) {
  registerServerBusinessObjectResources(server, simplifier);
  registerDataTypesResources(server, simplifier);
  registerConnectorResources(server, simplifier);

  registerUserApiDocumentation(server);
  registerLoggingApiDocumentation(server);
  registerUtilsApiDocumentation(server);
  registerConnectorApiDocumentation(server);
}
