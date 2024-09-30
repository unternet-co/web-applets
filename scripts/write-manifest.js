const fs = require('fs');
const path = require('path');

const applets = fs.readdirSync('applets');

const manifest = { applets: [] };

for (const applet of applets) {
  const appletManifest = JSON.parse(
    fs.readFileSync(`applets/${applet}/manifest.json`)
  );
  manifest.applets.push({
    name: appletManifest.name,
    description: appletManifest.description,
    url: `/applets/${applet}`,
  });
}

fs.writeFileSync('dist/applets/manifest.json', JSON.stringify(manifest));
