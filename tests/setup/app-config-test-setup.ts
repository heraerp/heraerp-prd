/**
 * HERA APP_CONFIG Test Setup
 * Smart Code: HERA.PLATFORM.CONFIG.TEST.SETUP.v2
 * 
 * Global test setup for APP_CONFIG snapshot testing
 * following the established Salon Staff preset testing patterns.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { config } from 'dotenv'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Load environment variables for testing
config({ path: '.env.test' })
config({ path: '.env.local' })
config({ path: '.env' })

// Ensure required environment variables are available
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Test directories
const testDirs = [
  'test-results',
  'snapshots',
  'snapshots/app-configs',
  'snapshots/comparisons',
  'coverage',
  'coverage/app-config'
]

// Global test setup
beforeAll(async () => {
  console.log('🚀 Setting up HERA APP_CONFIG test environment...')
  
  // Ensure test directories exist
  testDirs.forEach(dir => {
    const dirPath = join(process.cwd(), dir)
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  })
  
  // Set test-specific environment variables
  process.env.NODE_ENV = 'test'
  process.env.CI = process.env.CI || 'false'
  
  console.log('✅ APP_CONFIG test environment setup complete')
})

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up APP_CONFIG test environment...')
  
  // Cleanup can be added here if needed
  // For now, we preserve test artifacts for debugging
  
  console.log('✅ APP_CONFIG test environment cleanup complete')
})

// Test-level setup
beforeEach(async () => {
  // Reset any global state if needed
  // This runs before each individual test
})

// Test-level teardown
afterEach(async () => {
  // Cleanup after each test if needed
  // This runs after each individual test
})

// Global error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit the process in tests, but log the error
})

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Don't exit the process in tests, but log the error
})

// Console override for test output (optional)
const originalConsoleLog = console.log
const originalConsoleError = console.error

// Enhanced console logging for tests
console.log = (...args) => {
  if (process.env.VITEST_VERBOSE === 'true') {
    originalConsoleLog('[TEST]', ...args)
  }
}

console.error = (...args) => {
  originalConsoleError('[TEST ERROR]', ...args)
}

// Export test utilities
export const testUtils = {
  /**
   * Get test data directory
   */
  getTestDataDir(): string {
    return join(process.cwd(), 'tests', 'data', 'app-config')
  },
  
  /**
   * Get snapshots directory
   */
  getSnapshotsDir(): string {
    return join(process.cwd(), 'snapshots')
  },
  
  /**
   * Get test results directory
   */
  getTestResultsDir(): string {
    return join(process.cwd(), 'test-results')
  },
  
  /**
   * Check if running in CI environment
   */
  isCI(): boolean {
    return process.env.CI === 'true'
  },
  
  /**
   * Check if verbose logging is enabled
   */
  isVerbose(): boolean {
    return process.env.VITEST_VERBOSE === 'true'
  },
  
  /**
   * Get current test timeout
   */
  getTestTimeout(): number {
    return parseInt(process.env.VITEST_TEST_TIMEOUT || '30000')
  },
  
  /**
   * Sleep utility for async tests
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  },
  
  /**
   * Create mock APP_CONFIG entity
   */
  createMockAppConfig(overrides: Partial<any> = {}) {
    return {
      entity_id: '123e4567-e89b-12d3-a456-426614174000',
      entity_code: 'test-app',
      entity_name: 'Test Application',
      smart_code: 'HERA.PLATFORM.CONFIG.APP.TEST_APP.v2',
      organization_id: '00000000-0000-0000-0000-000000000000',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      created_by: '123e4567-e89b-12d3-a456-426614174001',
      updated_by: '123e4567-e89b-12d3-a456-426614174001',
      app_definition: {
        app_id: 'test-app',
        name: 'Test Application',
        version: '1.0.0',
        description: 'Test application for snapshot testing',
        entities: [],
        transactions: [],
        navigation: {
          main_menu: [],
          quick_actions: [],
          dashboards: []
        }
      },
      metadata: {
        snapshot_version: '2.0',
        generated_at: '2024-01-01T00:00:00.000Z',
        validation_status: 'valid',
        guardrail_compliance: true
      },
      ...overrides
    }
  },
  
  /**
   * Create mock field change
   */
  createMockFieldChange(overrides: Partial<any> = {}) {
    return {
      field_path: 'app_definition.name',
      change_type: 'modified',
      old_value: 'Old Name',
      new_value: 'New Name',
      impact_level: 'medium',
      ...overrides
    }
  },
  
  /**
   * Create mock snapshot comparison
   */
  createMockSnapshotComparison(overrides: Partial<any> = {}) {
    return {
      summary: {
        baseline_file: 'snapshots/baseline.json',
        current_file: 'snapshots/current.json',
        comparison_date: '2024-01-01T00:00:00.000Z',
        total_changes: 0,
        added_configs: [],
        removed_configs: [],
        modified_configs: [],
        unchanged_configs: []
      },
      detailed_changes: {},
      ...overrides
    }
  }
}

// Export environment info for tests
export const testEnvironment = {
  isCI: testUtils.isCI(),
  isVerbose: testUtils.isVerbose(),
  timeout: testUtils.getTestTimeout(),
  nodeEnv: process.env.NODE_ENV,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

console.log('📋 APP_CONFIG Test Environment Info:')
console.log(`  CI: ${testEnvironment.isCI}`)
console.log(`  Verbose: ${testEnvironment.isVerbose}`)
console.log(`  Timeout: ${testEnvironment.timeout}ms`)
console.log(`  Node Env: ${testEnvironment.nodeEnv}`)
console.log(`  Supabase URL: ${testEnvironment.supabaseUrl ? 'configured' : 'missing'}`)
console.log(`  Service Key: ${testEnvironment.hasServiceKey ? 'configured' : 'missing'}`)
console.log('✅ APP_CONFIG test setup loaded')