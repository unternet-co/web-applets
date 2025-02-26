import { debug } from '../lib/debug';
import { AppletEvent } from '../events';
import {
  AppletActionMessage,
  AppletActionsMessage,
  AppletDataMessage,
  AppletMessage,
  AppletReadyMessage,
  AppletRegisterMessage,
  AppletResizeMessage,
  AppletActionErrorMessage,
  AppletActionCompleteMessage,
} from '../types/protocol';
import {
  AppletManifest,
  AppletActionHandler,
  AppletActionHandlerMap,
  AppletActionMap,
  AppletActionDefinition,
} from '../types/public';
import { dispatchEventAndHandler } from '../lib/utils';

export class AppletScope<DataType = any> extends EventTarget {
  #actionHandlers: AppletActionHandlerMap = {};
  #manifest: AppletManifest;
  #actions: AppletActionMap;
  #data: DataType;
  #dispatchEventAndHandler: typeof dispatchEventAndHandler;
  #postMessage: MessagePort['postMessage'];

  onmessage: (event: MessageEvent) => void;
  onload: (event: AppletEvent) => void;
  ondata: (event: AppletEvent) => void;

  constructor() {
    super();
    debug.log('AppletScope', 'Constructor called');
    this.#dispatchEventAndHandler = dispatchEventAndHandler.bind(this);

    // Listen for a connect event to set up message port
    const appletConnectListener = (event: MessageEvent) => {
      if (
        event.source === window.parent &&
        event.data.type === 'appletconnect' &&
        event.ports &&
        event.ports.length > 0
      ) {
        debug.log('AppletScope', 'Recieved message', event.data);
        const port = event.ports[0];
        this.#postMessage = port.postMessage.bind(port);
        port.onmessage = this.#handleMessage.bind(this);
        this.removeEventListener('message', appletConnectListener);
        this.#initialize();
      }
    };
    window.addEventListener('message', appletConnectListener);

    const registerMessage: AppletRegisterMessage = {
      type: 'appletregister',
    };
    window.parent.postMessage(registerMessage, '*');
    debug.log('AppletScope', 'Send message', registerMessage);
  }

  async #initialize() {
    const manifest = await this.loadManifest();
    this.#manifest = manifest || {};
    this.#actions = manifest?.actions || {};

    // Tell the host we're ready
    const initMessage: AppletReadyMessage = {
      type: 'initialize',
      manifest: this.#manifest,
    };
    this.#postMessage(initMessage);
    debug.log('AppletScope', 'Send message', initMessage);

    const loadEvent = new AppletEvent('load');
    this.#dispatchEventAndHandler(loadEvent);

    this.#createResizeObserver();
  }

  #handleMessage(messageEvent: MessageEvent) {
    const message = messageEvent.data as AppletMessage;
    debug.log('AppletScope', 'Recieved message', message);

    switch (message.type) {
      case 'data':
        if ('data' in message) this.data = message.data as DataType;
        break;
      case 'action':
        if (
          'type' in message &&
          message.type === 'action' &&
          'id' in message &&
          typeof message.id === 'string' &&
          'actionId' in message &&
          typeof message.actionId == 'string' &&
          'arguments' in message
        ) {
          this.#handleActionMessage(message as AppletActionMessage);
        }
        break;
    }
  }

  async #handleActionMessage(message: AppletActionMessage) {
    if (Object.keys(this.#actionHandlers).includes(message.actionId)) {
      try {
        await this.#actionHandlers[message.actionId](message.arguments);
        const actionCompleteMessage: AppletActionCompleteMessage = {
          type: 'actioncomplete',
          id: message.id,
        };
        this.#postMessage(actionCompleteMessage);
      } catch (e) {
        const actionErrorMessage: AppletActionErrorMessage = {
          type: 'actionerror',
          id: message.id,
          message: `Error executing action handler '${message.actionId}'`,
        };
        this.#postMessage(actionErrorMessage);
        console.error(e);
      }
    }
  }

  #createResizeObserver() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const resizeMessage: AppletResizeMessage = {
          type: 'resize',
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };
        this.#postMessage(resizeMessage);
      }
    });
    resizeObserver.observe(document.querySelector('html')!);
  }

  async loadManifest(): Promise<AppletManifest | undefined> {
    const manifestLinkElem = document.querySelector('link[rel="manifest"]') as
      | HTMLLinkElement
      | undefined;
    if (!manifestLinkElem) return;

    try {
      const manifestRequest = await fetch(manifestLinkElem.href);
      const manifest = (await manifestRequest.json()) as AppletManifest;
      for (const key in manifest.actions) {
        const action = manifest.actions[key];
        if (action.parameters && !Object.keys(action.parameters).length) {
          action.parameters = undefined;
        }
      }
      return manifest;
    } catch (e) {
      return;
    }
  }

  setActionHandler<T = any>(actionId: string, handler: AppletActionHandler<T>) {
    this.#actionHandlers[actionId] = handler;
  }

  defineAction<T = any>(
    actionId: string,
    definition: AppletActionDefinition<T>
  ) {
    const { handler, ...properties } = definition;

    this.actions = {
      ...this.actions,
      [actionId]: properties,
    };

    this.setActionHandler<T>(actionId, handler);
  }

  set actions(actions: AppletActionMap) {
    if (!actions) return;

    const actionsMessage: AppletActionsMessage = {
      type: 'actions',
      actions: this.#actions,
    };

    this.#postMessage(actionsMessage);
  }

  get actions(): AppletActionMap {
    return this.#actions;
  }

  get manifest(): AppletManifest {
    return this.#manifest;
  }

  get actionHandlers(): AppletActionHandlerMap {
    return this.#actionHandlers;
  }

  set data(data: DataType) {
    this.#data = data;

    const dataMessage: AppletDataMessage<DataType> = {
      type: 'data',
      data,
    };
    this.#postMessage(dataMessage);

    const dataEvent = new AppletEvent('data', { data });
    this.#dispatchEventAndHandler(dataEvent);
  }

  get data(): DataType {
    return this.#data;
  }
}
