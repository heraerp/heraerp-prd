# HERA Product Costing v2: Test Suite

Enterprise-grade test suite for HERA Product Costing v2 system with comprehensive coverage of all components including standards, guardrails, RPC functions, materialized views, API endpoints, and TypeScript client SDK.

## 🎯 Test Coverage

### Core Components Tested
- ✅ **Standard Definitions & Validation** - Product codes, types, cost components, BOM/routing validation
- ✅ **Guardrails Engine** - Policy-as-data validation, cycle detection, business rules enforcement
- ✅ **RPC Functions** - Atomic database operations for products, BOMs, and routing
- ✅ **Materialized Views** - Performance-optimized views and helper functions
- ✅ **API Endpoints** - REST API with security, error handling, and audit trails
- ✅ **TypeScript Client SDK** - Enterprise client with React hooks integration
- ✅ **Integration Tests** - Complete product lifecycle with BOM and routing
- ✅ **Performance Tests** - BOM explosion, view refresh, and query optimization
- ✅ **Security Tests** - Organization isolation, smart code validation
- ✅ **Error Handling** - Graceful handling of invalid data and edge cases

### Test Categories

#### 1. Standard Definitions Tests
```typescript
// Product code validation
expect(validateProductCode('PROD-001').valid).toBe(true)

// Cost component validation  
expect(validateStandardCostComponents({
  material: 10.00,
  labor: 5.00,
  overhead: 3.00
}).valid).toBe(true)

// BOM component validation
expect(validateBOMComponent({
  component_id: 'comp-id',
  qty_per: 2.5,
  scrap_pct: 0.05
}).valid).toBe(true)
```

#### 2. Guardrails Engine Tests
```typescript
// Product creation validation
const validation = await applyProductCostingGuardrails(
  'create',
  productRequest,
  organizationId,
  existingProducts
)

// BOM cycle detection
const bomValidation = validateBOMPosting(productId, components)
expect(bomValidation.errors.some(e => e.code === 'ERR_BOM_CYCLE_DETECTED')).toBe(true)

// Routing validation
const routingValidation = validateRoutingPosting(productId, activities)
```

#### 3. RPC Function Tests
```typescript
// Product creation via RPC
const { data, error } = await supabase.rpc('hera_product_upsert_v2', {
  p_organization_id: organizationId,
  p_product_code: 'TEST-001',
  p_entity_name: 'Test Product',
  // ... other parameters
})

// BOM management via RPC
await supabase.rpc('hera_bom_upsert_v2', {
  p_product_id: productId,
  p_components: JSON.stringify(components)
})
```

#### 4. Integration Tests
```typescript
// Complete product lifecycle:
// 1. Create product
// 2. Create component products 
// 3. Add BOM relationships
// 4. Create activity types
// 5. Add routing relationships
// 6. Validate complete cost rollup
```

#### 5. Performance Tests
```typescript
// BOM explosion performance
const startTime = Date.now()
const { data } = await supabase
  .from('vw_bom_explosion_v2')
  .select('*')
  .limit(1000)
const queryTime = Date.now() - startTime
expect(queryTime).toBeLessThan(5000)
```

## 🚀 Running Tests

### Prerequisites
1. **Node.js 18+** with npm/yarn
2. **Supabase instance** with HERA universal schema
3. **Environment variables** configured (see Setup section)
4. **Test organization** created in database

### Quick Start
```bash
# Install dependencies
npm install

# Run all Product Costing v2 tests
npm run test:productcosting-v2

# Run with coverage
npm run test:productcosting-v2:coverage

# Run specific test categories
npm run test:productcosting-v2 -- --testNamePattern="Standard Definitions"
npm run test:productcosting-v2 -- --testNamePattern="Guardrails Engine"
npm run test:productcosting-v2 -- --testNamePattern="Integration"
```

### Test Commands
```bash
# Full test suite
jest --config tests/productcosting/jest.config.js

# Watch mode for development
jest --config tests/productcosting/jest.config.js --watch

# Coverage report
jest --config tests/productcosting/jest.config.js --coverage

# Specific test file
jest --config tests/productcosting/jest.config.js productcosting-v2.test.ts

# Performance tests only
jest --config tests/productcosting/jest.config.js --testNamePattern="Performance"

# Security tests only  
jest --config tests/productcosting/jest.config.js --testNamePattern="Security"
```

