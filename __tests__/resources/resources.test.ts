import { resources } from '../../src/resources/index';

describe('Resources', () => {
  describe('resources array', () => {
    it('should export an empty resources array initially', () => {
      expect(Array.isArray(resources)).toBe(true);
      expect(resources).toHaveLength(0);
    });

    it('should be properly typed', () => {
      // This test ensures the resources array conforms to the Resource[] type
      expect(resources.every(resource =>
        typeof resource === 'object' &&
        typeof resource.uri === 'string' &&
        (resource.name === undefined || typeof resource.name === 'string') &&
        (resource.description === undefined || typeof resource.description === 'string')
      )).toBe(true);
    });
  });

  // TODO: Add tests for individual resources when they are implemented:
  // - test simplifier://business-objects resource
});