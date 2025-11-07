/**
 * Type definitions for Simplifier Low Code Platform API
 */

export interface SimplifierBusinessObjectDetails {
  name: string;
  description: string;
  dependencies: SimplifierBusinessObjectDependencyRef[];
  functionNames?: string[];
  editable: boolean;
  deletable: boolean;
  tags: string[];
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
}


export interface SimplifierBusinessObjectDependencyRef {
  refType: SimplifierBusinessObjectRefType;
  name: string;
}

// todo consider enum
export type SimplifierBusinessObjectRefType = 'connector'|'serverbusinessobject'|'plugin';


export interface SimplifierBusinessObjectFunction {
  businessObjectName: string,
  name: string,
  description?: string,
  validateIn: boolean,
  validateOut: boolean,
  inputParameters: SimplifierCallableParameter[],
  outputParameters: SimplifierCallableParameter[],
  functionType: "JavaScript",
  code?: string
}

export interface SimplifierCallableParameter {
  name: string;
  description: string;
  alias: string;
  dataTypeId: string;
  dataType: any;
  isOptional: boolean;
}

export type SimplifierApiResponse<T = unknown> =
{
  success: true;
  result: T;
} | {
  success: false;
  error?: string;
  message?: string;
}

/**
 * API response where only errors use the unified format but successful responses do not wrap the result type.
 */
export type UnwrappedSimplifierApiResponse<T = unknown> = {
  success: false;
  error?: string;
  message?: string;
} | T

/**
 * Simplifier DataTypes API Response
 */
export interface SimplifierDataTypesResponse {
  baseTypes: SimplifierDataType[];
  domainTypes: SimplifierDataType[];
  structTypes: SimplifierStructType[];
  collectionTypes: SimplifierDataType[];
  nameSpaces: string[];
}

/**
 * Mutually exclusive categories of data types in simplifier.
 */
export type SimplifierDataTypeCategory = 'base'|'domain'|'struct'|'collection';

/**
 * Base or Domain DataType in Simplifier
 */
export interface SimplifierDataType {
  id: string;
  name: string;
  nameSpace?: string;
  category: SimplifierDataTypeCategory;
  description: string;
  baseType: string;
  derivedFrom?: string;
  isStruct: boolean;
  fields: SimplifierDataTypeField[];
  properties: SimplifierDataTypeProperty[];
  editable: boolean;
  tags: string[];
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
}


/**
 * Data type description for creating or updating a type in Simplifier
 * Fields omitted compared to Scala type:
 *  - id: is overridden in update api call
 *  - baseType: not used in Simplifier
 * Fields where values don't matter:
 *  - editable: not used in Simplifier
 */
export interface SimplifierDataTypeUpdate {
  name: string;
  nameSpace?: string | undefined;
  category: SimplifierDataTypeCategory;
  description?: string | undefined;
  derivedFrom?: string | undefined;
  derivedFromNS?: string | undefined;
  collDtName?: string | undefined;
  collDtNS?: string | undefined;
  isStruct: boolean;
  fields: SimplifierDataTypeFieldUpdate[];
  properties: SimplifierDataTypeProperty[];
  editable: boolean;
  tags: string[];
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
}

/**
 * Struct DataType in Simplifier (complex types with fields)
 */
export interface SimplifierStructType {
  id: string;
  name: string;
  nameSpace?: string;
  category: 'struct';
  description: string;
  isStruct: boolean;
  fields: SimplifierDataTypeField[];
  properties: SimplifierDataTypeProperty[];
  editable: boolean;
  tags: string[];
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
}

/**
 * Field within a DataType or StructType
 */
export interface SimplifierDataTypeField {
  name: string;
  dataTypeId: string;
  dtName: string;
  optional: boolean;
  description: string;
}


/**
 * Field description for creating or updating a struct type in Simplifier
 * Fields omitted compared to Scala type:
 *  - id: is overridden in update api call
 */
export interface SimplifierDataTypeFieldUpdate {
  name: string;
  dtName: string;
  dtNameSpace?: string | undefined;
  optional: boolean;
  description?: string | undefined;
}

/**
 * Property of a DataType (constraints, operators, etc.)
 */
