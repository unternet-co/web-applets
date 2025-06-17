---
layout: docs
title: API Reference - Web Applets
tags: docs
eleventyNavigation:
  key: Overview
  parent: Reference
  order: 0
---

# Web Applets reference

## Setup

To create or read an applet, you need to install the SDK. You can do this with an NPM package, or a polyfill that makes Web Applets objects available in the global scope. (For more detailed setup instructions, see the <a href="/docs/web-applets/quickstart">Quickstart</a>)

### NPM

To add the NPM package, in a shell open on your project folder run:

```bash
npm install @web-applets/sdk
```

### Web polyfill

To add the polyfill to your site, add the following script tag to your html:

```html
<script
  src="https://www.unpkg.com/@unternet/web-applets@latest/dist/web-applets.min.js"
  type="module"
></script>
```

Or use an ES module import from JavaScript:

```js
import { applets } from 'https://www.unpkg.com/@unternet/web-applets@latest/dist/web-applets.min.js';
```

## Core components

### The applets object

The main entrypoint into the Web Applets API is through the `applets` object, which is an instance of <a href="/docs/web-applets/reference/applet-factory#connect">`AppletFactory`</a>. This object provides functions to initialize the applet connection:

- <a href="/docs/web-applets/reference/applet-factory#connect">`applets.connect(window)`</a> &mdash; for connecting with an applet that's running in a given `Window`. This returns an <a href="/docs/web-applets/reference/applet">`Applet`</a> object which allows you to read the applet's `data` object, and send it actions.
- <a href="/docs/web-applets/reference/applet-factory#register">`applets.register()`</a> &mdash; which you'll use when creating your own applet. This reads the <a href="/docs/web-applets/reference/manifest">`manifest.json`</a> file linked in the HTML, and connects with the parent window so it's ready to receive actions. It returns an <a href="/docs/web-applets/reference/applet-scope">`AppletScope`</a> object, that allows you to define actions and action handlers, and set the `data` object.

If you have installed with NPM you can import `applets` from `@web-applets/sdk`. if you are using the polyfill `applets` will exist in the global scope.

### AppletScope class

When you run `applets.register()` in an applet, the object this returns is an instance of <a href="/docs/web-applets/reference/applet-scope">`AppletScope`</a>.

This object represents the complete state of the applet, and handles all syncing with the client. For example, if you set the `data` property on an instance of `AppletScope`, the `Applet` instance on the client side will update its `data` object and emit an event.

`AppletScope` also allows you to register handlers for incoming actions with <a href="/docs/web-applets/reference/applet-scope#setActionHandler">`setActionHandler()`</a>, so do something in response to incoming actions.

### Applet class

The <a href="/docs/web-applets/reference/applet">`Applet`</a> class is the client counterpart to `AppletScope`. It reflects the `data` and `actions` properties, making it useful for adding context to model calls, and assembling a list of function schemas for function calling.

You can set event listeners for updates from the applet, and dispatch actions using <a href="/docs/web-applets/reference/applet#sendAction">`sendAction()`</a>.

### Manifest

The <a href="/docs/web-applets/reference/manifest">`manifest.json`</a> file is an extension of the <a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest" target="_blank">Web App Manifest</a>. Use it to add metadata, an icon, and a description of the _initial_ actions your applet is able to perform (subsequent actions can be defined in code).

While a manifest is not required to create a web applet, if you expect your applet to be consumed by others and not just your own apps, we highly recommend adding a manifest. By doing so, you also allow your applets actions to be discovered without having to instantiate the applet itself.

If you don't want to use the `manifest.json` file, you can still add all the necessary metadata as an argument to <a href="/docs/web-applets/reference/applet-factory#register">`applets.register()`</a>.

## Usage examples

The following example demonstrates how to declare an applet that renders a map. Here we focus on the JavaScript, assuming certain map functions, as well as a manifest.json file and index.html file. For more details, see the [quickstart](/docs/web-applets/quickstart).

```js
// Register the applet
const self = applets.register();

// Set an action handler
self.setActionHandler('search', ({ q }) => {
  const results = searchMap(q);
  self.data = { q, results };
});

self.addEventListener('data', (e) => {
  renderMap(self.data.results);
});
```

The following example demonstrates how to load up and embed this a maps applet from a parent window, listen for events, and send an action:

```js
// Create an iframe
const frame = document.createElement('applet-frame');
frame.src = 'https://applets.unternet.co/maps';
document.body.appendChild(frame);

frame.addEventListener('data', (event) => console.log(event.data));

// Once the applet loads, send it an action
// This will result in the map showing pins for our search results
iframe.addEventListener('load', () => {
  applet.sendAction('search', { q: 'breweries in sydney' });
});
```
