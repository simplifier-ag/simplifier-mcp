// Set up environment before importing config module
process.env.SIMPLIFIER_BASE_URL = 'http://localhost:8080';
process.env.NODE_ENV = 'test';

// Don't use the global mock for this test
jest.unmock('../src/config');

import { validateConfig } from '../src/config';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
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

  });
});