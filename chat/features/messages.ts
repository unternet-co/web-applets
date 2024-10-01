import { type ObserverCallback } from '../lib/observers';
const messages: Message[] = [];
const subscribers: ObserverCallback<Message>[] = [];

/* Model */

export type Message = TextMessage | AppletMessage;

export interface TextMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export interface AppletMessage {
  role: 'applet';
  appletUrl: string;
  content: Record<string, unknown>;
}

/* Actions */

export function addMessage(message: Message) {
  messages.push(message);
  updateSubscribers();
  return messages.length - 1;
}

export function appendMessageContent(id: number, content: string) {
  messages[id].content += content;
  updateSubscribers();
}

/* Observers */

export function onMessages(callback: ObserverCallback<Message>) {
  subscribers.push(callback);
  return () =>
    subscribers.filter((item: ObserverCallback<Message>) => item !== callback);
}

function updateSubscribers() {
  for (const subscriber of subscribers) {
    subscriber(messages);
  }
}
