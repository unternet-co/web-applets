import './elements/applet-frame';
import { AppletFactory } from './main/applet-factory';
export * from './types/public';

export const applets = new AppletFactory();

export { AppletEvent } from './events';
