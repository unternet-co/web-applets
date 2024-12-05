import { AppletAction } from './core/shared';

// Adds http/https to URLs, and prepends with window location if relative
export function parseUrl(url: string, base?: string) {
  if (url) url = URL.parse(url, base ?? window.location.href).href;
  return trimTrailingSlash(url);
}

function trimTrailingSlash(url: string) {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}

export function createOpenAISchemaForAction(action: AppletAction) {
  return {
    strict: true,
    name: 'action_schema',
    schema: {
      type: 'object',
      required: Object.keys(action),
      properties: {
        id: { type: 'string' },
        params: action.params,
      },
      additionalProperties: false,
    },
  };
}

// export async function loadAppletManifest(url: string): Promise<AppletManifest> {
//   url = parseUrl(url);
//   const request = await fetch(`${url}/manifest.json`);
//   const appletManifest = await request.json();

//   if (appletManifest.type !== 'applet') {
//     throw new Error("URL doesn't point to a valid applet manifest.");
//   }

//   appletManifest.entrypoint = parseUrl(appletManifest.entrypoint, url);
//   return appletManifest;
// }
