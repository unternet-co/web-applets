import esbuild from 'esbuild';
import process from 'process';

esbuild
  .build({
    entryPoints: ['./src/polyfill.js'],
    bundle: true,
    minify: true,
    outfile: './dist/web-applets.min.js',
  })
  .catch(() => process.exit(1));
