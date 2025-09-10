# HERA Furniture Module E2E Tests

Comprehensive end-to-end test suite for the HERA Furniture Module using Playwright.

## Test Structure

```
tests/e2e/furniture/
├── fixtures/
│   ├── auth.fixture.ts          # Authentication and organization setup
│   ├── test-data.fixture.ts     # Test data for products, components, etc.
│   └── organization.fixture.ts  # Organization-specific setup
├── helpers/
│   ├── api-helpers.ts           # Universal API interaction helpers
│   ├── table-helpers.ts         # Table interaction utilities
│   └── dynamic-field-helpers.ts # Dynamic field management
├── page-objects/
│   ├── BasePage.ts              # Base page object with common functionality
│   ├── ProductCatalogPage.ts    # Product catalog page interactions
│   ├── BillOfMaterialsPage.ts   # BOM management page
│   ├── ProductionRoutingPage.ts # Production routing setup
│   └── ProductCostingPage.ts    # Product costing calculations
└── tests/
    ├── product-setup-flow.spec.ts      # Product creation workflow
    ├── manufacturing-workflow.spec.ts   # Production management
    ├── ucr-business-rules.spec.ts      # Business rules validation
    └── order-to-delivery-cycle.spec.ts # Complete business cycle
```

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your test configuration:
# - PLAYWRIGHT_BASE_URL=http://localhost:3000
# - FURNITURE_TEST_ORG_ID=your-test-org-id
# - NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=your-test-org-id
```

### Run All Tests
```bash
# Run all furniture module tests
npm run test:furniture

# Or using Playwright directly
cd tests/e2e/furniture && npx playwright test
```

### Run Specific Tests
```bash
# Run product setup tests only
npx playwright test product-setup-flow

# Run manufacturing workflow tests
npx playwright test manufacturing-workflow

# Run UCR validation tests
npx playwright test ucr-business-rules

# Run order-to-delivery cycle tests
npx playwright test order-to-delivery-cycle
```

### Run Tests in Specific Browser
```bash
# Chrome only
npx playwright test --project=furniture-chromium

# Firefox only
npx playwright test --project=furniture-firefox

# Mobile tests
npx playwright test --project=furniture-mobile
```

### Debug Mode
```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test product-setup-flow --debug

# Run with UI mode
npx playwright test --ui
```

## Test Scenarios Covered

### 1. Product Setup Flow (`product-setup-flow.spec.ts`)
- Create new furniture product
- Add Bill of Materials (BOM)
- Setup production routing
- Verify product costing calculations
- Import BOM from CSV
- Copy routing from existing products

### 2. Manufacturing Workflow (`manufacturing-workflow.spec.ts`)
- Create sales orders
- Generate production orders
- Track production progress
- Quality control checkpoints
- Inventory updates
- Material shortage handling

### 3. UCR Business Rules (`ucr-business-rules.spec.ts`)
- Minimum order quantity validation
- Maximum discount limits
- Customer credit limit checks
- Complex warranty rules
- Rule activation/deactivation
- API-based rule validation

### 4. Order-to-Delivery Cycle (`order-to-delivery-cycle.spec.ts`)
- Customer inquiry and quotes
- Quote to order conversion
- Inventory availability checks
- Production planning
- Quality control
- Invoice generation
- Payment processing
- Shipment preparation
- Delivery tracking
- Installation completion
- Customer feedback
- Warranty registration

## Page Object Models

### BasePage
Common functionality for all pages:
- Navigation helpers
- Loading state management
- Error handling
- Toast notifications
- Universal API response waiting

### ProductCatalogPage
- Product search and filtering
- Product creation/editing/deletion
- Category management
- Bulk operations

### BillOfMaterialsPage
- Component management
- Cost calculations
- Version control
- Import/export functionality

### ProductionRoutingPage
- Operation sequencing
- Time and cost tracking
- Quality checkpoints
- Routing templates

### ProductCostingPage
- Material cost breakdown
- Labor cost analysis
- Overhead allocation
- What-if scenarios
- Historical comparisons

## Helper Utilities

### API Helpers (`api-helpers.ts`)
- `waitForUniversalApiResponse()` - Wait for specific API actions
- `createEntity()` - Create entities via Universal API
- `createRelationship()` - Create entity relationships
- `createTransaction()` - Create transactions with line items
- `addDynamicField()` - Add custom fields to entities
- `executeUCRRule()` - Execute business rules

### Table Helpers (`table-helpers.ts`)
- `TableHelper` class for interacting with data tables
- Row finding and filtering
- Sorting and pagination
- Action button clicks
- Data export

### Dynamic Field Helpers (`dynamic-field-helpers.ts`)
- `DynamicFieldHelper` class for custom field management
- Field creation and validation
- Bulk field operations
- Configuration import/export

## Writing New Tests

### 1. Create New Test File
```typescript
import { test, expect } from './fixtures/auth.fixture';
import { setupFurnitureContext } from './fixtures/auth.fixture';

test.describe('Furniture Module - New Feature', () => {
  test.beforeEach(async ({ page, authenticatedUser, furnitureOrganization }) => {
    await setupFurnitureContext(page, authenticatedUser, furnitureOrganization);
  });

  test('should test new feature', async ({ page }) => {
    // Your test code here
  });
});
```

### 2. Use Page Objects
```typescript
const productCatalog = new ProductCatalogPage(page);
await productCatalog.goto();
await productCatalog.searchProducts('chair');
```

### 3. Use Test Data Fixtures
```typescript
import { testProducts, testComponents } from './fixtures/test-data.fixture';

await productCatalog.fillProductForm(testProducts.chair);
```

### 4. Wait for API Responses
```typescript
await page.click('[data-testid="save-button"]');
await waitForUniversalApiResponse(page, 'create');
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Furniture Module E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:furniture
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/reports/furniture-module/
```

## Troubleshooting

### Common Issues

1. **Organization not found**
   - Ensure `FURNITURE_TEST_ORG_ID` is set correctly
   - Check that the test organization exists in the database

2. **Authentication failures**
   - Verify test user credentials
   - Check JWT token expiration

3. **Element not found**
   - Update `data-testid` attributes in the application
   - Check for timing issues (add explicit waits)

4. **API errors**
   - Check Universal API permissions
   - Verify organization context is set

### Debug Tips
- Use `page.screenshot()` to capture state
- Add `console.log()` statements in tests
- Use Playwright Inspector (`--debug` flag)
- Check browser developer tools in headed mode
- Review test artifacts in `tests/reports/`

## Best Practices

1. **Use Page Objects** - Encapsulate page interactions
2. **Use Test Fixtures** - Share common test data
3. **Wait for API Responses** - Ensure data is loaded
4. **Use Descriptive Test Names** - Clear test intentions
5. **Clean Up Test Data** - Avoid test pollution
6. **Test in Isolation** - Each test should be independent
7. **Use Proper Assertions** - Verify expected outcomes
8. **Handle Dynamic Content** - Use appropriate wait strategies