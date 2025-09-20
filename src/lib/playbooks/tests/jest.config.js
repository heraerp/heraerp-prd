/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript support
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        moduleResolution: 'node',
      },
    }],
  },
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../../$1',
  },
  
  // Test file patterns
  testMatch: [
    // Golden-path tests
    '**/tests/golden-path/**/*.test.ts',
    
    // Failure scenario tests
    '**/tests/failure-scenarios/**/*.test.ts',
    
    // Property-based tests
    '**/tests/property-based/**/*.test.ts',
    
    // Unit tests
    '**/tests/unit/**/*.test.ts',
    
    // Integration tests
    '**/tests/integration/**/*.test.ts',
    
    // Any other test files
    '**/tests/**/*.spec.ts',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    '/coverage/',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/lib/playbooks/**/*.{ts,tsx}',
    '!src/lib/playbooks/**/*.test.{ts,tsx}',
    '!src/lib/playbooks/**/*.spec.{ts,tsx}',
    '!src/lib/playbooks/tests/**/*',
    '!src/lib/playbooks/**/*.d.ts',
    '!src/lib/playbooks/**/index.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/playbooks/parser/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/playbooks/executor/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Test reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
    ['jest-html-reporter', {
      pageTitle: 'HERA Playbook Test Report',
      outputPath: './coverage/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      dateFormat: 'yyyy-mm-dd HH:MM:ss',
      theme: 'darkTheme',
    }],
  ],
  
  // Test timeouts
  testTimeout: 30000, // 30 seconds for regular tests
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/test-setup.ts'],
  
  // Test sequencer
  testSequencer: '<rootDir>/tests/setup/test-sequencer.js',
  
  // Bail on first failure (useful for CI)
  bail: false,
  
  // Verbose output
  verbose: true,
  
  // Max workers for parallel execution
  maxWorkers: process.env.CI ? 2 : '50%',
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Error on deprecated APIs
  errorOnDeprecated: true,
  
  // Notify on completion
  notify: false,
  notifyMode: 'failure-change',
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Roots
  roots: ['<rootDir>'],
  
  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  
  // Globals
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: process.env.CI !== 'true',
      },
    },
  },
};