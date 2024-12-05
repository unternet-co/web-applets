/* Manifest & action definitions */

import { parseUrl } from '../utils';

export interface AppletManifest {
  name?: string;
  short_name?: string;
  icons: AppletIcons;
  description?: string;
  icon?: string;
  display?: string;
  start_url?: string;
  unsafe?: boolean;
  actions?: AppletAction[];
}

export interface AppletIcons {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

export interface AppletAction {
  id: string;
  name?: string;
  description?: string;
  params?: JSONSchemaProperties;
}

export type JSONSchemaProperties = Record<
  string,
  {
    description: string;
    type: string;
    properties: JSONSchemaProperties;
  }
>;

export type ActionParams = Record<string, any>;

export async function loadManifest(pageUrl: string): Promise<AppletManifest> {
  pageUrl = parseUrl(pageUrl);

  let manifest: AppletManifest;

  try {
    const pageRequest = await fetch(pageUrl);
    const html = await pageRequest.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const linkElem = doc.querySelector(
      'link[rel="manifest"]'
    ) as HTMLLinkElement;

    const manifestUrl = parseUrl(linkElem.href);

    const manifestRequest = await fetch(manifestUrl);

    manifest = await manifestRequest.json();
    // TODO: Add verification this is a valid manifest
  } catch (e) {
    return;
  }

  return manifest;
}

/* AppletMessageRelay */

interface SendMessageOptions {
  resolves: boolean;
}

export class AppletMessageRelay {
  target: Window;

  constructor(target: Window) {
    this.target = target;
  }

  async send(message: AppletMessage, options?: SendMessageOptions) {
    this.target.postMessage(message.toJson(), '*');
    if (options && options.resolves === false) return;

    // Wait for a resolve message to be sent back before completing await
    return new Promise<AppletMessage>((resolve) => {
      const listener = (messageEvent: MessageEvent) => {
        const responseMessage = new AppletMessage(
          messageEvent.data.type,
          messageEvent.data
        );

        if (
          responseMessage.type === 'resolve' &&
          responseMessage.id === message.id
        ) {
          window.removeEventListener('message', listener);
          resolve(responseMessage);
        }
      };

      window.addEventListener('message', listener);
    });
  }

  async on(messageType: AppletMessageType, callback: AppletMessageCallback) {
    const listener = async (messageEvent: MessageEvent<AppletMessage>) => {
      if (messageEvent.source === window.self) return;
      if (messageEvent.data.type !== messageType) return;

      const message = new AppletMessage(
        messageEvent.data.type,
        messageEvent.data
      );

      // Wait for the callback to complete, then send a 'resolve' event
      // with the message ID.
      await callback(message);
      const resolveMessage = new AppletResolveMessage({ id: message.id });
      this.send(resolveMessage, { resolves: false });
    };

    window.addEventListener('message', listener);
    // TODO: Return something that I can then call .off or .removeListener, implement the
    // rest of that event class
  }
}

/* Messages */

export class AppletMessage {
  type: AppletMessageType;
  id: string;
  timeStamp: number;
  [key: string]: any;

  constructor(type: AppletMessageType, values?: { [key: string]: any }) {
    this.timeStamp = Date.now();
    this.type = type;
    this.id = crypto.randomUUID();
    if (values) Object.assign(this, values);
  }

  toJson() {
    return Object.fromEntries(
      Object.entries(this).filter(([_, value]) => {
        try {
          JSON.stringify(value);
          return true;
        } catch {
          return false;
        }
      })
    );
  }
}

export class AppletResolveMessage extends AppletMessage {
  messageId: string;

  constructor({ id }: { id: string }) {
    super('resolve');
    this.id = id;
  }
}

export class AppletActionsMessage extends AppletMessage {
  actions: AppletAction[];

  constructor({ actions }: { actions: AppletAction[] }) {
    super('actions');
    this.actions = actions;
  }
}

export class AppletDataMessage<T = any> extends AppletMessage {
  data: T;

  constructor({ data }: { data: T }) {
    super('data');
    this.data = data;
  }
}

export class AppletReadyMessage extends AppletMessage {
  constructor() {
    super('ready');
  }
}

export class AppletResizeMessage extends AppletMessage {
  dimensions: { height: number; width: number };

  constructor({
    dimensions,
  }: {
    dimensions: AppletResizeMessage['dimensions'];
  }) {
    super('resize');
    this.dimensions = dimensions;
  }
}

interface AppletActionMessageOptions {
  actionId: string;
  params: any;
}
export class AppletActionMessage extends AppletMessage {
  actionId: string;
  params: any;

  constructor({ actionId, params }: AppletActionMessageOptions) {
    super('action');
    this.actionId = actionId;
    this.params = params;
  }
}

export class AppletInitMessage extends AppletMessage {
  constructor() {
    super('init');
  }
}

export type AppletMessageType =
  | 'action'
  | 'actions'
  | 'data'
  | 'init'
  | 'ready'
  | 'resolve'
  | 'resize';

export type AppletMessageCallback = (
  message: AppletMessage
) => Promise<void> | void;

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

export class AppletReadyEvent extends Event {
  constructor() {
    super('ready', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });
  }
}

export class AppletLoadEvent extends Event {
  constructor() {
    super('load', {
      bubbles: false,
      cancelable: false,
      composed: false,
    });
  }
}

export class AppletActionsEvent extends Event {
  actions: AppletAction[];

  constructor({ actions }: { actions: AppletAction[] }) {
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
