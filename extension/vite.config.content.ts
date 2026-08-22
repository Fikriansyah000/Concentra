import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate Vite config for content script: builds as IIFE (not ES module)
// Chrome content_scripts in manifest.json are loaded as classic scripts,
// so they CANNOT use ES module import/export statements.
export default defineConfig({
  base: '',
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't wipe other build output
    lib: {
      entry: resolve(__dirname, 'src/content/content.ts'),
      name: 'ConcentraContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
