import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'presets',
    include: ['**/*.preset.test.{ts,tsx}', 'tests/presets/**/*.test.{ts,tsx}'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/preset-tests.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})