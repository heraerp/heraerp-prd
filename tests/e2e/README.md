# HERA UAT Testing with Playwright

## 🎭 Why Playwright?

- **Auto-wait**: No flaky tests due to timing issues
- **Cross-browser**: Test on Chrome, Firefox, Safari, and mobile
- **Fast**: Parallel execution and efficient selectors
- **Debugging**: Screenshots, videos, and trace viewer
- **Modern**: Built for modern web apps like HERA

## 🚀 Quick Start

```bash
# Install Playwright
npm install

# Install browsers (one-time)
npm run test:e2e:install

# Run all tests
npm run test:e2e

# Run tests with UI (recommended for debugging)
npm run test:e2e:ui

# Run specific test suite
npm run test:e2e -- tests/e2e/auth/login.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed

# Generate test code by recording
npm run test:e2e:codegen
```

## 📁 Test Structure

```
tests/e2e/
├── auth/                    # Authentication tests
│   └── login.spec.ts       # Login flow testing
├── organization/           # Multi-tenant tests
│   └── organization-flow.spec.ts
├── mcp-chat/              # AI chat interface tests
│   └── chat-interaction.spec.ts
├── universal-crud/        # Entity management tests
│   └── entity-management.spec.ts
├── performance/           # Load and performance tests
│   └── load-test.spec.ts
├── mobile/                # Mobile responsiveness
│   └── mobile-responsive.spec.ts
├── visual/                # Visual regression tests
│   └── ui-readability.spec.ts
└── helpers/               # Test utilities
    └── auth.setup.ts      # Authentication helper
```

## 🧪 Test Categories

### 1. **Smoke Tests** (@smoke)
Critical path tests that must pass:
- Login/Logout
- Create organization
- Basic CRUD operations

### 2. **UAT Tests** (@uat)
User acceptance tests:
- Complete user journeys
- Business workflows
- Integration scenarios

### 3. **Performance Tests**
- Page load times
- API response times
- Concurrent user handling

### 4. **Mobile Tests**
- Responsive design
- Touch interactions
- Mobile-specific features

## 📝 Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/path');
    
    // Interact
    await page.getByRole('button', { name: 'Click me' }).click();
    
    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Best Practices
1. **Use semantic selectors**: `getByRole`, `getByLabel`, `getByText`
2. **Avoid hard waits**: Use `expect` with timeout instead
3. **Test user journeys**: Not just individual pages
4. **Handle async operations**: Wait for network idle or specific elements
5. **Use fixtures**: For common setup like authentication

## 🎯 Running UAT Suite

```bash
# Run complete UAT suite
node tests/e2e/run-uat-tests.js

# Run only UAT-tagged tests
npm run test:uat

# Run smoke tests
npm run test:smoke
```

## 📊 Test Reports

After running tests:

```bash
# View HTML report
npm run test:e2e:report

# Reports are in:
# - test-results/html/index.html (HTML report)
# - test-results/results.json (JSON data)
# - test-results/junit.xml (CI integration)
```

## 🐛 Debugging Failed Tests

1. **Run with UI Mode**:
   ```bash
   npm run test:e2e:ui
   ```

2. **Debug specific test**:
   ```bash
   npm run test:e2e:debug -- tests/e2e/auth/login.spec.ts
   ```

3. **Check artifacts**:
   - Screenshots: `test-results/`
   - Videos: `test-results/`
   - Traces: Use trace viewer

## 🔧 Configuration

Edit `playwright.config.ts` to:
- Change browsers
- Set timeouts
- Configure reporters
- Set base URL
- Enable/disable features

## 🚀 CI/CD Integration

```yaml
# GitHub Actions example
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright
  run: npm run test:e2e:install
  
- name: Run tests
  run: npm run test:e2e
  
- name: Upload artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

## 💡 Tips

1. **Parallel execution**: Tests run in parallel by default
2. **Retries**: Failed tests retry automatically in CI
3. **Projects**: Test across browsers simultaneously
4. **Fixtures**: Use for common test setup
5. **Snapshots**: For visual regression testing

## 🎥 Recording Tests

Generate test code by recording your actions:

```bash
npm run test:e2e:codegen

# Then:
# 1. Browser opens
# 2. Navigate and interact
# 3. Copy generated code
# 4. Paste into test file
```

This is the fastest way to create new tests!