export interface SimplifierDataTypeProperty {
  name: string;
  value: string;
}

/*
 * Business Object Function Testing Types
 */

export interface BusinessObjectTestRequest {
  parameters: BusinessObjectTestParameter[];
}

export interface BusinessObjectTestParameter {
  name: string;
  value: unknown;
  description?: string;
  dataTypeId: string;
  dataType?: SimplifierDataType;
  optional: boolean;
  transfer: boolean;
}

export interface GenericApiResponse {
  success?: boolean;
  error?: string;
  message: string;
}

export interface BusinessObjectTestResponse {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}


export interface ConnectorTestParameter {
  name: string;
  value: unknown;
  alias?: string|undefined;
  constValue?: unknown | undefined;
  dataType: SimplifierDataType;
  transfer: boolean;
}

export interface ConnectorTestRequest {
  parameters: ConnectorTestParameter[];
}

export interface ConnectorTestResponse {
  success: boolean;
  result?: { result?: unknown };
  error?: string;
  message?: string;
}

/*
 * Connector Types
 */

export interface SimplifierConnectorListResponse {
  connectors: SimplifierConnector[];
}

export interface SimplifierConnector {
  name: string;
  description: string;
  connectorType: {
    technicalName: string;
    i18n: string;
    descriptionI18n: string;
  };
  active: boolean;
  timeoutTime: number;
  amountOfCalls: number;
  editable: boolean;
  deletable: boolean;
  tags: string[];
  updateInfo?: {
    created: string;
    creator: SimplifierUser;
    lastEdited: string;
    lastEditor: SimplifierUser;
  };
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
}

export interface SimplifierConnectorUpdate {
  name: string;
  description: string;
  connectorType: string;
  endpointConfiguration?: DetailedEndpoint | undefined;
  active: boolean;
  timeoutTime: number;
  tags: string[];
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
}

interface SimpleEndpoint {
    endpointName: string;
    endpointType: string;
}

interface DetailedEndpoint {
    endpoint: string;
    loginMethodName?: string;
    certificates: string[];
    /* contents of configuration differ based on connector type */
    configuration?: any;
}

export interface SimplifierConnectorDetails extends SimplifierConnector {
  configuration?: {endpoints: SimpleEndpoint[] | DetailedEndpoint[]};
}

export interface SimplifierUser {
  loginName: string;
  firstName: string;
  lastName: string;
  platformDomain: string;
  differentPlatformDomain: boolean;
}

export interface SimplifierConnectorCallsResponse {
  connectorCalls: SimplifierConnectorCallSimple[];
}

export interface SimplifierConnectorCall {
  name: string;
  description: string;
  validateIn: boolean;
  validateOut: boolean;
  editable: boolean;
  executable: boolean;
  autoGenerated: boolean;
}

export interface SimplifierConnectorCallSimple extends SimplifierConnectorCall {
  amountOfInputParameters: number;
  amountOfOutputParameters: number;
}

export interface SimplifierConnectorCallDetails extends SimplifierConnectorCall {
  async: boolean;
  connectorCallParameters: SimplifierConnectorCallParameter[];
  connectorName: string;
}

export interface SimplifierConnectorCallUpdate {
  name: string;
  description: string;
  validateIn: boolean;
  validateOut: boolean;
  async: boolean;
  autoGenerated: boolean;
  connectorCallParameters: SimplifierConnectorCallParameter[];
}

export interface SimplifierConnectorCallParameter {
  name: string;
  alias?: string;
  isInput: boolean;
  constValue?: string;
  dataType: {
    name: string;
    nameSpace?: string;
    category: string;
  };
  optional: boolean;
  position: number;
}

/**
 * LoginMethod Types
 */
export interface SimplifierLoginMethodsResponse {
  loginMethods: SimplifierLoginMethod[];
}


/**
 * OAuth2 Client Types
 */
export interface SimplifierOAuth2ClientsResponse {
  authSettings: SimplifierOAuth2Client[];
}

export interface SimplifierOAuth2Client {
  name: string;
  mechanism: "OAuth2";
  description: string;
  hasIcon: boolean;
}

