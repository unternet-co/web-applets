import { join, resolve } from 'path';
import { dev } from './dev';
import { createServer } from 'vite';
import { copySync, readdir } from 'fs-extra';
import { loadConfig } from '../config';
import opener from 'opener';

export async function playground() {
  const config = await loadConfig();
  const outputPath = resolve(process.cwd(), config.output.path);
  const playgroundPath = resolve(__dirname, '../playground');
  const port = config.playground.port;

  console.log('Starting playground...');

  async function copyApplets() {
    try {
      const applets = await readdir(outputPath);
      for (const applet of applets) {
        const srcPath = join(outputPath, applet);
        const destPath = join(playgroundPath, 'applets', applet);
        copySync(srcPath, destPath);
      }
      console.log('Synced applets to playground.');
    } catch (error) {
      console.error('Error syncing applets:', error);
    }
  }

  console.log(playgroundPath);
  dev(copyApplets);

  const server = await createServer({
    root: playgroundPath,
    server: {
      port,
    },
  });

  await server.listen();

  const url = `http://localhost:${port}`;
  console.log(`Playground running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop');
  opener(url);
}
