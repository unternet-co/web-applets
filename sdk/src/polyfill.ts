import { AppletFrameElement, applets } from './index.js';
import './index.js';
import { type AppletFactory } from './applets/applet-factory.js';
import { AppletEvent } from './applets/events.js';

declare global {
  interface Window {
    applets: AppletFactory;
    AppletEvent: typeof AppletEvent;
    AppletFrameElement: typeof AppletFrameElement;
  }
}

window.applets = applets;
window.AppletEvent = AppletEvent;
window.AppletFrameElement = AppletFrameElement;
