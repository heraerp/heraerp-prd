import { defineConfig } from '@playwright/test'
import baseConfig from '../../../playwright.config'

export default defineConfig({
  ...baseConfig,
  
  // Test directory
  testDir: '.',
  
  // Test match pattern
  testMatch: /customers.*\.spec\.ts/,
  
  // Headless mode (default)
  use: {
    ...baseConfig.use,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  
  // Reduce parallel workers for CRUD tests to avoid conflicts
  workers: 1,
  
  // Retry failed tests once
  retries: 1,
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../../test-results/customers-report', open: 'never' }],
    ['json', { outputFile: '../../../test-results/customers-results.json' }],
  ],
})