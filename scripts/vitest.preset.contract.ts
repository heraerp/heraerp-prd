import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['scripts/tests/**/*.test.ts'],
    reporters: 'default',
    globals: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src')
    }
  }
})