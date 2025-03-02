// AppletFactory
import { AppletFactory } from './api/applet-factory';
export const applets = new AppletFactory();

// Applet & AppletScope (as types, not intantiable classes)
import { Applet as AppletClass } from './api/applet';
import { AppletScope as AppletScopeClass } from './api/applet-scope';
export type Applet = InstanceType<typeof AppletClass>;
export type AppletScope = InstanceType<typeof AppletScopeClass>;

// AppletFrame
import './elements/applet-frame';
export { AppletFrameElement } from './elements/applet-frame';

// AppletEvent
export { AppletEvent } from './api/events';

// Actions
export { type AppletActionDescriptor } from './api/actions';
