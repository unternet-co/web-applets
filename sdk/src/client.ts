import {
  AppletAction,
  AppletHeader,
  AppletMessage,
  ActionParams,
  AppletManifest,
} from './types';

const hiddenRoot = document.createElement('div');
hiddenRoot.style.display = 'none';
document.body.appendChild(hiddenRoot);

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

export async function load(
  url: string,
  container: HTMLIFrameElement
): Promise<Applet> {
  url = parseUrl(url);
  const manifest = await loadManifest(`${url}`);
  const applet = new Applet();
  applet.manifest = manifest;
  applet.actions = manifest.actions; // let the events set this later
  applet.container = container;
  container.src = applet.manifest.entrypoint;
  if (!container.isConnected) hiddenRoot.appendChild(container);

  return new Promise((resolve) => {
    window.addEventListener('message', (message) => {
      if (message.source !== container.contentWindow) return;
      if (message.data.type === 'ready') resolve(applet);
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
    window.addEventListener('message', (message) => {
      if (message.source !== this.container.contentWindow) return;
      if (message.data.type === 'state') {
        this.#state = message.data.state;
        this.dispatchEvent(
          new CustomEvent('stateupdated', { detail: message.data.detail })
        );
        this.onstateupdated(message.data.state);
      }
      if (message.data.type === 'resize') {
        this.resizeContainer(message.data.dimensions);
      }
      this.container.contentWindow?.postMessage({
        type: 'resolve',
        id: message.data.id,
      });
    });
  }

  get state() {
    return this.#state;
  }

  set state(state: T) {
    this.#state = state;
    const stateMessage = new AppletMessage('state', { state });
    this.container.contentWindow?.postMessage(stateMessage.toJson());
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
    this.container.style.height = `${dimensions.height}px`;
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
    this.container.contentWindow?.postMessage(requestMessage.toJson());

    return new Promise<AppletMessage>((resolve) => {
      const listener = (messageEvent: MessageEvent) => {
        if (messageEvent.source !== this.container.contentWindow) return;
        const responseMessage = new AppletMessage(
          messageEvent.data.type,
          messageEvent.data
        );

        if (
          responseMessage.type === 'resolve' &&
          responseMessage.id === requestMessage.id
        ) {
          this.container.contentWindow?.removeEventListener(
            'message',
            listener
          );
          resolve(responseMessage);
        }
      };
      window.addEventListener('message', listener);
    });
  }
}

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
