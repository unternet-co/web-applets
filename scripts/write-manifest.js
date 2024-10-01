const fs = require('fs');
const path = require('path');

const applets = fs.readdirSync('applets');

const manifest = { applets: [] };

for (const applet of applets) {
  const appletManifest = JSON.parse(
    fs.readFileSync(`dist/applets/${applet}.applet/manifest.json`)
  );

  const header = {
    name: appletManifest.name,
    description: appletManifest.description,
    url: `/applets/${applet}.applet`,
    actions: [],
  };

  for (const action of appletManifest.actions) {
    header.actions.push({
      id: action.id,
      description: action.description,
      params: {},
    });

    for (const paramId in action.params) {
      header.actions[header.actions.length - 1].params[paramId] =
        action.params[paramId].description;
    }
  }

  manifest.applets.push(header);
}

fs.writeFileSync(
  'dist/applets/manifest.json',
  JSON.stringify(manifest, null, 2)
);
