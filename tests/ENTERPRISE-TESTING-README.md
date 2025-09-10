# 🏢 HERA Enterprise Testing Suite

## Overview

The HERA Enterprise Testing Suite provides comprehensive test coverage across unit, API, E2E, and integration tests, following enterprise-grade standards and best practices.

## 📋 Test Structure

```
tests/
├── __mocks__/              # Shared mocks for all tests
├── __fixtures__/           # Test data factories and fixtures
│   └── factories/
│       ├── organization.factory.ts
│       ├── user.factory.ts
│       └── ...
├── unit/                   # Jest unit tests
│   ├── components/         # React component tests
│   ├── hooks/              # Custom hook tests
│   ├── services/           # Service layer tests
│   └── utils/              # Utility function tests
├── api/                    # API endpoint tests
│   └── v1/
│       ├── auth/           # Authentication API tests
│       ├── provisioning/   # Multi-tenant provisioning tests
│       ├── universal/      # Universal API tests
│       └── helpers/        # API test utilities
├── e2e/                    # Playwright E2E tests
│   ├── auth/               # Authentication flows
│   ├── multi-tenant/       # Multi-tenant specific tests
│   ├── finance/            # Financial module tests
│   ├── restaurant/         # Restaurant module tests
│   └── setup/              # Global setup/teardown
├── integration/            # Integration tests
├── performance/            # K6 performance tests
└── reports/                # Test reports and coverage
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Setup test database (if using local DB)
npm run db:test:setup
```

### Running Tests

#### All Tests
```bash
# Run all test suites
npm run test:enterprise:all

# With coverage
npm run test:enterprise:all -- -c
```

#### Unit Tests Only
```bash
npm run test:unit

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

#### API Tests Only
```bash
# Jest API tests
npm run test:api:jest

# Playwright API tests
npm run test:api
```

#### E2E Tests
```bash
# All E2E tests
npm run test:e2e

# Multi-tenant specific
npm run test:e2e:multi-tenant

# With UI (interactive)
npm run test:e2e:ui

# Specific browser
npm run test:e2e -- --project=firefox
```

#### Integration Tests
```bash
npm run test:integration
```

## 🧪 Test Categories

### 1. **Unit Tests** (60% coverage target)
- **Location**: `tests/unit/`
- **Framework**: Jest + React Testing Library
- **Purpose**: Test individual components, hooks, utilities in isolation
- **Example**:
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. **API Tests** (25% coverage target)
- **Location**: `tests/api/` and `src/**/api/**/__tests__/`
- **Framework**: Jest for unit-style, Playwright for E2E-style
- **Purpose**: Test REST endpoints, authentication, data validation
- **Example**:
```typescript
// tests/api/v1/provisioning/provisioning.test.ts
describe('POST /api/v1/provisioning', () => {
  it('should create new organization', async () => {
    const response = await request(app)
      .post('/api/v1/provisioning')
      .send({
        organizationName: 'Test Org',
        subdomain: 'test-org',
        businessType: 'salon'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.organizationId).toBeTruthy();
  });
});
```

### 3. **E2E Tests** (10% coverage target)
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user journeys and workflows
- **Categories**:
  - **Multi-tenant flows**: Organization creation, subdomain routing, module access
  - **Authentication**: Login, signup, organization switching
  - **Business workflows**: POS transactions, appointments, inventory

### 4. **Integration Tests** (5% coverage target)
- **Location**: `tests/integration/`
- **Framework**: Jest
- **Purpose**: Test interactions between multiple systems
- **Examples**: Database operations, external service integrations

## 📊 Test Standards

### Naming Conventions
```typescript
// Unit/API tests - describe behavior
describe('UserService', () => {
  it('should create user with valid data');
  it('should throw error when email is invalid');
});

// E2E tests - describe user journey
test.describe('User Registration', () => {
  test('new user can sign up and access dashboard');
});
```

### Test Organization Pattern
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset state, create mocks
  });

  // Teardown
  afterEach(() => {
    // Cleanup
  });

  // Group related tests
  describe('feature or method', () => {
    it('should behave correctly', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toMatchExpectation();
    });
  });
});
```

## 🔧 Test Utilities

### Factories
```typescript
import { OrganizationFactory, UserFactory } from '@test/fixtures/factories';

// Create test data
const org = OrganizationFactory.createSalon();
const user = UserFactory.createOwner({ organizationId: org.id });
const team = UserFactory.createTeam(org.id);
```

### Auth Helpers
```typescript
import { loginUser, createTestOrganization } from '@test/e2e/helpers/auth-helpers';

// E2E test setup
await loginUser(page, 'test@example.com', 'password');
await createTestOrganization(request, orgData, authToken);
```

### Mock Helpers
```typescript
import { createMockSupabase, mockSuccessfulQuery } from '@test/helpers';

// API test mocking
const { mockSupabase, mockChain } = createMockSupabase();
mockSuccessfulQuery(mockChain, testData);
```

## 📈 Coverage Requirements

### Minimum Thresholds
```json
{
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  },
  "critical": {
    "auth": 95,
    "payments": 95,
    "multi-tenant": 90
  }
}
```

### Viewing Coverage
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## 🤖 CI/CD Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request
- Nightly scheduled runs (performance tests)

### GitHub Actions Workflow
- **Unit Tests**: Run in parallel on ubuntu-latest
- **API Tests**: Run with PostgreSQL service
- **E2E Tests**: Matrix build for Chrome, Firefox, Safari
- **Integration Tests**: Run with PostgreSQL and Redis
- **Performance Tests**: Run on merge to main

## 🚨 Troubleshooting

### Common Issues

#### Jest Module Resolution
```bash
# Error: Cannot find module '@/components/...'
# Fix: Check jest.config.js moduleNameMapper
```

#### Playwright Timeouts
```typescript
// Increase timeout for slow operations
await page.goto('/heavy-page', { timeout: 60000 });
```

#### Flaky Tests
```typescript
// Use proper waits
await page.waitForSelector('.loaded');
await expect(locator).toBeVisible({ timeout: 10000 });
```

## 📚 Best Practices

1. **Keep tests independent** - No shared state between tests
2. **Use factories** - Consistent test data generation
3. **Mock external services** - Fast, reliable tests
4. **Test user behavior** - Not implementation details
5. **Clear test names** - Should explain what and why
6. **Proper cleanup** - Always clean up test data
7. **Avoid hard waits** - Use proper Playwright waiters
8. **Parallel by default** - Tests should run in any order

## 🎯 Multi-Tenant Testing Checklist

- [ ] Organization isolation verified
- [ ] Subdomain routing tested
- [ ] Module entitlements enforced
- [ ] Cross-tenant data leakage prevented
- [ ] Organization switching works
- [ ] RLS policies effective
- [ ] API includes organization context
- [ ] UI respects organization boundaries

## 📞 Support

- Review test output and reports in `tests/reports/`
- Check Playwright traces for E2E failures
- Use `--debug` flag for interactive debugging
- Consult team leads for test strategy questions