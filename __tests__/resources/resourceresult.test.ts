import { wrapResourceResult } from '../../src/resources/resourcesresult';

describe('wrapResourceResult', () => {
  describe('successful function execution', () => {
    it('should wrap a simple string result', async () => {
      const testUri = new URL('simplifier://test');
      const testFunction = () => 'Hello World';

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://test',
          text: '"Hello World"',
          mimeType: 'application/json'
        }]
      });
    });

    it('should wrap an object result with pretty formatting', async () => {
      const testUri = new URL('simplifier://businessobjects');
      const testData = {
        id: '123',
        name: 'Test Object',
        properties: {
          active: true,
          count: 5
        }
      };
      const testFunction = () => testData;

      const result = await wrapResourceResult(testUri, testFunction);

      const expectedText = JSON.stringify(testData, null, 2);
      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://businessobjects',
          text: expectedText,
          mimeType: 'application/json'
        }]
      });

      // Verify the formatting is pretty-printed
      expect(result.contents[0].text).toContain('  "id": "123"');
      expect(result.contents[0].text).toContain('  "name": "Test Object"');
    });

    it('should wrap undefined result', async () => {
      const testUri = new URL('simplifier://undefined-test');
      const testFunction = () => undefined;

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://undefined-test',
          text: undefined, // JSON.stringify(undefined) returns undefined
          mimeType: 'application/json'
        }]
      });
    });
  });

  describe('error handling', () => {
    it('should handle synchronous function errors', async () => {
      const testUri = new URL('simplifier://error-test');
      const errorMessage = 'Something went wrong!';
      const testFunction = () => {
        throw new Error(errorMessage);
      };

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://error-test',
          text: JSON.stringify({ error: `Could not get data! Error: ${errorMessage}` }),
          mimeType: 'application/json'
        }]
      });
    });

    it('should handle async function errors', async () => {
      const testUri = new URL('https://api.error.com/test');
      const errorMessage = 'Async operation failed';
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        throw new Error(errorMessage);
      };

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'https://api.error.com/test',
          text: JSON.stringify({ error: `Could not get data! Error: ${errorMessage}` }),
          mimeType: 'application/json'
        }]
      });
    });

    it('should handle non-Error thrown values', async () => {
      const testUri = new URL('simplifier://string-error');
      const testFunction = () => {
        throw 'String error message';
      };

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://string-error',
          text: JSON.stringify({ error: 'Could not get data! String error message' }),
          mimeType: 'application/json'
        }]
      });
    });

    it('should handle thrown objects', async () => {
      const testUri = new URL('simplifier://object-error');
      const errorObject = { code: 500, message: 'Internal Server Error' };
      const testFunction = () => {
        throw errorObject;
      };

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://object-error',
          text: JSON.stringify({ error: `Could not get data! ${errorObject}` }),
          mimeType: 'application/json'
        }]
      });
    });

    it('should handle null thrown values', async () => {
      const testUri = new URL('simplifier://null-error');
      const testFunction = () => {
        throw null;
      };

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://null-error',
          text: JSON.stringify({ error: 'Could not get data! null' }),
          mimeType: 'application/json'
        }]
      });
    });

    it('should handle async rejection', async () => {
      const testUri = new URL('simplifier://rejection-test');
      const testFunction = () => Promise.reject(new Error('Promise rejected'));

      const result = await wrapResourceResult(testUri, testFunction);

      expect(result).toEqual({
        contents: [{
          uri: 'simplifier://rejection-test',
          text: JSON.stringify({ error: 'Could not get data! Error: Promise rejected' }),
          mimeType: 'application/json'
        }]
      });
    });
  });

});