import { TargetAndSourceMapper, SourceMapping, TargetMapping } from "./TargetAndSourceMapper";

/**
 * Mapper for SAP-SSO login method type.
 * Default source is "Default" (empty configuration).
 * Supports Default and CustomHeader targets.
 */
export class SAPSSOTargetAndSourceMapper implements TargetAndSourceMapper {

  getDefaultSourceType(): string {
    return "Default";
  }

  mapSource(sourceType: string, params: any, existing?: any): SourceMapping {
    let source: 0 | 1 | 3 | 4 | 5;
    let sourceConfiguration: any;

    switch (sourceType) {
      case "Default":
        // DEFAULT (0) - Empty configuration for SAP-SSO - Uses User's login ticket
        source = 0;
        sourceConfiguration = {};
        break;

      case "SystemReference":
        // SYSTEM_REFERENCE (3) - Uses User's login ticket
        source = 3;
        sourceConfiguration = {};
        break;

      case "Provided":
        // PROVIDED (1) - User-provided login ticket
        if (!params.ticket) {
          throw new Error("SAP-SSO Ticket Provided source requires 'ticket' field");
        }
        source = 1;
        sourceConfiguration = {
          ticket: params.ticket,
          ...(existing && { changeTicket: params.changeTicket })
        };
        break;

      case "ProfileReference":
        // PROFILE_REFERENCE (4)
        if (!params.profileKey) {
          throw new Error("SAP-SSO ProfileReference requires 'profileKey' field");
        }
        source = 4;
        sourceConfiguration = { key: params.profileKey };
        break;

      case "UserAttributeReference":
        // USER_ATTRIBUTE_REFERENCE (5)
        if (!params.userAttributeName || !params.userAttributeCategory) {
          throw new Error("SAP-SSO UserAttributeReference requires 'userAttributeName' and 'userAttributeCategory' fields");
        }
        source = 5;
        sourceConfiguration = {
          name: params.userAttributeName,
          category: params.userAttributeCategory
        };
        break;

      default:
        throw new Error(`Unsupported sourceType for SAP-SSO: ${sourceType}`);
    }

    return { source, sourceConfiguration };
  }

  mapTarget(targetType: string, _params: any): TargetMapping {
    let target: 0;

    switch (targetType) {
      case "Default":
        target = 0;
        break;

      default:
        target = 0; // Default
    }

    return { target };
  }
}
