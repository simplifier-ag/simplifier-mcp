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
  assignedProperties: {
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
  description: string,
  validateIn: boolean,
  validateOut: boolean,
  inputParameters: SimplifierCallableParameter[],
  outputParameters: SimplifierCallableParameter[],
  functionType: "JavaScript",
  code: string
}

export interface SimplifierCallableParameter {
  name: string;
  description: string;
  alias: string;
  dataTypeId: string;
  dataType: any;
  isOptional: boolean;
}

export interface SimplifierApiResponse<T = unknown> {
  success?: boolean;
  result?: T;
  error?: string;
  message?: string;
}

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
 * Base or Domain DataType in Simplifier
 */
export interface SimplifierDataType {
  id: string;
  name: string;
  nameSpace?: string;
  category: 'base' | 'domain';
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
 * Property of a DataType (constraints, operators, etc.)
 */
export interface SimplifierDataTypeProperty {
  name: string;
  value: string;
}

