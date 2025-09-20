/**
 * Global setup for all playbook tests
 * Runs once before all test suites
 */

import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  console.log('🚀 Setting up global test environment for HERA Playbooks...');
  
  // Set up environment variables
  process.env.NODE_ENV = 'test';
  process.env.HERA_TEST_MODE = 'true';
  process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
  
  // Create necessary directories
  const dirs = [
    path.join(__dirname, '../coverage'),
    path.join(__dirname, '../test-results'),
    path.join(__dirname, '../temp'),
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  // Set up test database connection string (if needed)
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/hera_playbook_test';
  }
  
  // Set up test organization ID
  if (!process.env.TEST_ORGANIZATION_ID) {
    process.env.TEST_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000';
  }
  
  // Set up mock services (if needed)
  process.env.MOCK_EXTERNAL_SERVICES = 'true';
  
  // Initialize test data directory
  const testDataDir = path.join(__dirname, '../test-data');
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  
  console.log('✅ Global test environment ready');
  
  // Return a teardown function (optional)
  return async () => {
    // This runs after all tests are done
  };
}