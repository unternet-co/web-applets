import { type ObserverCallback } from '../lib/observers';

const messages: Message[] = [];
const subscribers: ObserverCallback<Message>[] = [];

export interface Message {
  from: 'user' | 'assistant';
  content: string;
}

export function addMessage(message: Message) {
  messages.push(message);
  updateSubscribers();
}

// Observers

export function onMessages(callback: ObserverCallback<Message>) {
  subscribers.push(callback);
  return () =>
    subscribers.filter((item: ObserverCallback<Message>) => item !== callback);
}

function updateSubscribers() {
  for (const subscriber of subscribers) {
    console.log(subscriber, messages);
    subscriber(messages);
  }
}
