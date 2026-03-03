import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  // Anchor Vite's config search to this directory, preventing it from
  // crawling up to the parent Next.js project's postcss.config.mjs.
  root: resolve(__dirname),
  css: {
    // Disable PostCSS processing entirely — this is a Node.js backend.
    postcss: {},
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/data/seed.ts', 'src/data/migrate.ts', 'src/index.ts'],
    },
  },
});
