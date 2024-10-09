import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    root: './playground',
    build: {
      outDir: '../dist/playground',
    },
  };
});
