import { defineConfig } from 'vite';

// Relative base so the built site works from any folder or GitHub Pages subpath.
export default defineConfig({
  base: './',
  build: { assetsDir: 'build' },
  test: { environment: 'node' },
} as any);
