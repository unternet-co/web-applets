export default {
  shouldCallTool: {
    name: 'boolean',
    strict: true,
    schema: {
      type: 'object',
      required: ['shouldCallTool', 'toolUrl', 'actionId'],
      properties: {
        shouldCallTool: {
          description:
            'A true/false answer as to whether the model should call a tool.',
          type: 'boolean',
        },
        toolUrl: {
          description:
            "The URL of the tool to choose if the above is true, otherwise 'None'",
          type: 'string',
        },
        actionId: {
          description:
            'The ID of the specific action to take on the tool (corresponding to tool.actions.id)',
          type: 'string',
        },
      },
      additionalProperties: false,
    },
  },
  shouldContinue: {
    name: 'continue',
    strict: true,
    schema: {
      type: 'object',
      required: ['shouldContinue'],
      properties: {
        shouldContinue: {
          description:
            'A true/false answer as to whether the response requires more information to be complete.',
          type: 'boolean',
        },
      },
      additionalProperties: false,
    },
  },
};
