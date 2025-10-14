import { TargetAndSourceMapper, SourceMapping, TargetMapping } from "./TargetAndSourceMapper.js";

/**
 * Mapper for UserCredentials login method type.
 * Default source is "Provided" (username/password).
 * Only supports Default target (no custom headers or query parameters).
 */
export class UserCredentialsTargetAndSourceMapper implements TargetAndSourceMapper {

  getDefaultSourceType(): string {
    return "Provided";
  }

  mapSource(sourceType: string, params: any, existing?: any): SourceMapping {
    let source: 1 | 4 | 5;
    let sourceConfiguration: any;

    switch (sourceType) {
      case "Provided":
        // Validate required fields for Provided source
        if (!params.username || !params.password) {
          throw new Error("UserCredentials with Provided source requires 'username' and 'password' fields");
        }
        source = 1;
        sourceConfiguration = {
          username: params.username,
          password: params.password,
          ...(existing && { changePassword: params.changePassword })
        };
        break;

      case "ProfileReference":
        if (!params.profileKey) {
          throw new Error("UserCredentials ProfileReference requires 'profileKey' field");
        }
        source = 4;
        sourceConfiguration = { key: params.profileKey };
        break;

      case "UserAttributeReference":
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
