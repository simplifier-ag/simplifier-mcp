import { OAuthTargetAndSourceMapper } from "../../../src/tools/loginmethod/OAuthTargetAndSourceMapper.js";

describe('OAuthTargetAndSourceMapper', () => {
  let mapper: OAuthTargetAndSourceMapper;

  beforeEach(() => {
    mapper = new OAuthTargetAndSourceMapper();
  });

  describe('getDefaultSourceType', () => {
    it('should return "Default" as the default source type', () => {
      expect(mapper.getDefaultSourceType()).toBe("Default");
    });
  });

  describe('mapSource', () => {
    describe('Default source (0)', () => {
      it('should map Default source with OAuth2 client name', () => {
        const params = {
          oauth2ClientName: "infraOIDC"
        };

        const result = mapper.mapSource("Default", params);

        expect(result).toEqual({
          source: 0,
          sourceConfiguration: {
            clientName: "infraOIDC"
          }
        });
      });

      it('should throw error when oauth2ClientName is missing', () => {
        const params = {};

        expect(() => mapper.mapSource("Default", params))
          .toThrow("OAuth2 Default source requires 'oauth2ClientName' field");
      });
    });

    describe('Reference source (2)', () => {
      it('should map Reference source with OAuth2 client name', () => {
        const params = {
          oauth2ClientName: "myOAuthClient"
        };

        const result = mapper.mapSource("Reference", params);

        expect(result).toEqual({
          source: 2,
          sourceConfiguration: {
            clientName: "myOAuthClient"
          }
        });
      });

      it('should throw error when oauth2ClientName is missing', () => {
        const params = {};

        expect(() => mapper.mapSource("Reference", params))
          .toThrow("OAuth2 Reference source requires 'oauth2ClientName' field");
      });
    });

    describe('ProfileReference source (4)', () => {
      it('should map ProfileReference source with key', () => {
        const params = {
          profileKey: "oauthToken"
        };

        const result = mapper.mapSource("ProfileReference", params);

        expect(result).toEqual({
          source: 4,
          sourceConfiguration: {
            key: "oauthToken"
          }
        });
      });

      it('should throw error when profileKey is missing', () => {
        const params = {};

        expect(() => mapper.mapSource("ProfileReference", params))
          .toThrow("OAuth2 ProfileReference requires 'profileKey' field");
      });
    });

    describe('UserAttributeReference source (5)', () => {
      it('should map UserAttributeReference source with name and category', () => {
        const params = {
          userAttributeName: "oauthAttr",
          userAttributeCategory: "auth"
        };

        const result = mapper.mapSource("UserAttributeReference", params);

        expect(result).toEqual({
          source: 5,
          sourceConfiguration: {
            name: "oauthAttr",
            category: "auth"
          }
        });
      });

      it('should throw error when userAttributeName is missing', () => {
        const params = {
          userAttributeCategory: "auth"
        };

        expect(() => mapper.mapSource("UserAttributeReference", params))
          .toThrow("OAuth2 UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
      });

      it('should throw error when userAttributeCategory is missing', () => {
        const params = {
          userAttributeName: "oauthAttr"
        };

        expect(() => mapper.mapSource("UserAttributeReference", params))
          .toThrow("OAuth2 UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
      });
    });

    describe('Unsupported source types', () => {
      it('should throw error for unsupported source type', () => {
        const params = {};

        expect(() => mapper.mapSource("InvalidSource", params))
          .toThrow("Unsupported sourceType for OAuth2: InvalidSource");
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
          customHeaderName: "X-Custom-Auth"
        };

        const result = mapper.mapTarget("CustomHeader", params);

        expect(result).toEqual({
          target: 1,
          targetConfiguration: {
            name: "X-Custom-Auth"
          }
        });
      });

      it('should throw error when customHeaderName is missing', () => {
        const params = {};

        expect(() => mapper.mapTarget("CustomHeader", params))
          .toThrow("OAuth2 CustomHeader target requires 'customHeaderName' field");
      });
    });

    describe('QueryParameter target (2)', () => {
      it('should map QueryParameter target with query key', () => {
        const params = {
          queryParameterKey: "authToken"
        };

        const result = mapper.mapTarget("QueryParameter", params);

        expect(result).toEqual({
          target: 2,
          targetConfiguration: {
            key: "authToken"
          }
        });
      });

      it('should throw error when queryParameterKey is missing', () => {
        const params = {};

        expect(() => mapper.mapTarget("QueryParameter", params))
          .toThrow("OAuth2 QueryParameter target requires 'queryParameterKey' field");
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
