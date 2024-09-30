import './components/applet-select';
import { AppletSelect, SelectEvent } from './components/applet-select';
import { applets } from '../sdk';
import { Applet } from '../sdk/client';

const appletSelect = document.querySelector('applet-select') as AppletSelect;
const appletContainer = document.querySelector(
  '#applet-container'
) as HTMLIFrameElement;
const appletLabel = document.querySelector('label') as HTMLLabelElement;
const appletStateDisplay = document.querySelector(
  '#applet-state'
) as HTMLLabelElement;

let applet: Applet;
const appletHeaders = await applets.getHeaders('/');
startApplet(appletHeaders[0].url);

async function startApplet(url: string) {
  const appletUrl = url;
  applet = await applets.load(appletUrl, appletContainer);
  appletLabel.innerText = applet.manifest.name;
  applet.onstateupdated = (state) => {
    appletStateDisplay.innerText = JSON.stringify(state, null, 2);
  };
  applet.dispatchAction('set_name', { name: 'Rupert' });
}

function handleAppletChange(event: SelectEvent) {
  if (applet) applet.disconnect();
  startApplet(event.detail);
}

appletSelect.addEventListener(
  'applet-select',
  handleAppletChange as EventListener
);
