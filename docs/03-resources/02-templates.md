---
layout: docs
title: Templates - Web Applets
tags: docs
eleventyNavigation:
  key: Templates
  parent: Resources & Tools
  order: 2
---

# Templates

We've prepared a <a href="https://github.com/unternet-co/web-applet-template-ts-vite" target="_blank">template</a> that can be cloned to quickly spin up a new Web Applet using TypeScript, and <a href="https://vite.dev" target="_blank">Vite</a> for bundling.

```bash
git clone https://github.com/unternet-co/web-applet-template-ts-vite.git
```

This creates a folder with the following structure:

```
.
├── index.html
├── package-lock.json
├── package.json
├── public
│   ├── icon-128x128.png
│   └── manifest.json
├── src
│   └── main.ts
└── vite.config.js
```

A sample action has been added to the `manifest.json` with a corresponding handler in `main.ts` that you can override.

For a sample web applet that uses this template, see [our applet creation guide](/docs/web-applets/guides/creating-an-applet).
