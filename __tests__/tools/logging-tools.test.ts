import { registerLoggingTools } from '../../src/tools/logging-tools';
import { SimplifierClient } from '../../src/client/simplifier-client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  SimplifierLogListResponse,
  SimplifierLogPagesResponse
} from '../../src/client/types';

// Mock the toolresult wrapper
jest.mock('../../src/tools/toolresult', () => ({
  wrapToolResult: jest.fn()
}));

// Mock the SimplifierClient
jest.mock('../../src/client/simplifier-client');

describe('Logging Tools', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockClient: jest.Mocked<SimplifierClient>;
  let mockWrapToolResult: jest.MockedFunction<any>;

  beforeEach(() => {
    // Create mock server with tool method
    mockServer = {
      tool: jest.fn(),
    } as any;

    // Create mock client
    mockClient = {
      listLogEntriesPaginated: jest.fn(),
      getLogPages: jest.fn(),
    } as any;

    // Get the mocked wrapToolResult
    mockWrapToolResult = require('../../src/tools/toolresult').wrapToolResult;
    mockWrapToolResult.mockClear();
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
      },
      {
        id: 'LOG003',
        entryDate: '2025-01-15T08:00:00Z',
        level: 1,
        messageKey: 'System_Info',
        messageParams: [],
        hasDetails: false,
        category: 'System'
      }
    ]
  };

  const mockLogPagesResponse: SimplifierLogPagesResponse = {
    pages: 3,
    pagesize: 50
  };

  describe('registerLoggingTools', () => {
    it('should register the logging-list tool', () => {
      registerLoggingTools(mockServer, mockClient);

      expect(mockServer.tool).toHaveBeenCalledTimes(1);
      expect(mockServer.tool).toHaveBeenCalledWith(
        'logging-list',
        expect.any(String),
        expect.any(Object),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should register tool with correct schema', () => {
      registerLoggingTools(mockServer, mockClient);

      const call = mockServer.tool.mock.calls[0];
      const schema = call[2];

      expect(schema).toHaveProperty('pageSize');
      expect(schema).toHaveProperty('page');
      expect(schema).toHaveProperty('logLevel');
      expect(schema).toHaveProperty('since');
      expect(schema).toHaveProperty('from');
      expect(schema).toHaveProperty('until');
    });

    it('should register tool with correct metadata', () => {
      registerLoggingTools(mockServer, mockClient);

      const call = mockServer.tool.mock.calls[0];
      const metadata = call[3];

      expect(metadata).toEqual({
        title: 'List Simplifier Log Entries',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      });
    });
  });

  describe('logging-list tool handler', () => {
    let loggingListHandler: any;

    beforeEach(() => {
      registerLoggingTools(mockServer, mockClient);
      loggingListHandler = mockServer.tool.mock.calls[0][4]; // Handler function
    });

    it('should call wrapToolResult with correct parameters', async () => {
      mockWrapToolResult.mockResolvedValue({ content: [] });

      await loggingListHandler({});

      expect(mockWrapToolResult).toHaveBeenCalledWith(
        'list log entries',
        expect.any(Function)
      );
    });

    it('should list log entries with default parameters', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({ pageSize: 50, page: 0 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 50, {});
      expect(mockClient.getLogPages).toHaveBeenCalledWith(50, {});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.logs).toHaveLength(3);
      expect(resultData.totalCount).toBe(3);
      expect(resultData.page).toBe(0);
      expect(resultData.pageSize).toBe(50);
      expect(resultData.totalPages).toBe(3);
    });

    it('should list log entries with custom pageSize', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue({ pages: 1, pagesize: 10 });

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({ pageSize: 10, page: 0 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 10, {});
      expect(mockClient.getLogPages).toHaveBeenCalledWith(10, {});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.pageSize).toBe(10);
    });

    it('should list log entries with custom page number', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({ page: 2, pageSize: 50 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(2, 50, {});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.page).toBe(2);
    });

    it('should filter by log level', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({ logLevel: 3, pageSize: 50, page: 0 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 50, { logLevel: 3 });
      expect(mockClient.getLogPages).toHaveBeenCalledWith(50, { logLevel: 3 });

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.filters.logLevel).toBe(3);
    });

    it('should filter by since timestamp', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({ since: '2025-01-01T00:00:00Z', pageSize: 50, page: 0 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 50, {
        since: '2025-01-01T00:00:00Z'
      });

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.filters.since).toBe('2025-01-01T00:00:00Z');
    });

    it('should filter by from and until timestamps', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({
        from: '2025-01-01T00:00:00Z',
        until: '2025-01-31T23:59:59Z',
        pageSize: 50,
        page: 0
      });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 50, {
        from: '2025-01-01T00:00:00Z',
        until: '2025-01-31T23:59:59Z'
      });

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.filters.from).toBe('2025-01-01T00:00:00Z');
      expect(resultData.filters.until).toBe('2025-01-31T23:59:59Z');
    });

    it('should combine multiple filters', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({
        pageSize: 25,
        page: 1,
        logLevel: 2,
        since: '2025-01-01T00:00:00Z'
      });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(1, 25, {
        logLevel: 2,
        since: '2025-01-01T00:00:00Z'
      });
      expect(mockClient.getLogPages).toHaveBeenCalledWith(25, {
        logLevel: 2,
        since: '2025-01-01T00:00:00Z'
      });

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.pageSize).toBe(25);
      expect(resultData.page).toBe(1);
      expect(resultData.filters.logLevel).toBe(2);
      expect(resultData.filters.since).toBe('2025-01-01T00:00:00Z');
    });

    it('should include log entry URIs', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.logs[0].uri).toBe('simplifier://logging/entry/LOG001');
      expect(resultData.logs[1].uri).toBe('simplifier://logging/entry/LOG002');
      expect(resultData.logs[2].uri).toBe('simplifier://logging/entry/LOG003');
    });

    it('should convert numeric log levels to names', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.logs[0].levelName).toBe('Error'); // level 3
      expect(resultData.logs[1].levelName).toBe('Warning'); // level 2
      expect(resultData.logs[2].levelName).toBe('Info'); // level 1
    });

    it('should handle all log levels', async () => {
      const allLevelsResponse: SimplifierLogListResponse = {
        list: [
          { id: '1', entryDate: '2025-01-15T10:00:00Z', level: 0, messageKey: 'debug', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '2', entryDate: '2025-01-15T10:00:00Z', level: 1, messageKey: 'info', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '3', entryDate: '2025-01-15T10:00:00Z', level: 2, messageKey: 'warning', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '4', entryDate: '2025-01-15T10:00:00Z', level: 3, messageKey: 'error', messageParams: [], hasDetails: false, category: 'Test' },
          { id: '5', entryDate: '2025-01-15T10:00:00Z', level: 4, messageKey: 'critical', messageParams: [], hasDetails: false, category: 'Test' }
        ]
      };

      mockClient.listLogEntriesPaginated.mockResolvedValue(allLevelsResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.logs[0].levelName).toBe('Debug');
      expect(resultData.logs[1].levelName).toBe('Info');
      expect(resultData.logs[2].levelName).toBe('Warning');
      expect(resultData.logs[3].levelName).toBe('Error');
      expect(resultData.logs[4].levelName).toBe('Critical');
    });

    it('should handle API errors through wrapper', async () => {
      const testError = new Error('API Connection Failed');
      mockClient.listLogEntriesPaginated.mockRejectedValue(testError);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        try {
          await fn();
          return { content: [] };
        } catch (e: any) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: e.message })
            }],
            isError: true
          };
        }
      });

      const result = await loggingListHandler({});

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalled();
      expect(result.content[0].text).toContain('API Connection Failed');
    });

    it('should handle empty result set', async () => {
      const emptyResponse: SimplifierLogListResponse = { list: [] };
      mockClient.listLogEntriesPaginated.mockResolvedValue(emptyResponse);
      mockClient.getLogPages.mockResolvedValue({ pages: 0, pagesize: 50 });

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        const result = await fn();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      });

      const result = await loggingListHandler({});

      const resultData = JSON.parse(result.content[0].text);
      expect(resultData.logs).toHaveLength(0);
      expect(resultData.totalCount).toBe(0);
      expect(resultData.totalPages).toBe(0);
    });

    it('should not include from/until in options when only from is provided', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        await fn();
        return { content: [] };
      });

      await loggingListHandler({ from: '2025-01-01T00:00:00Z', pageSize: 50, page: 0 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 50, {});
    });

    it('should not include from/until in options when only until is provided', async () => {
      mockClient.listLogEntriesPaginated.mockResolvedValue(mockLogListResponse);
      mockClient.getLogPages.mockResolvedValue(mockLogPagesResponse);

      mockWrapToolResult.mockImplementation(async (_description: string, fn: () => any) => {
        await fn();
        return { content: [] };
      });

      await loggingListHandler({ until: '2025-01-31T23:59:59Z', pageSize: 50, page: 0 });

      expect(mockClient.listLogEntriesPaginated).toHaveBeenCalledWith(0, 50, {});
    });
  });
});
