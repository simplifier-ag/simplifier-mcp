import { TargetAndSourceMapper, SourceMapping, TargetMapping } from "./TargetAndSourceMapper.js";

/**
 * Mapper for UserCredentials login method type.
 * Default source is "Provided" (username/password).
 * Only supports Default target (no custom headers or query parameters).
 */
export class UserCredentialsTargetAndSourceMapper implements TargetAndSourceMapper {

  getDefaultSourceType(): string {
    return "Default";
  }

  mapSource(sourceType: string, params: any, existing?: any): SourceMapping {
    let source: 0 | 1 | 4 | 5;
    let sourceConfiguration: any;

    switch (sourceType) {
      case "Default":
        // DEFAULT (0) - UserCredentials default, same config as Provided
        if (!params.username || !params.password) {
          throw new Error("UserCredentials Default source requires 'username' and 'password' fields");
        }
        source = 0;
        sourceConfiguration = {
          username: params.username,
          password: params.password,
          ...(existing && { changePassword: params.changePassword })
        };
        break;

      case "Provided":
        // PROVIDED (1) - Explicitly provided credentials, same config as Default
        if (!params.username || !params.password) {
          throw new Error("UserCredentials Provided source requires 'username' and 'password' fields");
        }
        source = 1;
        sourceConfiguration = {
          username: params.username,
          password: params.password,
          ...(existing && { changePassword: params.changePassword })
        };
        break;

      case "ProfileReference":
        // PROFILE_REFERENCE (4)
        if (!params.profileKey) {
          throw new Error("UserCredentials ProfileReference requires 'profileKey' field");
        }
        source = 4;
        sourceConfiguration = { key: params.profileKey };
        break;

      case "UserAttributeReference":
        // USER_ATTRIBUTE_REFERENCE (5)
        if (!params.userAttributeName || !params.userAttributeCategory) {
          throw new Error("UserCredentials UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
        }
        source = 5;
        sourceConfiguration = {
          name: params.userAttributeName,
          category: params.userAttributeCategory
        };
        break;

      default:
        throw new Error(`Unsupported sourceType for UserCredentials: ${sourceType}`);
    }

    return { source, sourceConfiguration };
  }

  mapTarget(_targetType: string, _params: any): TargetMapping {
    // UserCredentials only supports Default target
    return { target: 0 };
  }
}
