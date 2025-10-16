import { TokenTargetAndSourceMapper } from "../../../src/tools/loginmethod/TokenTargetAndSourceMapper.js";

describe('TokenTargetAndSourceMapper', () => {
  let mapper: TokenTargetAndSourceMapper;

  beforeEach(() => {
    mapper = new TokenTargetAndSourceMapper();
  });

  describe('getDefaultSourceType', () => {
    it('should return "Default" as the default source type', () => {
      expect(mapper.getDefaultSourceType()).toBe("Default");
    });
  });

  describe('mapSource', () => {
    describe('Default source (0)', () => {
      it('should map Default source with empty sourceConfiguration', () => {
        const params = {};

        const result = mapper.mapSource("Default", params);

        expect(result).toEqual({
          source: 0,
          sourceConfiguration: {}
        });
      });
    });

    describe('SystemReference source (3)', () => {
      it('should map SystemReference source with empty sourceConfiguration', () => {
        const params = {};

        const result = mapper.mapSource("SystemReference", params);

        expect(result).toEqual({
          source: 3,
          sourceConfiguration: {}
        });
      });
    });

    describe('Provided source (1)', () => {
      it('should map Provided source with token', () => {
        const params = {
          token: "mySecretToken123"
        };

        const result = mapper.mapSource("Provided", params);

        expect(result).toEqual({
          source: 1,
          sourceConfiguration: {
            token: "mySecretToken123"
          }
        });
      });

      it('should include changeToken when existing login method is provided', () => {
        const params = {
          token: "newToken456",
          changeToken: true
        };
        const existing = { name: "existing" };

        const result = mapper.mapSource("Provided", params, existing);

        expect(result).toEqual({
          source: 1,
          sourceConfiguration: {
            token: "newToken456",
            changeToken: true
          }
        });
      });

      it('should not include changeToken when existing login method is not provided', () => {
        const params = {
          token: "newToken456",
          changeToken: true
        };

        const result = mapper.mapSource("Provided", params);

        expect(result).toEqual({
          source: 1,
          sourceConfiguration: {
            token: "newToken456"
          }
        });
      });

      it('should include changeToken=false when existing login method is provided', () => {
        const params = {
          token: "token789",
          changeToken: false
        };
        const existing = { name: "existing" };

        const result = mapper.mapSource("Provided", params, existing);

        expect(result).toEqual({
          source: 1,
          sourceConfiguration: {
            token: "token789",
            changeToken: false
          }
        });
      });

      it('should throw error when token is missing', () => {
        const params = {};

        expect(() => mapper.mapSource("Provided", params))
          .toThrow("Token Provided source requires 'token' field");
      });
    });

    describe('ProfileReference source (4)', () => {
      it('should map ProfileReference source with key', () => {
        const params = {
          profileKey: "myTokenKey"
        };

        const result = mapper.mapSource("ProfileReference", params);

        expect(result).toEqual({
          source: 4,
          sourceConfiguration: {
            key: "myTokenKey"
          }
        });
      });

      it('should throw error when profileKey is missing', () => {
        const params = {};

        expect(() => mapper.mapSource("ProfileReference", params))
          .toThrow("Token ProfileReference requires 'profileKey' field");
      });
    });

    describe('UserAttributeReference source (5)', () => {
      it('should map UserAttributeReference source with name and category', () => {
        const params = {
          userAttributeName: "tokenAttribute",
          userAttributeCategory: "security"
        };

        const result = mapper.mapSource("UserAttributeReference", params);

        expect(result).toEqual({
          source: 5,
          sourceConfiguration: {
            name: "tokenAttribute",
            category: "security"
          }
        });
      });

      it('should throw error when userAttributeName is missing', () => {
        const params = {
          userAttributeCategory: "security"
        };

        expect(() => mapper.mapSource("UserAttributeReference", params))
          .toThrow("Token UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
      });

      it('should throw error when userAttributeCategory is missing', () => {
        const params = {
          userAttributeName: "tokenAttribute"
        };

        expect(() => mapper.mapSource("UserAttributeReference", params))
          .toThrow("Token UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
      });
    });

    describe('Unsupported source types', () => {
      it('should throw error for unsupported source type', () => {
        const params = {};

        expect(() => mapper.mapSource("InvalidSource", params))
          .toThrow("Unsupported sourceType for Token: InvalidSource");
      });
    });
  });

  describe('mapTarget', () => {
    describe('Default target (0)', () => {
      it('should map Default target with no configuration', () => {
        const params = {};

        const result = mapper.mapTarget("Default", params);

        expect(result).toEqual({
          target: 0,
          targetConfiguration: undefined
        });
      });
    });

    describe('CustomHeader target (1)', () => {
      it('should map CustomHeader target with header name', () => {
        const params = {
          customHeaderName: "X-API-Token"
        };

        const result = mapper.mapTarget("CustomHeader", params);

        expect(result).toEqual({
          target: 1,
          targetConfiguration: {
            name: "X-API-Token"
          }
        });
      });

      it('should throw error when customHeaderName is missing', () => {
        const params = {};

        expect(() => mapper.mapTarget("CustomHeader", params))
          .toThrow("Token CustomHeader target requires 'customHeaderName' field");
      });
    });

    describe('Unrecognized target types', () => {
      it('should default to target 0 for unrecognized target type', () => {
        const params = {};

        const result = mapper.mapTarget("SomeRandomTarget", params);

        expect(result).toEqual({
          target: 0,
          targetConfiguration: undefined
        });
      });
    });
  });
});
