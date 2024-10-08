"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppletsList = getAppletsList;
exports.loadAppletManifest = loadAppletManifest;
function parseUrl(url, base) {
    if (['http', 'https'].includes(url.split('://')[0])) {
        return url;
    }
    let path = url;
    if (path.startsWith('/'))
        path = path.slice(1);
    if (path.endsWith('/'))
        path = path.slice(0, -1);
    url = `${base || window.location.origin}/${path}`;
    return url;
}
async function getAppletsList(url) {
    url = parseUrl(url);
    try {
        const request = await fetch(`${url}/manifest.json`);
        const appManifest = await request.json();
        return appManifest.applets ? appManifest.applets : [];
    }
    catch (_a) {
        return [];
    }
}
async function loadAppletManifest(url) {
    url = parseUrl(url);
    const request = await fetch(`${url}/manifest.json`);
    const appletManifest = await request.json();
    if (appletManifest.type !== 'applet') {
        throw new Error("URL doesn't point to a valid applet manifest.");
    }
    appletManifest.entrypoint = parseUrl(appletManifest.entrypoint, url);
    return appletManifest;
}
