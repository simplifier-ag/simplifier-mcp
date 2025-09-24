// Set up environment before importing config module
process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
process.env.NODE_ENV = 'test';
process.env.SIMPLIFIER_TOKEN = 'test-token';

// Don't use the global mock for this test
jest.unmock('../src/config');

import { validateConfig } from '../src/config';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Set required environment variables for tests
    process.env.SIMPLIFIER_TOKEN = 'test-token';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateConfig', () => {
    it('should validate required SIMPLIFIER_BASE_URL', () => {
      delete process.env.SIMPLIFIER_BASE_URL;

      expect(() => validateConfig()).toThrow(
        'SIMPLIFIER_BASE_URL environment variable is required'
      );
    });

    it('should validate SIMPLIFIER_BASE_URL format', () => {
      process.env.SIMPLIFIER_BASE_URL = 'not-a-url';

      expect(() => validateConfig()).toThrow(
        'SIMPLIFIER_BASE_URL must be a valid URL'
      );
    });

    it('should accept valid HTTP URL', () => {
      process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';

      const config = validateConfig();

      expect(config.simplifierBaseUrl).toBe('http://localhost:8080');
      expect(config.nodeEnv).toBe('test');
    });

    it('should accept valid HTTPS URL', () => {
      process.env.SIMPLIFIER_BASE_URL = 'https://example.com/api';
      process.env.NODE_ENV = 'production';

      const config = validateConfig();

      expect(config.simplifierBaseUrl).toBe('https://example.com/api');
      expect(config.nodeEnv).toBe('production');
    });

    it('should default NODE_ENV to development', () => {
      process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
      delete process.env.NODE_ENV;

      const config = validateConfig();

      expect(config.nodeEnv).toBe('development');
    });

    it('should require either SIMPLIFIER_TOKEN or SIMPLIFIER_CREDENTIALS_FILE', () => {
      process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
      delete process.env.SIMPLIFIER_TOKEN;
      delete process.env.SIMPLIFIER_CREDENTIALS_FILE;

      expect(() => validateConfig()).toThrow(
        'Either variable SIMPLIFIER_TOKEN with an actual token or SIMPLIFIER_CREDENTIALS_FILE pointing to a valid credentials file must be set!'
      );
    });

    it('should accept SIMPLIFIER_TOKEN when set', () => {
      process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
      process.env.SIMPLIFIER_TOKEN = 'test-token-123';
      delete process.env.SIMPLIFIER_CREDENTIALS_FILE;

      const config = validateConfig();

      expect(config.simplifierToken).toBe('test-token-123');
      expect(config.credentialsFile).toBeUndefined();
    });

    it('should accept SIMPLIFIER_CREDENTIALS_FILE when set', () => {
      process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
      delete process.env.SIMPLIFIER_TOKEN;
      process.env.SIMPLIFIER_CREDENTIALS_FILE = '/path/to/credentials.json';

      const config = validateConfig();

      expect(config.credentialsFile).toBe('/path/to/credentials.json');
      expect(config.simplifierToken).toBeUndefined();
    });

    it('should reject when both SIMPLIFIER_TOKEN and SIMPLIFIER_CREDENTIALS_FILE are set', () => {
      process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
      process.env.SIMPLIFIER_TOKEN = 'test-token-123';
      process.env.SIMPLIFIER_CREDENTIALS_FILE = '/path/to/credentials.json';

      expect(() => validateConfig()).toThrow(
        'Cannot set both SIMPLIFIER_TOKEN and SIMPLIFIER_CREDENTIALS_FILE. Please use only one authentication method.'
      );
    });

  });
});