---
layout: docs
title: Events - Web Applets
tags: docs
eleventyNavigation:
  key: Events
  parent: Reference
  order: 5
---

# Events

The Web Applets API uses a standard event-based communication system. Applications can listen for these events to respond to applet lifecycle changes, communication, and user interactions.

## AppletEvent

All events in the Web Applets API use the AppletEvent interface, which extends the standard DOM Event interface.

### Constructor

```js
new AppletEvent(type, options);
```

#### Parameters

`type`

A `string`, specifying the event type, can be one of the following:

- `connect` - Connection established
- `actions` - Actions registered or updated
- `data` - Data transferred
- `resize` - Size changed

`options`

An optional `AppletEventInit` object containing initialization options.

### Instance properties

`data`

Optional JSON-serializable value containing any data associated with the event.

`actions`

An optional dictionary mapping action IDs as `string`, to their definitions as `AppletActionDescriptor`.

`width`

An optional `number` representing the applet's inner window width.

`height`

An optional `number` representing the applet's inner window height.

## AppletEventInit

Extends the standard `EventInit` dictionary with additional properties used to initialize an `AppletEvent`.

### Properties

Includes all properties from `EventInit` (`bubbles`, `cancelable`, `composed`), plus optionally:

- `data`
- `actions`
- `width`
- `height`

See corresponding property values in the `AppletEvent` interface above.

## Event Types

### connect

Fired when a connection is established between an applet and its client or between applets.

```js
applet.addEventListener('connect', (event) => {
  console.log('Connection established!');
});
```

### actions

Fired when actions are registered or updated. The `actions` property contains a map of the registered action definitions.

```js
applet.addEventListener('actions', (event) => {
  console.log('Available actions:', event.actions);
  // e.g. Update a list of actions for the model, or display to the user
});
```

### data

Fired when data is transferred between applets. The `data` property contains the transferred data.

```js
applet.addEventListener('data', (event) => {
  console.log('Received data:', event.data);
  // e.g. Save the applet's data to local storage
});
```

### resize

Fired when an applet's size changes. The `width` and `height` properties contain the new dimensions.

```js
applet.addEventListener('resize', (event) => {
  console.log(`New size: ${event.width}x${event.height}`);
});
```
