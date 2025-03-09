import { AppletActionDescriptor } from './applets/actions.js';

export function dispatchEventAndHandler(event: Event) {
  if (typeof this[`on${event.type}`] === 'function') {
    this[`on${event.type}`](event);
  }
  this.dispatchEvent(event);
}

export interface AppletManifest {
  name?: string;
  short_name?: string;
  icons?: {
    src: string;
    purpose?: string;
    sizes?: string;
    type?: string;
  }[];
  description?: string;
  display?: string;
  start_url?: string;
  actions?: { [id: string]: AppletActionDescriptor };
  [key: string]: any;
}

export interface JSONSchemaObject {
  type:
    | 'object'
    | 'string'
    | 'number'
    | 'integer'
    | 'array'
    | 'boolean'
    | 'null';
  description?: string;
  properties?: {
    [key: string]: JSONSchemaObject;
  };
  required?: string[];
  additionalProperties?: boolean;
}
