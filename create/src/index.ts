#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

const program = new Command();

program
  .name('@web-applets/create')
  .description('Create a new web applets project')
  .argument('[applet-name]')
  .action(create);

program.parse(process.argv);

export async function create(appletName: string) {
  appletName = appletName ?? 'my-applet';

  const templateDir = path.join(__dirname, 'template');
  const appletDest = path.join(process.cwd(), appletName);

  try {
    await fs.copy(templateDir, appletDest);
    console.log(`Created new applet '${appletName}'...`);
    process.stdout.write(`Installing dependencies...`);
    process.chdir(appletDest);
    execSync('npm install');
    process.stdout.write('Done!\n');
  } catch (error) {
    console.error('Error during applet creation:', error);
    process.exit(1);
  }
}
