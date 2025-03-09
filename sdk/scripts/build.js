import esbuild from 'esbuild';
import process from 'process';

esbuild
  .build({
    entryPoints: ['./src/polyfill.js'],
    bundle: true,
    minify: true,
    outfile: './dist/web-applets.min.js',
  })
  .catch(() => {
    console.log('Failed to build web-applets.min.js');
    process.exit(1);
  });
