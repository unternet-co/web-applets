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
} from './shared';
import { parseUrl } from '../lib/utils';

// Container for initializing applets without an explicit container
const hiddenContainer = document.createElement('iframe');
hiddenContainer.style.display = 'none';
document.body.appendChild(hiddenContainer);

// Options for loading an applet
interface LoadOpts {
  unsafe?: boolean;
}
const defaultOpts: LoadOpts = {
  unsafe: false,
};

// Load an applet object from a URL
export async function load(
  url: string,
  container?: HTMLIFrameElement,
  opts?: LoadOpts
): Promise<Applet> {
  const _opts = Object.assign(defaultOpts, opts ?? {});
  if (!container) container = hiddenContainer;

  url = parseUrl(url);
  const manifest = await loadManifest(`${url}`);

  // If unsafe enabled, allow same origin sandbox
  // This is required for e.g. YouTube embeds
  if (_opts.unsafe && manifest.unsafe) {
    container.setAttribute(
      'sandbox',
      'allow-scripts allow-forms allow-same-origin'
    );
  } else {
    container.setAttribute('sandbox', 'allow-scripts allow-forms');
  }

  // Load the applet
  const applet = new Applet({
    manifest,
    container,
  });

  return new Promise((resolve) => {
    applet.messageRelay.on('ready', () => {
      resolve(applet);
    });
  });
}

export interface AppletOptions {
  manifest: AppletManifest;
  container: HTMLIFrameElement;
}
export class Applet<T = any> extends EventTarget {
  messageRelay: AppletMessageRelay;
  url: string;
  actions: AppletAction[] = [];
  container: HTMLIFrameElement;
  #manifest: AppletManifest;
  type = 'host';
  #data: T;

  constructor(options: AppletOptions) {
    super();
    this.container = options.container;
    this.container.src = options.manifest.start_url;
    this.messageRelay = new AppletMessageRelay(this.container.contentWindow);
    this.#manifest = options.manifest;
    this.initializeListeners();

    this.messageRelay.on('ready', () => {
      this.messageRelay.send(
        new AppletInitMessage({ manifest: options.manifest })
      );
    });
  }

  initializeListeners() {
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

  onresize(event: AppletResizeEvent) {}
  onactions(event: AppletActionsEvent) {}
  ondata(event: AppletDataEvent) {}

  disconnect() {
    this.container.src = 'about:blank';
  }

  async dispatchAction(actionId: string, params: ActionParams) {
    const actionMessage = new AppletMessage('action', {
      actionId,
      params,
    });
    return await this.messageRelay.send(actionMessage);
  }
}

// Loads a manifest and parses the JSON
async function loadManifest(baseUrl: string): Promise<AppletManifest> {
  baseUrl = parseUrl(baseUrl);

  let manifest: AppletManifest;
  try {
    const request = await fetch(`${baseUrl}/manifest.json`);
    manifest = await request.json();
    // TODO: Add verification this is a valid manifest
  } catch (e) {
    console.error(e.message);
  }

  manifest.start_url = manifest.start_url
    ? parseUrl(manifest.start_url, baseUrl)
    : baseUrl;

  return manifest;
}
