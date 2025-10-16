import { TargetAndSourceMapper, SourceMapping, TargetMapping } from "./TargetAndSourceMapper.js";

/**
 * Mapper for Token login method type.
 * Default source is "Default" (empty configuration).
 * Supports Default and CustomHeader targets.
 */
export class TokenTargetAndSourceMapper implements TargetAndSourceMapper {

  getDefaultSourceType(): string {
    return "Default";
  }

  mapSource(sourceType: string, params: any, existing?: any): SourceMapping {
    let source: 0 | 1 | 3 | 4 | 5;
    let sourceConfiguration: any;

    switch (sourceType) {
      case "Default":
        // DEFAULT (0) - Empty configuration for Token - Uses SimplifierToken
        source = 0;
        sourceConfiguration = {};
        break;

      case "SystemReference":
        // SYSTEM_REFERENCE (3) - Uses SimplifierToken
        source = 3;
        sourceConfiguration = {};
        break;

      case "Provided":
        // PROVIDED (1) - User-provided token
        if (!params.token) {
          throw new Error("Token Provided source requires 'token' field");
        }
        source = 1;
        sourceConfiguration = {
          token: params.token,
          ...(existing && { changeToken: params.changeToken })
        };
        break;

      case "ProfileReference":
        // PROFILE_REFERENCE (4)
        if (!params.profileKey) {
          throw new Error("Token ProfileReference requires 'profileKey' field");
        }
        source = 4;
        sourceConfiguration = { key: params.profileKey };
        break;

      case "UserAttributeReference":
        // USER_ATTRIBUTE_REFERENCE (5)
        if (!params.userAttributeName || !params.userAttributeCategory) {
          throw new Error("Token UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
        }
        source = 5;
        sourceConfiguration = {
          name: params.userAttributeName,
          category: params.userAttributeCategory
        };
        break;

      default:
        throw new Error(`Unsupported sourceType for Token: ${sourceType}`);
    }

    return { source, sourceConfiguration };
  }

  mapTarget(targetType: string, params: any): TargetMapping {
    let target: 0 | 1;
    let targetConfiguration: any = undefined;

    switch (targetType) {
      case "Default":
        target = 0;
        break;

      case "CustomHeader":
        if (!params.customHeaderName) {
          throw new Error("Token CustomHeader target requires 'customHeaderName' field");
        }
        target = 1;
        targetConfiguration = { name: params.customHeaderName };
        break;

      default:
        target = 0; // Default
    }

    return { target, targetConfiguration };
  }
}
