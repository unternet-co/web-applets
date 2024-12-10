export * from './core/shared';
export * from './core/applet';
export * from './core/context';

import { load } from './core/applet';
import { getContext } from './core/context';

export const applets = {
  load,
  getContext,
};
