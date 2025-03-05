import { createOpenAI } from '@ai-sdk/openai';
import { store } from './store';
import { generateObject, jsonSchema } from 'ai';
import { Applet } from '@web-applets/sdk';
import type { Interaction } from './history-context';

type SchemaResponse = {
  text?: string;
  tools?: { id: string; arguments?: any }[];
};

function getSystemPrompt(applet: Applet) {
  if (!applet) return;

  const prompt = `\
    In this environment you have access to a set of tools. Here are the functions available in JSONSchema format:
    ${JSON.stringify(applet.actions)}
    Choose to respond as text and/or one or more functions to call to respond to the user's query.
  `;

  return prompt;
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
              Object.keys(action.params_schema).length > 0
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

async function getModelResponse(
  prompt: string,
  history: Interaction[],
  applet: Applet
) {
  const contextText = JSON.stringify(history);
  const fullPrompt = contextText ? `${contextText}\n${prompt}` : prompt;

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
    prompt: fullPrompt,
    system: systemPrompt,
    schema: responseSchema,
  });

  return object;
}

export const model = {
  getModelResponse,
};