export interface SimplifierLoginMethod {
  name: string;
  description: string;
  loginMethodType: SimplifierLoginMethodType;
  source: number;  // ID referencing loginMethodType.sources array
  target: number;  // ID referencing loginMethodType.targets array
  updateInfo?: SimplifierUpdateInfo;
  editable: boolean;
  deletable: boolean;
}

export interface SimplifierLoginMethodType {
  technicalName: string;  // e.g., "UserCredentials", "OAuth2", "Token"
  i18n: string;
  descriptionI18n: string;
  sources: SimplifierLoginMethodSource[];
  targets: SimplifierLoginMethodTarget[];
  supportedConnectors: string[];
  methodSpecificData?: any;  // Only present for WSS type
}

export interface SimplifierLoginMethodSource {
  id: number;
  name: string;  // e.g., "DEFAULT", "PROFILE_REFERENCE", "PROVIDED"
  i18nName: string;
  i18nDescription: string;
}

export interface SimplifierLoginMethodTarget {
  id: number;
  name: string;  // e.g., "DEFAULT", "HEADER", "QUERY"
  i18nName: string;
  i18nDescription: string;
}

/**
 * Reusable UpdateInfo type for entities with creation/modification tracking
 */
export interface SimplifierUpdateInfo {
  created: string;
  creator: SimplifierUser;
  lastEdited?: string;
  lastEditor?: SimplifierUser;
}

/**
 * ========================================
 * LoginMethod Details Types (Individual GET endpoint)
 * ========================================
 * These types represent the detailed configuration returned by GET /api/login-methods/{name}
 * Note: This endpoint does NOT return updateInfo, editable, or deletable fields
 */

/**
 * Raw API response from GET /api/login-methods/{name}
 * This is what Simplifier returns before transformation
 */
export interface SimplifierLoginMethodDetailsRaw {
  name: string;
  description: string;
  loginMethodType: SimplifierLoginMethodType;
  source: number;
  target: number;
  sourceConfiguration: Record<string, any>;
  targetConfiguration?: Record<string, any>;
  configuration: Record<string, any>;
}


// ========================================
// LoginMethod Create/Update Types
// ========================================

/**
 * Source configuration for UserCredentials with Default/Provided source (username/password)
 * Source IDs: 0 (DEFAULT), 1 (PROVIDED)
 */
export interface UserCredentialsProvidedSourceConfig {
  username: string;
  password: string;
  /** Only used in updates - set to true to change the password */
  changePassword?: boolean;
}

/**
 * Source configuration for Token with Provided source (token value)
 * Source ID: 1 (PROVIDED)
 */
export interface TokenProvidedSourceConfig {
  token: string;
  /** Only used in updates - set to true to change the token */
  changeToken?: boolean;
}

/**
 * Source configuration for OAuth2 with Default/Reference source (OAuth2 client)
 * Source IDs: 0 (DEFAULT), 2 (REFERENCE)
 */
export interface OAuth2ClientNameSourceConfig {
  clientName: string;
}

/**
 * Source configuration for ProfileReference source (used by both UserCredentials and OAuth2)
 * Source ID: 4 (PROFILE_REFERENCE)
 */
export interface ProfileReferenceSourceConfig {
  key: string;
}

/**
 * Source configuration for UserAttributeReference source (used by both UserCredentials and OAuth2)
 * Source ID: 5 (USER_ATTRIBUTE_REFERENCE)
 */
export interface UserAttributeReferenceSourceConfig {
  name: string;
  category: string;
}

/**
 * Empty source configuration for DEFAULT and SYSTEM_REFERENCE sources
 * Used when no additional configuration is needed (e.g., Token DEFAULT, Token SYSTEM_REFERENCE)
 * Source IDs: 0 (DEFAULT), 3 (SYSTEM_REFERENCE)
 */
export interface EmptySourceConfig {
  // Intentionally empty - represents {}
}

/**
 * Target configuration for custom header
 */
export interface HeaderTargetConfig {
  name: string;
}

/**
 * Target configuration for query parameter
 */
export interface QueryTargetConfig {
  key: string;
}

