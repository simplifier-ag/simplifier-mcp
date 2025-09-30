import { config } from '../config.js';
import { login } from "./basicauth.js";
import {
    BusinessObjectTestRequest, BusinessObjectTestResponse,
    SimplifierApiResponse,
    SimplifierBusinessObjectDetails,
    SimplifierBusinessObjectFunction,
    SimplifierDataType,
    SimplifierDataTypesResponse,
    SimplifierDataTypeUpdate,
    UnwrappedSimplifierApiResponse
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

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'SimplifierToken': simplifierToken,
        ...options.headers,
      },
    });

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


  async getServerBusinessObjects(): Promise<SimplifierBusinessObjectDetails[]> {
    return this.makeRequest("/UserInterface/api/businessobjects/server", { method: "GET" })
  }

  async getServerBusinessObjectDetails(objectName: string): Promise<SimplifierBusinessObjectDetails> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server/${objectName}`, { method: "GET" })
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

  async createServerBusinessObject(oData: SimplifierBusinessObjectDetails): Promise<string> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server`, { method: "POST", body: JSON.stringify(oData) })
      .then(() => `Successfully created Business Object '${oData.name}'`)
  }

  async updateServerBusinessObject(oData: SimplifierBusinessObjectDetails): Promise<string> {
    return this.makeRequest(`/UserInterface/api/businessobjects/server/${oData.name}`, { method: "PUT", body: JSON.stringify(oData) })
      .then(() => `Successfully updated Business Object '${oData.name}'`);
  }

  async getDataTypes(): Promise<SimplifierDataTypesResponse> {
    return this.makeUnwrappedRequest("/UserInterface/api/datatypes?cacheIndex=true", { method: "GET" });
  }

  async getSingleDataType(name: string, nameSpace?: string): Promise<SimplifierDataType> {
    const fullDataType = `${nameSpace ? nameSpace + '/' : ''}${name}`
    return this.makeUnwrappedRequest(`/UserInterface/api/datatypes/${fullDataType}`, { method: "GET" });
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
}