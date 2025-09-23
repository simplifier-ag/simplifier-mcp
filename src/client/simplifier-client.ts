import {
  SimplifierBusinessObject,
  SimplifierApiResponse
} from './types.js';
import { config } from '../config.js';

/**
 * Client for interacting with Simplifier Low Code Platform REST API
 *
 * TODO: SimplifierToken Authentication
 * This client will need to be enhanced with SimplifierToken authentication.
 * The SimplifierToken acts as a session key that needs to be:
 * - Obtained daily by the user
 * - Configured in environment variables
 * - Included in API requests as authentication header
 *
 * Implementation notes for future story:
 * - Add SimplifierToken to request headers
 * - Provide clear error messages for authentication issues
 */
export class SimplifierClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.simplifierBaseUrl;
  }

  // TODO: Add authentication headers when SimplifierToken is implemented
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<SimplifierApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      // TODO: Add SimplifierToken header when implemented
      // 'Authorization': `Bearer ${config.simplifierToken}`,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        // TODO: Handle specific authentication errors when SimplifierToken is implemented
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as SimplifierApiResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to make request to ${url}: ${error.message}`);
      }
      throw error;
    }
  }

  // BusinessObject methods TODO implement - this was made up by claude
  async getBusinessObjects(): Promise<SimplifierApiResponse<SimplifierBusinessObject[]>> {
    return this.makeRequest<SimplifierBusinessObject[]>('/businessobjects');
  }

}