import { type JSONSchema } from './core/shared';
import { AppletAction } from './core/shared';

// Adds http/https to URLs, and prepends with window location if relative
export function parseUrl(url: string, base?: string): string {
  if (!url) return '';

  try {
    // If the base URL is provided, ensure it has a trailing slash for proper path resolution
    if (base) {
      // Don't add trailing slash if the base already ends with a file extension
      if (!base.match(/\.[a-zA-Z0-9]+$/)) {
        base = base.endsWith('/') ? base : base + '/';
      }
    }

    // Use URL constructor to properly resolve relative paths
    const resolvedUrl = new URL(url, base ?? window.location.href);
    return trimTrailingSlash(resolvedUrl.href);
  } catch (e) {
    // Return original URL if parsing fails
    console.warn('Failed to parse URL:', e);
    return url;
  }
}

function trimTrailingSlash(url: string) {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
}
