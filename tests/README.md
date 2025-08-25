# HERA ERP - User Acceptance Testing (UAT) Suite

This directory contains comprehensive UI testing for HERA ERP using Playwright.

## Overview

The test suite validates all critical user journeys and functionality across the HERA Salon module, ensuring the application meets business requirements and provides a seamless user experience.

## Test Structure

```
tests/
├── e2e/
│   └── salon/
│       ├── appointments.spec.ts         # Original appointment tests
│       ├── clients.spec.ts              # Client management tests
│       ├── pos.spec.ts                  # Point of Sale tests
│       ├── services.spec.ts             # Service catalog tests
│       ├── dashboard.spec.ts            # Dashboard functionality
│       ├── navigation-fixed.spec.ts     # Fixed navigation tests
│       ├── comprehensive-salon.spec.ts  # Full test suite
│       ├── uat-report-generator.ts      # UAT report generation
│       └── helpers/
│           └── fix-overlapping.ts       # UI helper functions
```

## Running Tests

### Prerequisites

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run salon tests only
npm run test:e2e:salon

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:salon:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run navigation tests only
npx playwright test navigation-fixed.spec.ts

# Run a specific test
npx playwright test -g "Navigate to Appointments"

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Categories

### 1. Functional Tests
- User authentication and authorization
- CRUD operations (Create, Read, Update, Delete)
- Business workflow validation
- Data persistence and integrity

### 2. UI/UX Tests
- Responsive design across devices
- Navigation consistency
- Visual feedback and animations
- Error state handling

### 3. Performance Tests
- Page load times (< 3 seconds)
- Navigation response times (< 2 seconds)
- Search functionality performance
- API response times

### 4. Integration Tests
- Cross-module data flow
- State management
- API integration
- Third-party service integration

### 5. Accessibility Tests
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and roles
- Color contrast compliance

## UAT Report Generation

The test suite includes automatic UAT report generation:

```bash
# Run UAT tests with report
npx playwright test uat-report-generator.ts

# Reports generated:
# - uat-report.html (visual report)
# - uat-report.json (raw data)
# - test-results.json (Playwright report)
```

### Report Metrics
- **Functional Coverage**: % of business requirements tested
- **Performance Score**: % of performance benchmarks met
- **UI Consistency**: % of UI tests passing
- **Overall Score**: Total test success rate

## Best Practices

### 1. Page Object Model
Use page objects for reusable components:
```typescript
class SalonDashboardPage {
  constructor(private page: Page) {}
  
  async navigateToAppointments() {
    await this.page.click('button:has-text("Appointments")');
  }
}
```

### 2. Test Data Management
- Use test-specific data
- Clean up after tests
- Avoid dependencies between tests

### 3. Selectors
Priority order for selectors:
1. Role-based: `getByRole('button', { name: 'Submit' })`
2. Text content: `getByText('Welcome')`
3. Test IDs: `getByTestId('submit-button')`
4. CSS selectors: `locator('.submit-btn')`

### 4. Assertions
- Use explicit waits: `await expect(element).toBeVisible()`
- Set appropriate timeouts
- Make assertions specific and meaningful

## Troubleshooting

### Common Issues

1. **Elements not clickable**
   - Solution: Use force click or wait for element
   ```typescript
   await element.click({ force: true });
   ```

2. **Flaky tests**
   - Solution: Add proper waits
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Viewport issues**
   - Solution: Set viewport explicitly
   ```typescript
   await page.setViewportSize({ width: 1280, height: 720 });
   ```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    npx playwright install
    npm run test:e2e
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.TEST_URL }}
```

### Environment Variables
- `PLAYWRIGHT_BASE_URL`: Base URL for tests (default: http://localhost:3000)
- `CI`: Set to true in CI environments

## Contributing

1. Write tests for new features
2. Ensure tests are deterministic
3. Add appropriate comments
4. Update this README for new test categories

## Support

For issues or questions:
- Check test output and screenshots
- Review Playwright trace files
- Consult Playwright documentation
- Contact the QA team