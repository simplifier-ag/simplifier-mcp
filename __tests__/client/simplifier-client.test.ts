// Mock config for this test
jest.mock('../../src/config', () => ({
  config: {
    simplifierBaseUrl: 'http://localhost:8080/api',
    nodeEnv: 'test'
  }
}));

import { SimplifierClient } from '../../src/client/simplifier-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('SimplifierClient', () => {
  let client: SimplifierClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new SimplifierClient();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create client with base URL from config', () => {
      expect(client).toBeInstanceOf(SimplifierClient);
    });
  });


  describe('business object methods', () => {
    it('should call getBusinessObjects endpoint', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', name: 'Test BO', script: 'return "hello";' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getBusinessObjects();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/businessobjects',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

  });
});