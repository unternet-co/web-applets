import { AppletActionMap, AppletManifest, AppletResizeMessage } from './types';

export class AppletDataEvent extends Event {
  data: any;

  constructor({ data }: { data: any }) {
    super('data', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });

    this.data = data;
  }
}

interface AppletReadyEventInit {
  manifest?: AppletManifest;
}
export class AppletReadyEvent extends Event {
  manifest?: AppletManifest;

  constructor(init?: AppletReadyEventInit | undefined) {
    super('ready', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });

    if (init) this.manifest = init.manifest;
  }
}

export class AppletActionsEvent extends Event {
  actions: AppletActionMap;

  constructor({ actions }: { actions: AppletActionMap }) {
    super('actions', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });

    this.actions = actions;
  }
}

export interface AppletResizeEventInit {
  dimensions: AppletResizeMessage['dimensions'];
}
export class AppletResizeEvent extends Event {
  dimensions: AppletResizeMessage['dimensions'];

  constructor({ dimensions }: AppletResizeEventInit) {
    super('resize', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });

    this.dimensions = dimensions;
  }
}
