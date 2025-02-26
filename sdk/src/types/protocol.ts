import { AppletActionMap, AppletManifest } from './public';

export interface AppletMessage {
  type: string;
}

export interface AppletConnectMessage {
  type: 'appletconnect';
}

export interface AppletRegisterMessage {
  type: 'register';
  manifest?: AppletManifest;
  actions?: AppletActionMap;
  data?: any;
}

export interface AppletActionMessage extends AppletMessage {
  type: 'action';
  id: string;
  actionId: string;
  arguments: any;
}

export interface AppletActionCompleteMessage extends AppletMessage {
  type: 'actioncomplete';
  id: string;
}

export interface AppletActionErrorMessage extends AppletMessage {
  type: 'actionerror';
  id: string;
  message: string;
}

export interface AppletActionsMessage extends AppletMessage {
  type: 'actions';
  actions: AppletActionMap;
}

export interface AppletDataMessage<T = any> extends AppletMessage {
  type: 'data';
  data: T;
}

export interface AppletResizeMessage extends AppletMessage {
  type: 'resize';
  height: number;
  width: number;
}
