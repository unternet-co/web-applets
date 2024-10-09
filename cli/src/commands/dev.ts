import { join, relative } from 'path';
import chokidar from 'chokidar';
import { build } from './build';
import debounce from 'lodash.debounce';
import { loadConfig } from '../config';

export async function dev(onChange?: () => Promise<void>) {
  const config = await loadConfig();
  const inputPath = join(process.cwd(), config.input.path);

  // Perform initial build
  await build();
  if (onChange && typeof onChange === 'function') await onChange();

  // Set up file watcher
  const watcher = chokidar.watch(inputPath, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      (path: string) => {
        const relativePath = relative(process.cwd(), path);
        if (relativePath.includes(`/${config.input.buildDir}/`)) {
          return true; // Ignore anything in the build directory
        }
        return false;
      },
    ],
    persistent: true,
    ignoreInitial: true,
  });

  const debouncedRebuild = debounce(async () => {
    console.log('Rebuilding applets...');
    try {
      await build();
      console.log('Rebuild completed successfully');
      if (onChange && typeof onChange === 'function') await onChange();
    } catch (error) {
      console.error('Rebuild failed:', error);
    }
  }, 1000); // 1 second debounce

  watcher.on('all', async (event, path) => {
    debouncedRebuild();
  });

  watcher.on('ready', () => {
    console.log('Watching for changes. Press Ctrl+C to exit.');
  });

  // Keep the process running
  process.stdin.resume();
}
