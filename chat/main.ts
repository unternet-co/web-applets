import {
  addMessage,
  Message,
  onMessages,
  appendMessageContent,
} from './features/messages';
import schemas from './lib/schemas';
import OpenAI from 'openai';
import { AppletAction, AppletHeader, applets } from '../sdk/src';
import { convertToStandardMessages, convertToSchema } from './lib/utils';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const headers = await applets.getHeaders('/');
let messages: Message[] = [];

const inputForm = document.getElementById('input-form') as HTMLFormElement;
const input = document.getElementById('input') as HTMLTextAreaElement;
const responses = document.getElementById('responses') as HTMLDivElement;

/* State updates */

onMessages((newMessages: Message[]) => {
  messages = newMessages;
  renderMessages(newMessages, responses);
});

/* DOM events */

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    inputForm.dispatchEvent(new SubmitEvent('submit'));
  }
});

inputForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = input.value;
  input.value = '';
  const history = [...messages];

  const newMessage = {
    role: 'user',
    content: value,
  } as Message;
  addMessage(newMessage);

  requestExecutionLoop(newMessage, history);
});

/* Controller logic */

async function requestExecutionLoop(
  query: Message,
  priorHistory: Message[],
  responses?: Message[]
) {
  if (!responses) responses = [];
  const { appletRequired, appletUrl, actionId } = await shouldRequestApplet(
    query,
    responses,
    headers
  );

  console.log('[Action]', appletUrl, `#${actionId}`);

  if (appletRequired) {
    const appletContainer = document.createElement('iframe');
    appletContainer.style.display = 'none';
    document.querySelector('body').appendChild(appletContainer);
    const applet = await applets.load(appletUrl, appletContainer);
    const params = await selectParamsForAction(
      query,
      applet.actions.find((action) => action.id === actionId),
      priorHistory,
      responses
    );

    console.log('[Params]', params);
    await applet.dispatchAction(actionId, params);
    console.log('[State]', applet.state);
    const appletMessage = {
      role: 'applet',
      appletUrl,
      content: applet.state,
    } as Message;
    addMessage(appletMessage);

    responses.push(appletMessage);
    const followupRequired = await shouldContinue(query, responses);
    if (followupRequired) requestExecutionLoop(query, priorHistory, responses);
  } else {
    const messageId = addMessage({
      role: 'assistant',
      content: '',
    });
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: convertToStandardMessages(messages),
      stream: true,
    });
    let text = '';
    for await (const part of stream) {
      const textPart = part.choices[0]?.delta?.content || '';
      text += textPart;
      appendMessageContent(messageId, textPart);
    }

    responses.push({
      role: 'assistant',
      content: text,
    });
    const followupRequired = await shouldContinue(query, responses);
    if (followupRequired) requestExecutionLoop(query, priorHistory, responses);
  }
}

async function shouldRequestApplet(
  query: Message,
  responses: Message[],
  appletHeaders: AppletHeader[]
): Promise<{
  appletRequired: boolean;
  appletUrl?: string;
  actionId?: string;
}> {
  const question: Message = {
    role: 'system',
    content: `\
    Given the question, the available tools, and past history of messages & tool use, you must decide whether to request more information from a tool, or to answer the question directly now, and if the former which tool and action to use. Call an action only when further information is required from the internet or external sources in order to conduct a response.

    Question:\n\n${query.content}

    History:\n\n${JSON.stringify(convertToStandardMessages(responses), null, 2)}
    
    Available tools:\n\n${JSON.stringify(appletHeaders, null, 2)}
    
    Do you require more information from a tool right now, in order to respond to the user? If so, which tool and which action do you choose? Important: respond false if you require further clarification before filling the parameters.`,
  };

  const completion = await openai.beta.chat.completions.parse({
    // model: 'gpt-4o-2024-08-06',
    model: 'gpt-4o-mini-2024-07-18',
    messages: [question],
    response_format: {
      type: 'json_schema',
      json_schema: schemas.shouldCallTool,
    },
  });

  const json = completion.choices[0]?.message?.parsed as any;

  return {
    appletRequired: json ? json.shouldCallTool : false,
    appletUrl: json && json.toolUrl,
    actionId: json && json.actionId,
  };
}

async function shouldContinue(
  query: Message,
  responses: Message[]
): Promise<boolean> {
  const question: Message = {
    role: 'system',
    content: `\
    Given the query and past history of messages & tool use, you must stop responding if the user's query has been adequately responded to. Note: the system prompts above are visible to the user, and can be considered an answer to the query if sufficient. ONLY continue if it's necessary to provide additional output for clarification.

    Query:\n\n${query.content}

    History:\n\n${JSON.stringify(convertToStandardMessages(responses), null, 2)}

    Should you continue to answer the user's query? Answer only either 'YES' or 'NO', with no other text.`,
  };

  console.log(question.content);

  const completion = await openai.beta.chat.completions.parse({
    // model: 'gpt-4o-2024-08-06',
    model: 'gpt-4o-mini-2024-07-18',
    messages: [question],
  });

  console.log(completion.choices[0]?.message?.content);

  // const json = completion.choices[0]?.message?.parsed as any;

  return completion.choices[0]?.message?.content === 'YES';
  // return json.shouldContinue;
}

async function selectParamsForAction(
  query: Message,
  action: AppletAction,
  priorHistory: Message[],
  responses: Message[]
) {
  const completion = await openai.beta.chat.completions.parse({
    // model: 'gpt-4o-2024-08-06',
    model: 'gpt-4o-mini-2024-07-18',
    messages: convertToStandardMessages([
      ...priorHistory,
      query,
      ...responses,
      {
        role: 'system',
        content: `Please fill the following tool schema to gather more information in order to answer the user's query. The tool is called "${action.id}" and its description is "${action.description}".`,
      },
    ]),
    response_format: {
      type: 'json_schema',
      json_schema: convertToSchema(action.params),
    },
  });

  const json = completion.choices[0]?.message?.parsed as any;
  return json;
}

/* View templates */

async function renderMessages(messages: Message[], elem: HTMLElement) {
  messages.forEach(async (message, index) => {
    if (message.role === 'system') return;

    const existingElem = document.querySelector(`li[data-key="${index}"]`);
    if (existingElem) {
      const contentElem = existingElem.querySelector('.content');
      if (
        message.role === 'applet' ||
        (contentElem.innerHTML && contentElem.innerHTML === message.content)
      )
        return;
      contentElem.innerHTML = message.content;
      return;
    }

    if (message.role === 'applet') {
      const container = document.createElement('iframe');
      elem.appendChild(createMessageElement('applet', container, index));
      const applet = await applets.load(message.appletUrl, container);
      applet.state = message.content;
    } else {
      elem.appendChild(
        createMessageElement(message.role, message.content, index)
      );
    }
  });
}

function createMessageElement(role: string, content: any, key: number) {
  const li = document.createElement('li');
  li.dataset.key = key.toString();
  li.dataset.className = role;

  const fromElem = document.createElement('div');
  fromElem.className = 'from';
  fromElem.innerText =
    role === 'user' ? 'User' : role === 'applet' ? 'Applet' : 'Operator';

  const contentElem = document.createElement('div');
  contentElem.className = 'content';
  if (content instanceof HTMLElement) {
    contentElem.appendChild(content);
  } else {
    contentElem.innerText = content;
  }

  li.appendChild(fromElem);
  li.appendChild(contentElem);
  return li;
}
