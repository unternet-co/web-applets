# AppletScope

The `AppletScope` class represents the interface for an applet's implementation in the applet window. It handles communication with the client, manages action handlers, and maintains the applet's state.

## Constructor

### AppletScope()

Creates a new `AppletScope` instance and initiates connection with the client.

#### Syntax

```js
const applet = new AppletScope(manifest);
```

#### Parameters

`manifest`

An optional object that adheres to the Web App Manifest spec extension detailed in the "Manifest" section.

## Instance methods

<a id="setActionHandler"></a>

### AppletScope.setActionHandler()

Registers a handler function for a specific action that's already been declared, either with the <a href="manifest">manifest.json</a> or through `defineAction()`.

#### Syntax

```js
setActionHandler(actionId, handler);
```

#### Parameters

`actionId`

A `string` representing the identifier of the action.

`handler`

A function that will be called when the action is triggered. The function will receive the action arguments as its parameter.

#### Return value

None.

#### Example

```js
applet.setActionHandler('search', async (args) => {
  const results = await searchDatabase(args.query);
  applet.data = results;
});
```

<a id="defineAction"></a>

### AppletScope.defineAction()

Defines a new action with its properties and optional handler.

#### Syntax

```js
defineAction(actionId, definition);
```

#### Parameters

`actionId`

A `string` representing the identifier of the action.

`definition`  
An object describing the action, with the following properties:

- `title`<br>A short human-readable `string` title for the action.

- `description`<br>A human-readable `string` description of what the action does.

- `params_schema`<br>A JSON schema object describing the parameters your action expects.

- `handler`<br>An optional `function` that is invoked whenever the action is executed. Receives one argument, an object matching the validated schema. If is omitted, this defaults to whatever the current action handler is for this action, if any.

#### Return value

None.

#### Example

```js
applet.defineAction('search', {
  title: 'Search',
  description: 'Search for items matching the query',
  params_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
  handler: ({ query }) => {
    // do stuff
  },
});
```

## Instance properties

### AppletScope.data

Provides access to the current state of the applet's data. When modified, this property automatically synchronizes the data with the client.

#### Value

Can be any value that is JSON-serializable.

#### Example

```js
/* In applet window */
applet.data = { results: ['Item 1', 'Item 2'] };

/* Data will be automatically synchronized with client */
```

### AppletScope.actions

A map of available actions defined for the applet.

#### Value

An `AppletActionMap` object. When modified, this property automatically notifies the client of the updated actions.

### AppletScope.manifest

Contains the parsed contents of the applet's manifest.

#### Value

A read-only applet manifest JSON object.

### AppletScope.actionHandlers

A map of registered action handler functions.

#### Value

A map with `string` keys referring to the action ID, and values defining the action as `AppletActionDescriptor`.

### AppletScope.width

The current width of the applet in pixels.

#### Value

A read-only `number`.

### AppletScope.height

The current height of the applet in pixels.

#### Value

A read-only `number`.

## Events

### connect

An `AppletEvent`, which is dispatched when the connection with the client is established successfully.

#### Properties

None.

#### Example

```js
applet.addEventListener('connect', (event) => {
  console.log('Connected to client!');
});
```

### actions

An `AppletEvent`, which is dispatched when the available actions of the applet change.

#### Event properties

`actions: AppletActionMap`

An object representing the updated actions.

#### Example

```js
applet.addEventListener('actions', (event) => {
  console.log('Actions updated:', event.actions);
});
```

### data

An `AppletEvent`, which is fired when the applet's data changes.

#### Event properties

`event.data`

The data object, which can be any JSON-serializable value.

#### Example

```js
applet.addEventListener('data', (event) => {
  console.log('Data updated:', event.data);
});
```
