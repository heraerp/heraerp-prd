# Automated CRUD Testing for HERA

HERA now includes a revolutionary automated testing system that generates and runs comprehensive tests for any CRUD module following the universal 6-table architecture.

## 🚀 Quick Start

### Test a Single CRUD Module

```bash
# Test salon services
npm run test:crud -- --entity salon_service

# Test customer module
npm run test:crud -- --entity customer

# Test with custom module name
npm run test:crud -- --entity product --module product-management
```

### Test All CRUD Modules

```bash
# Run tests for all detected CRUD modules
npm run test:crud:all

# Build with automated tests (tests run before build)
npm run build:test

# Verbose output
npm run build:test:verbose
```

## 🧪 How It Works

### 1. **Automatic Detection**
The system scans your codebase for CRUD modules by looking for:
- Directories with `-data` suffix (e.g., `salon-data`)
- Directories with `manage-` prefix
- Pages/routes using `universalApi`
- Components with CRUD operations

### 2. **Test Generation**
For each detected module, the system generates:
- **CREATE tests**: Entity creation and dynamic fields
- **READ tests**: Fetching and searching entities
- **UPDATE tests**: Modifying entities and fields
- **DELETE tests**: Deletion with cascade handling
- **Relationship tests**: Entity connections
- **Transaction tests**: Business operations
- **Security tests**: Multi-tenant isolation
- **Error handling tests**: Validation and network errors

### 3. **Automatic Execution**
Tests are run automatically with:
- Mock API responses for fast execution
- Organization isolation verification
- HERA architecture compliance checks
- Smart code validation

## 📝 Test Configuration

### Built-in Entity Types

The system recognizes common entity types with pre-configured tests:

```javascript
// Customer
{
  entityType: 'customer',
  dynamicFields: ['email', 'credit_limit'],
  smartCodePrefix: 'HERA.CRM.CUSTOMER'
}

// Product
{
  entityType: 'product',
  dynamicFields: ['price', 'stock_quantity'],
  smartCodePrefix: 'HERA.INV.PRODUCT'
}

// Salon Service
{
  entityType: 'salon_service',
  dynamicFields: ['price', 'duration', 'description'],
  relationships: ['belongs_to_category'],
  transactions: ['service_booking']
}
```

### Custom Configuration

Create custom test configurations for new entity types:

```javascript
// scripts/test-configs/my-entity.js
module.exports = {
  entityType: 'my_entity',
  displayName: 'My Entity',
  smartCodePrefix: 'HERA.CUSTOM.ENTITY',
  dynamicFields: [
    {
      name: 'custom_field',
      type: 'text',
      testValue: 'Test Value',
      smartCode: 'HERA.CUSTOM.FIELD.v1'
    }
  ]
};
```

## 🏗️ Build Integration

### Standard Build with Tests

```bash
# Run build with automatic CRUD testing
npm run build:test
```

This will:
1. Detect all CRUD modules
2. Generate tests for each module
3. Run all tests
4. Proceed with build only if tests pass
5. Generate test report in `test-results/`

### CI/CD Integration

```yaml
# .github/workflows/build.yml
steps:
  - name: Checkout
    uses: actions/checkout@v3
    
  - name: Install dependencies
    run: npm ci
    
  - name: Run automated CRUD tests
    run: npm run test:crud:all
    
  - name: Build with tests
    run: npm run build:test
```

## 📊 Test Reports

After running tests, find reports in:
- `test-results/crud-test-report.json` - JSON format
- `tests/generated/` - Generated test files

### Report Structure

```json
{
  "timestamp": "2024-09-06T10:00:00Z",
  "totalModules": 5,
  "passed": 5,
  "failed": 0,
  "results": [
    {
      "module": "salon-services",
      "status": "PASSED"
    }
  ]
}
```

## 🎯 Benefits

### 1. **Zero Manual Test Writing**
Tests are generated automatically based on HERA patterns.

### 2. **100% CRUD Coverage**
Every CRUD operation is tested comprehensively.

### 3. **Multi-tenant Security**
Organization isolation is verified in every test.

### 4. **Fast Execution**
Mocked tests run in milliseconds, not seconds.

### 5. **Build Confidence**
No broken CRUD modules make it to production.

## 🛠️ Advanced Usage

### Generate Only (No Run)

```bash
npm run test:crud -- --entity product --skip-run
```

### Custom Test Location

Generated tests are saved to:
```
tests/generated/{module-name}-crud.test.js
```

### Run Specific Tests

```bash
# Run generated test directly
npx jest tests/generated/salon-service-crud.test.js
```

### Verbose Output

```bash
npm run test:crud -- --entity customer --verbose
```

## 📋 HERA Compliance

All generated tests validate:
- ✅ Use of universal 6-table architecture
- ✅ Smart code patterns in all operations
- ✅ Organization ID in every request
- ✅ Dynamic fields via `core_dynamic_data`
- ✅ Relationships via `core_relationships`
- ✅ No schema modifications

## 🚨 Troubleshooting

### "No CRUD modules detected"
- Check directory structure matches CRUD patterns
- Ensure modules use `universalApi`
- Try specifying entity type manually

### "Tests failed"
- Check test output for specific failures
- Verify entity type matches code
- Ensure mock data is appropriate

### "Build failed after tests"
- Fix failing tests before build
- Use `--skip-tests` for emergency builds
- Check `test-results/` for details

## 🎉 Example Output

```bash
$ npm run build:test

🏗️  HERA Build with Automated Tests

✔ Found 3 CRUD modules

Modules to test:
  - salon-data (salon_service)
  - customer-management (customer)
  - product-catalog (product)

🧪 Running automated tests...

✔ Tests passed for salon-data
✔ Tests passed for customer-management
✔ Tests passed for product-catalog

✅ All tests passed! (3/3)

📦 Running production build...

✔ Build completed successfully

✨ Build completed in 45.2s
```

## 🔮 Future Enhancements

- [ ] Integration test mode with real database
- [ ] Performance benchmarking
- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Load testing integration

---

**Remember**: With HERA's automated testing, you never have to manually write CRUD tests again. The system ensures every module follows universal patterns and maintains multi-tenant security automatically.