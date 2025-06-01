import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    target: 'es2022', // ensures top-level await support and modern syntax
    rollupOptions: {
      input: {
        'thmlt-ai2-content-script': 'src/content/content-script.js',
      },
      output: {
        entryFileNames: 'content/[name].js',
        chunkFileNames: 'content/[name].js',
        dir: 'dist',
      },
    },
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    modulePreload: {
      polyfill: false, // since you're targeting modern Chrome
    },
  }
});