/**
 * Unified request payload for creating a login method.
 * Supports UserCredentials and OAuth2 login method types with various source configurations.
 *
 * Source IDs:
 * - 0: DEFAULT
 * - 1: PROVIDED (UserCredentials only)
 * - 2: REFERENCE (OAuth2 only)
 * - 4: PROFILE_REFERENCE
 * - 5: USER_ATTRIBUTE_REFERENCE
 *
 * Target IDs (UserCredentials only supports 0):
 * - 0: DEFAULT
 * - 1: CUSTOM_HEADER (OAuth2 only)
 * - 2: QUERY_PARAMETER (OAuth2 only)
 */
export interface CreateLoginMethodRequest {
  name: string;
  description: string;
  loginMethodType: "UserCredentials" | "OAuth2" | "Token";
  source: 0 | 1 | 2 | 3 | 4 | 5;
  target: 0 | 1 | 2;
  sourceConfiguration:
    | UserCredentialsProvidedSourceConfig
    | TokenProvidedSourceConfig
    | OAuth2ClientNameSourceConfig
    | ProfileReferenceSourceConfig
    | UserAttributeReferenceSourceConfig
    | EmptySourceConfig;  // Empty configuration for DEFAULT/SYSTEM_REFERENCE sources
  targetConfiguration?: HeaderTargetConfig | QueryTargetConfig;
}

/**
 * Unified request payload for updating a login method.
 * Same structure as CreateLoginMethodRequest but used for update operations.
 */
export interface UpdateLoginMethodRequest {
  name: string;
  description: string;
  loginMethodType: "UserCredentials" | "OAuth2" | "Token";
  source: 0 | 1 | 2 | 3 | 4 | 5;
  target: 0 | 1 | 2;
  sourceConfiguration:
    | UserCredentialsProvidedSourceConfig
    | TokenProvidedSourceConfig
    | OAuth2ClientNameSourceConfig
    | ProfileReferenceSourceConfig
    | UserAttributeReferenceSourceConfig
    | EmptySourceConfig;  // Empty configuration for DEFAULT/SYSTEM_REFERENCE sources
  targetConfiguration?: HeaderTargetConfig | QueryTargetConfig;
}

/**
 * Processed/transformed login method details with discriminated unions
 * This is what our MCP resource returns after adding type discriminators
 */
export interface SimplifierLoginMethodDetails {
  name: string;
  description: string;
  loginMethodType: SimplifierLoginMethodType;
  source: number;
  target: number;
  sourceConfiguration: SimplifierLoginMethodSourceConfiguration;
  targetConfiguration?: SimplifierLoginMethodTargetConfiguration;
  configuration: SimplifierLoginMethodConfiguration;
}

// ===== SOURCE CONFIGURATION TYPES (Discriminated by type + source) =====

/**
 * UserCredentials with DEFAULT source - stores username/password directly
 */
export interface UserCredentialsDefaultSource {
  type: 'UserCredentials';
  source: 0; // DEFAULT
  jsonClass?: string;
  username?: string;
  password?: string; // Always masked as "*****" when retrieved
  changePassword?: boolean;
}

/**
 * PROFILE_REFERENCE source - references user profile attribute by key
 * Used by UserCredentials, OAuth2, Token, and Certificate login methods
 */
export interface ProfileReferenceSource {
  type: string; // Runtime value: 'UserCredentials' | 'OAuth2' | 'Token' | 'Certificate' etc.
  source: 4; // PROFILE_REFERENCE
  jsonClass?: string;
  key: string; // Profile attribute key (required)
}

/**
 * USER_ATTRIBUTE_REFERENCE source - references user attribute by name and category
 * Used by UserCredentials, Token, and Certificate login methods
 */
export interface UserAttributeSource {
  type: string; // Runtime value: 'UserCredentials' | 'Token' | 'Certificate' etc.
  source: 5; // USER_ATTRIBUTE_REFERENCE
  jsonClass?: string;
  name: string; // User attribute name
  category: string; // User attribute category
}

/**
 * OAuth2 with DEFAULT or REFERENCE source - references OAuth2 client configuration
 */
