import {
  AppletAction,
  AppletMessage,
  ActionParams,
  AppletManifest,
  AppletDataMessage,
  AppletResizeMessage,
  AppletDataEvent,
  AppletResizeEvent,
} from './shared';
import { AppletMessageChannel } from './shared';
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
async function load(
  url: string,
  container?: HTMLIFrameElement,
  opts?: AppletOpts
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
  const applet = new Applet();
  applet.manifest = manifest;
  applet.availableActions = manifest.actions;
  applet.container = container;
  container.src = applet.manifest.start_url;

  //
  return new Promise((resolve) => {
    applet.on('ready', () => {
      resolve(applet);
    });
  });
}

interface AppletOpts {
  manifest: AppletManifest;
  container: HTMLIFrameElement;
}
class Applet<T = any> extends AppletMessageChannel {
  url: string;
  availableActions: AppletAction[] = [];
  manifest: AppletManifest;
  container: HTMLIFrameElement;
  #data: T;

  constructor() {
    super();
    this.initializeListeners();
  }

  initializeListeners() {
    this.on('data', (message: AppletDataMessage) => {
      this.#data = message.data;
      const dataEvent = new AppletDataEvent({ data: message.data });
      if (typeof this.ondata === 'function') this.ondata(dataEvent);
      this.dispatchEvent(dataEvent);
    });

    this.on('resize', (message: AppletResizeMessage) => {
      const resizeEvent = new AppletResizeEvent({
        dimensions: message.dimensions,
      });
      if (typeof this.onresize === 'function') this.onresize(resizeEvent);
      this.dispatchEvent(resizeEvent);
    });
  }

  get data() {
    return this.#data;
  }

  set data(data: T) {
    this.#data = data;
    this.send(new AppletMessage('data', { data }));
  }

  onresize(event: AppletResizeEvent) {}

  ondata(event: AppletDataEvent) {}

  disconnect() {
    this.container.src = 'about:blank';
  }

  async dispatchAction(actionId: string, params: ActionParams) {
    const actionMessage = new AppletMessage('action', {
      actionId,
      params,
    });
    return await this.send(actionMessage);
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

// Exports

export const applets = {
  load,
};

export { Applet };
