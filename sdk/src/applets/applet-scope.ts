import { AppletActionDescriptor } from './actions';
import { debug } from '../debug';
import { AppletEvent } from './events';
import {
  AppletActionMessage,
  AppletActionsMessage,
  AppletDataMessage,
  AppletMessage,
  AppletRegisterMessage,
  AppletResizeMessage,
  AppletActionErrorMessage,
  AppletActionCompleteMessage,
  AppletConnectMessage,
} from '../messages';
import { AppletManifest, dispatchEventAndHandler } from '../utils';

export class AppletScope<DataType = any> extends EventTarget {
  #actionHandlers: { [key: string]: Function } = {};
  #manifest: AppletManifest;
  #actions: { [key: string]: AppletActionDescriptor };
  #data: DataType;
  #dispatchEventAndHandler: typeof dispatchEventAndHandler;
  #postMessage: MessagePort['postMessage'];
  #width: number;
  #height: number;

  onconnect: (event: AppletEvent) => void;
  onactions: (event: AppletEvent) => void;
  ondata: (event: AppletEvent) => void;

  constructor(manifest?: AppletManifest | undefined) {
    super();
    debug.log('AppletScope', 'Constructor called');
    this.#dispatchEventAndHandler = dispatchEventAndHandler.bind(this);
    if (manifest) this.#manifest = manifest;

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

    const registerMessage: AppletConnectMessage = {
      type: 'appletconnect',
    };
    window.parent.postMessage(registerMessage, '*');
    debug.log('AppletScope', 'Send message', registerMessage);
  }

  async #initialize() {
    const manifest = this.manifest ?? (await this.#loadManifest());
    this.#manifest = manifest || {};
    this.#actions = this.#actions || manifest?.actions || {};

    // Register the applet
    const registerMessage: AppletRegisterMessage = {
      type: 'register',
      manifest: this.#manifest,
      actions: this.#actions,
      data: this.#data,
    };
    this.#postMessage(registerMessage);
    debug.log('AppletScope', 'Send message', registerMessage);

    const connectEvent = new AppletEvent('connect');
    this.#dispatchEventAndHandler(connectEvent);

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
      for (let entry of entries)
        this.#handleResize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
    });
    resizeObserver.observe(document.querySelector('html')!);
  }

  #handleResize({ width, height }: { width: number; height: number }) {
    this.#width = width;
    this.#height = height;
    const resizeMessage: AppletResizeMessage = {
      type: 'resize',
      width,
      height,
    };
    debug.log('AppletScope', 'Send message', resizeMessage);
    this.#postMessage(resizeMessage);
  }

  async #loadManifest(): Promise<AppletManifest | undefined> {
    const manifestLinkElem = document.querySelector('link[rel="manifest"]') as
      | HTMLLinkElement
      | undefined;
    if (!manifestLinkElem) return;

    // TODO: Add timeout
    try {
      const manifestRequest = await fetch(manifestLinkElem.href);
      const manifest = (await manifestRequest.json()) as AppletManifest;
      for (const key in manifest.actions) {
        const action = manifest.actions[key];
        if (action.params_schema && !Object.keys(action.params_schema).length) {
          action.params_schema = undefined;
        }
      }
      return manifest;
    } catch (e) {
      return;
    }
  }

  setActionHandler<T = any>(actionId: string, handler: Function) {
    this.#actionHandlers[actionId] = handler;
  }

  defineAction(actionId: string, definition: AppletActionDescriptor) {
    this.actions = {
      ...this.actions,
      [actionId]: definition,
    };
  }

  set actions(actions: { [id: string]: AppletActionDescriptor }) {
    if (!actions) return;
    this.#actions = actions;

    const actionsMessage: AppletActionsMessage = {
      type: 'actions',
      actions: this.#actions,
    };

    debug.log('AppletScope', 'Send message', actionsMessage);
    this.#postMessage && this.#postMessage(actionsMessage);

    const dataEvent = new AppletEvent('actions', { actions });
    this.#dispatchEventAndHandler(dataEvent);
  }

  get actions(): { [id: string]: AppletActionDescriptor } {
    return this.#actions;
  }

  get manifest(): AppletManifest {
    return this.#manifest;
  }

  get actionHandlers(): { [id: string]: Function } {
    return this.#actionHandlers;
  }

  set actionHandlers(handlers: { [id: string]: Function }) {
    this.#actionHandlers = handlers;
  }

  set data(data: DataType) {
    this.#data = data;

    const dataMessage: AppletDataMessage<DataType> = {
      type: 'data',
      data,
    };
    debug.log('AppletScope', 'Send message', dataMessage);
    this.#postMessage && this.#postMessage(dataMessage);

    const dataEvent = new AppletEvent('data', { data });
    this.#dispatchEventAndHandler(dataEvent);
  }

  get data(): DataType {
    return this.#data;
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }
}
