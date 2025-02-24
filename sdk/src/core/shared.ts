/* Manifest & action definitions */

export interface AppletManifest {
  name?: string;
  short_name?: string;
  icons: ManifestIcon[];
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
  parameters?: JSONSchema;
}

/* Transport */

export class AppletMessageTransport {
  target: Window;

  constructor(target: Window) {
    this.target = target;
  }

  async send(message: AppletMessage) {
    this.target.postMessage(message, '*');
    if (message.type === 'response') return;

    // Wait for a resolve message to be sent back before completing await
    return new Promise<AppletMessage>((resolve) => {
      const listener = (messageEvent: MessageEvent) => {
        const responseMessage = messageEvent.data as AppletResponseMessage;

        if (
          responseMessage.type === 'response' &&
          responseMessage.requestId === message.id
        ) {
          window.removeEventListener('message', listener);
          resolve(responseMessage);
        }
      };

      window.addEventListener('message', listener);
    });
  }

  async on(
    messageType: AppletMessage['type'],
    callback: (message: AppletMessage) => Promise<void> | void
  ) {
    const listener = async (messageEvent: MessageEvent<AppletMessage>) => {
      if (messageEvent.source === window.self) return;
      if (messageEvent.data.type !== messageType) return;
      if (messageEvent.source !== this.target) return;

      const message = messageEvent.data;

      // Wait for the callback to complete, then send a 'resolve' event
      // with the message ID.
      await callback(message);
      const responseMessage: AppletResponseMessage = {
        id: crypto.randomUUID(),
        type: 'response',
        requestId: message.id,
      };
      this.send(responseMessage);
    };

    window.addEventListener('message', listener);
    // TODO: Return something that I can then call .off or .removeListener, implement the
    // rest of that event class1
  }
}

/* Events */

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

interface AppletReadyEventOptions {
  manifest?: AppletManifest;
}
export class AppletReadyEvent extends Event {
  manifest?: AppletManifest;

  constructor(options?: AppletReadyEventOptions) {
    super('ready', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });

    this.manifest = options.manifest;
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

export interface AppletResizeEventOpts {
  dimensions: AppletResizeMessage['dimensions'];
}
export class AppletResizeEvent extends Event {
  dimensions: AppletResizeMessage['dimensions'];

  constructor({ dimensions }: AppletResizeEventOpts) {
    super('resize', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });

    this.dimensions = dimensions;
  }
}

/* Messages */

export type AppletMessage =
  | AppletResponseMessage
  | AppletActionsMessage
  | AppletDataMessage
  | AppletReadyMessage
  | AppletResizeMessage
  | AppletActionMessage;

export interface BaseAppletMessage {
  id: string;
}

export interface AppletResponseMessage extends BaseAppletMessage {
  type: 'response';
  requestId: string;
}

export interface AppletActionsMessage extends BaseAppletMessage {
  type: 'actions';
  actions: AppletActionMap;
}

export interface AppletDataMessage<T = any> extends BaseAppletMessage {
  type: 'data';
  data: T;
}

export interface AppletReadyMessage extends BaseAppletMessage {
  type: 'ready';
  manifest?: AppletManifest;
}

export interface AppletResizeMessage extends BaseAppletMessage {
  type: 'resize';
  dimensions: { height: number; width: number };
}

export interface AppletActionMessage extends BaseAppletMessage {
  type: 'action';
  actionId: string;
  arguments: any;
}

/* Utility */

export interface JSONSchema {
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
    [key: string]: JSONSchema;
  };
  required?: string[];
  additionalProperties?: boolean;
}
