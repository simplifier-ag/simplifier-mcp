import {config} from '../config.js';
import {login} from "./basicauth.js";
import {
  BusinessObjectTestRequest,
  BusinessObjectTestResponse,
  ConnectorTestRequest,
  ConnectorTestResponse,
  CreateLoginMethodRequest,
  GenericApiResponse,
  SimplifierApiResponse,
  SimplifierBusinessObjectDetails,
  SimplifierBusinessObjectFunction,
  SimplifierConnectorCallDetails,
  SimplifierConnectorCallsResponse,
  SimplifierConnectorCallUpdate,
  SimplifierConnectorDetails,
  SimplifierConnectorListResponse,
  SimplifierConnectorUpdate,
  SimplifierDataType,
  SimplifierDataTypesResponse,
  SimplifierDataTypeUpdate, SimplifierInstance, SimplifierInstanceSettings,
  SimplifierLogEntryDetails,
  SimplifierLoginMethodDetailsRaw,
  SimplifierLoginMethodsResponse,
  SimplifierLogListOptions,
  SimplifierLogListResponse,
  SimplifierLogPagesResponse,
  SimplifierOAuth2ClientsResponse,
  UnwrappedSimplifierApiResponse,
  UpdateLoginMethodRequest,
} from './types.js';

/**
 * Client for interacting with Simplifier Low Code Platform REST API
 *
 * This client will need to be enhanced with SimplifierToken.
 * The SimplifierToken acts as a session key that needs to be:
 * - Obtained daily by the user
 * - Configured in environment variables
 * - Included in API requests as authentication header
 */
export class SimplifierClient {
  private baseUrl: string;
  private simplifierToken?: string | undefined;

  constructor() {
    this.baseUrl = config.simplifierBaseUrl;
  }

  getBaseUrl(): string { return this.baseUrl; }

  private async getSimplifierToken(): Promise<string> {
    if (!this.simplifierToken) {
      if (config.simplifierToken) {
        this.simplifierToken = config.simplifierToken;
      } else if (config.credentialsFile) {
        this.simplifierToken = await login();
      }
    }
    return this.simplifierToken!;
  }

