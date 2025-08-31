# HERA ERP - Playwright Testing Suite

This directory contains comprehensive API and UI testing for HERA ERP using Playwright, with a focus on API-first testing strategy.

## Overview

The test suite validates critical functionality across multiple HERA modules, with API tests for CRUD operations and minimal UI smoke tests to ensure the application meets business requirements.

## Test Structure

```
tests/
├── api/                                 # API-focused tests
│   └── icecream/
│       ├── entities.spec.ts             # Entity CRUD operations
│       ├── transactions.spec.ts         # Transaction management
│       └── multi-tenancy.spec.ts       # Organization isolation
├── e2e/                                 # End-to-end UI tests
│   ├── icecream/
│   │   └── smoke.spec.ts               # UI smoke tests
│   └── salon/
│       ├── appointments.spec.ts         # Appointment management
│       ├── clients.spec.ts              # Client management tests
│       ├── pos.spec.ts                  # Point of Sale tests
│       ├── services.spec.ts             # Service catalog tests
│       └── dashboard.spec.ts            # Dashboard functionality
├── fixtures/
│   └── api-fixtures.ts                  # Test fixtures and setup
└── helpers/
    ├── test-constants.ts                # Constants and test data
    └── supabase-test-client.ts          # Supabase API wrapper
```

## Running Tests

### Prerequisites

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run API tests only
npm run test:api

# Run ice cream module tests (API + UI)
npm run test:icecream

# Run ice cream API tests only
npm run test:icecream:api

# Run ice cream UI tests only
npm run test:icecream:ui

# Run salon tests only
npm run test:e2e:salon

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run navigation tests only
npx playwright test navigation-fixed.spec.ts

# Run a specific test
npx playwright test -g "Navigate to Appointments"

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Categories

### 1. API Tests (Primary Focus)
- **Entity CRUD**: Customer, Product, Recipe management
- **Transaction Management**: Production batches, sales, expenses
- **Multi-Tenancy**: Organization isolation verification
- **Dynamic Data**: Custom field operations
- **Relationships**: Entity connections and hierarchies

### 2. UI Smoke Tests (Minimal)
- Dashboard loading and navigation
- Key page accessibility
- Mobile responsive layout
- Real-time metric display

### 3. Integration Tests
- Cross-module data flow
- API response validation
- Organization context preservation
- Data persistence verification

### 4. Performance Considerations
- API response times (< 500ms)
- Bulk operation handling
- Concurrent request management
- Database query optimization

## UAT Report Generation

The test suite includes automatic UAT report generation:

```bash
# Run UAT tests with report
npx playwright test uat-report-generator.ts

# Reports generated:
# - uat-report.html (visual report)
# - uat-report.json (raw data)
# - test-results.json (Playwright report)
```

### Report Metrics
- **Functional Coverage**: % of business requirements tested
- **Performance Score**: % of performance benchmarks met
- **UI Consistency**: % of UI tests passing
- **Overall Score**: Total test success rate

## Best Practices

### 1. API Test Structure
```typescript
test('should create entity', async ({ supabaseClient, organizationId, testIds }) => {
  const { data, error } = await supabaseClient.insert('core_entities', {
    organization_id: organizationId,
    entity_type: 'customer',
    entity_code: `CUST-${testIds.uniqueId}`
  })
  
  expect(error).toBeNull()
  expect(data[0].organization_id).toBe(organizationId)
})
```

### 2. Test Data Management
- Always use `organizationId` from fixtures
- Generate unique IDs with `testIds.uniqueId`
- Clean up in `test.cleanup()` or `test.afterAll()`
- Never share data between tests

### 3. Multi-Tenancy Testing
- Verify organization isolation in every test
- Test cross-organization access prevention
- Include organization_id in all operations
- Use different org IDs for isolation tests

### 4. Error Handling
- Check for RLS policy violations
- Handle API rate limits gracefully
- Verify error messages are meaningful
- Test edge cases and invalid inputs

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   ```
   Error: new row violates row-level security policy
   ```
   - Ensure RLS policies exist for test organizations
   - Use service role key for write operations
   - Verify organization_id is included

2. **API Test Failures**
   - Check environment variables are set correctly
   - Verify Supabase connection is active
   - Ensure test data cleanup completed

3. **Test Data Conflicts**
   - Use unique IDs with timestamps
   - Clean up test data properly
   - Check for orphaned test records

4. **Multi-Tenancy Issues**
   - Verify organization context in fixtures
   - Test with correct organization IDs
   - Check middleware routing for UI tests

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    npx playwright install
    npm run test:e2e
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.TEST_URL }}
```

### Environment Variables
- `PLAYWRIGHT_BASE_URL`: Base URL for tests (default: http://localhost:3000)
- `CI`: Set to true in CI environments

## Contributing

1. Write tests for new features
2. Ensure tests are deterministic
3. Add appropriate comments
4. Update this README for new test categories

## Support

For issues or questions:
- Check test output and screenshots
- Review Playwright trace files
- Consult Playwright documentation
- Contact the QA team