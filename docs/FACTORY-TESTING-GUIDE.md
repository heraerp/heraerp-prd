# 🧪 HERA Universal Factory Testing Integration Guide

## **Complete Jest + Playwright Testing Orchestration**

The HERA Factory now includes comprehensive testing capabilities that generate and execute Jest API tests and Playwright E2E tests automatically, all stored in the sacred 6 tables.

## **Architecture Overview**

### **Testing in the Sacred Six Tables**

```sql
-- Test runs stored as transactions
universal_transactions:
  TYPE: 'FACTORY.TEST'
  SMART_CODE: 'HERA.UNIVERSAL.FACTORY.TEST.v1_0'
  
-- Test results as transaction lines  
universal_transaction_lines:
  STEP.UNIT     -- Jest unit tests
  STEP.CONTRACT -- API contract tests  
  STEP.E2E      -- Playwright UI tests
  STEP.SECURITY -- Dependency scanning

-- Test artifacts as entities
core_entities:
  ENTITY_TYPE: 'artifact'
  coverage reports, screenshots, videos, traces

-- Test suites linked to modules
core_relationships:
  MODULE validated_by TEST_SUITE
  TEST_SUITE produces ARTIFACT
```

## **Quick Start**

### **1. Generate Tests for a Module**

```bash
# Via Factory CLI
node factory-cli.js generate-tests HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0 \
  --personas "cashier,manager" \
  --browsers "chromium,webkit" \
  --coverage-min 0.9

# Via MCP/Claude
"Generate comprehensive tests for the restaurant loyalty module"
```

### **2. Run Tests in Pipeline**

```bash
# Full pipeline with testing
node factory-cli.js build HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0 \
  --tests unit,contract,e2e,security \
  --channels beta,stable

# Just run tests
node factory-cli.js test HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0
```

### **3. View Test Results**

```bash
# Get test report
node factory-cli.js test-report HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0

# Check coverage
node factory-cli.js coverage HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0
```

## **Generated Test Structure**

```
tests/
├── shared/
│   ├── http.ts          # API client helper
│   ├── builders.ts      # Test data builders
│   └── assertions.ts    # Custom assertions
├── api/
│   └── loyalty/
│       ├── loyalty.spec.ts      # Main API tests
│       └── performance.spec.ts  # Performance tests
├── e2e/
│   └── loyalty/
│       ├── loyalty.spec.ts      # UI flow tests
│       └── accessibility.spec.ts # A11y tests
├── setup.ts             # Global test setup
├── jest.config.ts       # Jest configuration
└── playwright.config.ts # Playwright configuration
```

## **Test Configuration**

### **Module Manifest Enhancement**

```json
{
  "name": "Restaurant Loyalty",
  "smart_code": "HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0",
  "test_config": {
    "matrix": {
      "personas": ["cashier", "manager", "customer"],
      "locales": ["en-US", "es-MX"],
      "browsers": ["chromium", "webkit", "firefox"],
      "datasets": ["happy_path", "edge_cases", "large_volume"]
    },
    "coverage": {
      "unit": 0.9,
      "e2e": 0.8,
      "overall": 0.85
    },
    "guardrails": {
      "max_test_duration_ms": 300000,
      "required_accessibility_score": 0.95,
      "block_on_security_vulnerabilities": true
    }
  }
}
```

### **Environment Variables**

```bash
# API Testing
HERA_API_BASE=https://api.heraerp.com
HERA_API_TOKEN=your-token
DEFAULT_ORGANIZATION_ID=org-uuid

# E2E Testing
DNA_BASE_URL=https://app.heraerp.com
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password

# CI/CD
CI=true
ARTIFACT_BUCKET=s3://hera-test-artifacts
```

## **Test Types**

### **1. Unit Tests (Jest)**
- API endpoint validation
- Smart code verification
- Entity CRUD operations
- Transaction processing
- Guardrail compliance

### **2. Contract Tests**
- OpenAPI schema validation
- Response structure verification
- Error format compliance
- Versioning compatibility

