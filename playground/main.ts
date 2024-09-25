import './components/applet-select';
import './components/applet-view';
import { AppletView } from './components/applet-view';
import { AppletSelect, SelectEvent } from './components/applet-select';
import { getAppletsList, loadAppletManifest } from '../sdk';

const appletSelect = document.querySelector('applet-select') as AppletSelect;
const appletFrame = document.querySelector('applet-view') as AppletView;

const applets = await getAppletsList('/');
initializeApplet(applets[0].url);

async function initializeApplet(url: string) {
  const appletManifest = await loadAppletManifest(url);
  appletFrame.url = appletManifest.entrypoint;

  appletFrame.postMessage({
    type: 'action',
    action: {
      id: 'set_name',
      params: {
        name: 'Rupert',
      },
    },
  });

  appletFrame.addEventListener('message', ((e: CustomEvent) => {
    if (e.detail.type === 'state') updateState(e.detail.state);
  }) as EventListener);

  function updateState(newState) {
    appletFrame.postMessage({ type: 'state', state: newState });
  }
}

function handleAppletChange(event: SelectEvent) {
  initializeApplet(event.detail);
}

appletSelect.addEventListener(
  'applet-select',
  handleAppletChange as EventListener
);
