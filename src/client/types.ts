/**
 * Type definitions for Simplifier Low Code Platform API
 * 
 * TODO fix those - all made up by claude
 */

export interface SimplifierBusinessObject {
  id: string;
  name: string;
  description?: string;
  script: string; // JavaScript code
  parameters: BOParameter[];
  returnType?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface BOParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: unknown;
}

export interface SimplifierApiResponse<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
  message?: string;
}

export interface CreateBusinessObjectRequest {
  name: string;
  description?: string;
  script: string;
  parameters: BOParameter[];
  returnType?: string;
}