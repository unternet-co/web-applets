// AppletFactory

import { AppletFactory } from './applets/applet-factory.ts';
export const applets = new AppletFactory();

// Applet & AppletScope (as types, not intantiable classes)

import { Applet as AppletClass } from './applets/applet.ts';
import { AppletScope as AppletScopeClass } from './applets/applet-scope.ts';
export type Applet<DataType = any> = AppletClass<DataType>;
export type AppletScope<DataType = any> = AppletScopeClass<DataType>;

// AppletEvent

export { AppletEvent } from './applets/events.ts';

// Actions

export { type AppletActionDescriptor } from './applets/actions.ts';

// AppletFrameElement

import { AppletFrameElement } from './elements/applet-frame.ts';
export { AppletFrameElement };

function registerElements() {
  if (!customElements.get('applet-frame')) {
    customElements.define('applet-frame', AppletFrameElement);
  }
}

registerElements();

export { registerElements };
