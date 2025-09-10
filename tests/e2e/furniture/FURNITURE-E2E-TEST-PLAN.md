# 🧪 HERA Furniture Module - E2E Test Plan with Playwright

## 📋 Overview

This plan outlines comprehensive end-to-end testing for the HERA Furniture Module using Playwright, focusing on real business scenarios that span across multiple pages and features.

## 🎯 Test Strategy

### Principles
1. **Scenario-Based Testing**: Test complete business workflows, not individual pages
2. **Data Integrity**: Verify data flows correctly through the universal architecture
3. **UCR Validation**: Ensure business rules execute properly
4. **Multi-Page Flows**: Test workflows that span multiple modules
5. **Real Business Cases**: Use realistic furniture manufacturing scenarios

## 🏗️ Test Architecture

```
tests/
├── e2e/
│   ├── furniture/
│   │   ├── fixtures/
│   │   │   ├── furniture-test-data.ts
│   │   │   ├── test-organization.ts
│   │   │   └── auth-helper.ts
│   │   ├── scenarios/
│   │   │   ├── 01-product-creation.spec.ts
│   │   │   ├── 02-bom-assembly.spec.ts
│   │   │   ├── 03-production-routing.spec.ts
│   │   │   ├── 04-cost-calculation.spec.ts
│   │   │   ├── 05-sales-order-flow.spec.ts
│   │   │   ├── 06-manufacturing-order.spec.ts
│   │   │   └── 07-inventory-tracking.spec.ts
│   │   ├── page-objects/
│   │   │   ├── product-catalog.page.ts
│   │   │   ├── bom.page.ts
│   │   │   ├── routing.page.ts
│   │   │   └── costing.page.ts
│   │   └── furniture.config.ts
```

## 📊 Business Scenarios to Test

### Scenario 1: Complete Product Setup Flow
**Pages**: Product Catalog → BOM → Production Routing → Product Costing

```typescript
test('Complete furniture product setup', async ({ page }) => {
  // 1. Create a new dining table product
  await page.goto('/furniture/products');
  await page.click('text=New Product');
  await page.fill('[name="name"]', 'Modern Dining Table');
  await page.fill('[name="sku"]', 'DT-2024-001');
  // Add specifications via dynamic fields
  
  // 2. Define BOM structure
  await page.goto('/furniture/products/bom');
  await page.click('text=DT-2024-001');
  // Add components: wood, glass, hardware
  
  // 3. Setup production routing
  await page.goto('/furniture/products/routing');
  // Define manufacturing steps
  
  // 4. Verify automatic cost calculation
  await page.goto('/furniture/products/costing');
  // Check rolled-up costs from BOM
});
```

### Scenario 2: Order-to-Manufacturing Flow
**Pages**: Sales Order → Manufacturing Order → Inventory

```typescript
test('Order triggers manufacturing', async ({ page }) => {
  // 1. Create sales order for custom table
  // 2. System creates manufacturing order
  // 3. Check material requirements
  // 4. Verify inventory deduction
});
```

### Scenario 3: UCR Business Rules Validation
**Tests**: Pricing rules, approval workflows, validation rules

```typescript
test('UCR pricing and approval rules', async ({ page }) => {
  // 1. Create order with quantity triggering volume discount
  // 2. Verify UCR pricing calculation
  // 3. Apply discount requiring approval
  // 4. Check approval workflow triggered
});
```

## 🔧 Page Objects Pattern

### ProductCatalogPage
```typescript
export class ProductCatalogPage {
  constructor(private page: Page) {}
  
  async navigateTo() {
    await this.page.goto('/furniture/products');
  }
  
  async createProduct(data: ProductData) {
    await this.page.click('text=New Product');
    await this.page.fill('[data-testid="product-name"]', data.name);
    await this.page.fill('[data-testid="product-sku"]', data.sku);
    await this.page.selectOption('[data-testid="product-category"]', data.category);
    await this.page.click('button:has-text("Save")');
  }
  
  async searchProduct(sku: string) {
    await this.page.fill('[data-testid="search-input"]', sku);
    await this.page.keyboard.press('Enter');
  }
  
  async verifyProductExists(sku: string) {
    await expect(this.page.locator(`text=${sku}`)).toBeVisible();
  }
}
```

### BOMPage
```typescript
export class BOMPage {
  constructor(private page: Page) {}
  
  async addComponent(productSku: string, component: ComponentData) {
    await this.page.click(`[data-testid="product-${productSku}"]`);
    await this.page.click('text=Add Component');
    await this.page.fill('[data-testid="component-search"]', component.sku);
    await this.page.fill('[data-testid="quantity"]', component.quantity.toString());
    await this.page.click('button:has-text("Add to BOM")');
  }
  
  async verifyBOMStructure(productSku: string, expectedComponents: number) {
    const components = await this.page.locator(`[data-testid="bom-tree-${productSku}"] .component`);
    await expect(components).toHaveCount(expectedComponents);
  }
}
```

