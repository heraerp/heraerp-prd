/**
 * Playwright configuration for Furniture Module E2E tests
 */

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: '../../../tests/reports/furniture-module' }],
    ['list'],
    ['json', { outputFile: '../../../tests/reports/furniture-test-results.json' }],
    ['junit', { outputFile: '../../../tests/reports/furniture-junit.xml' }]
  ],
  
  /* Configure timeouts */
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000 // 10 seconds for assertions
  },
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Capture screenshots on failure */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    /* Record videos on failure */
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    
    /* Global timeout settings */
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
    
    /* Furniture module specific headers */
    extraHTTPHeaders: {
      'x-organization-id': process.env.FURNITURE_TEST_ORG_ID || 'furniture-test-org',
      'x-test-environment': 'furniture-e2e',
      'x-module': 'furniture'
    }
  },
  
  /* Configure projects for different test scenarios */
  projects: [
    {
      name: 'furniture-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'furniture-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    {
      name: 'furniture-mobile',
      use: { 
        ...devices['iPhone 13'],
        // Mobile tests for responsive furniture module
      },
    },
    
    {
      name: 'furniture-tablet',
      use: {
        ...devices['iPad Pro'],
        // Tablet tests for warehouse/production floor usage
      },
    },
    
    /* Test specific workflows */
    {
      name: 'furniture-production',
      testMatch: '**/manufacturing-workflow.spec.ts',
      use: {
        // Production-specific configuration
        extraHTTPHeaders: {
          'x-test-scenario': 'production'
        }
      }
    },
    
    {
      name: 'furniture-sales',
      testMatch: '**/order-to-delivery-cycle.spec.ts',
      use: {
        // Sales-specific configuration
        extraHTTPHeaders: {
          'x-test-scenario': 'sales'
        }
      }
    },
    
    {
      name: 'furniture-ucr',
      testMatch: '**/ucr-business-rules.spec.ts',
      use: {
        // UCR testing configuration
        extraHTTPHeaders: {
          'x-test-scenario': 'ucr-validation'
        }
      }
    }
  ],
  
  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NEXT_PUBLIC_ENABLE_FURNITURE_MODULE: 'true',
      NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: process.env.FURNITURE_TEST_ORG_ID || 'furniture-test-org'
    }
  }
});