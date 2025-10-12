/**
 * HERA Product Costing v2: Test Environment Configuration
 * 
 * Environment variable setup for Product Costing v2 tests with proper
 * defaults and validation for CI/CD environments.
 * 
 * Smart Code: HERA.COST.PRODUCT.TEST.ENV.V2
 */

// Set default test environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api'

// Supabase configuration (required)
if (!process.env.SUPABASE_URL) {
  console.warn('⚠️  SUPABASE_URL not set, using localhost default')
  process.env.SUPABASE_URL = 'http://localhost:54321'
}

if (!process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️  SUPABASE_ANON_KEY not set, tests may fail')
  process.env.SUPABASE_ANON_KEY = 'your-anon-key-here'
}

// Test-specific configuration
process.env.JEST_TIMEOUT = process.env.JEST_TIMEOUT || '30000'
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.SUPABASE_URL

// API versioning for tests
process.env.HERA_API_VERSION = 'v2'

// Logging configuration
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'warn'

// Performance test configuration
process.env.PERF_TEST_ENABLED = process.env.PERF_TEST_ENABLED || 'true'
process.env.PERF_TEST_ITERATIONS = process.env.PERF_TEST_ITERATIONS || '100'

// Security test configuration
process.env.SECURITY_TEST_ENABLED = process.env.SECURITY_TEST_ENABLED || 'true'

// Coverage configuration
process.env.COVERAGE_THRESHOLD = process.env.COVERAGE_THRESHOLD || '85'

// Test organization IDs
process.env.TEST_ORG_ID_PRODUCT_COSTING = 'test-org-product-costing-v2'
process.env.TEST_ORG_ID_SYSTEM = '00000000-0000-0000-0000-000000000000'

// Export configuration for use in tests
export const TEST_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  API_URL: process.env.TEST_API_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  DATABASE_URL: process.env.TEST_DATABASE_URL,
  
  // Test configuration
  JEST_TIMEOUT: parseInt(process.env.JEST_TIMEOUT!),
  PERF_TEST_ENABLED: process.env.PERF_TEST_ENABLED === 'true',
  SECURITY_TEST_ENABLED: process.env.SECURITY_TEST_ENABLED === 'true',
  COVERAGE_THRESHOLD: parseInt(process.env.COVERAGE_THRESHOLD!),
  
  // Organization IDs
  ORG_ID_PRODUCT_COSTING: process.env.TEST_ORG_ID_PRODUCT_COSTING!,
  ORG_ID_SYSTEM: process.env.TEST_ORG_ID_SYSTEM!,
  
  // API configuration
  API_VERSION: process.env.HERA_API_VERSION!,
  LOG_LEVEL: process.env.LOG_LEVEL!
}

// Validate critical environment variables
const criticalVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'TEST_API_URL'
]

const missingCriticalVars = criticalVars.filter(varName => !process.env[varName])
if (missingCriticalVars.length > 0) {
  console.error(`❌ Missing critical environment variables: ${missingCriticalVars.join(', ')}`)
  console.error('Please set these variables before running tests')
}

console.log(`📝 Test environment configuration loaded:`)
console.log(`   - Node Environment: ${TEST_ENV.NODE_ENV}`)
console.log(`   - API URL: ${TEST_ENV.API_URL}`)
console.log(`   - API Version: ${TEST_ENV.API_VERSION}`)
console.log(`   - Jest Timeout: ${TEST_ENV.JEST_TIMEOUT}ms`)
console.log(`   - Performance Tests: ${TEST_ENV.PERF_TEST_ENABLED ? 'Enabled' : 'Disabled'}`)
console.log(`   - Security Tests: ${TEST_ENV.SECURITY_TEST_ENABLED ? 'Enabled' : 'Disabled'}`)
console.log(`   - Coverage Threshold: ${TEST_ENV.COVERAGE_THRESHOLD}%`)

export default TEST_ENV