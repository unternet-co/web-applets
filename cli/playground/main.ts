import './components/applet-select';
import { AppletSelect, SelectEvent } from './components/applet-select';
import { applets, type AppletAction, type Applet } from '../../sdk/dist';
import OpenAI from 'openai';

let openaiKey = '';

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
const commandForm = document.querySelector('#cmd-form') as HTMLFormElement;
const commandInput = document.querySelector('#cmd-input') as HTMLInputElement;
const devtoolsButton = document.querySelector('#devtools') as HTMLInputElement;

devtoolsButton.addEventListener('click', () => {
  document.body.classList.toggle('no-devtools');
});

let openai;

let applet: Applet;

async function main() {
  const appletsDict = await applets.list('/applets');
  startApplet(Object.keys(appletsDict)[0]);
}

main();

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

  const paramsArray = Object.keys(action.params).map((id) => {
    return {
      id,
      ...action.params[id],
    };
  });

  actionForm.innerHTML = /*html*/ `
    ${paramsArray.map(template).join('')}
    <input type="submit" />
  `;

  actionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(actionForm);
    const formContents = Object.fromEntries(formData.entries());
    await applet.dispatchAction(
      action.id,
      formContents as Record<string, string>
    );
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

commandForm.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  const formData = new FormData(commandForm);
  const formContents = Object.fromEntries(formData.entries());
  if (!openaiKey) {
    openaiKey = formContents.command as string;
    openai = new OpenAI({
      apiKey: openaiKey,
      dangerouslyAllowBrowser: true,
    });
    commandInput.value = '';
    commandInput.placeholder = 'Ask a command...';
  } else {
    const command = formContents.command as string;
    commandInput.value = '';
    const actionId = await getActionChoice(command);
    const action = applet.actions.find((action) => action.id === actionId)!;
    const params = await getParamsChoice(action, command);
    await applet.dispatchAction(actionId, params);
  }
});

async function getActionChoice(query: string): Promise<string> {
  const question = {
    role: 'system',
    content: `\
    Query:\n\n${query}
    
    Available tools:\n\n${JSON.stringify(applet.actions, null, 2)}
    
    Which tool best answers the user's query?`,
  };

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [question],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'boolean',
        strict: true,
        schema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              description: 'The ID of the specific tool',
              type: 'string',
            },
          },
          additionalProperties: false,
        },
      },
    },
  });

  const json = completion.choices[0]?.message?.parsed as any;

  return json && json.id;
}

async function getParamsChoice(action: AppletAction, query: string) {
  const completion = await openai.beta.chat.completions.parse({
    // model: 'gpt-4o-2024-08-06',
    model: 'gpt-4o-mini-2024-07-18',
    messages: [
      {
        role: 'system',
        content: `Please fill the following tool schema to gather more information in order to answer the user's query. The tool is called "${
          action.id
        }" and its description is "${
          action.description
        }". You will also see the tool's current state, which is currently being presented to the user, for context.
        
        Query:

        ${query}

        Current state:

        ${JSON.stringify(applet.state)}

        Schema:
        
        ${action.params}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: convertToSchema(action),
    },
  });

  const json = completion.choices[0]?.message?.parsed as any;
  return json;
}

export function convertToSchema(action: AppletAction) {
  return {
    strict: true,
    name: 'params_schema',
    schema: {
      type: 'object',
      required: Object.keys(action.params!),
      properties: action.params!,
      additionalProperties: false,
    },
  };
}
