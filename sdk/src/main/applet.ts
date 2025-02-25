import { RESPONSE_MESSAGE_TIMEOUT } from '../constants';
import { dispatchEventAndHandler } from '../utils';
import {
  AppletActionsEvent,
  AppletDataEvent,
  AppletReadyEvent,
  AppletResizeEvent,
} from '../events';
import {
  AppletActionMap,
  AppletActionMessage,
  AppletConnectMessage,
  AppletDataMessage,
  AppletManifest,
  AppletMessage,
} from '../types';
import { debug } from '../debug';

export class Applet<DataType = any> extends EventTarget {
  #window: Window;
  #actions: AppletActionMap = {};
  #manifest: AppletManifest;
  #data: DataType;
  #dispatchEventAndHandler: typeof dispatchEventAndHandler;
  #messagePort: MessagePort;
  postMessage: MessagePort['postMessage'];

  constructor(targetWindow: Window) {
    super();
    this.#window = targetWindow;
    this.#dispatchEventAndHandler = dispatchEventAndHandler.bind(this);

    // Set up message port
    this.#createMessageChannel();

    // In case the window hasn't loaded, wait for load then
    const registerListener = (messageEvent: MessageEvent) => {
      if (
        messageEvent.source === this.#window &&
        'type' in messageEvent.data &&
        messageEvent.data.type === 'appletregister'
      ) {
        debug.log('Applet', 'Recieved message', messageEvent.data);
        this.#createMessageChannel();
        this.removeEventListener('message', registerListener);
      }
    };
    window.addEventListener('message', registerListener);
  }

  #createMessageChannel() {
    const messageChannel = new MessageChannel();
    const connectMessage: AppletConnectMessage = {
      type: 'appletconnect',
    };
    debug.log('Applet', 'Send message', connectMessage);
    this.#messagePort = messageChannel.port1;
    // this.#messagePort.onmessage = () => console.log('messaga!!!');
    this.#messagePort.onmessage = this.#handleMessage.bind(this);
    this.#window.postMessage(connectMessage, '*', [messageChannel.port2]);
    this.postMessage = this.#messagePort.postMessage.bind(this.#messagePort);
  }

  #handleMessage(messageEvent: MessageEvent) {
    const message = messageEvent.data;
    debug.log('Applet', 'Recieved message', message);

    switch (message.type) {
      case 'ready':
        this.#manifest = message.manifest;
        this.#actions = message.manifest.actions;
        const readyEvent = new AppletReadyEvent();
        this.#dispatchEventAndHandler(readyEvent);
        break;
      case 'data':
        this.#data = message.data;
        const dataEvent = new AppletDataEvent({ data: message.data });
        this.#dispatchEventAndHandler(dataEvent);
        break;
      case 'resize':
        const resizeEvent = new AppletResizeEvent({
          dimensions: message.dimensions,
        });
        this.#dispatchEventAndHandler(resizeEvent);
        break;
      case 'actions':
        this.#actions = message.actions;
        const actionsEvent = new AppletActionsEvent({
          actions: message.actions,
        });
        this.#dispatchEventAndHandler(actionsEvent);
        break;
    }
  }

  async sendAction(actionId: string, args: any): Promise<void> {
    const actionMessage: AppletActionMessage = {
      id: crypto.randomUUID(),
      type: 'action',
      actionId,
      arguments: args,
    };

    return new Promise((resolve, reject) => {
      this.postMessage(actionMessage);

      const timeout = setTimeout(reject, RESPONSE_MESSAGE_TIMEOUT);

      const callback = (messageEvent: MessageEvent) => {
        const message = messageEvent.data as AppletMessage;
        if (
          message.type === 'actioncomplete' &&
          'id' in message &&
          message.id === actionMessage.id
        ) {
          resolve();
          this.#messagePort.removeEventListener('message', callback);
          clearTimeout(timeout);
        }
      };

      this.#messagePort.addEventListener('message', callback);
    });
  }

  get data() {
    return this.#data;
  }

  set data(data: DataType) {
    this.#data = data;
    const dataMessage: AppletDataMessage<DataType> = {
      type: 'data',
      data,
    };
    this.postMessage(dataMessage);
  }

  get window() {
    return this.#window;
  }

  // TODO: Allow set for this.window, which re-attaches the applet

  get manifest() {
    return this.#manifest;
  }

  get actions() {
    return this.#actions;
  }

  onready(event: AppletReadyEvent) {}
  onresize(event: AppletResizeEvent) {}
  onactions(event: AppletActionsEvent) {}
  ondata(event: AppletDataEvent) {}
}
