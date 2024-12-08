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

// Creates an OpenAI-compatible schema declaration for an action
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