## ⚙️ Configuration

### Environment Variables (.env.test)
```bash
# Supabase Configuration (Required)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test Configuration
NODE_ENV=test
TEST_API_URL=http://localhost:3000/api
JEST_TIMEOUT=30000

# Test Organization IDs
TEST_ORG_ID_PRODUCT_COSTING=test-org-product-costing-v2
TEST_ORG_ID_SYSTEM=00000000-0000-0000-0000-000000000000

# API Configuration
HERA_API_VERSION=v2
LOG_LEVEL=warn

# Performance Test Configuration
PERF_TEST_ENABLED=true
PERF_TEST_ITERATIONS=100

# Coverage Configuration
COVERAGE_THRESHOLD=85
```

### Jest Configuration
- **Preset**: `ts-jest` for TypeScript support
- **Test Environment**: `node` for server-side testing
- **Timeout**: 30 seconds per test
- **Coverage**: 85% minimum threshold
- **Reporters**: Console + JUnit XML for CI/CD

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%

### Coverage Reports
- **Console**: Real-time coverage during test runs
- **HTML**: Detailed coverage report in `coverage/productcosting-v2/`
- **LCOV**: Machine-readable format for CI/CD integration
- **JUnit**: XML reports for CI/CD systems

## 🔧 Test Architecture

### Test Structure
```
tests/productcosting/
├── productcosting-v2.test.ts    # Main test suite
├── jest.config.js               # Jest configuration
├── setup.ts                     # Global test setup
├── env.ts                       # Environment configuration  
├── README.md                    # This documentation
└── fixtures/                    # Test data fixtures
    ├── products.json           # Sample product data
    ├── bom-components.json     # Sample BOM data
    └── routing-activities.json # Sample routing data
```

### Test Utilities
```typescript
// Custom Jest matchers
expect(uuid).toBeValidUUID()
expect(smartCode).toBeValidSmartCode()
expect(amount).toBeValidCurrency()

// Test helpers
const testId = TEST_HELPERS.generateTestId('PRODUCT')
await TEST_HELPERS.delay(1000)
const result = await TEST_HELPERS.retry(asyncFunction, 3)
```

### Test Data Management
- **Automatic Cleanup**: All test data is automatically cleaned up after tests
- **Isolation**: Each test uses unique identifiers to prevent conflicts
- **Factories**: Reusable factory functions for creating test data
- **Fixtures**: Pre-defined test data for consistent testing

## 🧪 Test Categories Deep Dive

### 1. Standard Definitions Tests
Validates all TypeScript interfaces, validation functions, and business rules:
- Product code format validation (alphanumeric, length, special characters)
- Product type enumeration validation (FINISHED, SEMI, RAW, SERVICE)
- Standard cost component validation (non-negative, precision)
- BOM component validation (quantities, scrap percentages, relationships)
- Routing activity validation (hours, rates, work centers)
- Smart code format validation (HERA pattern compliance)

### 2. Guardrails Engine Tests
Tests the policy-as-data validation system:
- **Product Guardrails**: Duplicate code detection, valid types, cost requirements
- **BOM Guardrails**: Cycle detection, self-consumption prevention, valid components
- **Routing Guardrails**: Activity uniqueness, valid work centers, hour constraints
- **Cross-Validation**: Dimensional completeness, GL account mapping, effective dates
- **Batch Validation**: Multiple product validation with conflict detection

### 3. RPC Function Tests
Tests atomic database operations:
- **Product Management**: Create, update, archive with complete audit trails
- **BOM Management**: Component relationships with cycle detection
- **Routing Management**: Activity sequences with work center assignments
- **Error Handling**: Validation failures, constraint violations, transaction rollbacks
- **Performance**: Sub-second response times for typical operations

### 4. Materialized View Tests
Tests performance-optimized views:
- **Product Master View**: Complete product data with cost rollups
- **BOM Explosion View**: Multi-level BOM explosion with recursive CTEs  
- **Routing Summary View**: Activity costs and work center assignments
- **Cost Accounts View**: GL mappings with policy-driven defaults
- **Production Facts View**: Aggregated data for reporting and analytics
- **Helper Functions**: Cost calculations, validity checks, component queries

