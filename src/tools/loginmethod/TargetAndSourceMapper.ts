/**
 * Result of source mapping containing the numeric source type and configuration
 */
export interface SourceMapping {
  source: number;
  sourceConfiguration: any;
}

/**
 * Result of target mapping containing the numeric target type and optional configuration
 */
export interface TargetMapping {
  target: number;
  targetConfiguration?: any;
}

/**
 * Interface for mapping login method source and target configurations.
 * Different login method types (UserCredentials, OAuth2) have different
 * defaults and validation rules, implemented by separate mapper classes.
 */
export interface TargetAndSourceMapper {
  /**
   * Gets the default source type for this login method type.
   * @returns The default source type string (e.g., "Provided", "ClientReference")
   */
  getDefaultSourceType(): string;

  /**
   * Maps the source type string and parameters to numeric source code and configuration object.
   * @param sourceType - The source type string from the user
   * @param params - The tool parameters containing source-specific fields
   * @param existing - Optional existing login method (for update operations)
   * @returns SourceMapping with numeric source and sourceConfiguration
   * @throws Error if required fields are missing or sourceType is unsupported
   */
  mapSource(sourceType: string, params: any, existing?: any): SourceMapping;

  /**
   * Maps the target type string and parameters to numeric target code and configuration object.
   * @param targetType - The target type string from the user
   * @param params - The tool parameters containing target-specific fields
   * @returns TargetMapping with numeric target and optional targetConfiguration
   * @throws Error if required fields are missing or targetType is unsupported
   */
  mapTarget(targetType: string, params: any): TargetMapping;
}
