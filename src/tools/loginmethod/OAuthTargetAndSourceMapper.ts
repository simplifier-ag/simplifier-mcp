import { TargetAndSourceMapper, SourceMapping, TargetMapping } from "./TargetAndSourceMapper.js";

/**
 * Mapper for OAuth2 login method type.
 * Default source is "ClientReference" (OAuth2 client).
 * Supports Default, CustomHeader, and QueryParameter targets.
 */
export class OAuthTargetAndSourceMapper implements TargetAndSourceMapper {

  getDefaultSourceType(): string {
    return "ClientReference";
  }

  mapSource(sourceType: string, params: any, _existing?: any): SourceMapping {
    let source: 0 | 4 | 5;
    let sourceConfiguration: any;

    switch (sourceType) {
      case "ClientReference":
        if (!params.oauth2ClientName) {
          throw new Error("OAuth2 ClientReference requires 'oauth2ClientName' field");
        }
        source = 0;
        sourceConfiguration = { clientName: params.oauth2ClientName };
        break;

      case "ProfileReference":
        if (!params.profileKey) {
          throw new Error("OAuth2 ProfileReference requires 'profileKey' field");
        }
        source = 4;
        sourceConfiguration = { key: params.profileKey };
        break;

      case "UserAttributeReference":
        if (!params.userAttributeName || !params.userAttributeCategory) {
          throw new Error("OAuth2 UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
        }
        source = 5;
        sourceConfiguration = {
          name: params.userAttributeName,
          category: params.userAttributeCategory
        };
        break;

      default:
        throw new Error(`Unsupported sourceType for OAuth2: ${sourceType}`);
    }

    return { source, sourceConfiguration };
  }

  mapTarget(targetType: string, params: any): TargetMapping {
    let target: 0 | 1 | 2;
    let targetConfiguration: any = undefined;

    switch (targetType) {
      case "Default":
        target = 0;
        break;

      case "CustomHeader":
        if (!params.customHeaderName) {
          throw new Error("OAuth2 CustomHeader target requires 'customHeaderName' field");
        }
        target = 1;
        targetConfiguration = { name: params.customHeaderName };
        break;

      case "QueryParameter":
        if (!params.queryParameterKey) {
          throw new Error("OAuth2 QueryParameter target requires 'queryParameterKey' field");
        }
        target = 2;
        targetConfiguration = { key: params.queryParameterKey };
        break;

      default:
        target = 0; // Default
    }

    return { target, targetConfiguration };
  }
}
