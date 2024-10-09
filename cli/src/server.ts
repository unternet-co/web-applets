import { createServer } from 'vite';

async function startViteServer(root: string, port: number) {
  const server = await createServer({
    root,
    server: {
      port,
      open: true,
    },
  });

  await server.listen();
  server.printUrls();
}

startViteServer(process.argv[2], parseInt(process.argv[3], 10));
