#!/usr/bin/env node

import { Command } from 'commander';
import { build, create, dev, init, playground } from './commands';

const program = new Command();

program
  .name('web-applets')
  .description('CLI for building and running Web Applets');

program
  .command('init')
  .description('Initialize in current directory.')
  .action(init);

program
  .command('create')
  .argument('<name>', 'Name of the applet')
  .description('Create a new applet')
  .action(create);

program
  .command('build')
  .description('Build Web Applets for production')
  .action(build);

program
  .command('dev')
  .description('Start Web Applets in development mode')
  .action(dev);

program
  .command('playground')
  .description('Start Web Applets interactive playground.')
  .action(playground);

program.parse(process.argv);
