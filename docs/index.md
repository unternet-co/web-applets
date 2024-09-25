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
