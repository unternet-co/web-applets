import { applets } from './index';
import './index';
import { type AppletFactory } from './applets/applet-factory';
import { AppletEvent } from './applets/events';

declare global {
  interface Window {
    applets: AppletFactory;
    AppletEvent: typeof AppletEvent;
  }
}

window.applets = applets;
window.AppletEvent = AppletEvent;
