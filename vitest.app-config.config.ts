/**
 * Vitest Configuration for HERA APP_CONFIG Snapshot Tests
 * Smart Code: HERA.PLATFORM.CONFIG.TEST.CONFIG.v2
 * 
 * Specialized vitest configuration for APP_CONFIG snapshot testing
 * following the established Salon Staff preset testing patterns.
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Test discovery
    include: [
      'tests/app-config/**/*.test.ts',
      'tests/app-config/**/*.spec.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ],

    // Global test configuration
    globals: true,
    
    // Test timeouts
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 10000, // 10 seconds for setup/teardown
    
    // Setup files
    setupFiles: [
      'tests/setup/app-config-test-setup.ts'
    ],
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
      VITEST_POOL_ID: '1'
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: 'coverage/app-config',
      include: [
        'src/lib/validation/app-config-guardrails.ts',
        'src/lib/universal/supabase-app-builder.ts',
        'scripts/generate-app-config-snapshots.ts',
        'scripts/compare-app-config-snapshots.ts'
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Snapshot configuration
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false,
      callToJSON: true
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: 'test-results/app-config-test-results.json',
      html: 'test-results/app-config-test-results.html'
    },
    
    // Pool configuration for parallel testing
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        minForks: 1,
        maxForks: 4
      }
    },
    
    // Retry configuration
    retry: 2,
    
    // Watch configuration
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'snapshots/**',
      'test-results/**',
      'coverage/**'
    ]
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/tests': path.resolve(__dirname, 'tests')
    }
  },
  
  // Define for environment-specific code
  define: {
    __TEST__: true,
    __DEV__: false,
    __PROD__: false
  }
})