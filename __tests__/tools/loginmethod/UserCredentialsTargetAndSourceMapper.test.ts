import { UserCredentialsTargetAndSourceMapper } from "../../../src/tools/loginmethod/UserCredentialsTargetAndSourceMapper.js";

describe('UserCredentialsTargetAndSourceMapper', () => {
  let mapper: UserCredentialsTargetAndSourceMapper;

  beforeEach(() => {
    mapper = new UserCredentialsTargetAndSourceMapper();
  });

  describe('getDefaultSourceType', () => {
    it('should return "Default" as the default source type', () => {
      expect(mapper.getDefaultSourceType()).toBe("Default");
    });
  });

  describe('mapSource', () => {
    describe('Default source (0)', () => {
      it('should map Default source with username and password', () => {
        const params = {
          username: "admin",
          password: "secret123"
        };

        const result = mapper.mapSource("Default", params);

        expect(result).toEqual({
          source: 0,
          sourceConfiguration: {
            username: "admin",
            password: "secret123"
          }
        });
      });

      it('should include changePassword when existing login method is provided', () => {
        const params = {
          username: "admin",
          password: "newPassword",
          changePassword: true
        };
        const existing = { name: "existing" };

        const result = mapper.mapSource("Default", params, existing);

        expect(result).toEqual({
          source: 0,
          sourceConfiguration: {
            username: "admin",
            password: "newPassword",
            changePassword: true
          }
        });
      });

      it('should throw error when username is missing', () => {
        const params = {
          password: "secret123"
        };

        expect(() => mapper.mapSource("Default", params))
          .toThrow("UserCredentials Default source requires 'username' and 'password' fields");
      });

      it('should throw error when password is missing', () => {
        const params = {
          username: "admin"
        };

        expect(() => mapper.mapSource("Default", params))
          .toThrow("UserCredentials Default source requires 'username' and 'password' fields");
      });
    });

    describe('Provided source (1)', () => {
      it('should map Provided source with username and password', () => {
        const params = {
          username: "user1",
          password: "pass456"
        };

        const result = mapper.mapSource("Provided", params);

        expect(result).toEqual({
          source: 1,
          sourceConfiguration: {
            username: "user1",
            password: "pass456"
          }
        });
      });

      it('should include changePassword when existing login method is provided', () => {
        const params = {
          username: "user1",
          password: "newPass",
          changePassword: false
        };
        const existing = { name: "existing" };

        const result = mapper.mapSource("Provided", params, existing);

        expect(result).toEqual({
          source: 1,
          sourceConfiguration: {
            username: "user1",
            password: "newPass",
            changePassword: false
          }
        });
      });

      it('should throw error when username is missing', () => {
        const params = {
          password: "pass456"
        };

        expect(() => mapper.mapSource("Provided", params))
          .toThrow("UserCredentials Provided source requires 'username' and 'password' fields");
      });
    });

    describe('ProfileReference source (4)', () => {
      it('should map ProfileReference source with key', () => {
        const params = {
          profileKey: "myCredentials"
        };

        const result = mapper.mapSource("ProfileReference", params);

        expect(result).toEqual({
          source: 4,
          sourceConfiguration: {
            key: "myCredentials"
          }
        });
      });

      it('should throw error when profileKey is missing', () => {
        const params = {};

        expect(() => mapper.mapSource("ProfileReference", params))
          .toThrow("UserCredentials ProfileReference requires 'profileKey' field");
      });
    });

    describe('UserAttributeReference source (5)', () => {
      it('should map UserAttributeReference source with name and category', () => {
        const params = {
          userAttributeName: "credAttr",
          userAttributeCategory: "security"
        };

        const result = mapper.mapSource("UserAttributeReference", params);

        expect(result).toEqual({
          source: 5,
          sourceConfiguration: {
            name: "credAttr",
            category: "security"
          }
        });
      });

      it('should throw error when userAttributeName is missing', () => {
        const params = {
          userAttributeCategory: "security"
        };

        expect(() => mapper.mapSource("UserAttributeReference", params))
          .toThrow("UserCredentials UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
      });

      it('should throw error when userAttributeCategory is missing', () => {
        const params = {
          userAttributeName: "credAttr"
        };

        expect(() => mapper.mapSource("UserAttributeReference", params))
          .toThrow("UserCredentials UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
      });
    });

    describe('Unsupported source types', () => {
      it('should throw error for unsupported source type', () => {
        const params = {};

        expect(() => mapper.mapSource("InvalidSource", params))
          .toThrow("Unsupported sourceType for UserCredentials: InvalidSource");
      });
    });
  });

  describe('mapTarget', () => {
    it('should always return target 0 (Default) regardless of input', () => {
      expect(mapper.mapTarget("Default", {})).toEqual({ target: 0 });
      expect(mapper.mapTarget("CustomHeader", {})).toEqual({ target: 0 });
      expect(mapper.mapTarget("QueryParameter", {})).toEqual({ target: 0 });
    });
  });
});
