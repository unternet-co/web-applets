# Web Applets revision (2024.11)

## Goals

- Make it easier to understand & get started by simplifying the API
- Support a use case where the applet returns data but doesn't render a view
- Pave the way for future features like dynamic actions, dynamic parameters, global state, direct applet js imports, etc.

## Proposed changes

- New `applet.defineAction` function to create actions in code and assign them handlers
- Actions will have a `display` property that can indicate to the client whether/how to render the applet (this is especually useful for API-like actions that update the applet data, where you don't want to have to build a UI)
- Rename `state` to `data` to better reflect that this is a shared data object between the client & applet, not just internal app state
- All metadata should be contained in a standard web app manifest, so you don't need multiple manifests
- Add `applet.root` which defaults to `document.body` (in the future this might point to another DOM element – in particular if we allow direct JS imports for applets, see "Potential proposals")

## Examples

Let's imagine creating a new applet.

In `/index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      const applet = appletContext.connect();
    </script>
  </head>
  <body></body>
</html>
```

And add standard metadata to the web app manifest, at `/manifest.json`:

```json
{
  "name": "Database",
  "short_name": "DB",
  "description": "A database for storing data.",
  "actions": [
    {
      "id": "list_entries",
      "params": {
        "num": {
          "type": "number",
          "description": "THe number of entries to list"
        }
      }
    }
  ]
}
```

You now have a basic web applet (that doesn't do anything yet).

To assign an action handler to the `list_entries` action in the manifest:

```js
function listEntries(params) {
  const results = db.list(params.num);
  applet.data = results;
}

applet.setActionHandler('list_entries', listEntries);
```

You can also declare new actions from scratch in JS:

```js
function searchDatabase(params) {
  const results = db.search(params.query);
  applet.data = results;
}

applet.defineAction('search_database', {
 	display: "none",
  params: {
    query: {
      type: "string",
      description: "The user's search query"
    }
  },
  handler: searchDatabase,
}
```

Now we can render the UI by responding to the 'data' event:

```js
applet.ondata = () => {
  applet.root.innerHTML = '';
  // Your updates here, defaults to document.body
  // Or do something with a React renderer, whatever
};
```

## Potential proposals

There are a few things I haven't included here yet, that I'd be open to adding if the priority was high enough.

### Creating an applet in a single JS file

You can now create an applet completely within JS and import it, just like a component (for use within your own apps – to publish an applet for anyone on the web to use, you'll need to create an index.html file and manifest). You should only use this option for trusted code.

Declaring an applet:

```js
const spotifyApplet = appletContext.connect();

spotifyApplet.manifest = {
  name: 'Spotify',
  description: 'Play all your favorite music.',
};

export default spotifyApplet;
```

Defining an action:

```js
function searchSongs(params) {
  const results = spotify.search(params.query);
  applet.data = { searchResults: results };
}

applet.defineAction('search_songs', {
  display: 'frame', // none, inline, frame, auto (default)
  handler: searchSongs,
  params: {
    query: {
      type: 'string',
      description: 'Search query',
    },
  },
});
```

### Declaring available actions

By default, all defined actions will be added to `applet.availableActions`. But you can set this directly after defining, to only allow a subset of actions to be taken.

```js
applet.setAvailableActions(['search_database']);
```

### Dynamic parameters

Having a way to fill parameters on the fly, based on the applet state.

```js
applet.defineAction({
  name: 'book_flight',
  params: {
    // static defaults
  },
  getParams: async () => {
    // dynamic params based on current data
  },
});
```

### Global store

We need somewhere to store things like settings, or state for that all applets of the same kind need to share. This might be part of a more general applet storage API, that can handle applet state you don't want the client to see,

```js
applet.globalStore.set('key', 'value');
// or
applet.global.data = {
  // ...
};
// or
applet.storage.set('key', 'value', { global: true });
```

### Window targets

Having target window types, so we can create a new window if the current type isn't appropriate. Useful for when you're going from a list of documents to an individual document, for example.

```js
applet.defineAction('search_database', {
 	display: "frame",
  target: "player", // if not in player mode, will create new instance
  params: {
    query: {
      type: "string",
      description: "The user's search query"
    }
  },
  handler: searchDatabase,
}
```
