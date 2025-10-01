module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "import",
    "react",
    "react-hooks",
    "@next/eslint-plugin-next"
  ],
  extends: [
    "eslint:recommended",
    "@next/eslint-config-next",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: "detect"
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json"
      }
    }
  },
  rules: {
    // BAN ALL FOOT-GUNS AND ANYS
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    
    // Prevent lowercase version suffixes in smart codes
    'no-restricted-syntax': [
      'error',
      { selector: "Literal[value=/\\.v\\d+\\b/]", message: 'Use uppercase version suffix, e.g., .V1' }
    ],
    
    // EXPLICIT FUNCTION RETURN TYPES (CRITICAL FOR PROP CONTRACTS)
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        "allowExpressions": false,
        "allowTypedFunctionExpressions": true,
        "allowHigherOrderFunctions": false,
        "allowDirectConstAssertionInArrowFunctions": true,
        "allowConciseArrowFunctionExpressionsStartingWithVoid": false
      }
    ],
    
    // CONSISTENT TYPE DEFINITIONS - PREFER TYPE OVER INTERFACE
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    
    // CONSISTENT TYPE IMPORTS - EXPLICIT TYPE IMPORTS
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports",
        "disallowTypeAnnotations": false,
        "fixStyle": "separate-type-imports"
      }
    ],
    
    // IMPORT ORDERING - ALPHABETICAL AND ORGANIZED
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "type"
        ],
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "always",
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/contracts/**",
            "group": "internal",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"]
      }
    ],
    
    // NO FALLTHROUGH IN SWITCH STATEMENTS
    "no-fallthrough": "error",
    
    // NO UNUSED VARIABLES WITH UNDERSCORE EXCEPTION
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ],
    
    // PREFER CONST FOR IMMUTABILITY
    "prefer-const": "error",
    
    // NO VAR - USE LET/CONST
    "no-var": "error",
    
    // NO HARDCODED VALUES THAT SHOULD BE CONSTANTS
    "no-magic-numbers": [
      "error",
      {
        "ignore": [0, 1, -1, 2],
        "ignoreArrayIndexes": true,
        "ignoreDefaultValues": true,
        "detectObjects": false
      }
    ],
    
    // REACT SPECIFIC RULES
    "react/prop-types": "off", // We use TypeScript for prop validation
    "react/display-name": "error",
    "react/jsx-uses-react": "off", // Not needed in React 17+
    "react/react-in-jsx-scope": "off", // Not needed in React 17+
    "react/jsx-no-leaked-render": "error",
    "react/jsx-key": "error",
    "react/no-array-index-key": "error",
    
    // REACT HOOKS RULES
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    
    // TYPESCRIPT SPECIFIC SAFETY RULES
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/no-misused-promises": "error",
    
    // IMPORT SAFETY
    "import/no-unresolved": "error",
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-useless-path-segments": "error",
    "import/no-duplicates": "error",
    
    // CONSOLE RESTRICTIONS
    "no-console": ["error", { "allow": ["warn", "error", "info"] }],
    
    // NEXT.JS SPECIFIC RULES
    "@next/next/no-html-link-for-pages": "error",
    "@next/next/no-img-element": "error",
    "@next/next/no-unwanted-polyfillio": "error",
    
    // HERA SPECIFIC RULES - CONTRACT-FIRST ENFORCEMENT
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["**/components/**"],
            "message": "Import components from @/components barrel exports only"
          },
          {
            "group": ["../contracts/*", "../../contracts/*"],
            "message": "Import contracts from @/contracts/* only"
          },
          {
            "group": ["react", "react-dom"],
            "importNames": ["FC", "FunctionComponent"],
            "message": "Use explicit function declarations with return types instead of FC/FunctionComponent"
          }
        ],
        "paths": [
          {
            "name": "any",
            "message": "Type 'any' is banned. Use specific types from @/contracts instead"
          },
          {
            "name": "unknown",
            "message": "Type 'unknown' should be avoided. Use specific types from @/contracts"
          },
          {
            "name": "@supabase/supabase-js",
            "message": "Call the v2 API routes; server-only data access happens in RPC services."
          }
        ],
        "patterns": [
          {
            "group": ["**/universal/v1/**"],
            "message": "V1 universal client is deprecated. Use @/lib/universal/v2/client instead."
          },
          {
            "group": ["**/lib/universal-api.ts", "**/lib/universal-api-v1.ts"],
            "message": "Legacy universal API imports banned. Use @/lib/universal/v2/client instead."
          }
        ]
      }
    ],
    
    // CONTRACT-FIRST DEVELOPMENT ENFORCEMENT
    "no-restricted-syntax": [
      "error",
      {
        selector: "Literal[value=/\\/api\\/v1\\//]",
        message: 'V1 endpoints are disallowed. Use /api/v2/.',
      },
      {
        "selector": "TSAnyKeyword",
        "message": "Type 'any' is forbidden. All types must be defined in @/contracts with Zod schemas"
      },
      {
        "selector": "TSUnknownKeyword",
        "message": "Type 'unknown' should be avoided. Use specific types from @/contracts"
      },
      {
        "selector": "ImportDeclaration[source.value=/^(?!@\\/contracts).*\\.types?$/]",
        "message": "Type imports must come from @/contracts only. Move types to appropriate contract files"
      },
      {
        "selector": "VariableDeclarator[id.name=/^(props|modalProps|componentProps)$/][init.type!='CallExpression'][init.callee.name!='exact']",
        "message": "Component props must use exact<T>() pattern to prevent prop drift"
      },
      {
        "selector": "FunctionDeclaration[id.name=/Component$/]:not([returnType])",
        "message": "Component functions must have explicit return type annotation (: JSX.Element)"
      },
      {
        "selector": "ArrowFunctionExpression[params.length>0]:not([returnType]):not([parent.type='CallExpression'])",
        "message": "Functions with parameters must have explicit return type annotations"
      },
      {
        "selector": "Literal[value=/^\\/api\\/(?!v2\\/)/]",
        "message": "Use /api/v2/* endpoints only. Legacy /api/ paths are deprecated. Use apiV2 client or fetchV2() instead."
      }
    ],
    
    // ADDITIONAL SAFETY RULES
    "eqeqeq": ["error", "always"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-return-await": "error",
    "require-atomic-updates": "error"
  },
  overrides: [
    {
      // SCRIPT FILES - RELAXED RULES
      files: ["scripts/**/*", "*.config.js", "*.config.ts"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "no-console": "off",
        "@typescript-eslint/no-var-requires": "off"
      }
    },
    {
      // TEST FILES - RELAXED RULES
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "no-magic-numbers": "off",
        "@typescript-eslint/no-non-null-assertion": "off"
      }
    },
    {
      // MCP SERVER - RELAXED RULES FOR NODE.JS
      files: ["mcp-server/**/*"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "no-console": "off",
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ],
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "dist/",
    "build/",
    "coverage/",
    "*.d.ts",
    "src/components_old/**/*"
  ]
};
