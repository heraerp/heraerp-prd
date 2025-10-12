/**
 * HERA Product Costing v2: Test Setup
 * 
 * Global test setup for Product Costing v2 test suite with database initialization,
 * environment validation, and shared test utilities.
 * 
 * Smart Code: HERA.COST.PRODUCT.TEST.SETUP.V2
 */

import { config } from 'dotenv'
import { beforeAll, afterAll } from '@jest/globals'

// Load environment variables
config({ path: '.env.local' })
config({ path: '.env.test' })
config({ path: '.env' })

// Global test configuration
const GLOBAL_TEST_TIMEOUT = 60000 // 60 seconds
const DB_CONNECTION_TIMEOUT = 10000 // 10 seconds

// Extend Jest matchers for better assertions
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false
      }
    }
  },
  
  toBeValidSmartCode(received: string) {
    const smartCodeRegex = /^HERA\.[A-Z]+(\.[A-Z]+)*\.V\d+$/
    const pass = smartCodeRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid smart code`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid smart code format`,
        pass: false
      }
    }
  },
  
  toBeValidCurrency(received: number) {
    const pass = typeof received === 'number' && 
                 received >= 0 && 
                 Number.isFinite(received) &&
                 Number((received).toFixed(2)) === received
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency amount`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid currency amount (non-negative, finite, max 2 decimal places)`,
        pass: false
      }
    }
  }
})

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R
      toBeValidSmartCode(): R
      toBeValidCurrency(): R
    }
  }
}

// Global setup function
beforeAll(async () => {
  console.log('🚀 Setting up HERA Product Costing v2 Test Suite...')
  
  // Validate required environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }
  
  // Set test-specific environment variables
  process.env.NODE_ENV = 'test'
  process.env.TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api'
  
  console.log('✅ Environment validation complete')
  console.log(`📊 Test API URL: ${process.env.TEST_API_URL}`)
  console.log(`🗄️  Supabase URL: ${process.env.SUPABASE_URL}`)
  
}, GLOBAL_TEST_TIMEOUT)

// Global teardown function
afterAll(async () => {
  console.log('🧹 Cleaning up HERA Product Costing v2 Test Suite...')
  console.log('✅ Test suite cleanup complete')
}, GLOBAL_TEST_TIMEOUT)

// Export test utilities
export const TEST_CONSTANTS = {
  TIMEOUT: {
    SHORT: 5000,    // 5 seconds
    MEDIUM: 15000,  // 15 seconds  
    LONG: 30000,    // 30 seconds
    VERY_LONG: 60000 // 60 seconds
  },
  
  ORG_IDS: {
    TEST: 'test-org-product-costing-v2',
    SYSTEM: '00000000-0000-0000-0000-000000000000'
  },
  
  SMART_CODES: {
    TEST_PRODUCT: 'HERA.COST.PRODUCT.TEST.V2',
    TEST_COMPONENT: 'HERA.COST.COMPONENT.TEST.V2',
    TEST_ACTIVITY: 'HERA.COST.ACTIVITY.TEST.V2'
  }
}

export const TEST_HELPERS = {
  /**
   * Generate a unique test identifier
   */
  generateTestId: (prefix: string = 'TEST'): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}-${timestamp}-${random}`.toUpperCase()
  },
  
  /**
   * Create a delay for async testing
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  },
  
  /**
   * Retry a function with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>, 
    maxAttempts: number = 3, 
    baseDelay: number = 1000
  ): Promise<T> => {
    let attempt = 1
    
    while (attempt <= maxAttempts) {
      try {
        return await fn()
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await TEST_HELPERS.delay(delay)
        attempt++
      }
    }
    
    throw new Error('Max attempts reached')
  },
  
  /**
   * Validate test database state
   */
  validateDatabaseState: async (supabase: any): Promise<boolean> => {
    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from('core_organizations')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('Database validation failed:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Database validation error:', error)
      return false
    }
  }
}

// Console logging for test environment
console.log(`
🧬 HERA Product Costing v2 Test Environment
==========================================
Environment: ${process.env.NODE_ENV}
API URL: ${process.env.TEST_API_URL}
Supabase URL: ${process.env.SUPABASE_URL}
Test Timeout: ${GLOBAL_TEST_TIMEOUT}ms
==========================================
`)

export default {
  TEST_CONSTANTS,
  TEST_HELPERS
}