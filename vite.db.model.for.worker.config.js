import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false, // disable copying a public directory
  build: {
    target: 'es2022', // support top-level await and modern syntax
    emptyOutDir: false, // clean output folder before build (recommended)
    minify: false,     // no minification, keep output readable/debuggable
    sourcemap: false,  // disable source maps for simplicity
    lib: {
      entry: 'src/db/DatabaseManagerForWorker.js',
      formats: ['es'],
      fileName: () => 'db/DatabaseManagerForWorker.js',
    },
    rollupOptions: {
      output: {
        // Use consistent folder structure
        entryFileNames: 'db/[name].js',
        chunkFileNames: 'db/[name].js',
        dir: 'src/background',
      },
      external: [], // Leave empty to force bundling Dexie, etc.
    },
    modulePreload: {
      polyfill: false, // no need for preload polyfill for modern Chrome
    },
  },
});
