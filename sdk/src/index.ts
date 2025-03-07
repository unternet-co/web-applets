// AppletFactory
import { AppletFactory } from './applets/applet-factory.js';
export const applets = new AppletFactory();

// Applet & AppletScope (as types, not intantiable classes)
import { Applet as AppletClass } from './applets/applet.js';
import { AppletScope as AppletScopeClass } from './applets/applet-scope.js';
export type Applet = InstanceType<typeof AppletClass>;
export type AppletScope = InstanceType<typeof AppletScopeClass>;

// AppletFrame
import './elements/applet-frame.js';
export { AppletFrameElement } from './elements/applet-frame.js';

// AppletEvent
export { AppletEvent } from './applets/events.js';

// Actions
export { type AppletActionDescriptor } from './applets/actions.js';
