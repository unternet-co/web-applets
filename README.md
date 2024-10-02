# Web Applets

> An open SDK to create interoperable actions & views for agents – _a web of capabilities!_

## What is it?

Web Applets is a specification for modular, local web software that can be read and used by both humans and machines. Web Applets aims to be an interoperabe application layer for agents – instead of chatbots that can only interact in plain text, Web Applets allow them to actuate real software, read the results, and render rich, graphical views in response.

Did we mention it's _interoperable_? We think the future of software should be open & collaborative, not locked down to a single platform.

## Getting started

First, clone this repo and run `npm run install`. There are a few sample applets included in `/applets`. To install these applets and start the playground, run `npm run playground`.

The fastest way to create a new applet is by duplicating one of the applet folders in `/applets`. The folder title will be part of the URL of your applet, so make sure it doesn't include any spaces or other non-URL-safe characters.

Inside your applet folder, you'll find a basic web app setup:

- `public/manifest.json`: This file describes the Applet, and tells the model what actions are available and what parameters each action takes
- `index.html`: Much like a website, this holds the main page for your applet
- `main.js`: Declares functions that respond to each action, and a render function that updates the view based on state

Let's say we want our applet to respond to a "set_name" action and render the user's name. In our `manifest.json` file we can write:

```json
{
  // ...
  "actions": [
    {
      "id": "set_name",
      "description": "Sets the name of the user to be greeted",
      "params": {
        "name": {
          "type": "string",
          "description": "The name of the user"
        }
      }
    }
  ]
}
```

Now let's update `main.ts` to assign an action handler:

```js
// First, import the SDK
import { appletContext, type AppletContext } from '../../sdk/src';

// Now connect to the applet runtime
const applet = appletContext.connect() as AppletContext;

// Attach the action handler, and update the state
applet.setActionHandler('set_name', ({ name }) => {
  applet.setState({ name });
});
```

When this state updates, it will inform the client which can then store the state somewhere, for example in a database so the applet will persist between uses.

Finally, we need to render the applet whenever a render signal is received. Again in `main.ts`:

```js
// ...

applet.onrender = () => {
  nameElem.innerText = applet.state.name;
};
```

Now if you run `npm run playground` from the project root, you should be able to test out your new applet action directly. This applet will now work in any environment where the SDK is installed.

## Integrating Web Applets into your client

Integrating Web Applets is just as easy as creating one. First, in your project, make sure you have the sdk installed:

```
npm install @unternet/web-applets
```

In your code, you can import the applets client:

```js
import { applets } from '@unternet/web-applets';
```

Now you can create a new applet from a URL:

```js
applet = await applets.load(`https://unternet.co/applets/helloworld.applet`);
applet.onstateupdated = (state) => console.log(state);
applet.dispatchAction('set_name', { name: 'Web Applets' });
// console.log: { name: "Web Applets" }
```

To load pre-existing saved state into an applet, simply set the state property:

```js
applet.state = { name: 'Ada Lovelace' };
// console.log: { name: "Ada Lovelace" }
```

It may also be helpful to check available applets at a domain, or in your local public folder if you've downloaded a set of Web Applets you want your product to use. For that you can extract the applet headers from the App Manifest at the public root (`/manifest.json`), and see the available applets and a shorthand for the actions you can take in them. This is automatically created when you build your applets.

```js
const headers = await applets.getHeaders('/');
```

This headers object looks like:

```json
[
  {
    "name": "Hello World",
    "description": "Displays a greeting to the user.",
    "url": "/applets/helloworld.applet",
    "actions": [
      {
        "id": "set_name",
        "description": "Sets the name of the user to be greeted",
        "params": {
          "name": "The name of the user"
        }
      }
    ]
  }
  // ...
]
```

You can use it to present a quick summary of available tools to your model, and then decide on an applet and action to use.

## Feedback & Community

## License

[MIT](./LICENSE.md)

---

Built by [Unternet](https://unternet.co).
