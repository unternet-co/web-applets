import {
  AppletMessage,
  ActionParams,
  AppletDataMessage,
  AppletDataEvent,
  AppletLoadEvent,
  AppletReadyEvent,
  JSONSchema,
  AppletInitMessage,
  AppletManifest,
  AppletActionsMessage,
  AppletReadyMessage,
  AppletAction,
  AppletMessageRelay,
} from './shared';

export type ActionHandler<T extends ActionParams> = (
  params: T
) => void | Promise<void>;

export type ActionHandlerDict = { [key: string]: ActionHandler<any> };

export class AppletContext extends EventTarget {
  messageRelay: AppletMessageRelay;
  actionHandlers: ActionHandlerDict = {};
  manifest: AppletManifest;
  #actions: { [key: string]: AppletAction } = {};
  #data: any;

  constructor() {
    super();
    this.connect();
  }

  connect() {
    this.messageRelay = new AppletMessageRelay(window.parent);
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
      this.manifest = manifest;
      this.actions = manifest.actions ?? [];
    } catch (e) {
      return;
    }

    // Call the onload function
    const loadEvent = new AppletLoadEvent();
    this.dispatchEvent(loadEvent);
    if (typeof this.onload === 'function') await this.onload(loadEvent);

    // Tell the host we're ready
    this.messageRelay.send(new AppletReadyMessage());

    // Emit a local ready event
    const readyEvent = new AppletReadyEvent();
    this.dispatchEvent(readyEvent);
    if (typeof this.onready === 'function') this.onready(readyEvent);

    this.createResizeObserver();
  }

  createResizeObserver() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const message = new AppletMessage('resize', {
          dimensions: {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          },
        });
        this.messageRelay.send(message);
      }
    });
    resizeObserver.observe(document.querySelector('html')!);
  }

  attachListeners() {
    this.messageRelay.on('init', (message: AppletInitMessage) => {
      this.manifest = message.manifest;
      this.actions = this.manifest?.actions || [];
    });

    this.messageRelay.on('data', (message: AppletDataMessage) => {
      this.setData(message.data);
    });

    this.messageRelay.on('action', async (message: AppletMessage) => {
      if (Object.keys(this.actionHandlers).includes(message.actionId)) {
        await this.actionHandlers[message.actionId](message.params);
      }
    });
  }

  setActionHandler<T = ActionParams>(
    actionId: string,
    handler: ActionHandler<T>
  ) {
    this.actionHandlers[actionId] = handler;
  }

  defineAction<T = ActionParams>(
    actionId: string,
    definition: ActionDefinition<T>
  ) {
    const { handler, ...properties } = definition;

    this.actions = [
      ...this.actions,
      {
        id: actionId,
        ...properties,
      },
    ];

    this.setActionHandler(actionId, handler);
  }

  set actions(actions: AppletAction[]) {
    if (!actions) return;
    for (let action of actions) {
      this.#actions[action.id] = action;
    }
    this.messageRelay.send(new AppletActionsMessage({ actions: this.actions }));
  }

  get actions(): AppletAction[] {
    return Object.values(this.#actions);
  }

  set data(data: any) {
    this.setData(data);
  }

  get data() {
    return this.#data;
  }

  async setData(data: any) {
    const dataMessage = new AppletMessage('data', { data });
    await this.messageRelay.send(dataMessage);
    this.#data = data;

    const dataEvent = new AppletDataEvent({ data });
    this.dispatchEvent(dataEvent);
    this.ondata(dataEvent);
  }

  onload(event: AppletLoadEvent): Promise<void> | void {}
  onready(event: AppletReadyEvent): void {}
  ondata(event: AppletDataEvent): void {}
}

// For defining an action in JS
interface ActionDefinition<T> extends Omit<AppletAction, 'id'> {
  parameters?: JSONSchema;
  handler?: ActionHandler<T>;
}

export function getContext() {
  return new AppletContext();
}
