import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppletProjectConfig } from '../types';
import { isAppletFolder } from '../utils';
import { loadConfig } from '../config';
const execAsync = promisify(exec);

export async function build() {
  try {
    const config = await loadConfig();
    const inputPath = path.resolve(process.cwd(), config.input.path);
    const outputPath = path.resolve(process.cwd(), config.output.path);
    const appletFolders = await fs.readdir(inputPath);

    for (const folder of appletFolders) {
      const appletPath = path.join(inputPath, folder);

      if (await isAppletFolder(appletPath)) {
        console.info(`Building applet: ${folder}`);
        console.log(appletPath);
        await execAsync('npm run build', { cwd: appletPath });

        // Copy build directory to output
        const buildDir = path.join(appletPath, config.input.buildDir);
        const outputDir = path.join(outputPath, folder);

        await fs.ensureDir(outputDir);
        await fs.copy(buildDir, outputDir);
      }
    }

    writeManifest(config);
  } catch (e) {
    console.error('Failed to build applets.\n\n', e);
    process.exit(1);
  }
}

export async function writeManifest(config: AppletProjectConfig) {
  const appletOutputDir = path.resolve(process.cwd(), config.output.path);
  const appletPaths = fs.readdirSync(appletOutputDir);
  const manifest = { applets: [] as string[] };

  for (let appletName of appletPaths) {
    const appletPath = path.resolve(
      process.cwd(),
      `${config.output.path}/${appletName}`
    );

    if (await isAppletFolder(appletPath)) {
      const baseUrl = trimSlashes(config.output.baseUrl);
      manifest.applets.push(`${baseUrl}/${appletName}`);
    }
  }

  fs.writeFileSync(
    `${appletOutputDir}/manifest.json`,
    JSON.stringify(manifest, null, 2)
  );
}
// export async function writeManifest(config: AppletProjectConfig) {
//   const outputPath = path.resolve(process.cwd(), config.output.path);
//   const paths = fs.readdirSync(outputPath);
//   const manifest = { applets: [] as AppletHeader[] };

//   for (let appletName of paths) {
//     const appletPath = path.resolve(
//       process.cwd(),
//       `${config.output.path}/${appletName}`
//     );
//     if (await isAppletFolder(appletPath)) {
//       const appletManifestJson = fs.readFileSync(
//         `${appletPath}/manifest.json`,
//         'utf-8'
//       );
//       const appletManifest = JSON.parse(appletManifestJson);

//       const header = {
//         name: appletManifest.name,
//         description: appletManifest.description,
//         url: `${
//           config.output.baseUrl === '/' ? '' : config.output.baseUrl
//         }/${appletName}`,
//         actions: [],
//       } as AppletHeader;

//       for (const action of appletManifest.actions) {
//         header.actions.push({
//           id: action.id,
//           description: action.description,
//           params: {},
//         });

//         for (const paramId in action.params) {
//           header.actions[header.actions.length - 1].params[paramId] =
//             action.params[paramId].description;
//         }
//       }

//       manifest.applets.push(header);
//     }
//   }

//   fs.writeFileSync(
//     `${outputPath}/manifest.json`,
//     JSON.stringify(manifest, null, 2)
//   );
// }

function trimSlashes(str: string) {
  return str.replace(/^\/+|\/+$/g, '');
}
