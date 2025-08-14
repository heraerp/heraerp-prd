import { defineConfig } from '@playwright/test'

// Procurement-specific test configuration
export default defineConfig({
  testDir: './tests/e2e/procurement',
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  fullyParallel: false, // Run procurement tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Single worker for procurement tests
  reporter: [
    ['html', { outputFolder: 'playwright-report-procurement' }],
    ['json', { outputFile: 'test-results-procurement.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: !!process.env.CI,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Mario restaurant test credentials
    storageState: undefined // Fresh login for each test
  },
  projects: [
    {
      name: 'Mario Restaurant Procurement',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Additional procurement-specific settings
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write']
        }
      }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI
  }
})