---
layout: docs
title: AppletFactory - Web Applets
tags: docs
eleventyNavigation:
  key: AppletFactory
  parent: Reference
  order: 1
---

# AppletFactory

This is the main entry point for both connecting to existing applets (from the host app) and registering new ones (from within an applet).

It is implemented by the `applets` object, which is either imported from the `@web-applets/sdk` node module, or part of the global scope if you've imported the Web Applets polyfill.

## Instance methods

<a id="connect"></a>

### AppletFactory.connect()

Connects from a client to an applet that's running inside a window (such as an iframe's `contentWindow` or a webview), and returns an Applet object representing the applet for the client.

The client uses this method to establish a communication channel with the applet window containing the applet implementation.

#### Syntax

```js
connect(window);
```

#### Parameters

`window`: A `Window` object containing the applet

#### Return value

A `Promise` that resolves to a new instance of `Applet` that provides access to the applet's actions and data from the client.

#### Exceptions

Throws an `AppletConnectionError` if the connection times out before it can be established.

<a id="register"></a>

### AppletFactory.register()

Creates and returns a new AppletScope object within the applet window, which represents the applet implementation and lets the host (parent window) know it's ready for connection.

This method is called from within the applet's own window and checks for a `<link rel="manifest" href="...">` tag, then instantiates the applet's properties and actions based on the contents of the manifest.

#### Syntax

```js
applets.register(manifest);
```

#### Parameters

`manifest`

An optional object that adheres to the Web App Manifest spec extension detailed in the "Manifest" section. You don't need to include this if you have an applet manifest linked in the html file.

#### Returnvalue

An `AppletScope` object representing the applet and its properties.
