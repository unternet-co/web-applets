"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Applet_state;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Applet = void 0;
exports.getHeaders = getHeaders;
exports.getManifests = getManifests;
exports.load = load;
exports.loadManifest = loadManifest;
const types_1 = require("./types");
const hiddenRoot = document.createElement('div');
hiddenRoot.style.display = 'none';
document.body.appendChild(hiddenRoot);
async function getHeaders(url) {
    url = parseUrl(url);
    try {
        const request = await fetch(`${url}/manifest.json`);
        const appManifest = await request.json();
        const appletHeaders = appManifest.applets;
        return appletHeaders !== null && appletHeaders !== void 0 ? appletHeaders : [];
    }
    catch (_a) {
        return [];
    }
}
async function getManifests(url) {
    url = parseUrl(url);
    const request = await fetch(`${url}/manifest.json`);
    const headers = (await request.json()).applets;
    const manifests = await Promise.all(headers.map(async (header) => {
        const appletUrl = parseUrl(header.url);
        const request = await fetch(`${appletUrl}/manifest.json`);
        return await request.json();
    }));
    return manifests !== null && manifests !== void 0 ? manifests : [];
}
async function load(url, container) {
    url = parseUrl(url);
    const manifest = await loadManifest(`${url}`);
    const applet = new Applet();
    applet.manifest = manifest;
    applet.actions = manifest.actions; // let the events set this later
    applet.container = container;
    container.src = applet.manifest.entrypoint;
    if (!container.isConnected)
        hiddenRoot.appendChild(container);
    return new Promise((resolve) => {
        window.addEventListener('message', (message) => {
            if (message.source !== container.contentWindow)
                return;
            if (message.data.type === 'ready')
                resolve(applet);
        });
    });
}
class Applet extends EventTarget {
    constructor() {
        super();
        this.actions = [];
        _Applet_state.set(this, void 0);
        window.addEventListener('message', (message) => {
            var _a;
            if (message.source !== this.container.contentWindow)
                return;
            if (message.data.type === 'state') {
                __classPrivateFieldSet(this, _Applet_state, message.data.state, "f");
                this.dispatchEvent(new CustomEvent('stateupdated', { detail: message.data.detail }));
                this.onstateupdated(message.data.state);
            }
            if (message.data.type === 'resize') {
                this.resizeContainer(message.data.dimensions);
            }
            (_a = this.container.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage({
                type: 'resolve',
                id: message.data.id,
            }, '*');
        });
    }
    get state() {
        return __classPrivateFieldGet(this, _Applet_state, "f");
    }
    set state(state) {
        var _a;
        __classPrivateFieldSet(this, _Applet_state, state, "f");
        const stateMessage = new types_1.AppletMessage('state', { state });
        (_a = this.container.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(stateMessage.toJson(), '*');
    }
    toJson() {
        return Object.fromEntries(Object.entries(this).filter(([_, value]) => {
            try {
                JSON.stringify(value);
                return true;
            }
            catch (_a) {
                return false;
            }
        }));
    }
    resizeContainer(dimensions) {
        this.container.style.height = `${dimensions.height}px`;
        // if (!this.#styleOverrides) {
        //   this.#container.style.height = `${dimensions.height}px`;
        // }
    }
    onstateupdated(event) { }
    disconnect() { }
    async dispatchAction(actionId, params) {
        var _a;
        const requestMessage = new types_1.AppletMessage('action', {
            actionId,
            params,
        });
        (_a = this.container.contentWindow) === null || _a === void 0 ? void 0 : _a.postMessage(requestMessage.toJson(), '*');
        return new Promise((resolve) => {
            const listener = (messageEvent) => {
                if (messageEvent.source !== this.container.contentWindow)
                    return;
                const responseMessage = new types_1.AppletMessage(messageEvent.data.type, messageEvent.data);
                if (responseMessage.type === 'resolve' &&
                    responseMessage.id === requestMessage.id) {
                    window.removeEventListener('message', listener);
                    resolve(responseMessage);
                }
            };
            window.addEventListener('message', listener);
        });
    }
}
exports.Applet = Applet;
_Applet_state = new WeakMap();
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
async function loadManifest(url) {
    url = parseUrl(url);
    const request = await fetch(`${url}/manifest.json`);
    const appletManifest = await request.json();
    if (appletManifest.type !== 'applet') {
        throw new Error("URL doesn't point to a valid applet manifest.");
    }
    appletManifest.entrypoint = parseUrl(appletManifest.entrypoint, url);
    return appletManifest;
}
