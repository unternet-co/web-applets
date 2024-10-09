import fs from 'fs-extra';
import path from 'path';

export async function init() {
  const appletsDir = path.join(process.cwd(), 'applets');
  const configSource = path.join(__dirname, '../template/applets.config.json');
  const configDest = path.join(process.cwd(), 'applets.config.json');

  try {
    await fs.ensureDir(appletsDir);
    await fs.copy(configSource, configDest);
    console.log('Initialization complete. Your Web Applets project is ready!');
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}
