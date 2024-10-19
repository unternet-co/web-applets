import {
  AppletAction,
  AppletHeader,
  AppletMessage,
  ActionParams,
  AppletManifest,
  AppletMessageType,
  AppletMessageCallback,
  AppletStateMessage,
  AppletResizeMessage,
  AppletInitMessage,
} from './types';

const hiddenContainer = document.createElement('iframe');
hiddenContainer.style.display = 'none';
document.body.appendChild(hiddenContainer);

export async function list(
  url: string
): Promise<{ [key: string]: AppletManifest }> {
  url = parseUrl(url);

  try {
    const request = await fetch(`${url}/manifest.json`);
    const appManifest = await request.json();
    const appletUrls = appManifest.applets as string[];
    const manifests = {};

    const manifestRequests = appletUrls.map(async (appletUrl) => {
      appletUrl = parseUrl(appletUrl, url);
      const request = await fetch(`${appletUrl}/manifest.json`);
      const manifest = await request.json();
      manifests[appletUrl] = manifest;
    });

    await Promise.all(manifestRequests);
    return manifests;
  } catch {
    return {};
  }
}

interface AppletOpts {
  headless?: boolean;
  unsafe?: boolean;
}

const defaultOpts = {
  headless: false,
  unsafe: false,
};

export async function load(
  url: string,
  container?: HTMLIFrameElement,
  opts?: AppletOpts
): Promise<Applet> {
  const _opts = Object.assign(defaultOpts, opts ?? {});

  if (!container) {
    container = hiddenContainer;
    _opts.headless = true;
  }
  if (!_opts.unsafe) container.setAttribute('sandbox', 'allow-scripts');

  url = parseUrl(url);
  const manifest = await loadManifest(`${url}`);
  const applet = new Applet();
  applet.manifest = manifest;
  applet.actions = manifest.actions;
  applet.container = container;
  container.src = applet.manifest.entrypoint;

  return new Promise((resolve) => {
    applet.on('ready', () => {
      const initMessage = new AppletMessage('init', {
        headless: _opts.headless,
      }) as AppletInitMessage;
      applet.send(initMessage);
      resolve(applet);
    });
  });
}

export class Applet<T = unknown> extends EventTarget {
  actions: AppletAction[] = [];
  manifest: AppletManifest;
  container: HTMLIFrameElement;
  #state: T;

  constructor() {
    super();

    this.on('state', (message: AppletStateMessage) => {
      this.#state = message.state;
      this.#dispatchEvent('stateupdated', message.state);
    });

    this.on('resize', (message: AppletResizeMessage) => {
      this.resizeContainer(message.dimensions);
    });
  }

  get state() {
    return this.#state;
  }

  set state(state: T) {
    this.#state = state;
    this.send(new AppletMessage('state', { state }));
  }

  toJson() {
    return Object.fromEntries(
      Object.entries(this).filter(([_, value]) => {
        try {
          JSON.stringify(value);
          return true;
        } catch {
          return false;
        }
      })
    );
  }

  resizeContainer(dimensions: { height: number; width: number }) {
    this.container.style.height = `${dimensions.height + 2}px`;
    // if (!this.#styleOverrides) {
    //   this.#container.style.height = `${dimensions.height}px`;
    // }
  }

  onstateupdated(event: CustomEvent) {}
  disconnect() {}

  async dispatchAction(actionId: string, params: ActionParams) {
    const requestMessage = new AppletMessage('action', {
      actionId,
      params,
    });
    return await this.send(requestMessage);
  }

  async send(message: AppletMessage) {
    this.container.contentWindow?.postMessage(message.toJson(), '*');

    return new Promise<AppletMessage>((resolve) => {
      const listener = (messageEvent: MessageEvent) => {
        const responseMessage = new AppletMessage(
          messageEvent.data.type,
          messageEvent.data
        );

        if (
          responseMessage.type === 'resolve' &&
          responseMessage.id === message.id
        ) {
          window.removeEventListener('message', listener);
          resolve(responseMessage);
        }
      };

      window.addEventListener('message', listener);
    });
  }

  async on(messageType: AppletMessageType, callback: AppletMessageCallback) {
    const listener = async (messageEvent: MessageEvent<AppletMessage>) => {
      if (messageEvent.source !== this.container.contentWindow) return;
      if (messageEvent.data.type !== messageType) return;

      const message = new AppletMessage(
        messageEvent.data.type,
        messageEvent.data
      );

      await callback(message);
      this.container.contentWindow?.postMessage(
        new AppletMessage('resolve', { id: message.id }),
        '*'
      );
    };

    window.addEventListener('message', listener);
  }

  #dispatchEvent(id: string, detail: any) {
    if (typeof this[`on${id}`] === 'function') {
      this[`on${id}`](detail);
    }
    this.dispatchEvent(new CustomEvent(id, { detail }));
  }
}

/* Helpers */

function parseUrl(url: string, base?: string) {
  if (['http', 'https'].includes(url.split('://')[0])) {
    return url;
  }

  let path = url;
  if (path.startsWith('/')) path = path.slice(1);
  if (path.endsWith('/')) path = path.slice(0, -1);
  url = `${base || window.location.origin}/${path}`;

  return url;
}

export async function loadManifest(url: string): Promise<AppletManifest> {
  url = parseUrl(url);
  const request = await fetch(`${url}/manifest.json`);
  const appletManifest = await request.json();

  if (appletManifest.type !== 'applet') {
    throw new Error("URL doesn't point to a valid applet manifest.");
  }

  appletManifest.entrypoint = parseUrl(appletManifest.entrypoint, url);
  return appletManifest;
}

export async function getHeaders(url: string): Promise<AppletHeader[]> {
  url = parseUrl(url);
  try {
    const request = await fetch(`${url}/manifest.json`);
    const appManifest = await request.json();
    const appletHeaders = appManifest.applets as AppletHeader[];
    return appletHeaders ?? [];
  } catch {
    return [];
  }
}

export async function getManifests(url: string) {
  url = parseUrl(url);
  const request = await fetch(`${url}/manifest.json`);
  const headers = (await request.json()).applets;
  const manifests = await Promise.all(
    headers.map(async (header: any) => {
      const appletUrl = parseUrl(header.url);
      const request = await fetch(`${appletUrl}/manifest.json`);
      return await request.json();
    })
  );
  return manifests ?? [];
}
