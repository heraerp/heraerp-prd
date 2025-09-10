# 🏢 HERA Enterprise Testing Standards

## Overview

This document defines the enterprise-level testing standards for HERA ERP, ensuring consistent, maintainable, and comprehensive test coverage across all modules and features.

## 📋 Testing Hierarchy

```
1. Unit Tests (60%)
   ├── Components
   ├── Hooks
   ├── Utilities
   └── Services

2. API Tests (25%)
   ├── REST Endpoints
   ├── Authentication
   ├── Authorization
   └── Data Validation

3. E2E Tests (10%)
   ├── Critical User Journeys
   ├── Multi-tenant Flows
   └── Payment Workflows

4. Integration Tests (5%)
   ├── Database Operations
   ├── External Services
   └── Message Queues
```

## 🎯 Testing Principles

### 1. **Test Pyramid Strategy**
- Many small, fast unit tests
- Moderate API/integration tests
- Few comprehensive E2E tests
- Performance tests for critical paths

### 2. **Independence**
- Tests must not depend on execution order
- Each test creates its own test data
- Tests clean up after themselves
- Parallel execution must be possible

### 3. **Determinism**
- Same input → Same output
- No flaky tests allowed
- Proper waits and retries for async operations
- Controlled random data generation

### 4. **Clarity**
- Test names describe what they test
- Arrange-Act-Assert pattern
- One assertion focus per test
- Clear failure messages

## 🔧 Technical Standards

### Directory Structure
```
tests/
├── __mocks__/              # Shared mocks
├── __fixtures__/           # Test data factories
├── unit/                   # Jest unit tests
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── api/                    # Jest API tests
│   ├── v1/
│   │   ├── auth/
│   │   ├── provisioning/
│   │   └── universal/
│   └── helpers/
├── e2e/                    # Playwright E2E tests
│   ├── auth/
│   ├── multi-tenant/
│   ├── finance/
│   └── restaurant/
├── integration/            # Integration tests
├── performance/            # K6 performance tests
└── reports/                # Test reports
```

### Naming Conventions

#### Test Files
```typescript
// Unit tests
ComponentName.test.tsx
serviceName.test.ts
utilityName.test.ts

// API tests
endpoint-name.api.test.ts

// E2E tests
feature-name.e2e.spec.ts

// Integration tests
service-name.integration.test.ts
```

#### Test Cases
```typescript
// Unit/API tests - describe behavior
describe('UserService', () => {
  it('should create user with valid data')
  it('should throw error when email is invalid')
  it('should hash password before saving')
})

// E2E tests - describe user journey
test.describe('User Registration', () => {
  test('new user can sign up and access dashboard')
  test('existing email shows appropriate error')
})
```

### Test Organization

#### Unit Test Template
```typescript
// tests/unit/services/UserService.test.ts
import { UserService } from '@/services/UserService'
import { mockDatabase } from '@/__mocks__/database'

describe('UserService', () => {
  let service: UserService
  
  beforeEach(() => {
    jest.clearAllMocks()
    service = new UserService(mockDatabase)
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      }
      
      // Act
      const user = await service.createUser(userData)
      
      // Assert
      expect(user).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name
      })
    })
  })
})
```

#### API Test Template
```typescript
// tests/api/v1/users/create-user.api.test.ts
import request from 'supertest'
import { app } from '@/app'
import { createAuthToken } from '@/__fixtures__/auth'

describe('POST /api/v1/users', () => {
  const endpoint = '/api/v1/users'
  let authToken: string
  
  beforeAll(async () => {
    authToken = await createAuthToken({ role: 'admin' })
  })
  
  it('should create user with valid request', async () => {
    const response = await request(app)
      .post(endpoint)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user'
      })
    
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: expect.any(String),
        email: 'newuser@example.com'
      }
    })
  })
  
  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post(endpoint)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'invalid-email',
        name: 'Test User'
      })
    
    expect(response.status).toBe(400)
    expect(response.body.error).toContain('email')
  })
})
```

