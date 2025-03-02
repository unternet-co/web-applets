import { AppletActionDescriptor } from './actions';

export type AppletEventType = 'connect' | 'actions' | 'resize' | 'data';

export interface AppletEventInit extends EventInit {
  data?: any;
  actions?: { [id: string]: AppletActionDescriptor };
}

export class AppletEvent extends Event {
  data?: any;
  actions?: { [id: string]: AppletActionDescriptor };

  constructor(type: AppletEventType, init?: AppletEventInit | undefined) {
    super(type, {
      bubbles: init?.bubbles,
      composed: init?.composed,
      cancelable: init?.cancelable,
    });

    this.data = init?.data;
    this.actions = init?.actions;
  }
}