  /**
   * Private method to execute HTTP request with common setup
   * Returns raw Response object for different processing approaches
   */
  private async executeRequest(urlPath: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${urlPath}`;
    const simplifierToken = await this.getSimplifierToken();

    const data = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'SimplifierToken': simplifierToken,
        ...options.headers,
      },
    }

    const response: Response = await fetch(url, data);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${body}`);
    }

    return response;
  }

  async executeRequestWithHandler<T>(
    urlPath: string,
    options: RequestInit,
    handle: (response: Response) => T
  ): Promise<T> {
    try {
      const response = await this.executeRequest(urlPath, options);

      return handle(response)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed request ${options.method || "GET"} ${this.baseUrl}${urlPath}: ${error.message}`);
      }
      throw error;
    }
  }

  /** For handling APIs that return JSON in the common Simplifier API format:
   * ```
   * { success: true, result: T } | {success: false, message?: string, error?: string }
   * ```
   */
  async makeRequest<T>(
    urlPath: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.executeRequestWithHandler(urlPath, options, async (response: Response) => {
      const oResponse = (await response.json()) as SimplifierApiResponse<T>;
      if (oResponse.success === false) {
        throw new Error(`Received error: ${oResponse.error || ""}${oResponse.message || ""}`);
      }
      return oResponse.result as T;
    })
  }

  /** For handling APIs that return JSON, but don't wrap successful calls with `{success: true, result: ... }`.
   * Errors are still expected to be of the form `{success: false, message?: string, error?: string }` */
  async makeUnwrappedRequest<T extends object>(
    urlPath: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.executeRequestWithHandler(urlPath, options, async (response: Response) => {
      const oResponse = (await response.json()) as UnwrappedSimplifierApiResponse<T>;
      if ('success' in oResponse && oResponse.success === false) {
        throw new Error(`Received error: ${oResponse.error || ""}${oResponse.message || ""}`);
      }
      return (oResponse) as T;
    })
  }

  /** For handling APIs that return plaintext results and errors */
  async makePlaintextRequest(
    urlPath: string,
    options: RequestInit = {}
  ): Promise<string> {
    return this.executeRequestWithHandler(urlPath, options, async (response: Response) => {
      return await response.text();
    })
  }

  async ping(): Promise<boolean> {
    return this.makeUnwrappedRequest<{msg: string}>(`/client/2.0/ping`).then(response => response.msg === "pong");
  }

  async getServerBusinessObjects(): Promise<SimplifierBusinessObjectDetails[]> {
    return this.makeRequest("/UserInterface/api/businessobjects/server", { method: "GET" })
  }

  async getServerBusinessObjectDetails(objectName: string): Promise<SimplifierBusinessObjectDetails> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server/${objectName}`, { method: "GET" })
  }

  async deleteServerBusinessObject(objectName: string): Promise<string> {
    const oResult = await  this.makeUnwrappedRequest<GenericApiResponse>(`/UserInterface/api/businessobjects/server/${objectName}`, {
      method: "DELETE",
    })
    return oResult.message;
  }

  async getServerBusinessObjectFunction(objectName: string, functionName: string): Promise<SimplifierBusinessObjectFunction> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server/${objectName}/functions/${functionName}?completions=false&dataTypes=true`, { method: "GET" })
  }

  async getServerBusinessObjectFunctions(objectName: string): Promise<SimplifierBusinessObjectFunction[]> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server/${objectName}/functions`, { method: "GET" })
  }

  async createServerBusinessObjectFunction(objectName: string, functionData: SimplifierBusinessObjectFunction): Promise<string> {
    await this.makeRequest(`/UserInterface/api/businessobjects/server/${objectName}/functions`, {
      method: "POST",
      body: JSON.stringify(functionData)
    });
    return `Successfully created function '${functionData.name}' in Business Object '${objectName}'`;
  }

  async updateServerBusinessObjectFunction(objectName: string, functionName: string, functionData: SimplifierBusinessObjectFunction): Promise<string> {
    await this.makeRequest(`/UserInterface/api/businessobjects/server/${objectName}/functions/${functionName}`, {
      method: "PUT",
      body: JSON.stringify(functionData)
    });
    return `Successfully updated function '${functionName}' in Business Object '${objectName}'`;
  }

  async testServerBusinessObjectFunction(objectName: string, functionName: string, testRequest: BusinessObjectTestRequest): Promise<BusinessObjectTestResponse> {
      return await this.makeUnwrappedRequest(`/UserInterface/api/businessobjecttest/${objectName}/methods/${functionName}`, {
        method: "POST",
        body: JSON.stringify(testRequest)
      });
  }

  async deleteServerBusinessObjectFunction(objectName: string, functionName: string): Promise<string> {
    const oResult = await this.makeUnwrappedRequest<GenericApiResponse>(`/UserInterface/api/businessobjects/server/${objectName}/functions/${functionName}`, {
      method: "DELETE",
    })
    return oResult.message;
  }

  async createServerBusinessObject(oData: SimplifierBusinessObjectDetails): Promise<string> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server`, { method: "POST", body: JSON.stringify(oData) })
      .then(() => `Successfully created Business Object '${oData.name}'`)
  }

  async updateServerBusinessObject(oData: SimplifierBusinessObjectDetails): Promise<string> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server/${oData.name}`, { method: "PUT", body: JSON.stringify(oData) })
      .then(() => `Successfully updated Business Object '${oData.name}'`);
  }

  async createConnector(oData: SimplifierConnectorUpdate): Promise<string> {
    await this.makeRequest(`/UserInterface/api/connectors`, { method: "POST", body: JSON.stringify(oData) });
    return `Successfully created Connector '${oData.name}'`;
  }

  async updateConnector(oData: SimplifierConnectorUpdate): Promise<string> {
    await this.makeRequest(`/UserInterface/api/connectors/${oData.name}`, { method: "PUT", body: JSON.stringify(oData) });
    return `Successfully updated Connector '${oData.name}'`;
  }

  async createConnectorCall(connectorName: string, oData: SimplifierConnectorCallUpdate): Promise<string> {
    await this.makeRequest(`/UserInterface/api/connectors/${connectorName}/calls`, { method: "POST", body: JSON.stringify(oData) });
    return `Successfully created Connector call '${connectorName}.${oData.name}'`;
  }

  async updateConnectorCall(connectorName: string, oData: SimplifierConnectorCallUpdate): Promise<string> {
    await this.makeRequest(`/UserInterface/api/connectors/${connectorName}/calls/${oData.name}`, { method: "PUT", body: JSON.stringify(oData) });
    return `Successfully updated Connector call '${connectorName}.${oData.name}'`;
  }

  async getDataTypes(): Promise<SimplifierDataTypesResponse> {
    return this.makeUnwrappedRequest("/UserInterface/api/datatypes?cacheIndex=true", { method: "GET" });
  }

  async getSingleDataType(name: string, nameSpace?: string): Promise<SimplifierDataType> {
    const fullDataType = `${nameSpace ? nameSpace + '/' : ''}${name}`
    return this.makeUnwrappedRequest(`/UserInterface/api/datatypes/${fullDataType}`, { method: "GET" });
  }

  /**
   * Get detailed information about a specific datatype by its full identifier.
   *
   * @param datatypeId - The fully qualified datatype identifier, which is namespace/datatypename.
   *                     For root namespace (no namespace), use just the datatype name without slash.
   *                     Examples:
   *                     - "bo/SF_User/getUser_groups_Struct" (business object datatype with namespace)
   *                     - "_ITIZ_B_BUS2038_DATA" (datatype in root namespace)
   * @returns Detailed datatype information including fields, category, and metadata
   */
  async getDataTypeById(datatypeId: string): Promise<SimplifierDataType> {
    return this.makeUnwrappedRequest(`/UserInterface/api/datatypes/${datatypeId}?woAutoGen=false&detailLevel=detailed`, { method: "GET" });
  }

  async createDataType(datatypeDesc: SimplifierDataTypeUpdate): Promise<string> {
    const fullDataType = `${datatypeDesc.nameSpace ? datatypeDesc.nameSpace + '/' : ''}${datatypeDesc.name}`
    return this.makePlaintextRequest(`/UserInterface/api/datatypes`, { method: "POST", body: JSON.stringify(datatypeDesc) })
      .then((id) => `Successfully created data type ${fullDataType} with id ${id}`);
  }

  async updateDataType(datatypeDesc: SimplifierDataTypeUpdate): Promise<string> {
    const fullDataType = `${datatypeDesc.nameSpace ? datatypeDesc.nameSpace + '/' : ''}${datatypeDesc.name}`
    return this.makePlaintextRequest(`/UserInterface/api/datatypes/${fullDataType}`, { method: "PUT", body: JSON.stringify(datatypeDesc) })
      .then((id) => `Successfully updated data type ${fullDataType} with id ${id}`)
  }

  async deleteDataType(name: string, nameSpace: string | undefined): Promise<string> {
    const fullDataType = `${nameSpace ? nameSpace + '/' : ''}${name}`
    return this.makePlaintextRequest(`/UserInterface/api/datatypes/${fullDataType}`, { method: "DELETE" });
  }

  // ========================================
  // Connector API Methods
  // ========================================

  async listConnectors(): Promise<SimplifierConnectorListResponse> {
    return this.makeUnwrappedRequest(`/UserInterface/api/connectors`);
  }

  async getConnector(name: string, withEndpointConfigurations: boolean = true): Promise<SimplifierConnectorDetails> {
    const params = withEndpointConfigurations ? '' : '?withEndpointConfigurations=false';
    return this.makeUnwrappedRequest(`/UserInterface/api/connectors/${name}${params}`);
  }

  async listConnectorCalls(connectorName: string): Promise<SimplifierConnectorCallsResponse> {
    return this.makeUnwrappedRequest(`/UserInterface/api/connectors/${connectorName}/calls`);
  }

  async getConnectorCall(connectorName: string, callName: string): Promise<SimplifierConnectorCallDetails> {
    return this.makeUnwrappedRequest(`/UserInterface/api/connectors/${connectorName}/calls/${callName}`);
  }


  async testConnectorCall(connectorName: string, callName: string, testRequest: ConnectorTestRequest): Promise<ConnectorTestResponse> {
    return await this.makeUnwrappedRequest(`/UserInterface/api/connectortest/${connectorName}/calls/${callName}`, {
      method: "POST",
      body: JSON.stringify(testRequest)
    });
  }

  async deleteConnector(connectorName: string): Promise<string> {
    const oResult = await this.makeUnwrappedRequest<GenericApiResponse>(`/UserInterface/api/connectors/${connectorName}`, {
      method: "DELETE"
    })
    return oResult.message;
  }

  async deleteConnectorCall(connectorName: string, callName: string): Promise<string> {
    const oResult = await this.makeUnwrappedRequest<GenericApiResponse>(`/UserInterface/api/connectors/${connectorName}/calls/${callName}`, {
      method: "DELETE"
    })
    return oResult.message;
  }

  // ========================================
  // LoginMethod API Methods
  // ========================================

  async listLoginMethods(): Promise<SimplifierLoginMethodsResponse> {
    return this.makeUnwrappedRequest(`/UserInterface/api/login-methods`);
  }


  async listOAuth2Clients(): Promise<SimplifierOAuth2ClientsResponse> {
    return this.makeUnwrappedRequest(`/UserInterface/api/AuthSettings?mechanism=OAuth2`);
  }

  async getLoginMethodDetails(name: string): Promise<SimplifierLoginMethodDetailsRaw> {
    return this.makeUnwrappedRequest(`/UserInterface/api/login-methods/${name}`);
  }


  async createLoginMethod(request: CreateLoginMethodRequest): Promise<string> {
    await this.makeUnwrappedRequest(`/UserInterface/api/login-methods`, {
      method: "POST",
      body: JSON.stringify(request)
    });
    return `Successfully created Login Method '${request.name}'`;
  }

  async updateLoginMethod(name: string, request: UpdateLoginMethodRequest): Promise<string> {
    await this.makeUnwrappedRequest(`/UserInterface/api/login-methods/${name}`, {
      method: "PUT",
      body: JSON.stringify(request)
    });
    return `Successfully updated Login Method '${name}'`;
  }

  // Logging API methods
  async listLogEntriesPaginated(pageNo: number, pageSize: number, options?: SimplifierLogListOptions): Promise<SimplifierLogListResponse> {
    const params = this.optionsToQueryParams(options)

    const queryString = params.toString();
    const url = queryString
      ? `/UserInterface/api/logging/list/page/${pageNo}/pagesize/${pageSize}?${queryString}`
      : `/UserInterface/api/logging/list/page/${pageNo}/pagesize/${pageSize}`;

    return await this.makeUnwrappedRequest(url);
  }

  async getLogPages(pageSize: number = 50, options?: SimplifierLogListOptions): Promise<SimplifierLogPagesResponse> {
    const params = this.optionsToQueryParams(options)
    params.append('pagesize', pageSize.toString())

    return await this.makeUnwrappedRequest(`/UserInterface/api/logging/pages?${params}`);
  }

  async getLogEntry(id: string): Promise<SimplifierLogEntryDetails> {
    return await this.makeUnwrappedRequest(`/UserInterface/api/logging/entry/${id}`);
  }

  optionsToQueryParams(options?: SimplifierLogListOptions): URLSearchParams {
    const params = new URLSearchParams();
    if (options?.logLevel !== undefined) params.append('logLevel', options.logLevel.toString());
    if (options?.since) params.append('since', options.since);
    if (options?.from) params.append('from', options.from);
    if (options?.until) params.append('until', options.until);
    return params;
  }


  // Instance settings

  async getInstanceSettings(): Promise<SimplifierInstance[]> {
    const oInstanceSettings: SimplifierInstanceSettings = await this.makeUnwrappedRequest(`/UserInterface/api/InstanceSettings`);
    return oInstanceSettings.instanceSettings;
  }

}