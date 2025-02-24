import {
  AppletManifest,
  AppletDataMessage,
  AppletResizeMessage,
  AppletDataEvent,
  AppletResizeEvent,
  AppletActionsMessage,
  AppletActionsEvent,
  AppletMessageTransport,
  AppletReadyMessage,
  AppletReadyEvent,
  AppletActionMessage,
  AppletActionMap,
} from './shared';

export class Applet<T = any> extends EventTarget {
  #transport: AppletMessageTransport;
  #window: Window;
  #actions: AppletActionMap = {};
  #manifest: AppletManifest;
  #data: T;

  constructor(targetWindow: Window) {
    super();
    this.#transport = new AppletMessageTransport(targetWindow);
    this.#addListeners();
  }

  #addListeners() {
    this.#transport.on('ready', (message: AppletReadyMessage) => {
      this.#manifest = message.manifest;
      this.#actions = message.manifest.actions;
      const readyEvent = new AppletReadyEvent();
      if (typeof this.onready === 'function') this.onready(readyEvent);
      this.dispatchEvent(readyEvent);
    });

    this.#transport.on('data', (message: AppletDataMessage) => {
      this.#data = message.data;
      const dataEvent = new AppletDataEvent({ data: message.data });
      if (typeof this.ondata === 'function') this.ondata(dataEvent);
      this.dispatchEvent(dataEvent);
    });

    this.#transport.on('resize', (message: AppletResizeMessage) => {
      const resizeEvent = new AppletResizeEvent({
        dimensions: message.dimensions,
      });
      if (typeof this.onresize === 'function') this.onresize(resizeEvent);
      this.dispatchEvent(resizeEvent);
    });

    this.#transport.on('actions', (message: AppletActionsMessage) => {
      this.#actions = message.actions;
      const actionsEvent = new AppletActionsEvent({ actions: message.actions });
      if (typeof this.onactions === 'function') this.onactions(actionsEvent);
      this.dispatchEvent(actionsEvent);
    });
  }

  async dispatchAction(actionId: string, args: any) {
    const actionMessage: AppletActionMessage = {
      id: crypto.randomUUID(),
      type: 'action',
      actionId,
      arguments: args,
    };
    return await this.#transport.send(actionMessage);
  }

  get data() {
    return this.#data;
  }

  set data(data: T) {
    this.#data = data;
    const dataMessage: AppletDataMessage = {
      id: crypto.randomUUID(),
      type: 'data',
      data,
    };
    this.#transport.send(dataMessage);
  }

  get window() {
    return this.#window;
  }

  // TODO: Allow setting window, which re-attaches the applet

  get messageRelay() {
    return this.messageRelay;
  }

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
