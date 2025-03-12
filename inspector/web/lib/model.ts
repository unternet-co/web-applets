import { createOpenAI } from '@ai-sdk/openai';
import { store } from './store';
import { generateObject, jsonSchema } from 'ai';
import { Applet } from '@web-applets/sdk';
import { historyContext } from './history-context';
import { isEmpty } from '../utils';

type SchemaResponse = {
  text?: string;
  tools?: { id: string; arguments?: any }[];
};

function getSystemPrompt(applet: Applet) {
  // Retrieve the last 10 interactions (default value) to provide context to the model.
  const recentHistory = historyContext.getRecentInteractions();

  const baseSystemPrompt = [
    'In this environment you have access to a set of tools and a set of the last ten historical messages and tools used.',
  ];
  if (recentHistory.length > 0)
    baseSystemPrompt.push(
      `Here is a a history of the last ten messages and tools used for context: ${JSON.stringify(
        recentHistory
      )}.`
    );

  if (applet) {
    baseSystemPrompt.push(
      `Here are the functions available in JSONSchema format:
        ${JSON.stringify(applet.actions)}
      This is the start data that the tools have provided:
        ${JSON.stringify(applet.data)}.`
    );
  }

  baseSystemPrompt.push(
    `Choose to respond as text and/or one or more functions to call to respond to the user's query.`
  );

  return baseSystemPrompt.join(' ');
}

function getResponseSchema(applet: Applet) {
  if (!applet)
    return jsonSchema<SchemaResponse>({
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
      additionalProperties: false,
    });

  const responseSchema = {
    type: 'object',
    properties: {
      text: { type: 'string' },
      tools: {
        type: 'array',
        items: {
          anyOf: Object.keys(applet.actions).map((actionId) => {
            const action = applet.actions[actionId];

            const schema: any = {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  enum: [actionId],
                },
              },
              additionalProperties: false,
              required: ['id'],
            };

            if (
              action.params_schema &&
              !isEmpty(action.params_schema.properties)
            ) {
              schema.properties.arguments = action.params_schema;

              // Set some variables that OpenAI requires if they're not present
              if (!schema.properties.arguments.required) {
                schema.properties.arguments.required = Object.keys(
                  schema.properties.arguments.properties
                );
              }
              schema.properties.arguments.additionalProperties = false;

              schema.required.push('arguments');
            }

            return schema;
          }),
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  };

  return jsonSchema<SchemaResponse>(responseSchema);
}

async function getModelResponse(prompt: string, applet: Applet) {
  /**
   * @TODO
   *
   * We currently re-create this each time, can we store it? We need to
   * make sure it stays up to date with the token set in localStorage.
   */
  const openAIAPIToken = store.get().settings?.openAIAPIToken;
  const openai = createOpenAI({
    apiKey: openAIAPIToken,
    compatibility: 'strict',
  });

  const model = openai('gpt-4o-mini');

  const systemPrompt = getSystemPrompt(applet);
  const responseSchema = getResponseSchema(applet);

  const { object } = await generateObject({
    model,
    prompt: prompt,
    system: systemPrompt,
    schema: responseSchema,
  });

  return object;
}

export const model = {
  getModelResponse,
};
