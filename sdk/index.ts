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

export async function getAppletsList(url: string) {
  url = parseUrl(url);
  try {
    const request = await fetch(`${url}/manifest.json`);
    const appManifest = await request.json();
    return appManifest.applets ? appManifest.applets : [];
  } catch {
    return [];
  }
}

export async function loadAppletManifest(url: string): Promise<AppletManifest> {
  url = parseUrl(url);
  const request = await fetch(`${url}/manifest.json`);
  const appletManifest = await request.json();

  if (appletManifest.type !== 'applet') {
    throw new Error("URL doesn't point to a valid applet manifest.");
  }

  appletManifest.entrypoint = parseUrl(appletManifest.entrypoint, url);
  return appletManifest;
}

export interface AppletManifest {
  type: 'applet';
  name: string;
  description: string;
  icon?: string;
  entrypoint: string;
}

export interface AppletAction {
  id: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
}

export class AppletMessage {
  type: string;
  detail: unknown;
  timestamp: number;

  constructor(type, detail) {
    this.type = type;
    this.detail = detail;
    this.timestamp = Date.now();
  }
}
