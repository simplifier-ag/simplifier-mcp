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
  // - test business_object_template prompt
  // - test troubleshoot_connector prompt
  // - test optimize_business_object prompt
  // - test security_review prompt
  // - test migration_guide prompt
  // - test best_practices prompt
  // - test api_integration prompt
  // - test error_handling prompt
});