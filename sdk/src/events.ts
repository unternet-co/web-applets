import {
  AppletActionMap,
  AppletEventInit,
  AppletEventType,
  AppletManifest,
} from './types/public';

export class AppletEvent extends Event {
  data?: any;
  actions?: AppletActionMap;

  constructor(type: AppletEventType, init?: AppletEventInit | undefined) {
    super(type, {
      bubbles: init?.bubbles,
      composed: init?.composed,
      cancelable: init?.cancelable,
    });

    this.data = init.data;
    this.actions = init.actions;
  }
}
