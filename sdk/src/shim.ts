import { applets } from './index';
import { type AppletFactory } from './main/applet-factory';
import './index';
import {
  AppletReadyEvent,
  AppletActionsEvent,
  AppletDataEvent,
  AppletResizeEvent,
} from './events';

declare global {
  interface Window {
    applets: AppletFactory;
    AppletReadyEvent: typeof AppletReadyEvent;
    AppletActionsEvent: typeof AppletActionsEvent;
    AppletDataEvent: typeof AppletDataEvent;
    AppletResizeEvent: typeof AppletResizeEvent;
  }
}

window.applets = applets;
window.AppletReadyEvent = AppletReadyEvent;
window.AppletActionsEvent = AppletActionsEvent;
window.AppletDataEvent = AppletDataEvent;
window.AppletResizeEvent = AppletResizeEvent;
