import { AppletActionDescriptor } from './actions.js';
import { debug } from '../debug.js';
import { AppletEvent } from './events.js';
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
} from '../messages.js';
import { AppletManifest, dispatchEventAndHandler } from '../utils.js';
import { isEmpty } from '../utils.js';

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

  constructor(manifest?: Object | undefined) {
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

    const connectMessage: AppletConnectMessage = {
      type: 'appletconnect',
    };
    window.parent.postMessage(connectMessage, '*');
    debug.log('AppletScope', 'Send message', connectMessage);
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
    const { actionId, arguments: args, id } = message;
    if (Object.keys(this.#actionHandlers).includes(actionId)) {
      try {
        const result = await this.#actionHandlers[actionId](args);
        const actionCompleteMessage: AppletActionCompleteMessage<unknown> = {
          type: 'actioncomplete',
          id,
          result
        };
        this.#postMessage(actionCompleteMessage);
      } catch (e) {
        const actionErrorMessage: AppletActionErrorMessage = {
          type: 'actionerror',
          id,
          message: e.message,
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
    if (!manifestLinkElem) {
      console.warn('No manifest link found');
      return;
    }

    try {
      const manifestRequest = await fetch(manifestLinkElem.href);
      const manifest = (await manifestRequest.json()) as AppletManifest;
      for (const key in manifest.actions) {
        const action = manifest.actions[key];
        if (action.params_schema && isEmpty(action.params_schema)) {
          action.params_schema = undefined;
        }
      }
      return manifest;
    } catch (e) {
      console.warn('Failed to fetch manifest', e.message);
    }
  }

  setActionHandler<T = any>(actionId: string, handler: Function) {
    this.#actionHandlers[actionId] = handler;
  }

  defineAction(
    actionId: string,
    definition: AppletActionDescriptor & { handler?: Function }
  ) {
    const { handler, ...actionDefinition } = definition;
    if (handler) this.#actionHandlers[actionId] = handler;
    this.actions = {
      ...this.actions,
      [actionId]: actionDefinition,
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

    // Set a timeout, so if data is set and a listener attached immediately after
    // the listener will still fire
    const dataEvent = new AppletEvent('actions', { actions });
    setTimeout(() => this.#dispatchEventAndHandler(dataEvent), 1);
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

    // Set a timeout, so if data is set and a listener attached immediately after
    // the listener will still fire
    const dataEvent = new AppletEvent('data', { data });
    setTimeout(() => this.#dispatchEventAndHandler(dataEvent), 1);
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
