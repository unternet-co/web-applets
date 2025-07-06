import { AppletActionDescriptor } from './actions.js';

export type AppletEventType = 'connect' | 'actions' | 'resize' | 'data' | 'workerport';

export interface AppletEventInit extends EventInit {
  data?: any;
  actions?: { [id: string]: AppletActionDescriptor };
  port?: MessagePort
}

export class AppletEvent extends Event {
  data?: any;
  actions?: { [id: string]: AppletActionDescriptor };
  port?: MessagePort

  constructor(type: AppletEventType, init?: AppletEventInit | undefined) {
    super(type, {
      bubbles: init?.bubbles,
      composed: init?.composed,
      cancelable: init?.cancelable,
    });

    this.data = init?.data;
    this.actions = init?.actions;
    this.port = init?.port;
  }
}
