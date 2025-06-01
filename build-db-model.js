const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/db/DatabaseModelForWorker.js'],
  bundle: true,
  outfile: 'dist/DatabaseModelForWorker.js',
  format: 'esm',
  sourcemap: true,
  minify: true,
}).catch(() => process.exit(1));
