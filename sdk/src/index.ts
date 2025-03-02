// AppletFactory
import { AppletFactory } from './applets/applet-factory';
export const applets = new AppletFactory();

// Applet & AppletScope (as types, not intantiable classes)
import { Applet as AppletClass } from './applets/applet';
import { AppletScope as AppletScopeClass } from './applets/applet-scope';
export type Applet = InstanceType<typeof AppletClass>;
export type AppletScope = InstanceType<typeof AppletScopeClass>;

// AppletFrame
import './elements/applet-frame';
export { AppletFrameElement } from './elements/applet-frame';

// AppletEvent
export { AppletEvent } from './applets/events';

// Actions
export { type AppletActionDescriptor } from './applets/actions';
