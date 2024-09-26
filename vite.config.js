import { defineConfig } from "vite";
import fs from "fs";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        ...Object.fromEntries(
          fs
            .readdirSync("applets", { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => [
              `app${
                dirent.name.charAt(0).toUpperCase() + dirent.name.slice(1)
              }`,
              fileURLToPath(
                new URL(`./applets/${dirent.name}/index.html`, import.meta.url)
              ),
            ])
        ),
      },
    },
  },
});
