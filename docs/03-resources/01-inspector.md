# Inspector

The **Web Applets Inspector** is a utility for inspecting and debugging web applets.

With the Inspector you can view an applet and its properties, dispatch actions, and read the applet's internal data.

In addition, the Inspector incorporates a chat sidebar where you can experiment with using natural language to answer questions about the applet and send it actions, emulating real-world use.

Launch the Inspector from the command line using `npx`:

```bash
npx @web-applets/inspector
```

In the location bar at the top of the Inspector you can enter the URL of any running applet, including those running on a dev server on localhost.

For example, if you're using our Vite template, run `npx vite` to get the server running.

> **Note:** The Inspector will only work if your applet is currently running on a remote or local server, it can't open a folder directly.
