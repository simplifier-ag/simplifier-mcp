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
    projectsAfter: string[];
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

/**
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
  dataType?: any;
  optional: boolean;
  transfer: boolean;
}

export interface BusinessObjectTestResponse {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}

