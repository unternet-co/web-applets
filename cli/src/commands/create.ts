import fs from 'fs-extra';
import path from 'path';
import { loadConfig } from '../config';

export async function create(nameArg: string) {
  const config = await loadConfig();
  let name = 'my-applet.applet';
  if (nameArg) name = nameArg;

  const templateSource = path.join(__dirname, '..', 'template', 'applet');
  const appletDest = path.join(
    process.cwd(),
    config.input.path,
    `${name}.applet`
  );

  try {
    // Check if the template directory exists
    if (!(await fs.pathExists(templateSource))) {
      console.error('Error: Template directory not found in the CLI package');
      process.exit(1);
    }

    // Check if the destination already exists
    if (await fs.pathExists(appletDest)) {
      console.error(`Error: An applet named '${name}.applet' already exists`);
      process.exit(1);
    }

    // Copy the template to the new applet directory
    await fs.copy(templateSource, appletDest);
    console.log(`Created '${name}.applet' in ./applets`);
    console.log(
      'Please update public/manifest.json & start developing according to the docs.'
    );
  } catch (error) {
    console.error('Error during applet creation:', error);
    process.exit(1);
  }
}
