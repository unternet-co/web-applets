# Web Applets

> An open spec & SDK for creating apps that agents can use.

💌 [Mailing List](https://groups.google.com/a/unternet.co/g/community)

## What is it?

**Web Applets is an open specification for building software that both humans and AI can understand and use together.** Instead of forcing AI to operate traditional point-and-click apps built for humans, Web Applets creates a new kind of software designed for human-AI collaboration.

Think of them a bit like Claude artifacts, but they *do stuff* & *work anywhere*!

![Demo of a web applets chatbot](./docs/assets/applets-chat-demo.gif)

Think of any web software you use today - maps, documents, shopping, calendars - and imagine if instead of visiting these as separate websites, you could pull them into your own environment where both you and AI could use them together seamlessly. Web applets can do that!

- **Built on Web Standards:** Create applets using familiar web technologies (HTML, CSS, JavaScript, React, Vue, etc.)
- **AI-Native Protocol:** Applets expose their state and actions in a way AI can understand and use
- **Rich Interfaces:** Full support for complex graphical UIs, not just text
- **Local-First:** Runs in your environment, keeping your data under your control
- **Composable:** Applets can work together, sharing context and state
- **Open Standard:** Designed for interoperability across clients, not platform lock-in

## Example

Let's say we have a simple website that says hello. It might look something like this:

`index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <script src="./main.js" type="module"></script>
  <body>
    Hello! <span id="name">whoever you are</span>.
  </body>
</html>
```

Let's add some Web Applets functionality, so this can respond to a `set_name` message:

`main.js`:

```js
import { applets } from '@web-applets/sdk';

const context = applets.getContext();

// Define a 'set_name' action, and make it update the shared data object with the new name
context.defineAction('set_name', {
  params: {
    name: {
      type: string,
      description: 'The name of the person to be greeted.',
    },
  },
  handler: ({ name }) => applet.data = { name };
});

// Whenever the data is updated, update the view
context.ondata = () => {
  document.getElementById('name').innerText = applet.data.name;
};
```

Done! If you load this up in the inspector and introduce yourself, it will respond by greeting you.

To use this applet, we need to load it in our host web app using the SDK. Assuming the applet lives in our public directory, here's what that might look like:

```js
const applet = await applets.load('/helloworld.applet');
applet.onstateupdated = (state) => console.log(state);
applet.dispatchAction('set_name', { name: 'Web Applets' });
// { name: 'Web Applets' }
```

For a live example you can download and play with now, check out the [applets chat demo](https://github.com/unternet-co/applets-chat).

## Getting started

Create a new web app with the applets SDK installed. You can do this quickly using our CLI:

```bash
npx @web-applets/create
```

Inside the generated folder, you'll find a basic web app setup:

- `public/manifest.json`: A web app manifest, useful when publishing your applet, adding icons, etc.
- `index.html`: Much like a website, this holds the main page for your applet
- `src/main.ts`: Declares functions that respond to each action, and a render function that updates the view based on state

> Want to use React? Svelte? Vue? – No problem, just install the dependencies and create an app the way you normally would in a website. So long as you're receiving the action events, it will all just work.

Now if you run `npx @web-applets/inspector`, you should be able to test out your new applet directly. This applet will now work in any environment where the SDK is installed.

![A screenshot showing the 'playground' editing UI, with a web applets showing 'Hello, Web Applets'](docs/assets/web-applets-playground.png)

## Integrating Web Applets into your client

Using Web Applets is just as easy as creating them!

Install & import the applets client in your app:

```bash
npm install @web-applets/sdk
```

```js
import { applets } from '@web-applets/sdk';
```

Now you can import your applets from wherever they're being served from (note – you can also host them anywhere on the web):

```js
const applet = await applets.load('/helloworld.applet'); // replace with an https URL if hosted remotely
applet.ondata = (e) => console.log(e.data);
applet.dispatchAction('set_name', { name: 'Web Applets' });
```

The above applet is actually running headless, but we can get it to display by attaching it to a container. For the loading step, instead run:

```js
const container = document.createElement('iframe');
document.body.appendChild(container);
const applet = await applets.load(`/helloworld.applet`, container);
```

To load pre-existing saved data into an applet, simply set the data property:

```js
applet.data = { name: 'Ada Lovelace' };
// console.log: { name: "Ada Lovelace" }
```

## Feedback & Community

This is a community project, and we're open to community members discussing the project direction, and submitting code!

To join the conversation, visit the Applets mailing list [here](https://groups.google.com/a/unternet.co/g/community). You can also find more about the company that's kicking off this work at [unternet.co](https://unternet.co)

## License

[MIT](./LICENSE.md)

---

Built by [Unternet](https://unternet.co).
