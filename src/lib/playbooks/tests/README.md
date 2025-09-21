# HERA Playbook Test Suite

Comprehensive test suite for the HERA Playbook system, including unit tests, integration tests, golden-path tests, failure scenarios, and property-based tests.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:golden        # Golden-path tests
npm run test:failure       # Failure scenario tests
npm run test:property      # Property-based tests
npm run test:integration   # Integration tests

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Organization

```
tests/
├── unit/                    # Fast, isolated unit tests
├── golden-path/            # Happy path integration tests
├── failure-scenarios/      # Error handling and edge cases
├── property-based/         # Generative testing
├── integration/            # Full system integration tests
├── setup/                  # Test configuration and helpers
├── test-data/             # Test fixtures and sample data
├── coverage/              # Coverage reports
└── test-results/          # Test execution results
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

The Jest configuration includes:

- TypeScript support via ts-jest
- Path aliases for clean imports
- Coverage thresholds (80% global, 90% for critical modules)
- Multiple reporters (console, JUnit, HTML)
- Custom test sequencing
- Global setup/teardown hooks

### Coverage Thresholds

- **Global**: 80% coverage required
- **Parser Module**: 90% coverage required
- **Executor Module**: 85% coverage required

### Test Timeouts

- Default timeout: 30 seconds
- Long-running tests: Can be extended using `jest.setTimeout()`

## Running the Test Suite

### All Tests with Report

```bash
npm run test:all
```

This runs the complete test suite runner that:

1. Sets up the test environment
2. Runs test suites in priority order
3. Generates comprehensive reports
4. Provides clear pass/fail status

### Individual Test Suites

```bash
# Run only unit tests
npm run test:unit

# Run with specific pattern
npm test -- --testNamePattern="parser"

# Run single file
npm test -- tests/unit/parser.test.ts
```

### Debugging Tests

```bash
# Run tests with Node debugger
npm run test:debug

# Then open chrome://inspect in Chrome
```

### Continuous Integration

```bash
# Run in CI mode with limited workers
npm run test:ci
```

## Test Reports

After running tests, reports are available in:

- `coverage/` - Coverage reports (lcov, HTML)
- `coverage/junit.xml` - JUnit format for CI integration
- `coverage/test-report.html` - Detailed HTML report
- `test-results/summary.json` - JSON summary
- `test-results/summary.html` - Executive summary

## Writing Tests

### Custom Matchers

```typescript
// Check if string is valid smart code
expect(smartCode).toBeValidSmartCode()

// Check if number is within range
expect(value).toBeWithinRange(0, 100)

// Check if array contains transaction type
expect(transactions).toContainTransaction('sale')
```

### Test Helpers

```typescript
import { createTestOrganization, createTestUser, createTestEntity } from '../setup/test-setup'

const org = createTestOrganization()
const user = createTestUser()
const entity = createTestEntity('customer', 'Test Customer')
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Clarity**: Test names should describe what they test
3. **Focus**: One assertion per test when possible
4. **Speed**: Keep unit tests fast (< 100ms)
5. **Coverage**: Aim for high coverage but focus on critical paths

## Troubleshooting

### Clear Jest Cache

```bash
npm run test:clear-cache
```

### Update Snapshots

```bash
npm run test:update-snapshots
```

### View Detailed Logs

Set `LOG_LEVEL=debug` before running tests:

```bash
LOG_LEVEL=debug npm test
```

## CI/CD Integration

The test suite is designed for CI/CD:

1. **Exit Codes**:
   - 0: All required tests passed
   - 1: Some required tests failed
   - 2: Test runner error
   - 3: Fatal error

2. **Reports**: JUnit XML for CI systems
3. **Parallel Execution**: Supports test sharding
4. **Performance**: Optimized for CI environments