export interface OAuth2DefaultOrReferenceSource {
  type: 'OAuth2';
  source: 0 | 2; // DEFAULT or REFERENCE
  jsonClass?: string;
  clientName?: string | null; // OAuth2 client name, can be null
}

/**
 * Token with DEFAULT source
 */
export interface TokenDefaultSource {
  type: 'Token';
  source: 0; // DEFAULT
  jsonClass?: string;
}

/**
 * SYSTEM_REFERENCE source - references system-managed credentials
 * Used by Token and SingleSignOn login methods
 * (so it is either a SimplifierToken or a SAP SSO token (strangely compared to oAuth2 no clientName of the AuthClient is selected - it is assumed, that there is only one...))
 */
export interface SystemReferenceSource {
  type: string; // Runtime value: 'Token' | 'SingleSignOn'
  source: 3; // SYSTEM_REFERENCE
  jsonClass?: string;
}

/**
 * Token with PROVIDED source - stores token value directly
 */
export interface TokenProvidedSource {
  type: 'Token';
  source: 1; // PROVIDED
  jsonClass?: string;
  token?: string; // May be masked when retrieved
  changeToken?: boolean;
}

/**
 * Certificate with DEFAULT source - references certificate by identifier
 */
export interface CertificateDefaultSource {
  type: 'Certificate';
  source: 0; // DEFAULT
  identifier?: string; // e.g., "Simplifier: X509 - Certificate (2): WssTestAutomationCrt"
}

/**
 * SingleSignOn (SSO) with WITH_EXT_PROVIDER source - uses external identity provider
 */
export interface SSOWithExtProviderSource {
  type: 'SingleSignOn';
  source: 7; // WITH_EXT_PROVIDER
  identityProvider?: string;
  secretUserAttribute?: string;
}

/**
 * SingleSignOn (SSO) with DEFAULT source
 */
export interface SSODefaultSource {
  type: 'SingleSignOn';
  source: 0; // DEFAULT
  jsonClass?: string;
}

/**
 * Union type for all source configurations
 * Discriminated by 'type' (login method type) and 'source' (source ID)
 */
export type SimplifierLoginMethodSourceConfiguration =
  | UserCredentialsDefaultSource
  | OAuth2DefaultOrReferenceSource
  | TokenDefaultSource
  | TokenProvidedSource
  | CertificateDefaultSource
  | SystemReferenceSource
  | ProfileReferenceSource
  | UserAttributeSource
  | SSOWithExtProviderSource
  | SSODefaultSource;

// ===== CONFIGURATION TYPES (Discriminated by type) =====

/**
 * Configuration for UserCredentials login method
 */
export interface UserCredentialsConfiguration {
  type: 'UserCredentials';
  convertTargetToBase64?: boolean;
  convertSourceFromBase64?: boolean;
}

/**
 * Configuration for Token login method
 */
export interface TokenConfiguration {
  type: 'Token';
  convertTargetToBase64?: boolean;
  convertSourceFromBase64?: boolean;
}

/**
 * Configuration for Certificate login method
 */
export interface CertificateConfiguration {
  type: 'Certificate';
  removeLinebreaks?: boolean;
  prerequisites?: {
    type?: string; // e.g., "X509"
    version?: string; // e.g., "3.0"
    encodingFormat?: string; // e.g., "PEM"
  };
}

/**
 * Configuration for SingleSignOn (SSO) login method
 */
export interface SSOConfiguration {
  type: 'SingleSignOn';
  sapSystem?: string;
  externalIdType?: string; // e.g., "LDAP"
}

/**
 * Configuration for OAuth2 login method
 * Often empty or minimal, keeping flexible
 */
export interface OAuth2Configuration {
  type: 'OAuth2';
  [key: string]: any; // OAuth2 config is highly variable
}

/**
 * Configuration for SAML login method
 */
export interface SAMLConfiguration {
  type: 'SAML';
  [key: string]: any; // SAML config is highly variable
}

/**
 * Configuration for WSS (Web Services Security) login method
 */
export interface WSSConfiguration {
  type: 'WSS';
  [key: string]: any; // WSS config is highly variable
}

/**
 * Configuration for Microsoft Entra ID login method
 */
