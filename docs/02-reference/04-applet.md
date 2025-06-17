---
layout: docs
title: Applet - Web Applets
tags: docs
eleventyNavigation:
  key: Applet
  parent: Reference
  order: 3
---

# Applet

The `Applet` class represents the interface through which the client interacts with an applet window. It is returned by the `AppletFactory.connect()` method and provides access to the applet's properties, data, and actions.

## Constructor

### Applet()

Creates a new `Applet` instance that communicates with the specified applet window. Don't use this directly, this class should only be instantiated through the `applets.connect()` method.

#### Parameters

`targetWindow`

A `Window` object where the applet is implemented (typically an iframe's content window).

## Instance methods

<a id="sendAction"></a>

### Applet.sendAction()

Sends an action to the applet for execution.

#### Syntax

```js
await sendAction(actionId, args);
```

#### Parameters

`actionId`

A `string` representing the identifier of the action to execute.

`args`

An `object` containing the arguments to pass to the action, or `undefined` if the action takes no arguments. This should fulfill the `params_schema` declared for the given action.

#### Return value

A `Promise` that resolves when the action has been sent to the applet.

#### Example

```js
applet.sendAction('search', {
  query: 'cafes in my neighbourhood',
});
```

## Instance properties

### Applet.data

Provides access to the current state of the applet's data. This object reflects the data defined in the applet implementation and is synchronized between the client and applet windows.

#### Value

Can be any value that is JSON-serializable.

#### Example

```js
/* In client */
applet.data = 'Hello world!';

/* In applet */
applet.ondata = (e) => console.log(e.data); // "Hello world!"
```

### Applet.window

A read-only reference to the window where the applet is implemented.

#### Value

A `Window` object.

### Applet.manifest

Contains the parsed contents of the applet's manifest, as declared by the `<link rel="manifest" href="...">` tag in the applet window. Declares the initial set of actions for the applet, and contains properties like descrition, name, etc.

#### Value

A read-only JSON object containing the web app manifest. If no manifest link is present, this will be an empty object.

### Applet.actions

A map of available actions that can be invoked on the applet.

#### Value

An `AppletActionMap` object.

### Applet.width

The current width of the applet's document in pixels.

#### Value

A `number`.

### Applet.height

The current height of the applet's document in pixels.

#### Value

A `number`.

## Events

### connect

An `AppletEvent`, which is dispatched when the connection with the applet is established successfully.

#### Properties

None.

#### Example

```js
applet.addEventListener('connect', (event) => {
  console.log('Applet connected successfully');
});
```

### actions

An `AppletEvent`, which is dispatched when the available actions of the applet change. This typically happens after initial connection or when the applet implementation adds or removes actions.

#### Event properties

`actions: AppletActionMap`

An object representing the updated actions.

#### Example

```js
applet.addEventListener('actions', (event) => {
  console.log('Applet actions updated:', event.actions);
});
```

### data

An `AppletEvent`, which is fired when the applet's data changes. This occurs when the applet implementation updates its internal state.

#### Event properties

`event.data`

The data object, which can be any JSON-serializable value.

#### Example

```js
applet.addEventListener('data', (event) => {
  console.log('Applet data updated:', event.data);
});
```

### resize

An `AppletEvent`, which is fired when the applet's document changes dimensions.

#### Event properties

None.

#### Example

```js
applet.addEventListener('resize', (event) => {
  console.log('Applet size updated:', applet.width, applet.height);
});
```
