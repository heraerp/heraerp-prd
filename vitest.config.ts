import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/contracts': path.resolve(__dirname, './src/contracts'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
});