# HERA Salon Module - Playwright UAT Testing

## 🎯 Overview

Comprehensive end-to-end testing for the HERA Salon Management System, covering all business-critical functionality from appointment booking to point-of-sale operations.

## 🧪 Test Coverage

### 1. **Dashboard Tests** (`dashboard.spec.ts`)
- ✅ KPI cards display (revenue, appointments, clients, staff)
- ✅ Quick actions navigation
- ✅ Today's appointments section
- ✅ Top services analytics
- ✅ Recent activity feed
- ✅ Navigation to all modules

### 2. **Appointments Tests** (`appointments.spec.ts`)
- ✅ Appointment list display with filtering
- ✅ Date navigation (previous/next)
- ✅ Search by client/service/stylist
- ✅ Tab navigation (Today/Upcoming/Completed/Cancelled)
- ✅ Status badges and colors
- ✅ Check-in functionality
- ✅ Cancellation with reason
- ✅ Edit appointment details
- ✅ New appointment creation
- ✅ Empty state handling

### 3. **Client Management Tests** (`clients.spec.ts`)
- ✅ Client list with tier badges (Platinum/Gold/Silver/Bronze)
- ✅ Client statistics display
- ✅ Search and filter functionality
- ✅ Add new client with validation
- ✅ Edit client information
- ✅ View client details/history
- ✅ Import/Export clients
- ✅ Tab filtering (All/Active/VIP/Inactive)
- ✅ Loyalty points display
- ✅ Phone number validation

### 4. **Point of Sale Tests** (`pos.spec.ts`)
- ✅ Service/Product catalog display
- ✅ Shopping cart management
- ✅ Customer selection
- ✅ Quantity adjustments
- ✅ VAT calculation (5% Dubai)
- ✅ Payment methods (Cash, Card, Digital Wallets)
- ✅ Split payment functionality
- ✅ Discount application
- ✅ Staff assignment to services
- ✅ Receipt generation

### 5. **Services Management Tests** (`services.spec.ts`)
- ✅ Service catalog display
- ✅ Category management
- ✅ Add/Edit/Delete services
- ✅ Price and duration settings
- ✅ Service availability toggle
- ✅ Search and filter
- ✅ Booking statistics
- ✅ Bulk actions
- ✅ Form validation

## 🚀 Running Salon Tests

### Quick Start
```bash
# Run all salon tests
node tests/e2e/salon/run-salon-tests.js

# Run in headed mode (see browser)
node tests/e2e/salon/run-salon-tests.js --headed

# Run with slow motion for debugging
node tests/e2e/salon/run-salon-tests.js --headed --slow

# Stop on first failure
node tests/e2e/salon/run-salon-tests.js --stop-on-failure
```

### Individual Test Suites
```bash
# Run specific module tests
npm run test:e2e -- tests/e2e/salon/appointments.spec.ts
npm run test:e2e -- tests/e2e/salon/pos.spec.ts
npm run test:e2e -- tests/e2e/salon/clients.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui -- tests/e2e/salon/appointments.spec.ts
```

### Test Configuration
```bash
# Set base URL for different environments
node run-salon-tests.js --url https://salon-staging.heraerp.com

# Increase timeout for slow connections
node run-salon-tests.js --timeout 60000

# Full production test
node run-salon-tests.js --url https://mario.heraerp.com --timeout 45000
```

## 📊 Test Reports

After running tests, reports are generated in multiple formats:

1. **Console Output**: Immediate feedback with pass/fail status
2. **JSON Report**: `test-results/salon-test-report.json`
3. **HTML Report**: Run `npm run test:e2e:report` to view
4. **Screenshots**: Failed test screenshots in `test-results/`

## 🧪 Test Data Requirements

For comprehensive testing, ensure your salon instance has:

### Minimum Test Data:
- **5+ Clients** with different loyalty tiers
- **10+ Services** across multiple categories
- **3+ Staff Members** with different roles
- **5+ Appointments** in various states
- **Sample Products** for POS testing
- **Transaction History** for analytics

### Setup Test Data:
```bash
# Use HERA CLI to create test data
cd mcp-server
node create-salon-test-data.js --org-id "your-org-id"
```

## 🐛 Debugging Failed Tests

### 1. **Run in UI Mode**
```bash
npm run test:e2e:ui -- tests/e2e/salon/[failing-test].spec.ts
```

### 2. **Use Debug Mode**
```bash
npm run test:e2e:debug -- tests/e2e/salon/[failing-test].spec.ts
```

### 3. **Check Screenshots**
Failed tests automatically capture screenshots:
```
test-results/
├── salon-appointments-failed.png
├── salon-pos-checkout-failed.png
└── ...
```

### 4. **View Trace Files**
```bash
npx playwright show-trace test-results/trace.zip
```

## 🔧 Common Issues & Solutions

### Issue: "Element not found"
**Solution**: Check if element selectors have changed in the UI. Update test selectors accordingly.

### Issue: "Timeout waiting for selector"
**Solution**: 
- Increase timeout: `await page.waitForSelector('selector', { timeout: 10000 })`
- Check if page is loading correctly
- Verify API responses

### Issue: "Test works locally but fails in CI"
**Solution**:
- Check for timing issues - add appropriate waits
- Ensure test data is consistent
- Verify environment variables

### Issue: "Cannot click element"
**Solution**:
- Element might be covered - scroll into view first
- Check if element is disabled
- Wait for animations to complete

## 📝 Writing New Salon Tests

### Test Structure Template:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Salon [Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to feature page
    await page.goto('/salon/[feature]');
    
    // Wait for page load
    await page.waitForSelector('h1:has-text("[Feature]")');
  });

  test('should [test description]', async ({ page }) => {
    // Arrange - setup test data
    
    // Act - perform actions
    
    // Assert - verify results
    await expect(element).toBeVisible();
  });
});
```

### Best Practices:
1. **Use data-testid**: Add test IDs to critical elements
2. **Wait appropriately**: Use `waitForSelector` over fixed timeouts
3. **Test user journeys**: Not just individual features
4. **Handle async operations**: Wait for API calls to complete
5. **Clean test data**: Reset state between tests when needed

## 🎯 Salon-Specific Test Patterns

### Appointment Status Flow:
```typescript
// Test complete appointment lifecycle
pending → confirmed → checked-in → completed
```

### Client Tier Progression:
```typescript
// Test loyalty point accumulation
Bronze (0-199) → Silver (200-499) → Gold (500-999) → Platinum (1000+)
```

### POS Transaction Flow:
```typescript
// Test complete sale process
Select Services → Add to Cart → Apply Discount → Select Payment → Process → Receipt
```

## 🚀 CI/CD Integration

### GitHub Actions Example:
```yaml
name: Salon UAT Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install
      - run: node tests/e2e/salon/run-salon-tests.js
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 📈 Performance Benchmarks

Expected test execution times:
- **Dashboard**: 15-20 seconds
- **Appointments**: 30-45 seconds
- **Clients**: 25-35 seconds
- **POS**: 40-60 seconds
- **Services**: 20-30 seconds

**Total Suite**: 2-3 minutes

## 🎉 Success Criteria

All critical tests must pass for deployment:
- ✅ Dashboard loads with correct data
- ✅ Appointments can be created and managed
- ✅ Clients can be added with validation
- ✅ POS processes sales correctly
- ✅ All navigation works properly

Non-critical test failures are logged but don't block deployment.