import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright config for manual testing
 * Assumes dev server is already running
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/rebate-agreement-simple.spec.ts'],
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Retry on CI only */
  retries: 0,
  /* Opt out of parallel tests */
  workers: 1,
  /* Reporter to use */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/reports/html-simple' }]
  ],
  
  /* Shared settings */
  use: {
    /* Base URL - dev server is running on 3003 */
    baseURL: 'http://localhost:3003',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Capture screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Record videos on failure */
    video: 'retain-on-failure',
    
    /* Global timeout settings */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* Configure projects for chromium only */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  /* DO NOT start webServer - assume it's already running */
});