## 📝 Test Data Fixtures

### furniture-test-data.ts
```typescript
export const testProducts = {
  diningTable: {
    name: 'Modern Dining Table',
    sku: 'DT-TEST-001',
    category: 'dining',
    dimensions: { length: 200, width: 100, height: 75 },
    material: 'oak',
    finish: 'natural'
  },
  officeChair: {
    name: 'Ergonomic Office Chair',
    sku: 'OC-TEST-001',
    category: 'seating',
    dimensions: { length: 60, width: 60, height: 110 },
    material: 'mesh',
    color: 'black'
  }
};

export const testComponents = {
  tableTop: {
    name: 'Oak Table Top',
    sku: 'COMP-TOP-001',
    quantity: 1,
    unit: 'EA',
    cost: 250
  },
  tableLegs: {
    name: 'Metal Table Legs',
    sku: 'COMP-LEG-001',
    quantity: 4,
    unit: 'EA',
    cost: 50
  }
};
```

## 🎬 Critical E2E Test Scenarios

### 1. Product Lifecycle Test
```typescript
test.describe('Furniture Product Lifecycle', () => {
  test('Create product with complete specifications', async ({ page }) => {
    // Test dynamic fields for furniture specifications
  });
  
  test('Build multi-level BOM structure', async ({ page }) => {
    // Test parent-child component relationships
  });
  
  test('Calculate costs through BOM explosion', async ({ page }) => {
    // Verify cost roll-up calculations
  });
});
```

### 2. Manufacturing Process Test
```typescript
test.describe('Manufacturing Workflow', () => {
  test('Production routing with work centers', async ({ page }) => {
    // Define cutting → assembly → finishing steps
  });
  
  test('Material availability check', async ({ page }) => {
    // Verify inventory validation before production
  });
  
  test('Production order completion', async ({ page }) => {
    // Test finished goods receipt
  });
});
```

### 3. Business Rules Test
```typescript
test.describe('UCR Business Rules', () => {
  test('Dimension validation rules', async ({ page }) => {
    // Test min/max furniture dimensions
  });
  
  test('Volume pricing calculation', async ({ page }) => {
    // Test quantity-based discounts
  });
  
  test('Approval workflow triggers', async ({ page }) => {
    // Test discount approval thresholds
  });
});
```

### 4. Integration Test
```typescript
test.describe('Full Business Cycle', () => {
  test('Order to delivery complete flow', async ({ page }) => {
    // 1. Customer places order
    // 2. Check stock availability
    // 3. Create manufacturing order
    // 4. Process production
    // 5. Update inventory
    // 6. Complete shipment
  });
});
```

## 🔄 Test Execution Phases

### Phase 1: Setup & Authentication
```typescript
test.beforeAll(async () => {
  // Create test organization
  // Setup test user
  // Initialize test data
});
```

### Phase 2: Individual Module Tests
- Product Catalog CRUD operations
- BOM structure creation
- Routing definition
- Cost calculation verification

### Phase 3: Cross-Module Workflows
- Product → BOM → Costing flow
- Order → Manufacturing → Inventory flow
- Complete business scenarios

### Phase 4: Performance & Scale Tests
- Bulk product creation
- Large BOM structures (100+ components)
- Concurrent user scenarios

## 🛠️ Playwright Configuration

### playwright.config.ts
```typescript
export default defineConfig({
  testDir: './tests/e2e/furniture',
  timeout: 60000,
  retries: 2,
  workers: 1, // Sequential for data dependencies
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'furniture-chrome',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
```

## 🚀 Execution Commands

```bash
# Run all furniture tests
npm run test:e2e:furniture

# Run specific scenario
npm run test:e2e:furniture -- --grep "Product Lifecycle"

# Run with UI mode
npm run test:e2e:furniture -- --ui

# Generate test report
npm run test:e2e:furniture:report
```

## 📊 Success Metrics

1. **Coverage**: All 4 main modules tested
2. **Scenarios**: 7+ complete business workflows
3. **Data Integrity**: Universal API data consistency
4. **UCR Validation**: All rule types tested
5. **Performance**: Pages load < 2 seconds
6. **Reliability**: 95%+ test pass rate

## 🎯 Next Steps

1. Implement page objects for all modules
2. Create test data factories
3. Build scenario test suites
4. Add visual regression tests
5. Integrate with CI/CD pipeline