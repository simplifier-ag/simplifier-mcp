import { tools } from '../../src/tools/index';

describe('Tools', () => {
  describe('tools array', () => {
    it('should export an empty tools array initially', () => {
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(0);
    });

    it('should be properly typed', () => {
      // This test ensures the tools array conforms to the Tool[] type
      expect(tools.every(tool =>
        typeof tool === 'object' &&
        typeof tool.name === 'string' &&
        typeof tool.description === 'string'
      )).toBe(true);
    });
  });

  // TODO: Add tests for individual tools when they are implemented:
  // - test create_business_object tool
});