/**
 * Type definitions for Simplifier Low Code Platform API
 */

export interface SimplifierBusinessObjectDetails {
  name: string;
  description: string;
  dependencies: SimplifierBusinessObjectDependencyRef[];
  functionNames: string[];
  editable: boolean;
  deletable: boolean;
  tags: string[];
  assignedProperties: {
    projectsBefore: string[];
    projectsAfter: string[];
  };
}


interface SimplifierBusinessObjectDependencyRef {
  refType: SimplifierBusinessObjectRefType;
  name: string;
}

// todo consider enum
export type SimplifierBusinessObjectRefType = 'connector'|'businessobject'|'plugin';


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

