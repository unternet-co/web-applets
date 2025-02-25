import { APPLET_CONNECT_TIMEOUT } from '../constants';
import { Applet } from './applet';
import { AppletScope } from './applet-scope';

export class AppletFactory {
  async connect<DataType = any>(window: Window): Promise<Applet> {
    return new Promise((resolve, reject) => {
      const applet = new Applet<DataType>(window);
      const timeout = setTimeout(reject, APPLET_CONNECT_TIMEOUT);
      const listener = () => {
        resolve(applet);
        applet.removeEventListener('ready', listener);
        clearTimeout(timeout);
      };
      applet.addEventListener('ready', listener);
    });
  }

  register<DataType = any>(): AppletScope {
    return new AppletScope<DataType>();
  }
}