### **3. E2E Tests (Playwright)**
- User workflow validation
- Multi-browser testing
- Accessibility compliance
- Visual regression
- Performance metrics

### **4. Security Tests**
- Dependency scanning
- OWASP compliance
- Authentication flows
- Authorization boundaries

## **Guardrail Integration**

### **Quality Gates**

```yaml
# Stable Channel Requirements
- coverage >= 0.90
- all contract tests pass
- zero critical vulnerabilities
- accessibility score >= 0.95
- performance budget met

# Beta Channel Requirements
- coverage >= 0.70
- critical paths pass
- no high vulnerabilities
- basic accessibility pass
```

### **Test Guardrails**

```typescript
// Automatically enforced during TEST stage
const guardrails = {
  // Coverage requirements
  BLOCK_IF: coverage < config.coverage_min,
  
  // Security scanning
  BLOCK_IF: vulnerabilities.critical > 0,
  
  // Contract compliance
  BLOCK_IF: contractTests.failed > 0 && channel === 'stable',
  
  // Performance budgets
  WARN_IF: p95_response_time > 2000, // 2 seconds
  
  // Accessibility
  BLOCK_IF: a11y_violations.critical > 0
}
```

## **CI/CD Integration**

### **GitHub Actions Example**

```yaml
name: Factory Test Pipeline
on: [push, pull_request]

jobs:
  factory-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      
      # Run factory test stage
      - name: Execute Factory Tests
        run: |
          node factory-cli.js test $MODULE_SMART_CODE \
            --report-to-factory \
            --upload-artifacts
      
      # Upload results to Factory
      - name: Report to Factory
        if: always()
        run: |
          node factory-cli.js report-test-results \
            --pipeline-id ${{ github.run_id }} \
            --status ${{ job.status }}
```

## **Test Data Management**

### **Datasets**

```typescript
// Define in module manifest
"datasets": {
  "happy_path": {
    "customers": 10,
    "transactions": 50,
    "timeframe": "30d"
  },
  "edge_cases": {
    "expired_points": true,
    "negative_balance": true,
    "concurrent_redemptions": true
  },
  "large_volume": {
    "customers": 10000,
    "transactions": 100000,
    "concurrent_users": 100
  }
}
```

### **Persona-Based Testing**

```typescript
// Automatic persona switching
const personas = {
  cashier: {
    permissions: ['create_transaction', 'view_customer'],
    ui_elements: ['pos_terminal', 'customer_lookup']
  },
  manager: {
    permissions: ['*'],
    ui_elements: ['dashboard', 'reports', 'settings']
  },
  customer: {
    permissions: ['view_own_data'],
    ui_elements: ['loyalty_dashboard', 'rewards']
  }
}
```

## **Artifact Management**

### **Automatic Artifact Collection**

```typescript
// All artifacts automatically uploaded and linked
artifacts/
├── coverage/
│   ├── lcov.info
│   ├── coverage-final.json
│   └── html/
├── screenshots/
│   ├── loyalty-dashboard.png
│   └── failures/
├── videos/
│   └── e2e-flows/
├── traces/
│   └── trace-files/
└── reports/
    ├── junit.xml
    ├── playwright-report/
    └── security-scan.json
```

### **Artifact Storage**

```sql
-- Artifacts stored as entities
INSERT INTO core_entities (
  entity_type,
  entity_name,
  smart_code,
  metadata
) VALUES (
  'artifact',
  'coverage-report-v1.2.3',
  'HERA.UNIVERSAL.ARTIFACT.COVERAGE.v1_0',
  {
    "module_id": "...",
    "coverage": 0.94,
    "uri": "s3://artifacts/coverage/...",
    "checksum": "sha256:..."
  }
);
```

## **Real-World Examples**

### **Restaurant Loyalty Module**

```bash
# Generate complete test suite
node factory-cli.js generate-tests HERA.RESTAURANT.MODULE.APP.LOYALTY.v1_0 \
  --api-tests "crud,transactions,rewards" \
  --e2e-flows "earn-points,redeem-rewards,check-balance" \
  --personas "cashier,manager,customer" \
  --datasets "happy_path,expiration_edge"

# Output:
✅ Generated 12 API test files
✅ Generated 8 E2E test files  
✅ Generated CI configuration
✅ Total coverage target: 90%
```

