import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// Mock config for this test: authenticate with a personal access token
const mockConfig: { simplifierBaseUrl: string; apiToken: string; httpRequestLogFile?: string } = {
  simplifierBaseUrl: 'http://some.test',
  apiToken: 'test-pat',
};
jest.mock('../../src/config', () => ({
  config: mockConfig,
}));

jest.mock('../../src/client/basicauth', () => ({
  login: jest.fn(),
}));

import { SimplifierClient } from '../../src/client/simplifier-client';
import { login } from '../../src/client/basicauth';

// Mock fetch globally
global.fetch = jest.fn();

describe('SimplifierClient with API token', () => {
  let client: SimplifierClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new SimplifierClient();
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: [] }),
    } as Response);
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete mockConfig.httpRequestLogFile;
  });

  it('should send ApiToken header and no SimplifierToken header', async () => {
    await client.getServerBusinessObjects('test-tracking-key');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://some.test/UserInterface/api/businessobjects/server',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'ApiToken': 'test-pat',
        }),
      })
    );
    expect(mockFetch.mock.calls[0]![1]!.headers).not.toHaveProperty('SimplifierToken');
  });

  it('should not log in via genToken', async () => {
    await client.getServerBusinessObjects('test-tracking-key');
    await client.getServerBusinessObjects('test-tracking-key');

    expect(login).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    for (const [url] of mockFetch.mock.calls) {
      expect(String(url)).not.toContain('genToken');
    }
  });

  it('should redact ApiToken in the request log', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'simplifier-mcp-log-'));
    try {
      mockConfig.httpRequestLogFile = join(dir, 'requests.log');

      await client.getServerBusinessObjects('test-tracking-key');

      const log = await readFile(mockConfig.httpRequestLogFile, 'utf8');
      const entry = JSON.parse(log.trim());
      expect(entry.headers.ApiToken).toBe('***REDACTED***');
      expect(log).not.toContain('test-pat');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
