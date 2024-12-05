import { parseUrl } from '../utils';
import {
  AppletAction,
  AppletMessage,
  ActionParams,
  AppletManifest,
  AppletDataMessage,
  AppletInitMessage,
  AppletResizeMessage,
  AppletDataEvent,
  AppletResizeEvent,
  AppletActionsMessage,
  AppletActionsEvent,
  AppletMessageRelay,
  loadManifest,
  AppletReadyMessage,
  AppletReadyEvent,
  AppletActionMessage,
} from './shared';

// Container for initializing applets without an explicit container
const hiddenContainer = document.createElement('iframe');
hiddenContainer.style.display = 'none';
document.body.appendChild(hiddenContainer);

// Options for loading an applet
// interface LoadOpts {
//   unsafe?: boolean;
// }
// const defaultOpts: LoadOpts = {
//   unsafe: false,
// };

// Load an applet object from a URL
export async function load(
  url: string,
  container?: HTMLIFrameElement
  // opts?: LoadOpts
): Promise<Applet> {
  if (!container) container = hiddenContainer;

  url = parseUrl(url);
  const manifest = await loadManifest(url);

  // If unsafe enabled, allow same origin sandbox
  // This is required for e.g. YouTube embeds
  //   const _opts = Object.assign(defaultOpts, opts ?? {});
  // if (_opts.unsafe && manifest.unsafe) {
  //   container.setAttribute(
  //     'sandbox',
  //     'allow-scripts allow-forms allow-same-origin'
  //   );
  // } else {
  //   container.setAttribute('sandbox', 'allow-scripts allow-forms');
  // }

  container.setAttribute('sandbox', 'allow-scripts allow-forms');
  container.src = url;

  const applet = new Applet(manifest, container.contentWindow);

  return new Promise((resolve) => {
    applet.onready = () => resolve(applet);
  });
}

export interface AppletOptions {
  manifest: AppletManifest;
  container: HTMLIFrameElement;
}
export class Applet<T = any> extends EventTarget {
  messageRelay: AppletMessageRelay;
  actions: AppletAction[] = [];
  container: HTMLIFrameElement;
  #manifest: AppletManifest;
  #data: T;

  constructor(manifest: AppletManifest, targetWindow: Window) {
    super();
    this.messageRelay = new AppletMessageRelay(targetWindow);

    this.#manifest = manifest;
    this.#addListeners();

    this.messageRelay.on('ready', () => {
      this.messageRelay.send(new AppletInitMessage());
    });
  }

  #addListeners() {
    this.messageRelay.on('ready', (message: AppletReadyMessage) => {
      const readyEvent = new AppletReadyEvent();
      if (typeof this.onready === 'function') this.onready(readyEvent);
      this.dispatchEvent(readyEvent);
    });

    this.messageRelay.on('data', (message: AppletDataMessage) => {
      this.#data = message.data;
      const dataEvent = new AppletDataEvent({ data: message.data });
      if (typeof this.ondata === 'function') this.ondata(dataEvent);
      this.dispatchEvent(dataEvent);
    });

    this.messageRelay.on('resize', (message: AppletResizeMessage) => {
      const resizeEvent = new AppletResizeEvent({
        dimensions: message.dimensions,
      });
      if (typeof this.onresize === 'function') this.onresize(resizeEvent);
      this.dispatchEvent(resizeEvent);
    });

    this.messageRelay.on('actions', (message: AppletActionsMessage) => {
      this.actions = message.actions;
      const actionsEvent = new AppletActionsEvent({ actions: message.actions });
      if (typeof this.onactions === 'function') this.onactions(actionsEvent);
      this.dispatchEvent(actionsEvent);
    });
  }

  async dispatchAction(actionId: string, params?: ActionParams) {
    const actionMessage = new AppletActionMessage({
      actionId,
      params,
    });
    return await this.messageRelay.send(actionMessage);
  }

  get data() {
    return this.#data;
  }

  set data(data: T) {
    this.#data = data;
    this.messageRelay.send(new AppletDataMessage({ data }));
  }

  get manifest() {
    return this.#manifest;
  }

  onready(event: AppletReadyEvent) {}
  onresize(event: AppletResizeEvent) {}
  onactions(event: AppletActionsEvent) {}
  ondata(event: AppletDataEvent) {}
}
