import { APPLET_CONNECT_TIMEOUT } from '../constants.js';
import { AppletConnectionError } from './errors.js';
import { Applet } from './applet.js';
import { AppletScope } from './applet-scope.js';

export class AppletFactory {
  async connect<DataType = any>(window: Window): Promise<Applet> {
    return new Promise((resolve, reject) => {
      const applet = new Applet<DataType>(window);
      const timeout = setTimeout(() => {
        reject(
          new AppletConnectionError(
            `Applet failed to connect before the timeout was reached (${APPLET_CONNECT_TIMEOUT}ms)`
          )
        );
      }, APPLET_CONNECT_TIMEOUT);
      const listener = () => {
        resolve(applet);
        applet.removeEventListener('connect', listener);
        clearTimeout(timeout);
      };
      applet.addEventListener('connect', listener);
    });
  }

  register<DataType = any>(): AppletScope {
    return new AppletScope<DataType>();
  }
}
