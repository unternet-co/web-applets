import { Applet as AppletClass } from './main/applet';
import { AppletScope as AppletScopeClass } from './main/applet-scope';

export type Applet = InstanceType<typeof AppletClass>;
export type AppletScope = InstanceType<typeof AppletScopeClass>;

export interface AppletManifest {
  name?: string;
  short_name?: string;
  icons?: ManifestIcon[];
  description?: string;
  display?: string;
  start_url?: string;
  unsafe?: boolean;
  actions?: AppletActionMap;
}

export interface ManifestIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
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

export interface AppletMessage {
  type: string;
}

export interface AppletConnectMessage {
  type: 'appletconnect';
}

export interface AppletRegisterMessage {
  type: 'appletregister';
}

export interface AppletActionCompleteMessage extends AppletMessage {
  type: 'actioncomplete';
  id: string;
}

export interface AppletActionsMessage extends AppletMessage {
  type: 'actions';
  actions: AppletActionMap;
}

export interface AppletDataMessage<T> extends AppletMessage {
  type: 'data';
  data: T;
}

export interface AppletReadyMessage extends AppletMessage {
  type: 'ready';
  manifest?: AppletManifest;
}

export interface AppletResizeMessage extends AppletMessage {
  type: 'resize';
  dimensions: { height: number; width: number };
}

export interface AppletActionMessage extends AppletMessage {
  type: 'action';
  id: string;
  actionId: string;
  arguments: any;
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
