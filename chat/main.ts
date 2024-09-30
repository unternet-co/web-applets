import {
  addMessage,
  Message,
  onMessages,
  appendMessageContent,
} from './features/messages';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });

const inputForm = document.getElementById('input-form') as HTMLFormElement;
const input = document.getElementById('input') as HTMLTextAreaElement;
const responses = document.getElementById('responses') as HTMLDivElement;

let messages: Message[] = [];

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

  const currentMessages = [...messages];
  const newMessage = {
    role: 'user',
    content: value,
  } as Message;

  addMessage(newMessage);

  console.log(typeof currentMessages);
  const { textStream } = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [...currentMessages, newMessage],
  });

  const messageId = addMessage({
    role: 'assistant',
    content: '',
  });

  for await (const textPart of textStream) {
    appendMessageContent(messageId, textPart);
  }
});

function messageTemplate(message: Message) {
  return /*html*/ `
    <ul>
      <div class="from">${message.role === 'user' ? 'User' : 'Operator'}</div>
      <div class="content">${message.content}</div>
    </ul>
  `;
}

onMessages((newMessages: Message[]) => {
  messages = newMessages;
  responses.innerHTML = messages.map(messageTemplate).join('');
});