export interface MSEntraIDConfiguration {
  type: 'MSEntraID_OAuth';
  [key: string]: any; // Entra ID config is highly variable
}

/**
 * Union type for all configuration types
 * Discriminated by 'type' (login method type)
 */
export type SimplifierLoginMethodConfiguration =
  | UserCredentialsConfiguration
  | TokenConfiguration
  | CertificateConfiguration
  | SSOConfiguration
  | OAuth2Configuration
  | SAMLConfiguration
  | WSSConfiguration
  | MSEntraIDConfiguration;

// ===== TARGET CONFIGURATION TYPES (Discriminated by target) =====

/**
 * DEFAULT target - no additional configuration
 */
export interface DefaultTargetConfiguration {
  target: 0; // DEFAULT
}

/**
 * HEADER target - places token/credential in HTTP header
 */
export interface HeaderTargetConfiguration {
  target: 1; // HEADER
  name?: string; // Header name like "MY_CERT", "Authorization", etc.
}

/**
 * QUERY target - places token/credential in query parameter
 */
export interface QueryTargetConfiguration {
  target: 2; // QUERY
  name?: string; // Query parameter name
}

/**
 * Union type for all target configurations
 * Discriminated by 'target' (target ID)
 */
export type SimplifierLoginMethodTargetConfiguration =
  | DefaultTargetConfiguration
  | HeaderTargetConfiguration
  | QueryTargetConfiguration;

/*
 * Logging Types
 */

export interface SimplifierLogEntry {
  id: string;
  entryDate: string;
  level: number;
  messageKey: string;
  messageParams: any[];
  hasDetails: boolean;
  category: string;
}

export interface SimplifierLogEntryDetails extends SimplifierLogEntry {
  details?: string;
  context: any[];
}

export interface SimplifierLogListResponse {
  list: SimplifierLogEntry[];
}

export interface SimplifierLogPagesResponse {
  pagesize: number;
  pages: number;
}

/**
 * Represents options for configuring log listing in Simplifier.
 * `from` and `until` always have to be used together.
 */
export type SimplifierLogListOptions = {
  logLevel?: number;
  since?: string;
  pageNo?: number;
  pageSize?: number;
  from?: string;
  until?: string;
};

export interface SimplifierInstance {
  name: string;
  url: string;
  description: string;
  type: string;
  active: boolean;
}

export interface SimplifierInstanceSettings {
  instanceSettings: SimplifierInstance[]
}

export type SAPSystemBase = {
  name: string;
  description: string;
  active: boolean;
  instanceRestrictions: string[];
  systemType: string;
  tags: string[];
  assignedProjects: {
    projectsBefore: string[];
    projectsAfterChange: string[];
  };
  permission: {
    deletable: true;
    editable: true;
  }
}

/** A detail view of a SAP system */
export type SAPSystem = SAPSystemBase & { configuration: SAPSystemConfiguration }

/** Entry for a SAP system in the list of all SAP systems */
export type SAPSystemOverviewItem = SAPSystemBase & {
  updateInfo: {
    created: string;
    creator: {
      loginName: string;
      firstName: string;
      lastName: string;
      platformDomain: string;
      differentPlatformDomain: boolean;
    }
  };
  referencedBy: {
    loginMethods: string[];
    connectors: string[]
  };
}

type SAPSystemConfiguration = SAPCustomApplicationServer | SAPGroupServer;

/** configuration options common to both types of server */
type SAPSystemConfigurationCommon = {
  systemId: string;
  systemNumber: string;
  clientNumber: string;
  language: string;
  sapRouterString: string;
  sncActive: boolean;
  sncPartner: string;
  sncSsoMode: boolean;
  sncQualityOfProtection: number;
}
type SAPCustomApplicationServer = SAPSystemConfigurationCommon & { applicationServerHostname: string }
type SAPGroupServer = SAPSystemConfigurationCommon & {
  messageServerHostname: string;
  messageServerServiceName: string;
  messageServerR3Name: string;
  messageServerGroupName: string;
}

export interface SAPSystemListResponse {
  sapSystems: SAPSystemOverviewItem[];
}
