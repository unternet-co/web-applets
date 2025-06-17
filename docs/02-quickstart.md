---
layout: docs
title: Quickstart - Web Applets
tags: docs
eleventyNavigation:
  key: Quickstart
  parent: Web Applets
  order: 2
---

# Quickstart

Here we'll quickly get you set up with how to [create an applet](#applet) or [a client](#client)

<a id="applet"></a>

## Creating an applet

### Using npm

First, let's create an npm project that will build a static website (or clone one of our [templates](/docs/web-applets/resources/templates)).

In this example, we'll use <a href="https://vite.dev/" target="_blank">Vite</a> for our bundling, but you can use any bundler.

```bash
mkdir my-applet
cd my-applet
npm init
```

After you set up your npm project, let's install dependencies:

```
npm install -D vite
npm install @web-applets/sdk
```

Create the files we'll need:

```
touch index.html main.js
```

In `index.html`, let's build a minimal website and link to our script:

```html
<html>
  <head>
    <script src="./main.js" type="module"></script>
  </head>
  <body></body>
</html>
```

Now in `main.js` we can register our applet and define an action.

```js
import { applets } from '@web-applets/sdk';

const self = applets.register({
  name: 'My first applet',
  description: 'Hello world, just testing out web applets',
});

self.defineAction('hello_world', {
  description: 'Logs a welcome message to the console',
  handler: () => console.log('Hello from Web Applets!'),
});
```

That's it! Run your applet with `npx vite`, and run the inspector using `npx @web-applets/inspector`. Enter the localhost URL of your running applet in the Inspector UI to test it out.

### Using the polyfill

You don't need to use a bundler to use Web Applets. To add the API to any website, simply add the following script tag to your `index.html`:

```html
<script
  src="https://www.unpkg.com/@unternet/web-applets@latest/dist/web-applets.min.js"
  type="module"
></script>
```

The <a href="/docs/web-applets/reference/applet-factory">`applets`</a> object will be available in the global scope. That is, from any script, you can now run:

```
applets.register() // etc.
```

### Going further

For a more detailed example of creating an applet, follow our <a href="/docs/web-applets//guides/creating-an-applet"> guide</a>.

<a id="client"></a>

## Creating a client

> Want to create a client on a platform that isn't the web? Please <a href="https://github.com/unternet-co/web-applets/issues/new" target="_blank">create an issue on GitHub</a> and let us know!

To implement a Web Applets client, follow the same steps as above to create a web app that loads the Web Applets SDK, either through NPM or a polyfill.

First, you need to have an applet running in a `Window` object somewhere. In our case, we'll use an <a href="/docs/web-applets/reference/applet-frame-element">`<applet-frame>`</a> element, which is made available when you import the SDK.

Somewhere in a JavaScript file that's loaded by your app, write:

```javascript
const frame = document.createElement('applet-frame');
frame.src = 'https://applets.unternet.co/maps';
```

Now run the <a href="/docs/web-applets/reference/applet-factory#connect">`applets.connect()`</a> method to connect to the running applet:

```javascript
const applet = applets.connect(frame.contentWindow);
```

You can now send actions and receive data events from this applet.

```javascript
applet.addEventListener('data', (event) => {
  console.log(event.data);
});

applet.sendAction('search', { q: 'paris, france' });
// { q: 'paris, france', places: { ... } }
```
