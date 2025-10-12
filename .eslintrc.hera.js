/**
 * HERA ESLint Configuration
 * Enforces HERA architectural patterns and coding standards
 */

module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    './eslint-rules/hera-patterns.js'
  ],
  rules: {
    // HERA Custom Rules
    'hera-patterns/smart-code-format': 'error',
    'hera-patterns/api-response-format': 'warn',
    'hera-patterns/no-status-columns': 'error',
    'hera-patterns/require-organization-id': 'error',
    'hera-patterns/consistent-exports': 'warn',
    'hera-patterns/smart-code-constants': 'warn',
    'hera-patterns/hera-naming-convention': 'warn',
    'hera-patterns/require-error-handling': 'error',

    // TypeScript Strict Rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // HERA Naming Conventions
    'camelcase': ['error', {
      properties: 'never',
      ignoreGlobals: true,
      allow: [
        'organization_id',
        'entity_type',
        'entity_name',
        'entity_id',
        'smart_code',
        'created_at',
        'updated_at'
      ]
    }],

    // Import/Export Standards
    'import/no-default-export': 'off', // Allow default exports for pages
    'import/prefer-default-export': 'off',
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'pathGroups': [
        {
          'pattern': '@/**',
          'group': 'internal',
          'position': 'before'
        }
      ],
      'pathGroupsExcludedImportTypes': ['builtin']
    }],

    // React/Next.js Best Practices
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'error',
    'react-hooks/exhaustive-deps': 'error',

    // General Code Quality
    'no-console': ['warn', { 
      allow: ['warn', 'error'] 
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error'
  },
  overrides: [
    // API Routes
    {
      files: ['src/app/api/**/*.ts'],
      rules: {
        'hera-patterns/require-error-handling': 'error',
        'hera-patterns/api-response-format': 'error',
        'hera-patterns/require-organization-id': 'error'
      }
    },
    // Database Functions
    {
      files: ['database/**/*.sql'],
      rules: {
        'hera-patterns/no-status-columns': 'error',
        'hera-patterns/smart-code-format': 'error'
      }
    },
    // Component Files
    {
      files: ['src/components/**/*.tsx'],
      rules: {
        'hera-patterns/hera-naming-convention': 'error',
        'hera-patterns/consistent-exports': 'error'
      }
    },
    // Hook Files
    {
      files: ['src/hooks/**/*.ts'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error'
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
}