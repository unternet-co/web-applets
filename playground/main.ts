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
const actionsList = document.querySelector(
  '#actions-list'
) as HTMLFieldSetElement;
const actionForm = document.querySelector('#action-form') as HTMLFormElement;

let applet: Applet;
const appletHeaders = await applets.getHeaders('/');
startApplet(appletHeaders[0].url);

async function startApplet(url: string) {
  const appletUrl = url;
  applet = await applets.load(appletUrl, appletContainer);

  appletLabel.innerText = applet.manifest.name;
  renderActions(applet.manifest.actions);
  applet.onstateupdated = renderState;
}

function renderActions(actions) {
  const actionTemplate = (action, i) => /*html*/ `
    <div class="action">
      <input type="radio" id="${action.id}" name="${action.id}" value="${
    action.id
  }" checked="${i === 0}"/>
      <label for="${action.id}">
        <div class="action-name">${action.id}</div>
        <div class="action-description">${action.description}</div>
      </label>
    </div>
  `;

  actionsList.innerHTML = actions.map(actionTemplate).join('');
  if (actions.length > 0) renderForm(actions[0]);

  document.querySelectorAll('.action > input').forEach((radio) => {
    radio.addEventListener('change', function () {
      if (this.checked) {
        renderForm(actions.filter((a) => a.id === this.value)[0]);
      }
    });
  });
}

function renderForm(action) {
  const template = (param) => /*html*/ `
    <div>
      <label for=${param.id}>${param.id} (${param.type})</label>
      <p>${param.description}</p>
      <input type="text" name=${param.id} id=${param.id} placeholder="Parameter value..." />
    </div>
  `;

  actionForm.innerHTML = /*html*/ `
    ${action.params.map(template).join('')}
    <input type="submit" />
  `;

  actionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(actionForm);
    const formContents = Object.fromEntries(formData.entries());
    applet.dispatchAction(action.id, formContents as Record<string, string>);
    actionForm.reset();
  });
}

function renderState(state) {
  appletStateDisplay.innerText = JSON.stringify(state, null, 2);
}

function handleAppletChange(event: SelectEvent) {
  if (applet) applet.disconnect();
  startApplet(event.detail);
}

appletSelect.addEventListener(
  'applet-select',
  handleAppletChange as EventListener
);
