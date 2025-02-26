import { AppletActionMap, AppletManifest } from './public';

export interface AppletMessage {
  type: string;
}

export interface AppletConnectMessage {
  type: 'appletconnect';
}

export interface AppletRegisterMessage {
  type: 'appletregister';
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

export interface AppletReadyMessage extends AppletMessage {
  type: 'initialize';
  manifest?: AppletManifest;
}

export interface AppletResizeMessage extends AppletMessage {
  type: 'resize';
  height: number;
  width: number;
}
