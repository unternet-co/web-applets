import { type JSONSchemaObject } from '../utils.js';

export interface AppletActionDescriptor {
  name?: string;
  description?: string;
  params_schema?: JSONSchemaObject;
}
