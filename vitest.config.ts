import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/tests/e2e/**' // Exclude e2e tests (use Playwright for those)
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/contracts': path.resolve(__dirname, './src/contracts'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/tools': path.resolve(__dirname, './src/tools'),
    },
  },
});