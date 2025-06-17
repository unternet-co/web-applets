# AppletFrameElement

`AppletFrameElement` is a custom HTML element that provides a container for embedding and interacting with applets. It handles the connection to the applet, manages communication, and automatically resizes based on the applet's dimensions.

> **Note:** Currently `AppletFrameElement` does not accept the `allow` attribute, meaning that it is not sandboxed by default and should only be used for trusted applications or in low-risk settings. In the meantime, we recommend using an `iframe` manually for production settings.

`AppletFrameElement` extends <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement" target="_blank">`HTMLElement`</a>, and inherits its properties and methods. In addition, it implements the below.

## Usage

In an HTML file:

```html
<applet-frame src="path/to/applet.html"></applet-frame>
```

## DOM attributes

### src

The URL of the applet to load in the frame.

#### Value

A `string` representing the URL.

#### Example

```html
<applet-frame src="https://example.com/applet"></applet-frame>
```

## Instance properties

### AppletFrame.src

Gets or sets the URL of the applet to load. Setting this property triggers the loading of a new applet.

#### Value

A `string` representing the URL.

#### Example

```js
// Get the current URL
const url = frame.src;

// Set a new URL and load the applet
frame.src = 'https://example.com/new-applet';
```

### AppletFrame.applet

Provides read-only access to the `Applet` instance that represents the connection to the embedded applet.

#### Value

An `Applet` object or `undefined` if no applet is connected.

#### Example

```js
// Access the applet's data
const data = frame.applet.data;

// Send an action to the applet
frame.applet.sendAction('search', { query: 'example' });
```

### AppletFrame.contentWindow

A reference to contentWindow that contains the applet.

#### Value

A read-only `Window` object.

## Events

### load

Fired when the applet has been loaded and the connection has been established.

#### Properties

None.

#### Example

```js
frame.addEventListener('load', (event) => {
  console.log('Applet loaded successfully');
});
```

### actions

Fired when the available actions of the applet change.

#### Event properties

`actions: AppletActionMap`

An object representing the updated actions.

#### Example

```js
frame.addEventListener('actions', (event) => {
  console.log('Applet actions updated:', event.actions);
});
```

### data

Fired when the applet's data changes.

#### Event properties

`event.data`

The data object, which can be any JSON-serializable value.

#### Example

```js
frame.addEventListener('data', (event) => {
  console.log('Applet data updated:', event.data);
});
```
