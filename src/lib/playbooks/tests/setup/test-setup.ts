/**
 * Test setup that runs before each test file
 * Configure test utilities, mocks, and helpers
 */

import '@testing-library/jest-dom'

// Extend Jest matchers
expect.extend({
  toBeValidSmartCode(received: string) {
    const smartCodePattern = /^HERA\.[A-Z]+(\.[A-Z]+)*\.v\d+$/
    const pass = smartCodePattern.test(received)

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid smart code`
          : `expected ${received} to be a valid smart code (format: HERA.DOMAIN.SUBDOMAIN.TYPE.v1)`
    }
  },

  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`
    }
  },

  toContainTransaction(received: any[], transactionType: string) {
    const pass = received.some(t => t.transaction_type === transactionType)

    return {
      pass,
      message: () =>
        pass
          ? `expected transactions not to contain type ${transactionType}`
          : `expected transactions to contain type ${transactionType}`
    }
  }
})

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Set up test timeouts
jest.setTimeout(30000) // 30 seconds default

// Mock external services
jest.mock('@/lib/services/external-api', () => ({
  externalApi: {
    post: jest.fn().mockResolvedValue({ success: true }),
    get: jest.fn().mockResolvedValue({ data: [] })
  }
}))

// Mock database client for unit tests
jest.mock('@/lib/db/client', () => ({
  db: {
    query: jest.fn(),
    transaction: jest.fn()
  }
}))

// Helper functions for tests
global.createTestOrganization = () => ({
  id: 'test-org-123',
  name: 'Test Organization',
  settings: {}
})

global.createTestUser = () => ({
  id: 'test-user-123',
  email: 'test@example.com',
  organizationId: 'test-org-123'
})

global.createTestEntity = (type: string, name: string) => ({
  id: `test-entity-${Date.now()}`,
  entity_type: type,
  entity_name: name,
  organization_id: 'test-org-123',
  created_at: new Date().toISOString()
})

// TypeScript declarations for custom matchers and globals
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSmartCode(): R
      toBeWithinRange(floor: number, ceiling: number): R
      toContainTransaction(transactionType: string): R
    }
  }

  var createTestOrganization: () => any
  var createTestUser: () => any
  var createTestEntity: (type: string, name: string) => any
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})

// Export test utilities
export { createTestOrganization, createTestUser, createTestEntity }
