# Web Applets documentation

Web Applets is a specification that allows for a type of modular web software that can be read and used by both humans and machines, all while running locally. Web Applets aims to solve the problem of "AI chatbot" apps that can only receive and output plain text. Instead, Web Applets allow you to use the reasoning capabilities of language models to actuate real software, read the results, and render rich, graphical views in response.

## Getting started

First, clone this repo and run `npm run install`. There are a few sample applets included in `/applets`.

To install the applets and start the playground, run `npm run playground`.

To interact with the applets in a chat-style UI, run `npm run chat`.

### Creating a new applet

The fastest way to create a new applet is by duplicating one of the applet folders in `/applets`. The folder title will be part of the URL of your applet, so make sure it doesn't include any spaces or other non-URL-safe characters.

---

## Messages

Applets can emit the following messages:

- `ready`
- `state`
- `actions` # list of available actions the applet can take

Applets can receive the following messages:

---

- `activate` # can send firstRun: boolean if not rehydrating, and share capabilities of the client
- `action`
- `state`

---

Views can emit the following messages:

- `ready`
- `action`

Views can receive the following messages:

- `state`

Action handlers can receive the following messages:

- `initialize`
- `connect`
- `action`
- `state`

Action handlers can emit the following messages:

- `state`
- `ready`
