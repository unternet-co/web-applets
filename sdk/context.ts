/**
 * Context
 */

export class AppletContext<StateType extends AppletState> extends EventTarget {
  client: AppletClient;
  actionHandlers: ActionHandlerDict = {};
  state: StateType;

  connect() {
    this.client = new AppletClient();

    window.addEventListener('DOMContentLoaded', async () => {
      this.client.send('ready');
      this.dispatchEvent(new CustomEvent('ready'));
      await this.onready();
    });

    window.addEventListener('resize', () => {
      this.client.send('resize', {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      });
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        this.client.send('resize', {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(document.querySelector('html')!);

    this.client.on('action', (detail: AppletMessageDetail) => {
      if (!isActionMessageDetail(detail)) {
        throw new TypeError(
          "Message detail doesn't match type AppletMessageDetail."
        );
      }
      if (Object.keys(this.actionHandlers).includes(detail.actionId)) {
        this.actionHandlers[detail.actionId](detail.params);
      }
    });

    return this;
  }

  setActionHandler<T extends ActionParams>(
    actionId: string,
    handler: ActionHandler<T>
  ) {
    this.actionHandlers[actionId] = handler;
  }

  setState(state: StateType) {
    this.client.send('state', state);
    this.state = state;
    this.dispatchEvent(new CustomEvent('render'));
    this.onrender(); // TODO: Should come from client? Or stay here, and only activate if mounted? Need a control for mounting.
  }

  onready(): Promise<void> | void {}
  onrender(): void {}
}

function isActionMessageDetail(
  detail: AppletMessageDetail
): detail is ActionMessageDetail {
  return 'actionId' in detail && 'params' in detail;
}

/**
 * Client
 */

class AppletClient {
  on(messageType: AppletMessageType, callback: AppletMessageCallback) {
    window.addEventListener('message', (message: AppletMessage) => {
      if (message.data.type !== messageType) return;
      callback(message.data.detail);
    });
  }

  send(messageType: AppletMessageType, detail?: AppletMessageDetail) {
    const id = crypto.randomUUID();
    window.parent.postMessage({
      type: messageType,
      id,
      detail,
    });
  }
}

/**
 * Types
 */

// State
type AppletState = Record<string, Serializable>;
type StateMessageDetail = AppletState;

// Actions
export type ActionParams = Record<string, Serializable>;
type ActionHandlerDict = { [key: string]: ActionHandler<any> };
type ActionHandler<T extends ActionParams> = (params: T) => void;
interface ActionMessageDetail {
  actionId: string;
  params: ActionParams;
}

// Messages
// TODO: Get rid of detail here, just have it as part of the event
interface AppletMessage extends MessageEvent {
  data: {
    type: AppletMessageType;
    id: string;
    detail: AppletMessageDetail;
  };
}
type AppletMessageType = 'action' | 'render' | 'state' | 'ready' | 'resize';
type AppletMessageCallback = (detail: AppletMessageDetail) => void;
type AppletMessageDetail = ActionMessageDetail | StateMessageDetail;

// Generic
type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | { [key: string]: Serializable };

/**
 * Exports
 */

export default new AppletContext();
