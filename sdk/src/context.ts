import {
  ActionHandlerDict,
  AppletMessage,
  AppletActionMessage,
  AppletMessageType,
  AppletMessageCallback,
  ActionParams,
  ActionHandler,
  AppletStateMessage,
  AppletInitMessage,
} from './types';

/**
 * Context
 */

export class AppletContext<StateType = any> extends EventTarget {
  client: AppletClient;
  actionHandlers: ActionHandlerDict = {};
  state: StateType;
  headless: boolean = false;

  connect() {
    this.client = new AppletClient();

    const startup = async () => {
      await this.onload();
      this.client.send(new AppletMessage('ready'));
      this.dispatchEvent(new CustomEvent('ready'));
      await this.onready();
    };

    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      setTimeout(startup, 1);
    } else {
      window.addEventListener('DOMContentLoaded', startup);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const message = new AppletMessage('resize', {
          dimensions: {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          },
        });
        this.client.send(message);
      }
    });
    resizeObserver.observe(document.querySelector('html')!);

    this.client.on('init', (message: AppletMessage) => {
      const initMessage = message as AppletInitMessage;
      this.headless = initMessage.headless;
    });

    this.client.on('state', (message: AppletMessage) => {
      if (!isStateMessage(message)) {
        throw new TypeError("Message doesn't match type StateMessage");
      }

      this.setState(message.state);
    });

    this.client.on('action', async (message: AppletMessage) => {
      if (!isActionMessage(message)) {
        throw new TypeError("Message doesn't match type AppletMessage.");
      }

      if (Object.keys(this.actionHandlers).includes(message.actionId)) {
        await this.actionHandlers[message.actionId](message.params);
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

  async setState(state: StateType, shouldRender?: boolean) {
    const message = new AppletMessage('state', { state });
    await this.client.send(message);
    this.state = state;
    this.dispatchEvent(new CustomEvent('render'));
    if (shouldRender && !this.headless) this.onrender();
  }

  onload(): Promise<void> | void {}
  onready(): Promise<void> | void {}
  onrender(): void {}
}

function isActionMessage(
  message: AppletMessage
): message is AppletActionMessage {
  return message.type === 'action';
}

function isStateMessage(message: AppletMessage): message is AppletStateMessage {
  return message.type === 'state';
}

/**
 * Client
 */

class AppletClient {
  on(messageType: AppletMessageType, callback: AppletMessageCallback) {
    window.addEventListener(
      'message',
      async (messageEvent: MessageEvent<AppletMessage>) => {
        if (messageEvent.data.type !== messageType) return;
        const message = new AppletMessage(
          messageEvent.data.type,
          messageEvent.data
        );
        await callback(message);
        window.parent.postMessage(
          new AppletMessage('resolve', { id: message.id }),
          '*'
        );
      }
    );
  }

  send(message: AppletMessage) {
    window.parent.postMessage(message.toJson(), '*');

    return new Promise<void>((resolve) => {
      const listener = (messageEvent: MessageEvent<AppletMessage>) => {
        if (
          messageEvent.data.type === 'resolve' &&
          messageEvent.data.id === message.id
        ) {
          window.removeEventListener('message', listener);
          resolve();
        }
      };
      window.addEventListener('message', listener);
    });
  }
}

export const appletContext = new AppletContext();
