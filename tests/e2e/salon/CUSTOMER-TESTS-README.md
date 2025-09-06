# Customer CRUD E2E Tests

This directory contains end-to-end tests for the Salon Customer Management module.

## Test Files

- `customers-crud.spec.ts` - Basic customer listing and viewing tests
- `customers-crud-operations.spec.ts` - Full CRUD cycle tests (Create, Read, Update, Delete)

## Running Tests

### Quick Start (Headless)
```bash
npm run test:e2e:customers
```

### With Browser Visible
```bash
npm run test:e2e:customers:headed
```

### Interactive UI Mode
```bash
npm run test:e2e:customers:ui
```

### Using Test Runner Script
```bash
./run-customers-tests.sh           # Headless mode
./run-customers-tests.sh --headed  # With browser visible
./run-customers-tests.sh --ui      # UI mode
./run-customers-tests.sh --browser firefox  # Specific browser
```

### Run Specific Test
```bash
npx playwright test customers-crud.spec.ts
npx playwright test customers-crud-operations.spec.ts
```

## Test Coverage

### Customer List Tests
- ✅ Display customer list with pagination
- ✅ Search functionality
- ✅ Filter by status, segment, membership, location, staff
- ✅ Bulk selection and actions
- ✅ Customer segments and badges
- ✅ Value information (LTV, loyalty points)
- ✅ Mobile responsiveness

### Customer Detail Modal Tests  
- ✅ Open customer details
- ✅ Navigate between tabs (Profile, Activity, Value Programs, Files, Ledger)
- ✅ Display contact and personal information
- ✅ Show preferences and marketing consents
- ✅ Close modal functionality

### CRUD Operations Tests
- ✅ Create new customer with all fields
- ✅ Validate required fields
- ✅ Search and find created customer
- ✅ Update customer information
- ✅ Delete customer
- ✅ Quick actions (book appointment, send message)

## Test Data

Tests use dynamically generated test data with timestamps to avoid conflicts:
- Customer names: `Test Customer {timestamp}`
- Emails: `test.{timestamp}@example.com`
- Phone numbers: Standard UAE format

## Debugging

### View Test Report
```bash
npm run test:e2e:report
```

### Debug Mode
```bash
npx playwright test customers-crud.spec.ts --debug
```

### Generate New Tests
```bash
npm run test:e2e:codegen
# Navigate to /salon-data/customers and interact with the UI
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests affecting customer-related files
- GitHub Actions workflow: `.github/workflows/customers-e2e-tests.yml`

### Test Results
- HTML reports uploaded as artifacts
- Screenshots captured on failure
- Videos recorded on failure
- Test results posted as PR comments

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** after navigation
3. **Use dynamic test data** to avoid conflicts
4. **Clean up test data** after tests complete
5. **Test both success and error scenarios**
6. **Verify UI feedback** (success messages, validation errors)
7. **Test on multiple viewports** (desktop, tablet, mobile)

## Troubleshooting

### Tests failing to find elements
- Check if modal is using React Portal (rendered outside normal DOM)
- Verify z-index values for modals
- Use more specific selectors or data-testid attributes

### Flaky tests
- Add explicit waits for network requests
- Use `waitForLoadState('networkidle')`
- Increase timeout for slow operations
- Use retry logic for transient failures

### Modal not opening
- Ensure proper mounting state for SSR
- Check z-index conflicts
- Verify click handlers are attached
- Use React Portal for modals

## Future Enhancements

- [ ] Add customer import/export tests
- [ ] Test loyalty program operations
- [ ] Test membership management
- [ ] Test gift card operations
- [ ] Test customer merge functionality
- [ ] Add performance benchmarks
- [ ] Test real-time updates
- [ ] Add accessibility tests