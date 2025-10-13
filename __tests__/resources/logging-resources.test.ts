import { registerLoggingResources } from '../../src/resources/logging-resources';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  SimplifierLogListResponse,
  SimplifierLogEntryDetails
} from '../../src/client/types';

// Mock the resourcesresult wrapper
jest.mock('../../src/resources/resourcesresult', () => ({
  wrapResourceResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('Logging Resources', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockClient: jest.Mocked<SimplifierClient>;
  let mockWrapResourceResult: jest.MockedFunction<any>;

  beforeEach(() => {
    // Create mock server with resource method
    mockServer = {
      resource: jest.fn(),
    } as any;

    // Create mock client
    mockClient = {
      listLogEntries: jest.fn(),
      getLogEntry: jest.fn(),
    } as any;

    // Get the mocked wrapResourceResult
    mockWrapResourceResult = require('../../src/resources/resourcesresult').wrapResourceResult;
    mockWrapResourceResult.mockClear();
  });

  const createMockExtra = () => ({
    signal: new AbortController().signal,
    requestId: 'test-request-id',
    sendNotification: jest.fn(),
    sendRequest: jest.fn()
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockLogListResponse: SimplifierLogListResponse = {
    list: [
      {
        id: 'LOG001',
        entryDate: '2025-01-15T10:30:00Z',
        level: 3,
        messageKey: 'System_Error',
        messageParams: [],
        hasDetails: true,
        category: 'System'
      },
      {
        id: 'LOG002',
        entryDate: '2025-01-15T09:15:00Z',
        level: 2,
        messageKey: 'System_Warning',
        messageParams: ['param1'],
        hasDetails: false,
        category: 'Application'
      }
    ]
  };

  const mockLogEntryDetails: SimplifierLogEntryDetails = {
    id: 'LOG001',
    entryDate: '2025-01-15T10:30:00Z',
    level: 3,
    messageKey: 'System_Error',
    messageParams: [],
    hasDetails: true,
    category: 'System',
    details: 'java.lang.NullPointerException: Test error\n\tat com.example.Test.method(Test.java:42)',
    context: []
  };

  describe('registerLoggingResources', () => {
    it('should register two logging resources', () => {
      registerLoggingResources(mockServer, mockClient);

      expect(mockServer.resource).toHaveBeenCalledTimes(2);

      // Check that specific resources are registered
      const calls = mockServer.resource.mock.calls;
      const resourceNames = calls.map(call => call[0]);

      expect(resourceNames).toContain('logging-list');
      expect(resourceNames).toContain('log-entry-details');
    });

    describe('logging list handler', () => {
      let loggingListHandler: any;

      beforeEach(() => {
        registerLoggingResources(mockServer, mockClient);
        loggingListHandler = mockServer.resource.mock.calls[0][3]; // First resource (logging list)
      });

      it('should call wrapResourceResult with correct parameters', async () => {
        const testUri = new URL('simplifier://logging');
        mockWrapResourceResult.mockResolvedValue({ contents: [] });

        await loggingListHandler(testUri, {}, createMockExtra());

        expect(mockWrapResourceResult).toHaveBeenCalledWith(
          testUri,
          expect.any(Function)
        );
      });

      it('should return log entries list through wrapper', async () => {
        const testUri = new URL('simplifier://logging');
        mockClient.listLogEntries.mockResolvedValue(mockLogListResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loggingListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLogEntries).toHaveBeenCalledWith({});
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.logs).toHaveLength(2);
        expect(resultData.totalCount).toBe(2);
        expect(resultData.logs[0].uri).toBe('simplifier://logging/entry/LOG001');
        expect(resultData.logs[0].id).toBe('LOG001');
        expect(resultData.logs[0].levelName).toBe('Error');
      });

      it('should filter by log level', async () => {
        const testUri = new URL('simplifier://logging?logLevel=3');
        mockClient.listLogEntries.mockResolvedValue(mockLogListResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loggingListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLogEntries).toHaveBeenCalledWith({ logLevel: 3 });
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.filters.logLevel).toBe(3);
      });

      it('should filter by since parameter', async () => {
        const testUri = new URL('simplifier://logging?since=2025-01-01T00:00:00Z');
        mockClient.listLogEntries.mockResolvedValue(mockLogListResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loggingListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLogEntries).toHaveBeenCalledWith({ since: '2025-01-01T00:00:00Z' });
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.filters.since).toBe('2025-01-01T00:00:00Z');
      });

      it('should filter by from and until parameters', async () => {
        const testUri = new URL('simplifier://logging?from=2025-01-01T00:00:00Z&until=2025-01-31T23:59:59Z');
        mockClient.listLogEntries.mockResolvedValue(mockLogListResponse);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await loggingListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLogEntries).toHaveBeenCalledWith({
          from: '2025-01-01T00:00:00Z',
          until: '2025-01-31T23:59:59Z'
        });
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.filters.from).toBe('2025-01-01T00:00:00Z');
        expect(resultData.filters.until).toBe('2025-01-31T23:59:59Z');
      });

      it('should handle API errors through wrapper', async () => {
        const testUri = new URL('simplifier://logging');
        const testError = new Error('API Error');
        mockClient.listLogEntries.mockRejectedValue(testError);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          try {
            await fn();
            return { contents: [] };
          } catch (e) {
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({ error: `Failed to fetch: ${e}` }),
                mimeType: 'application/json'
              }]
            };
          }
        });

        const result = await loggingListHandler(testUri, {}, createMockExtra());

        expect(mockClient.listLogEntries).toHaveBeenCalled();
        expect(result.contents[0].text).toContain('Failed to fetch');
        expect(result.contents[0].text).toContain('API Error');
      });
    });

    describe('log entry details handler', () => {
      let logEntryDetailsHandler: any;

      beforeEach(() => {
        registerLoggingResources(mockServer, mockClient);
        logEntryDetailsHandler = mockServer.resource.mock.calls[1][3]; // Second resource (log entry details)
      });

      it('should return log entry details', async () => {
        const testUri = new URL('simplifier://logging/entry/LOG001');
        mockClient.getLogEntry.mockResolvedValue(mockLogEntryDetails);

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          const result = await fn();
          return {
            contents: [{
              uri: uri.href,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json'
            }]
          };
        });

        const result = await logEntryDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLogEntry).toHaveBeenCalledWith('LOG001');
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.id).toBe('LOG001');
        expect(resultData.level).toBe(3);
        expect(resultData.levelName).toBe('Error');
        expect(resultData.details).toContain('NullPointerException');
        expect(resultData.hasDetails).toBe(true);
      });

      it('should throw error if log entry ID is missing', async () => {
        const testUri = new URL('simplifier://logging/entry/');

        mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
          try {
            await fn();
            return { contents: [] };
          } catch (e: any) {
            return {
              contents: [{
                uri: uri.href,
                text: JSON.stringify({ error: e.message }),
                mimeType: 'application/json'
              }]
            };
          }
        });

        const result = await logEntryDetailsHandler(testUri, {}, createMockExtra());

        expect(mockClient.getLogEntry).not.toHaveBeenCalled();
        const resultData = JSON.parse(result.contents[0].text as string);
        expect(resultData.error).toBe('Log entry ID is required');
      });
    });
  });

  describe('resource registration configuration', () => {
    it('should register logging-list as a simple resource', () => {
      registerLoggingResources(mockServer, mockClient);

      // First call should be simple resource (string URI)
      expect(mockServer.resource).toHaveBeenNthCalledWith(
        1,
        'logging-list',
        'simplifier://logging',
        expect.objectContaining({
          title: 'Simplifier Log Entries',
          mimeType: 'application/json'
        }),
        expect.any(Function)
      );
    });

    it('should register log-entry-details as a template resource', () => {
      registerLoggingResources(mockServer, mockClient);

      // Second call should be template resource
      const secondCall = mockServer.resource.mock.calls[1];
      expect(secondCall[0]).toBe('log-entry-details');
      expect(secondCall[1]).toHaveProperty('uriTemplate');
      expect(secondCall[2]).toHaveProperty('title', 'Log Entry Details');
    });
  });

  describe('level name conversion', () => {
    it('should convert numeric log levels to names', async () => {
      const testUri = new URL('simplifier://logging');
      const responseWithDifferentLevels: SimplifierLogListResponse = {
        list: [
          { id: '1', entryDate: '2025-01-15T10:00:00Z', level: 0, messageKey: 'debug', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '2', entryDate: '2025-01-15T10:00:00Z', level: 1, messageKey: 'info', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '3', entryDate: '2025-01-15T10:00:00Z', level: 2, messageKey: 'warning', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '4', entryDate: '2025-01-15T10:00:00Z', level: 3, messageKey: 'error', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '5', entryDate: '2025-01-15T10:00:00Z', level: 4, messageKey: 'critical', messageParams: [], hasDetails: false, category: 'Test' }
        ]
      };
      mockClient.listLogEntries.mockResolvedValue(responseWithDifferentLevels);

      registerLoggingResources(mockServer, mockClient);
      const loggingListHandler = mockServer.resource.mock.calls[0][3];

      mockWrapResourceResult.mockImplementation(async (uri: URL, fn: () => any) => {
        const result = await fn();
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(result, null, 2),
            mimeType: 'application/json'
          }]
        };
      });

      const result = await loggingListHandler(testUri, {}, createMockExtra());
      const resultData = JSON.parse(result.contents[0].text as string);

      expect(resultData.logs[0].levelName).toBe('Debug');
      expect(resultData.logs[1].levelName).toBe('Info');
      expect(resultData.logs[2].levelName).toBe('Warning');
      expect(resultData.logs[3].levelName).toBe('Error');
      expect(resultData.logs[4].levelName).toBe('Critical');
    });
  });
});