### 5. Integration Tests
Tests complete business scenarios:
- **Product Lifecycle**: Create → Add BOM → Add Routing → Cost Calculation
- **Multi-Level BOM**: Complex product structures with multiple levels
- **Routing Sequences**: Multiple activities with work center assignments
- **Cost Rollup**: Accurate cost calculation through BOM and routing
- **Audit Trail**: Complete transaction logging for all operations

### 6. Performance Tests
Validates system performance under load:
- **BOM Explosion**: Complex multi-level BOMs with thousands of components
- **View Refresh**: Materialized view refresh within acceptable timeframes
- **Query Performance**: Sub-second response times for typical queries
- **Concurrent Operations**: Multiple users creating/updating products simultaneously
- **Memory Usage**: Efficient memory usage during large operations

### 7. Security Tests
Validates security and data isolation:
- **Organization Isolation**: Complete data separation between organizations
- **User Authorization**: Role-based access control validation
- **Smart Code Validation**: Proper smart code format and versioning
- **SQL Injection Prevention**: Protection against malicious input
- **Data Integrity**: Referential integrity and constraint enforcement

## 🚨 Common Issues and Solutions

### Test Failures

#### Database Connection Issues
```bash
# Ensure Supabase is running and accessible
curl -f http://localhost:54321/health

# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### Timeout Issues
```bash
# Increase timeout for slow operations
JEST_TIMEOUT=60000 npm run test:productcosting-v2

# Run specific slow tests separately
npm run test:productcosting-v2 -- --testNamePattern="Performance" --timeout=60000
```

#### Coverage Issues
```bash
# Generate detailed coverage report
npm run test:productcosting-v2:coverage

# View coverage in browser
open coverage/productcosting-v2/lcov-report/index.html
```

### Development Tips

#### Running Specific Tests
```bash
# Single test file
jest productcosting-v2.test.ts

# Single test case
jest --testNamePattern="should validate product codes correctly"

# Test category
jest --testNamePattern="Guardrails Engine"
```

#### Debugging Tests
```bash
# Enable verbose logging
LOG_LEVEL=debug jest productcosting-v2.test.ts

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest productcosting-v2.test.ts

# Debug specific test
jest --testNamePattern="Integration" --verbose
```

#### Adding New Tests
1. Follow existing test structure and naming conventions
2. Use test factories for creating test data
3. Include proper cleanup in `afterEach` or `afterAll`
4. Add appropriate type assertions and error handling
5. Document complex test scenarios with comments

## 📋 CI/CD Integration

### GitHub Actions
```yaml
name: Product Costing v2 Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:productcosting-v2:ci
      - uses: codecov/codecov-action@v3
        with:
          file: coverage/productcosting-v2/lcov.info
```

### Test Reports
- **JUnit XML**: `test-results/productcosting-v2/junit.xml`
- **Coverage LCOV**: `coverage/productcosting-v2/lcov.info`
- **Coverage HTML**: `coverage/productcosting-v2/lcov-report/`

## 🎯 Success Criteria

### Test Suite Requirements
- ✅ **95%+ Pass Rate**: All tests must pass consistently
- ✅ **85%+ Coverage**: Minimum code coverage across all metrics
- ✅ **<30s Runtime**: Complete test suite runs within 30 seconds
- ✅ **Zero Data Leakage**: Complete cleanup after each test run
- ✅ **CI/CD Ready**: Automated testing in CI/CD pipelines

### Quality Standards
- ✅ **Type Safety**: Full TypeScript integration with strict mode
- ✅ **Error Handling**: Comprehensive error scenario testing
- ✅ **Security**: Organization isolation and access control validation
- ✅ **Performance**: Sub-second response times for typical operations
- ✅ **Documentation**: Clear test descriptions and inline comments

---

**Smart Code**: `HERA.COST.PRODUCT.TEST.SUITE.V2`

This test suite validates the complete Product Costing v2 system following HERA's enterprise-grade standards with bulletproof testing, comprehensive coverage, and production-ready quality assurance.