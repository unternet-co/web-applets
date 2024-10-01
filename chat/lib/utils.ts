import { AppletAction } from '../../sdk';
import { Message } from '../features/messages';

export function convertToStandardMessages(messages: Message[]) {
  return messages.map((message) => {
    if (message.role === 'applet') {
      message = {
        role: 'system',
        content: JSON.stringify(message.content, null, 2),
      };
    }
    return message;
  });
}

export function convertToSchema(actionParams: AppletAction['params']) {
  return {
    strict: true,
    name: 'params_schema',
    schema: {
      type: 'object',
      required: Object.keys(actionParams),
      properties: actionParams,
      additionalProperties: false,
    },
  };
}
