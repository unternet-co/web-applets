export interface AppletManifest {
  type: 'applet';
  name: string;
  description: string;
  icon?: string;
  entrypoint: string;
  actions: AppletAction[];
}

export interface AppletAction {
  id: string;
  description: string;
  params?: ActionParamSchema;
}

export interface AppletHeader {
  name: string;
  description: string;
  url: string;
  actions: {
    id: string;
    description: string;
    params: {
      [key: string]: string;
    };
  }[];
}

/* State */

export type AppletState = Record<string, Serializable>;

/* Actions */

export type ActionParamSchema = Record<
  string,
  {
    description: string;
    type: 'string';
  }
>;

export type ActionParams = Record<string, unknown>;

export type ActionHandlerDict = { [key: string]: ActionHandler<any> };
export type ActionHandler<T extends ActionParams> = (
  params: T
) => void | Promise<void>;

/* Messages */

export type AnyAppletMessage =
  | AppletMessage
  | AppletStateMessage
  | AppletActionMessage;

export interface AppletStateMessage<T = any> extends AppletMessage {
  type: 'state';
  state: T;
}

export interface AppletActionMessage<T = any> extends AppletMessage {
  type: 'action';
  actionId: string;
  params: T;
}

export class AppletMessage<T = any> {
  type: AppletMessageType;
  id: string;
  timeStamp: number;

  constructor(type: AppletMessageType, values?: T) {
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

  resolve() {}
}

export type AppletMessageType =
  | 'action'
  | 'render'
  | 'state'
  | 'ready'
  | 'resolve'
  | 'resize';
export type AppletMessageCallback = (message: AnyAppletMessage) => void;

/* Utils */

type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable };
