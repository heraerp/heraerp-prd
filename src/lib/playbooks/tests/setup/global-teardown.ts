/**
 * Global teardown for all playbook tests
 * Runs once after all test suites
 */

import * as fs from 'fs'
import * as path from 'path'

export default async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...')

  // Clean up temporary files
  const tempDir = path.join(__dirname, '../temp')
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }

  // Close any open database connections
  // This would be implementation-specific

  // Clean up any test data created during tests
  if (process.env.CLEANUP_TEST_DATA === 'true') {
    const testDataDir = path.join(__dirname, '../test-data')
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true })
    }
  }

  // Generate final coverage report
  if (process.env.GENERATE_COVERAGE_REPORT === 'true') {
    console.log('📊 Generating final coverage report...')
    // This would typically be handled by Jest, but we can do additional processing here
  }

  console.log('✅ Global cleanup complete')
}
