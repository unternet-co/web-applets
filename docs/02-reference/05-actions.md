# Actions

<a id="AppletActionDescriptor"></a>

## AppletActionDescriptor

A dictionary used in the web applet manifest, as well as <a href="/docs/web-applets/reference/applet-scope">`AppletScope`</a> and <a href="/docs/web-applets/reference/applet">`Applet`</a> classes that describes the properties of an Applet action, and its params schema.

### Properties

`title`

An optional `string` that provides a human-readable title.

`description`

An optional `string`, which describes the action to the model.

`params_schema`

A JSON Schema object.

### Example

```js
const applet = applets.register();

applet.defineAction('get_notes', {
  title: 'Get notes',
  description:
    'Retrieves all notes from the note-taking app, limited to a number if provided.',
  params_schema: {
    type: 'object',
    properties: {
      num: {
        type: 'number',
        description: 'The maximum number of notes to retrieve',
      },
    },
  },
});
```
