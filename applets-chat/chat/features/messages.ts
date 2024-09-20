import { Applet } from './applets';

class Message {
  from: 'user' | 'assistant';
  content: string;
  applets?: Applet[];
}
