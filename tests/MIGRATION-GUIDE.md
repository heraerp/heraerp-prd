# Testing Migration Guide

## Overview

This guide helps migrate existing tests to the new enterprise testing structure.

## Changes Made

### 1. Test File Locations

All test files have been reorganized:

| Old Location | New Location | Reason |
|--------------|--------------|---------|
| `src/**/__tests__/*.test.ts` | `tests/unit/**/*.test.ts` | Centralized test location |
| `src/**/api/**/__tests__/*.test.ts` | `tests/api/**/*.api.test.ts` | Clear API test separation |
| `tests/*.test.js` | `tests/legacy/*.test.js` | Legacy tests archived |
| `tests/generated/` | Keep as-is (auto-generated) | Review for removal later |

### 2. Test Naming Conventions

| Test Type | Old Pattern | New Pattern | Example |
|-----------|-------------|-------------|---------|
| Unit Tests | `*.test.ts` | `*.test.ts` | `Button.test.tsx` |
| API Tests | `*.test.ts` | `*.api.test.ts` | `route.api.test.ts` |
| E2E Tests | `*.spec.ts` | `*.e2e.spec.ts` | `login.e2e.spec.ts` |
| Integration | Various | `*.integration.test.ts` | `db.integration.test.ts` |

### 3. Configuration Changes

#### Removed Files:
- `playwright-procurement.config.ts` - Use main playwright.config.ts
- `tests/e2e/salon/customers.config.ts` - Use main config
- `tests/e2e/procurement/procurement.config.ts` - Use main config

#### Updated Files:
- `jest.config.js` - Now uses project-based configuration
- `playwright.config.ts` - Supports both `*.spec.ts` and `*.e2e.spec.ts` (temporary)
- `package.json` - Consolidated test scripts

### 4. Package.json Script Changes

| Old Script | New Script | Purpose |
|------------|------------|---------|
| `test:new-apis` | `test:api:jest` | Run API tests with Jest |
| `test:unit` | `test:unit` | Updated to use new location |
| Various individual | `test:enterprise` | Unified test runner |

### 5. New Test Commands

```bash
# Run all tests with enterprise standards
npm run test:enterprise:all

# Run specific test types
npm run test:enterprise:unit
npm run test:enterprise:api
npm run test:enterprise:e2e

# Run with options
./scripts/run-tests.sh -t unit -c  # Unit tests with coverage
./scripts/run-tests.sh -t e2e -b firefox -h  # E2E in Firefox with UI
```

## Migration Steps

### For Existing Tests:

1. **Unit Tests in src/**
   ```bash
   # Tests have been moved to:
   tests/unit/lib/onboarding/
   tests/unit/lib/salon/
   ```

2. **API Tests**
   ```bash
   # Tests have been moved to:
   tests/api/v1/digital-accountant/
   tests/api/v1/finance/
   tests/api/v1/provisioning/
   ```

3. **Update Imports**
   If your tests import from test helpers:
   ```typescript
   // Old
   import { mockHelper } from '../../../test/helpers';
   
   // New
   import { mockHelper } from '@test/helpers';
   ```

### For New Tests:

1. **Choose Correct Location**
   - Unit tests: `tests/unit/[module]/`
   - API tests: `tests/api/v1/[endpoint]/`
   - E2E tests: `tests/e2e/[feature]/`
   - Integration: `tests/integration/[system]/`

2. **Use Correct Naming**
   - Unit: `ComponentName.test.tsx`
   - API: `endpoint.api.test.ts`
   - E2E: `feature.e2e.spec.ts`
   - Integration: `system.integration.test.ts`

3. **Use Test Factories**
   ```typescript
   import { OrganizationFactory, UserFactory } from '@test/fixtures/factories';
   
   const org = OrganizationFactory.createSalon();
   const user = UserFactory.createOwner();
   ```

## Temporary Compatibility

The following compatibility measures are in place:

1. **Playwright** accepts both `*.spec.ts` and `*.e2e.spec.ts`
2. **Legacy tests** preserved in `tests/legacy/`
3. **Old test scripts** marked with `:old` suffix

These should be removed after full migration.

## Next Steps

1. Rename all E2E tests from `*.spec.ts` to `*.e2e.spec.ts`
2. Review and remove `tests/generated/` if not needed
3. Update any CI/CD pipelines to use new test scripts
4. Remove legacy compatibility after migration complete

## Questions?

Refer to:
- `tests/ENTERPRISE-TESTING-README.md` - Full testing guide
- `tests/ENTERPRISE-TESTING-STANDARDS.md` - Testing standards
- Team leads for migration assistance