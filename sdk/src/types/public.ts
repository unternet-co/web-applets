import { Applet as AppletClass } from '../applets/applet';
import { AppletScope as AppletScopeClass } from '../applets/applet-scope';

export type Applet = InstanceType<typeof AppletClass>;
export type AppletScope = InstanceType<typeof AppletScopeClass>;

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
  unsafe?: boolean;
  actions?: AppletActionMap;
}

export type AppletActionMap = { [id: string]: AppletAction };

export interface AppletAction {
  name?: string;
  description?: string;
  parameters?: JSONSchemaObject;
}

export interface AppletActionDefinition<T> extends AppletAction {
  handler?: AppletActionHandler<T>;
}

export type AppletActionHandler<T> = (args: T) => void | Promise<void>;

export type AppletActionHandlerMap = {
  [key: string]: AppletActionHandler<any>;
};

export type AppletEventType = 'connect' | 'actions' | 'resize' | 'data';

export interface AppletEventInit extends EventInit {
  data?: any;
  actions?: AppletActionMap;
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
