import { type JSONSchemaObject } from '../utils.ts';

export interface AppletActionDescriptor {
  name?: string;
  description?: string;
  params_schema?: JSONSchemaObject;
}
