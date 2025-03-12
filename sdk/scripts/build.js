import esbuild from 'esbuild';
import process from 'process';

esbuild
  .build({
    entryPoints: {
      'web-applets.min': './src/polyfill.js',
    },
    bundle: true,
    minify: true,
    outdir: './dist',
  })
  .catch(() => {
    console.log('Failed to build web-applets.min.js');
    process.exit(1);
  });
