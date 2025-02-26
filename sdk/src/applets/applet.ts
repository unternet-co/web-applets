import { RESPONSE_MESSAGE_TIMEOUT } from '../constants';
import { dispatchEventAndHandler } from '../lib/utils';
import { AppletEvent } from '../events';
import {
  AppletActionErrorMessage,
  AppletActionMessage,
  AppletActionsMessage,
  AppletConnectMessage,
  AppletDataMessage,
  AppletMessage,
  AppletReadyMessage,
  AppletResizeMessage,
} from '../types/protocol';
import { debug } from '../lib/debug';
import { AppletExecutionError } from '../errors';
import { AppletActionMap, AppletManifest } from '../types/public';

export class Applet<DataType = any> extends EventTarget {
  #window: Window;
  #actions: AppletActionMap = {};
  #manifest: AppletManifest;
  #data: DataType;
  #dispatchEventAndHandler: typeof dispatchEventAndHandler;
  #messagePort: MessagePort;
  #postMessage: MessagePort['postMessage'];
  width: number;
  height: number;

  onload: (event: AppletEvent) => void;
  onresize: (event: AppletEvent) => void;
  onactions: (event: AppletEvent) => void;
  ondata: (event: AppletEvent) => void;

  constructor(targetWindow: Window) {
    super();
    debug.log('Applet', 'Constructor called');
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
    if (this.#messagePort) this.#messagePort.close();
    const messageChannel = new MessageChannel();
    const connectMessage: AppletConnectMessage = {
      type: 'appletconnect',
    };
    debug.log('Applet', 'Send message', connectMessage);
    this.#messagePort = messageChannel.port1;
    this.#messagePort.onmessage = this.#handleMessage.bind(this);
    this.#window.postMessage(connectMessage, '*', [messageChannel.port2]);
    this.#postMessage = this.#messagePort.postMessage.bind(this.#messagePort);
  }

  #handleMessage(messageEvent: MessageEvent) {
    const message = messageEvent.data;
    debug.log('Applet', 'Recieved message', message);

    switch (message.type) {
      case 'initialize':
        const readyMessage = message as AppletReadyMessage;
        this.#manifest = readyMessage.manifest;
        this.#actions = readyMessage.manifest.actions;
        const loadEvent = new AppletEvent('load');
        this.#dispatchEventAndHandler(loadEvent);
        break;
      case 'data':
        const dataMessage = message as AppletDataMessage;
        this.#data = dataMessage.data;
        const dataEvent = new AppletEvent('data', { data: message.data });
        this.#dispatchEventAndHandler(dataEvent);
        break;
      case 'resize':
        const resizeMessage = message as AppletResizeMessage;
        this.width = resizeMessage.width;
        this.height = resizeMessage.height;
        const resizeEvent = new AppletEvent('resize');
        this.#dispatchEventAndHandler(resizeEvent);
        break;
      case 'actions':
        const actionsMessage = message as AppletActionsMessage;
        this.#actions = actionsMessage.actions;
        const actionsEvent = new AppletEvent('actions', {
          actions: actionsMessage.actions,
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
      this.#postMessage(actionMessage);

      const timeout = setTimeout(() => {
        reject(
          new AppletExecutionError(
            `Applet action handler failed to complete before timeout (${RESPONSE_MESSAGE_TIMEOUT}ms)`
          )
        );
      }, RESPONSE_MESSAGE_TIMEOUT);

      const callback = (messageEvent: MessageEvent) => {
        const message = messageEvent.data as AppletMessage;
        if (
          ['actionresponse', 'actionerror'].includes(message.type) &&
          'id' in message &&
          message.id === actionMessage.id
        ) {
          this.#messagePort.removeEventListener('message', callback);
          clearTimeout(timeout);

          if (message.type === 'actionerror') {
            const actionErrorMessage = message as AppletActionErrorMessage;
            reject(new AppletExecutionError(actionErrorMessage.message));
          } else {
            resolve();
          }
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
    this.#postMessage(dataMessage);
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
}