### **Healthcare Patient Portal**

```bash
# With HIPAA compliance
node factory-cli.js generate-tests HERA.HEALTHCARE.MODULE.APP.PATIENT-PORTAL.v1_0 \
  --guardrails "HIPAA" \
  --no-screenshots \  # HIPAA: no PII in screenshots
  --mask-sensitive-data \
  --audit-access-logs

# Output:
✅ HIPAA-compliant test suite generated
✅ PII masking enabled
✅ Audit trail verification included
```

## **Advanced Features**

### **Parallel Test Execution**

```typescript
// Automatic parallel execution based on matrix
const matrix = {
  shards: 4,  // Split tests across 4 workers
  browsers: ['chromium', 'webkit'],
  datasets: ['small', 'large'],
  // Total: 4 × 2 × 2 = 16 parallel executions
}
```

### **Smart Test Selection**

```typescript
// Only run affected tests based on changes
const affectedTests = await factory.selectTests({
  changedFiles: gitDiff.files,
  impactAnalysis: true,
  minTestSuite: 'smoke'  // Always run smoke tests
})
```

### **Test Flakiness Detection**

```typescript
// Automatic retry with flakiness tracking
{
  retries: 3,
  quarantine_flaky: true,
  flakiness_threshold: 0.1,  // 10% failure rate
  report_to_factory: true
}
```

## **Monitoring & Reporting**

### **Real-Time Test Dashboard**

```typescript
// Available at Factory Dashboard
- Live test execution progress
- Coverage trends over time  
- Flakiness tracking
- Performance metrics
- Cross-browser results
```

### **Test Analytics**

```sql
-- Query test trends
SELECT 
  DATE_TRUNC('day', created_at) as date,
  AVG((metadata->>'coverage')::float) as avg_coverage,
  SUM(CASE WHEN metadata->>'status' = 'PASSED' THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN metadata->>'status' = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM universal_transaction_lines
WHERE line_type LIKE 'STEP.%'
GROUP BY date
ORDER BY date DESC;
```

## **Best Practices**

1. **Test Early in Pipeline** - Run tests in BUILD stage for fast feedback
2. **Use Test Matrix** - Cover all personas, browsers, and datasets
3. **Monitor Flakiness** - Quarantine flaky tests automatically
4. **Parallelize Aggressively** - Use sharding for faster execution
5. **Cache Dependencies** - Speed up test runs with smart caching
6. **Screenshot on Failure** - Automatic debugging artifacts
7. **Track Coverage Trends** - Ensure quality doesn't degrade
8. **Test in Production** - Synthetic monitoring with same tests

## **Troubleshooting**

### **Common Issues**

```bash
# Tests timing out
export TEST_TIMEOUT=120000  # 2 minutes

# Playwright browser issues  
npx playwright install --with-deps

# Coverage not meeting threshold
npm run test:coverage -- --updateSnapshot

# Artifacts not uploading
check ARTIFACT_BUCKET permissions
```

### **Debug Mode**

```bash
# Run with full debugging
DEBUG=* node factory-cli.js test MODULE_CODE \
  --verbose \
  --headed \
  --slow-mo 1000 \
  --debug-on-failure
```

## **Summary**

The HERA Factory Testing Integration provides:
- ✅ **Zero-Config Test Generation** - Tests created from module manifests
- ✅ **Comprehensive Coverage** - API, UI, Security, Accessibility
- ✅ **Sacred Six Storage** - All test data in universal tables
- ✅ **Guardrail Enforcement** - Quality gates at every stage
- ✅ **Complete Automation** - From generation to reporting
- ✅ **Multi-Industry Support** - HIPAA, SOX, PCI compliance built-in

This makes HERA the first ERP with **factory-integrated testing** that ensures every module ships with comprehensive quality assurance! 🚀