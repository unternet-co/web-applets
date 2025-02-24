import {
  AppletDataMessage,
  AppletDataEvent,
  AppletReadyEvent,
  AppletManifest,
  AppletActionsMessage,
  AppletAction,
  AppletMessageTransport,
  AppletActionMap,
  AppletActionMessage,
  JSONSchema,
  AppletReadyMessage,
  AppletResizeMessage,
} from './shared';

export type ActionHandler<T> = (args: T) => void | Promise<void>;

export type ActionHandlerMap = { [key: string]: ActionHandler<any> };

export class AppletScope extends EventTarget {
  #transport: AppletMessageTransport;
  #actionHandlers: ActionHandlerMap = {};
  #manifest: AppletManifest;
  #actions: AppletActionMap;
  #data: any;

  constructor() {
    super();
    this.#transport = new AppletMessageTransport(window.parent);

    // When document loads/if it's loaded, call the initialize function
    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      // Document has loaded already.
      // Timeout added so if the caller defines the onload function, it will exist by now
      setTimeout(this.initialize.bind(this), 1);
    } else {
      // Document not yet loaded, we'll add an event listener to call when it does
      window.addEventListener('DOMContentLoaded', this.initialize.bind(this));
    }

    this.attachListeners();
  }

  async initialize() {
    const manifestLinkElem = document.querySelector('link[rel="manifest"]') as
      | HTMLLinkElement
      | undefined;
    if (!manifestLinkElem) return;

    try {
      const manifestRequest = await fetch(manifestLinkElem.href);
      const manifest = await manifestRequest.json();

      manifest.actions = manifest.actions.map((action: AppletAction) => {
        // If the parameters object is empty, remove it
        // This prevents common errors where devs check for action.parameters truthiness
        if (action.parameters && !Object.keys(action.parameters).length) {
          action.parameters = undefined;
        }
        return action;
      });

      this.#manifest = manifest;
      this.actions = manifest.actions ?? [];
    } catch (e) {
      return;
    }

    // Tell the host we're ready
    const readyMessage: AppletReadyMessage = {
      id: crypto.randomUUID(),
      type: 'ready',
      manifest: this.#manifest,
    };
    this.#transport.send(readyMessage);

    // Emit a local ready event
    const readyEvent = new AppletReadyEvent();
    this.dispatchEvent(readyEvent);
    if (typeof this.onready === 'function') this.onready(readyEvent);

    this.createResizeObserver();
  }

  createResizeObserver() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const resizeMessage: AppletResizeMessage = {
          id: crypto.randomUUID(),
          type: 'resize',
          dimensions: {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          },
        };
        this.#transport.send(resizeMessage);
      }
    });
    resizeObserver.observe(document.querySelector('html')!);
  }

  attachListeners() {
    this.#transport.on('data', (message: AppletDataMessage) => {
      this.setData(message.data);
    });

    this.#transport.on('action', async (message: AppletActionMessage) => {
      if (Object.keys(this.#actionHandlers).includes(message.actionId)) {
        await this.#actionHandlers[message.actionId](message.arguments);
      }
    });
  }

  setActionHandler<T>(actionId: string, handler: ActionHandler<T>) {
    this.#actionHandlers[actionId] = handler;
  }

  defineAction<T>(actionId: string, definition: ActionDefinition<T>) {
    const { handler, ...properties } = definition;

    this.actions = {
      ...this.actions,
      [actionId]: properties,
    };

    this.setActionHandler(actionId, handler);
  }

  set actions(actions: AppletActionMap) {
    if (!actions) return;

    const actionsMessage: AppletActionsMessage = {
      id: crypto.randomUUID(),
      type: 'actions',
      actions: this.actions,
    };

    this.#transport.send(actionsMessage);
  }

  get actions(): AppletActionMap {
    return this.#actions;
  }

  get manifest(): AppletManifest {
    return this.#manifest;
  }

  get actionHandlers(): ActionHandlerMap {
    return this.#actionHandlers;
  }

  set data(data: any) {
    this.setData(data);
  }

  get data() {
    return this.#data;
  }

  async setData(data: any) {
    const dataMessage: AppletDataMessage = {
      id: crypto.randomUUID(),
      type: 'data',
      data,
    };
    await this.#transport.send(dataMessage);
    this.#data = data;

    const dataEvent = new AppletDataEvent({ data });
    this.dispatchEvent(dataEvent);
    this.ondata(dataEvent);
  }

  onready(event: AppletReadyEvent): void {}
  ondata(event: AppletDataEvent): void {}
}

// For defining an action in JS
interface ActionDefinition<T> extends AppletAction {
  handler?: ActionHandler<T>;
}

export const applet = new AppletScope();
