import { createOpenAI } from '@ai-sdk/openai';
import { store } from './store';
import { generateObject, jsonSchema } from 'ai';
import { Applet } from '@web-applets/sdk';

function getSystemPrompt(applet: Applet) {
  const prompt = `\
    In this environment you have access to a set of tools. Here are the functions available in JSONSchema format:
    ${applet.actions}
    Choose one or more functions to call to respond to the user's query.
  `;

  return prompt;
}

function getResponseSchema(applet: Applet) {
  const responseSchema = {
    type: 'object',
    properties: {
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

            if (action.parameters) {
              schema.properties.arguments = action.parameters;

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
    required: ['tools'],
    additionalProperties: false,
  };

  return jsonSchema<{ tools: { id: string; arguments?: any }[] }>(
    responseSchema
  );
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

  return object.tools[0];
}

export const model = {
  getModelResponse,
};
