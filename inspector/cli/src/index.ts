#!/usr/bin/env node

import { Command } from 'commander';
import express from 'express';
import path from 'path';

const program = new Command();

program
  .name('@web-applets/inspector')
  .description('Launch the web applets inspector.')
  .action(serve);

program.parse(process.argv);

export async function serve() {
  const port = 1234;
  const serverDir = path.join(__dirname, 'web');
  const app = express();
  app.use(express.static(serverDir));

  try {
    const server = app
      .listen(port, () => {
        console.log(`Applets inspector running at http://localhost:${port}`);
      })
      .on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying port ${port + 1}`);
          server.listen(port + 1);
        } else {
          console.error(err);
        }
      });
  } catch (error) {
    console.error('Error starting inspector web server:', error);
    process.exit(1);
  }
}
