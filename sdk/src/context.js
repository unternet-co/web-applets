"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appletContext = exports.AppletContext = void 0;
const types_1 = require("./types");
/**
 * Context
 */
class AppletContext extends EventTarget {
    constructor() {
        super(...arguments);
        this.actionHandlers = {};
    }
    connect() {
        this.client = new AppletClient();
        const startup = async () => {
            await this.onload();
            this.client.send(new types_1.AppletMessage('ready'));
            this.dispatchEvent(new CustomEvent('ready'));
            await this.onready();
        };
        if (document.readyState === 'complete' ||
            document.readyState === 'interactive') {
            setTimeout(startup, 1);
        }
        else {
            window.addEventListener('DOMContentLoaded', startup);
        }
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const message = new types_1.AppletMessage('resize', {
                    dimensions: {
                        width: entry.contentRect.width,
                        height: entry.contentRect.height,
                    },
                });
                this.client.send(message);
            }
        });
        resizeObserver.observe(document.querySelector('html'));
        this.client.on('state', (message) => {
            if (!isStateMessage(message)) {
                throw new TypeError("Message doesn't match type StateMessage");
            }
            this.setState(message.state);
        });
        this.client.on('action', async (message) => {
            if (!isActionMessage(message)) {
                throw new TypeError("Message doesn't match type AppletMessage.");
            }
            if (Object.keys(this.actionHandlers).includes(message.actionId)) {
                await this.actionHandlers[message.actionId](message.params);
            }
            message.resolve();
        });
        return this;
    }
    setActionHandler(actionId, handler) {
        this.actionHandlers[actionId] = handler;
    }
    async setState(state) {
        const message = new types_1.AppletMessage('state', { state });
        await this.client.send(message);
        this.state = state;
        this.dispatchEvent(new CustomEvent('render'));
        this.onrender(); // TODO: Should come from client? Or stay here, and only activate if mounted? Need a control for mounting.
    }
    onload() { }
    onready() { }
    onrender() { }
}
exports.AppletContext = AppletContext;
function isActionMessage(message) {
    return message.type === 'action';
}
function isStateMessage(message) {
    return message.type === 'state';
}
/**
 * Client
 */
class AppletClient {
    on(messageType, callback) {
        window.addEventListener('message', (messageEvent) => {
            if (messageEvent.data.type !== messageType)
                return;
            const message = new types_1.AppletMessage(messageEvent.data.type, messageEvent.data);
            message.resolve = () => {
                window.parent.postMessage(new types_1.AppletMessage('resolve', { id: message.id }), '*');
            };
            callback(message);
        });
    }
    send(message) {
        window.parent.postMessage(message.toJson(), '*');
        return new Promise((resolve) => {
            const listener = (messageEvent) => {
                if (messageEvent.data.type === 'resolve' &&
                    messageEvent.data.id === message.id) {
                    window.removeEventListener('message', listener);
                    resolve();
                }
            };
            window.addEventListener('message', listener);
        });
    }
}
exports.appletContext = new AppletContext();
