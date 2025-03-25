// AppletFactory
import { AppletFactory } from './applets/applet-factory.js';
export const applets = new AppletFactory();

// Applet & AppletScope (as types, not instantiable classes)
import { Applet as AppletClass } from './applets/applet.js';
import { AppletScope as AppletScopeClass } from './applets/applet-scope.js';
export type Applet<DataType = any> = AppletClass<DataType>;
export type AppletScope<DataType = any> = AppletScopeClass<DataType>;

// AppletFrame
import './elements/applet-frame.js';
export { AppletFrameElement } from './elements/applet-frame.js';

// AppletEvent
export { AppletEvent } from './applets/events.js';

// Actions
export { type AppletActionDescriptor } from './applets/actions.js';
