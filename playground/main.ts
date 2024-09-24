import './components/applet-select';
import './components/applet-view';
import { AppletView } from './components/applet-view';
import { AppletSelect, SelectEvent } from './components/applet-select';
import { getAppletsList, loadAppletManifest } from '../sdk';

const applets = await getAppletsList('/');
initializeApplet(applets[0].url);

const appletSelect = document.querySelector('applet-select') as AppletSelect;
const appletView = document.querySelector('applet-view') as AppletView;

async function initializeApplet(url: string) {
  const appletManifest = await loadAppletManifest(url);
  appletView.url = appletManifest.view;
  let state;

  function updateState(newState) {
    state = newState;
    appletView.state = newState;
  }

  const worker = new Worker(appletManifest.controller);

  worker.postMessage({ type: 'name', payload: 'Rupert' });
  worker.onmessage = function (e) {
    updateState(e.data.payload);
  };
}

function handleAppletChange(event: SelectEvent) {
  initializeApplet(event.detail);
}

appletSelect.addEventListener(
  'applet-select',
  handleAppletChange as EventListener
);
