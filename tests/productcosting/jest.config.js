/**
 * HERA Product Costing v2: Jest Test Configuration
 * 
 * Enterprise-grade test configuration for Product Costing v2 test suite
 * with proper TypeScript support, timeout handling, and environment setup.
 * 
 * Smart Code: HERA.COST.PRODUCT.TEST.CONFIG.V2
 */

module.exports = {
  // Use TypeScript preset
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/productcosting/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/productcosting/setup.ts'
  ],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // TypeScript configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        lib: ['es2020'],
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      }
    }]
  },
  
  // Test timeouts
  testTimeout: 30000,
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/lib/productcosting/**/*.ts',
    'src/app/api/v2/products/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  coverageDirectory: 'coverage/productcosting-v2',
  
  // Minimum coverage thresholds
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test results processors
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results/productcosting-v2',
      outputName: 'junit.xml',
      suiteName: 'HERA Product Costing v2 Test Suite'
    }]
  ],
  
  // Environment variables
  setupFiles: [
    '<rootDir>/tests/productcosting/env.ts'
  ],
  
  // Error handling
  bail: false,
  verbose: true,
  
  // Performance optimization
  maxWorkers: '50%',
  
  // Global variables
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
}