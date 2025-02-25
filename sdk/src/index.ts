import './elements/applet-frame';
import { AppletFactory } from './main/applet-factory';
export * from './types';

export const applets = new AppletFactory();

export {
  AppletReadyEvent,
  AppletActionsEvent,
  AppletDataEvent,
  AppletResizeEvent,
} from './events';
