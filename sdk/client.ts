import { ActionParams } from './context';
import { AppletAction, type AppletManifest } from './types';

export async function getHeaders(url: string) {
  url = parseUrl(url);
  try {
    const request = await fetch(`${url}/manifest.json`);
    const appManifest = await request.json();
    return appManifest.applets ? appManifest.applets : [];
  } catch {
    return [];
  }
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

  return new Promise((resolve) => {
    window.addEventListener('message', (message) => {
      if (message.source !== container.contentWindow) return;
      if (message.data.type === 'ready') resolve(applet);
    });
  });
}

export class Applet extends EventTarget {
  actions: AppletAction[] = [];
  manifest: AppletManifest;
  // containerStyle: CSSStyleDeclaration;
  // #styleOverrides: (string | symbol)[] = [];
  #container: HTMLIFrameElement;

  constructor() {
    super();
    window.addEventListener('message', (message) => {
      if (message.source !== this.#container.contentWindow) return;
      if (message.data.type === 'state') {
        this.dispatchEvent(
          new CustomEvent('stateupdated', { detail: message.data.detail })
        );
        this.onstateupdated(message.data.detail);
      }
      if (message.data.type === 'resize') {
        this.resizeContainer(message.data.detail);
      }
    });
  }

  resizeContainer(dimensions) {
    this.#container.style.height = `${dimensions.height}px`;
    // if (!this.#styleOverrides) {
    //   this.#container.style.height = `${dimensions.height}px`;
    // }
  }

  set container(container: HTMLIFrameElement) {
    // container.style.border = 'none';
    container.style.height = '0px';
    this.#container = container;
    // this.containerStyle = new Proxy(container.style, {
    //   set: (target, property, value) => {
    //     this.#styleOverrides.push(property);
    //     return Reflect.set(target, property, value);
    //   },
    //   deleteProperty: (target, property) => {
    //     this.#styleOverrides.splice()
    //     return Reflect.deleteProperty(target, property);
    //   }
    // });
  }

  get container() {
    return this.#container;
  }

  onstateupdated(event: CustomEvent) {}
  disconnect() {}
  dispatchAction(actionId: string, params: ActionParams) {
    // TODO: Make async, with each action requiring a reply
    this.#container.contentWindow?.postMessage({
      type: 'action',
      detail: {
        actionId,
        params,
      },
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
