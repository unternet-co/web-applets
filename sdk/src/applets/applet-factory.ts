import { APPLET_CONNECT_TIMEOUT } from '../constants.ts';
import { AppletConnectionError } from './errors.ts';
import { Applet } from './applet.ts';
import { AppletScope } from './applet-scope.ts';

export class AppletFactory {
  async connect<DataType = any>(window: Window): Promise<Applet<DataType>> {
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

  register<DataType = any>(manifest?: Object): AppletScope<DataType> {
    return new AppletScope<DataType>(manifest);
  }
}
