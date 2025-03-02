import { applets } from './index';
import './index';
import { type AppletFactory } from './api/applet-factory';
import { AppletEvent } from './api/events';

declare global {
  interface Window {
    applets: AppletFactory;
    AppletEvent: typeof AppletEvent;
  }
}

window.applets = applets;
window.AppletEvent = AppletEvent;
