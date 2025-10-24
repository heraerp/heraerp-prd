const path = require('path')

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // Prevent duplicate imports (regression shield for lucide icons)
    'no-duplicate-imports': 'error',
    'import/no-duplicates': 'error',
    
    // HERA-specific rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    
    // Import organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',   // Node.js built-ins
          'external',  // npm packages
          'internal',  // Internal modules
          'parent',    // Parent directories
          'sibling',   // Same directory
          'index'      // Index files
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    
    // HERA compliance rules (custom)
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value="transaction_code"]',
        message: 'Use "transaction_number" instead of "transaction_code" (HERA Sacred Six compliance)'
      },
      {
        selector: 'Literal[value="from_entity_id"]', 
        message: 'Use "source_entity_id" instead of "from_entity_id" (HERA Sacred Six compliance)'
      },
      {
        selector: 'Literal[value="to_entity_id"]',
        message: 'Use "target_entity_id" instead of "to_entity_id" (HERA Sacred Six compliance)'
      }
    ],
    
    // React/Next.js specific
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Code quality
    'prefer-template': 'error',
    'no-var': 'error',
    'object-shorthand': 'error'
  },
  overrides: [
    {
      // Stricter rules for generated code
      files: ['src/app/*/page.tsx', 'src/lib/generators/*.ts'],
      rules: {
        'no-duplicate-imports': 'error',
        'import/no-duplicates': 'error',
        '@typescript-eslint/no-explicit-any': 'error', // Stricter for generated code
        'no-console': 'off' // Allow console in generators for debugging
      }
    },
    {
      // Test files can be more lenient
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off'
      }
    },
    {
      // Scripts can use console
      files: ['scripts/**/*.js', 'scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: path.join(__dirname, 'tsconfig.json')
  },
  env: {
    browser: true,
    node: true,
    es6: true
  },
  ignorePatterns: [
    '.next',
    'out',
    'build',
    'dist',
    'node_modules',
    '*.config.js'
  ]
}