import { AppletFrameElement, applets } from './index.ts';
import { type AppletFactory } from './applets/applet-factory.ts';
import { AppletEvent } from './applets/events.ts';

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
