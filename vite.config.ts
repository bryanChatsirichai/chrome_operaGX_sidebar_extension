import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

/** Vite build config for the Chrome extension via CRXJS + React. */
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  css: {
    modules: {
      // Preserve original class names so shadow DOM HTML matches SCSS selectors.
      generateScopedName: '[local]'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
