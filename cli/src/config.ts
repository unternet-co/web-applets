import fs from 'fs-extra';
import path from 'path';
import { AppletProjectConfig } from './types';
import merge from 'lodash.merge';

const defaultConfig: AppletProjectConfig = {
  input: {
    path: './applets',
    buildDir: 'dist',
    buildCommand: 'npm run build',
  },
  output: {
    path: './build',
    baseUrl: '/',
    createRootManifest: true,
  },
  playground: {
    port: 3000,
  },
};

export async function loadConfig() {
  let config = defaultConfig;

  try {
    const configPath = path.resolve(process.cwd(), 'applets.config.json');

    if (fs.existsSync(configPath)) {
      const configJson = await fs.readFile(configPath, 'utf-8');
      const configObj = (await JSON.parse(configJson)) as AppletProjectConfig;
      config = merge(defaultConfig, configObj);
    }
  } catch (error) {
    console.error('Failed to load config.\n\n', error);
    process.exit(1);
  }

  return config;
}
