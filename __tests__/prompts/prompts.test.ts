import { prompts } from '../../src/prompts/index';

describe('Prompts', () => {
  describe('prompts array', () => {
    it('should export an empty prompts array initially', () => {
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts).toHaveLength(0);
    });

    it('should be properly typed', () => {
      // This test ensures the prompts array conforms to the Prompt[] type
      expect(prompts.every(prompt =>
        typeof prompt === 'object' &&
        typeof prompt.name === 'string' &&
        (prompt.description === undefined || typeof prompt.description === 'string')
      )).toBe(true);
    });
  });

  // TODO: Add tests for individual prompts when they are implemented:
  // - test create_connector_guide prompt
});