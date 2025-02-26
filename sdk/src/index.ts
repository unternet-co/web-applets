import './elements/applet-frame';
import { AppletFactory } from './applets/index';
export * from './types/public';

export const applets = new AppletFactory();

export { AppletEvent } from './events';
