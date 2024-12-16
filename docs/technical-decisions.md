# Technical decisions

- `setActionHandler` instead of `addActionHandler`, because we’re setting one handler not adding multiple
- We use `applets.getContext()` to create a new applet context. It's inspired by WebSockets and web media/context APIs. We don't use a class instantiation here, because there is only one applet context – you can't have multiple instances of an applet in the applet-side code.
