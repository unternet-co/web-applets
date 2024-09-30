import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

function copyJsonPlugin() {
  return {
    name: 'copy-json-files',
    writeBundle() {
      const applets = fs
        .readdirSync('applets', { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      for (const applet of applets) {
        const sourceDir = path.join('applets', applet);
        const targetDir = path.join('dist', 'applets', applet);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const files = fs.readdirSync(sourceDir);
        for (const file of files) {
          if (path.extname(file) === '.json') {
            fs.copyFileSync(
              path.join(sourceDir, file),
              path.join(targetDir, file)
            );
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [copyJsonPlugin()],
  build: {
    rollupOptions: {
      input: {
        ...Object.fromEntries(
          fs
            .readdirSync('applets', { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => [
              dirent.name,
              fileURLToPath(
                new URL(`./applets/${dirent.name}/index.html`, import.meta.url)
              ),
            ])
        ),
      },
      output: {
        dir: 'dist',
        entryFileNames: (chunkInfo) => {
          return `applets/${chunkInfo.name}/[name].[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const fileName = path.basename(assetInfo.name);
          const extType = path.extname(fileName).slice(1);
          if (extType !== 'html') {
            return `applets/[name]/assets/[name][extname]`;
          }
          return `applets/[name]/[name][extname]`;
        },
      },
    },
  },
});
