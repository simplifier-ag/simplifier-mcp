import {
  SimplifierBusinessObjectDetails,
  SimplifierApiResponse, SimplifierBusinessObjectFunction, SimplifierDataTypesResponse,
  BusinessObjectTestRequest, BusinessObjectTestResponse
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
    try {
      const response = await this.executeRequest(`/UserInterface/api/businessobjecttest/${objectName}/methods/${functionName}`, {
        method: "POST",
        body: JSON.stringify(testRequest)
      });

      const result = await response.json() as BusinessObjectTestResponse;
      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Enhanced error handling for specific HTTP status codes
        const errorMessage = error.message;
        if (errorMessage.includes('HTTP 404')) {
          throw new Error(`Business Object '${objectName}' or function '${functionName}' not found`);
        } else if (errorMessage.includes('HTTP 400')) {
          throw new Error(`Invalid parameters for function '${functionName}': ${errorMessage}`);
        } else if (errorMessage.includes('HTTP 500')) {
          throw new Error(`Function '${functionName}' execution failed: ${errorMessage}`);
        } else {
          throw new Error(`Failed to test function '${objectName}.${functionName}': ${errorMessage}`);
        }
      }
      throw error;
    }
  }

  async createServerBusinessObject(oData: SimplifierBusinessObjectDetails): Promise<string> {
    this.makeRequest(`/UserInterface/api/businessobjects/server`, { method: "POST", body: JSON.stringify(oData) });
    return `Successfully created Business Object '${oData.name}'`
  }

  async updateServerBusinessObject(oData: SimplifierBusinessObjectDetails): Promise<string> {
    this.makeRequest(`/UserInterface/api/businessobjects/server/${oData.name}`, { method: "PUT", body: JSON.stringify(oData) });
    return `Successfully updated Business Object '${oData.name}'`
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