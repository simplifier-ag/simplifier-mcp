import {
  SimplifierBusinessObjectDetails,
  SimplifierApiResponse, SimplifierBusinessObjectFunction, SimplifierDataTypesResponse
} from './types.js';
import {config} from '../config.js';
import {login} from "./basicauth.js";

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

  getBaseUrl(): string {return this.baseUrl;}

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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async makeRequest<T>(
    urlPath: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await this.executeRequest(urlPath, options);

      const json = await response.json();
      const oResponse = json as SimplifierApiResponse<T>;
      if (oResponse.success === false) {
        throw new Error(`Received error: ${oResponse.error || ""}${oResponse.message || ""}`);
      }
      return (oResponse.result) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed request ${options.method || "GET"} ${this.baseUrl}${urlPath}: ${error.message}`);
      }
      throw error;
    }
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

  async getDataTypes(): Promise<SimplifierDataTypesResponse> {
    // The datatypes endpoint returns data directly, not wrapped in SimplifierApiResponse
    try {
      const response = await this.executeRequest("/UserInterface/api/datatypes?cacheIndex=true", { method: "GET" });
      return await response.json() as SimplifierDataTypesResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed request GET ${this.baseUrl}/UserInterface/api/datatypes?cacheIndex=true: ${error.message}`);
      }
      throw error;
    }
  }

}