#### E2E Test Template
```typescript
// tests/e2e/auth/registration.e2e.spec.ts
import { test, expect } from '@playwright/test'
import { createTestUser, deleteTestUser } from '../helpers/user-helpers'

test.describe('User Registration Flow', () => {
  test.afterEach(async ({ request }) => {
    // Clean up test data
    await deleteTestUser(request, 'test@example.com')
  })
  
  test('new user can register and access dashboard', async ({ page }) => {
    // Navigate to registration
    await page.goto('/auth/register')
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'Test123!@#')
    await page.fill('[data-testid="name-input"]', 'Test User')
    
    // Submit form
    await page.click('[data-testid="register-button"]')
    
    // Wait for redirect
    await page.waitForURL('/dashboard')
    
    // Verify dashboard access
    await expect(page.locator('h1')).toContainText('Welcome, Test User')
  })
})
```

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
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
    "multi-tenant": 90,
    "api": 85
  }
}
```

### Coverage Reports
- Generated after each test run
- Uploaded to coverage dashboard
- PR blocks if coverage drops
- Monthly coverage trends tracked

## 🔐 Test Data Management

### Test Data Principles
1. **Isolation**: Each test uses unique data
2. **Cleanup**: All test data removed after tests
3. **Factories**: Consistent data generation
4. **Security**: No production data in tests

### Test Data Factories
```typescript
// tests/__fixtures__/factories/user.factory.ts
export const userFactory = {
  create: (overrides = {}) => ({
    id: generateTestId('user'),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    organizationId: generateTestId('org'),
    ...overrides
  }),
  
  createBatch: (count: number, overrides = {}) => {
    return Array.from({ length: count }, (_, i) => 
      userFactory.create({ 
        email: `test-${i}-${Date.now()}@example.com`,
        ...overrides 
      })
    )
  }
}
```

### Test Database
- Separate test database per developer
- Migrations run before test suite
- Transaction rollback between tests
- Periodic cleanup of orphaned data

## 🚀 Performance Standards

### API Performance
- Response time < 200ms (p95)
- Throughput > 1000 req/sec
- Error rate < 0.1%
- Concurrent users: 100+

### E2E Performance
- Page load < 3 seconds
- Time to interactive < 5 seconds
- Core Web Vitals passing
- Mobile performance score > 90

### Performance Test Example
```javascript
// tests/performance/api-load.k6.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.1'],
  },
}

export default function() {
  const res = http.get('https://api.heraerp.com/v1/health')
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  })
}
```

## 🤖 CI/CD Integration

### Pipeline Stages
```yaml
name: Test Pipeline
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3
  
  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run test:api
  
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e:${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Environments
1. **Local**: Developer machines
2. **CI**: Automated pipeline
3. **Staging**: Pre-production testing
4. **Production**: Smoke tests only

## 📈 Monitoring & Reporting

### Test Metrics Dashboard
- Test execution time trends
- Failure rate by module
- Coverage trends
- Flaky test detection
- Performance regression alerts

### Reporting Tools
- **Jest**: Coverage and test reports
- **Playwright**: HTML reports with traces
- **Allure**: Comprehensive test reporting
- **Grafana**: Real-time test metrics

## ✅ Checklist for New Features

### Before Development
- [ ] Define test scenarios
- [ ] Create test data factories
- [ ] Set up test environment
- [ ] Define coverage targets

### During Development
- [ ] Write unit tests first (TDD)
- [ ] Add API tests for endpoints
- [ ] Create E2E for critical paths
- [ ] Update test documentation

### Before Merge
- [ ] All tests passing
- [ ] Coverage meets threshold
- [ ] No console errors/warnings
- [ ] Performance benchmarks met
- [ ] Test data cleanup verified

### After Deployment
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update test baselines

## 🚨 Troubleshooting Guide

### Common Issues

#### Flaky Tests
```typescript
// Bad - Race condition
await page.click('button')
expect(await page.locator('.result')).toBeVisible()

// Good - Proper wait
await page.click('button')
await page.waitForSelector('.result')
expect(await page.locator('.result')).toBeVisible()
```

#### Test Isolation
```typescript
// Bad - Shared state
let user
beforeAll(() => {
  user = createUser()
})

// Good - Fresh state
beforeEach(() => {
  const user = createUser()
})
```

#### Database State
```typescript
// Use transactions for isolation
beforeEach(async () => {
  await db.query('BEGIN')
})

afterEach(async () => {
  await db.query('ROLLBACK')
})
```

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [HERA Testing Wiki](internal-wiki-link)

## 🎯 Goals

1. **Confidence**: Tests give confidence to deploy
2. **Speed**: Fast feedback loop for developers
3. **Clarity**: Clear what broke and why
4. **Maintenance**: Easy to update tests
5. **Coverage**: Comprehensive without redundancy