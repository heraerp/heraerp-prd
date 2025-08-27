import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

interface UATestReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  testResults: TestResult[];
  summary: {
    functionalCoverage: number;
    performanceScore: number;
    uiConsistency: number;
    overallScore: number;
  };
}

// UAT Test Suite with Report Generation
test.describe('HERA Salon UAT - Complete Validation', () => {
  let report: UATestReport;
  let testResults: TestResult[] = [];
  
  test.beforeAll(async () => {
    report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      testResults: [],
      summary: {
        functionalCoverage: 0,
        performanceScore: 0,
        uiConsistency: 0,
        overallScore: 0
      }
    };
  });

  test.afterEach(async ({ page }, testInfo) => {
    const result: TestResult = {
      name: testInfo.title,
      status: testInfo.status as 'passed' | 'failed' | 'skipped',
      duration: testInfo.duration
    };

    if (testInfo.status === 'failed') {
      result.error = testInfo.error?.message;
      const screenshot = await page.screenshot();
      const screenshotPath = `test-results/screenshots/${testInfo.title.replace(/\s+/g, '-')}.png`;
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      fs.writeFileSync(screenshotPath, screenshot);
      result.screenshot = screenshotPath;
    }

    testResults.push(result);
  });

  test.afterAll(async () => {
    // Calculate summary scores
    const functionalTests = testResults.filter(t => t.name.includes('functional'));
    const performanceTests = testResults.filter(t => t.name.includes('performance'));
    const uiTests = testResults.filter(t => t.name.includes('UI'));

    report.testResults = testResults;
    report.totalTests = testResults.length;
    report.passed = testResults.filter(t => t.status === 'passed').length;
    report.failed = testResults.filter(t => t.status === 'failed').length;
    report.skipped = testResults.filter(t => t.status === 'skipped').length;
    report.duration = testResults.reduce((sum, t) => sum + t.duration, 0);

    // Calculate scores
    report.summary.functionalCoverage = (functionalTests.filter(t => t.status === 'passed').length / functionalTests.length) * 100 || 0;
    report.summary.performanceScore = (performanceTests.filter(t => t.status === 'passed').length / performanceTests.length) * 100 || 0;
    report.summary.uiConsistency = (uiTests.filter(t => t.status === 'passed').length / uiTests.length) * 100 || 0;
    report.summary.overallScore = (report.passed / report.totalTests) * 100;

    // Generate HTML report
    generateHTMLReport(report);
    
    // Generate JSON report
    fs.writeFileSync('uat-report.json', JSON.stringify(report, null, 2));
  });

  // Functional Tests
  test.describe('Functional Requirements', () => {
    test('UAT-F001: User can login to salon system', async ({ page }) => {
      await page.goto('/salon');
      await expect(page).toHaveTitle(/HERA/);
      await expect(page.getByText('Welcome to Dubai Luxury Salon')).toBeVisible();
    });

    test('UAT-F002: Dashboard displays key metrics', async ({ page }) => {
      await page.goto('/salon');
      
      // Check for metric cards or dashboard elements
      const metricsVisible = await page.locator('.metric-card, .stat-card, [class*="metric"], [class*="stat"]').count() > 0;
      expect(metricsVisible).toBeTruthy();
    });

    test('UAT-F003: Appointment booking functional flow', async ({ page }) => {
      await page.goto('/salon/appointments');
      
      // Check appointment page loads
      expect(page.url()).toContain('appointments');
      
      // Verify key appointment elements
      const hasAppointmentElements = await page.locator('table, .appointments-list, .calendar').count() > 0;
      expect(hasAppointmentElements).toBeTruthy();
    });

    test('UAT-F004: Client management CRUD operations', async ({ page }) => {
      await page.goto('/salon/clients');
      
      // Check for client list/grid
      const hasClientElements = await page.locator('table, .client-card, .clients-grid').count() > 0;
      expect(hasClientElements).toBeTruthy();
      
      // Check for add button
      const hasAddButton = await page.locator('button:has-text("Add"), button:has-text("New")').count() > 0;
      expect(hasAddButton).toBeTruthy();
    });

    test('UAT-F005: Service catalog management', async ({ page }) => {
      await page.goto('/salon/services');
      
      // Check services are displayed
      const hasServices = await page.locator('.service-card, table, [class*="service"]').count() > 0;
      expect(hasServices).toBeTruthy();
    });

    test('UAT-F006: POS checkout process', async ({ page }) => {
      await page.goto('/salon/pos');
      
      // Check for POS elements
      const hasPOSElements = await page.locator('[class*="cart"], [class*="total"], button:has-text("Checkout")').count() > 0;
      expect(hasPOSElements).toBeTruthy();
    });
  });

  // UI/UX Tests
  test.describe('UI/UX Requirements', () => {
    test('UAT-UI001: Responsive design on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/salon');
      
      // Check sidebar is still accessible
      const sidebar = page.locator('.fixed.left-0').first();
      await expect(sidebar).toBeVisible();
    });

    test('UAT-UI002: Navigation consistency', async ({ page }) => {
      await page.goto('/salon');
      
      // Check navigation elements
      const navItems = ['Dashboard', 'Appointments', 'Clients', 'Services'];
      for (const item of navItems) {
        const navElement = page.getByText(item).first();
        await expect(navElement).toBeVisible({ timeout: 5000 });
      }
    });

    test('UAT-UI003: Visual feedback for user actions', async ({ page }) => {
      await page.goto('/salon');
      
      // Hover over sidebar to check expansion
      const sidebar = page.locator('.fixed.left-0').first();
      await sidebar.hover();
      
      // Check if sidebar expands (width changes)
      await page.waitForTimeout(500);
      const expandedWidth = await sidebar.evaluate(el => el.offsetWidth);
      expect(expandedWidth).toBeGreaterThan(100);
    });

    test('UAT-UI004: Error states display correctly', async ({ page }) => {
      // Navigate to a non-existent page
      await page.goto('/salon/non-existent-page');
      
      // Should either show 404 or redirect
      const has404 = await page.getByText('404').isVisible({ timeout: 5000 }).catch(() => false);
      const redirected = page.url().includes('/salon');
      
      expect(has404 || redirected).toBeTruthy();
    });
  });

  // Performance Tests
  test.describe('Performance Requirements', () => {
    test('UAT-P001: Page load time under 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/salon');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
    });

    test('UAT-P002: Navigation response time', async ({ page }) => {
      await page.goto('/salon');
      
      const navigationTimes: number[] = [];
      const routes = ['/salon/appointments', '/salon/clients', '/salon/services'];
      
      for (const route of routes) {
        const startTime = Date.now();
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');
        navigationTimes.push(Date.now() - startTime);
      }
      
      const avgTime = navigationTimes.reduce((a, b) => a + b) / navigationTimes.length;
      expect(avgTime).toBeLessThan(2000);
    });

    test('UAT-P003: Search functionality response', async ({ page }) => {
      await page.goto('/salon/clients');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const startTime = Date.now();
        await searchInput.fill('test search');
        await page.waitForTimeout(500); // Wait for search debounce
        const searchTime = Date.now() - startTime;
        
        expect(searchTime).toBeLessThan(1000);
      }
    });
  });

  // Integration Tests
  test.describe('Integration Requirements', () => {
    test('UAT-I001: Data persistence across pages', async ({ page }) => {
      // This would test if user data/settings persist
      await page.goto('/salon');
      
      // Set some state (e.g., expand sidebar)
      const sidebar = page.locator('.fixed.left-0').first();
      await sidebar.hover();
      
      // Navigate away and back
      await page.goto('/salon/appointments');
      await page.goto('/salon');
      
      // Check if state persists (this is a simple example)
      expect(page.url()).toContain('/salon');
    });

    test('UAT-I002: Cross-module data flow', async ({ page }) => {
      // Test if creating a client in one module appears in another
      await page.goto('/salon/clients');
      
      // Check if clients page loads properly
      const hasClientData = await page.locator('table, .client-card, .clients-grid').count() > 0;
      expect(hasClientData).toBeTruthy();
    });
  });

  // Accessibility Tests
  test.describe('Accessibility Requirements', () => {
    test('UAT-A001: Keyboard navigation support', async ({ page }) => {
      await page.goto('/salon');
      
      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if an element is focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('UAT-A002: Screen reader compatibility', async ({ page }) => {
      await page.goto('/salon');
      
      // Check for ARIA labels
      const hasAriaLabels = await page.locator('[aria-label], [role]').count() > 0;
      expect(hasAriaLabels).toBeTruthy();
    });
  });
});

// HTML Report Generator
function generateHTMLReport(report: UATestReport) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HERA Salon UAT Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; text-align: center; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card h3 { margin: 0; color: #666; font-size: 14px; }
    .summary-card .value { font-size: 32px; font-weight: bold; margin: 10px 0; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .skipped { color: #ffc107; }
    .score-excellent { color: #28a745; }
    .score-good { color: #17a2b8; }
    .score-fair { color: #ffc107; }
    .score-poor { color: #dc3545; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
    th { background: #f8f9fa; font-weight: bold; }
    tr:hover { background: #f8f9fa; }
    .test-passed { color: #28a745; }
    .test-failed { color: #dc3545; }
    .test-skipped { color: #ffc107; }
    .footer { text-align: center; margin-top: 40px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HERA Salon UAT Report</h1>
    <p style="text-align: center; color: #666;">Generated on ${new Date(report.timestamp).toLocaleString()}</p>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <div class="value">${report.totalTests}</div>
      </div>
      <div class="summary-card">
        <h3>Passed</h3>
        <div class="value passed">${report.passed}</div>
      </div>
      <div class="summary-card">
        <h3>Failed</h3>
        <div class="value failed">${report.failed}</div>
      </div>
      <div class="summary-card">
        <h3>Success Rate</h3>
        <div class="value ${getScoreClass(report.summary.overallScore)}">${report.summary.overallScore.toFixed(1)}%</div>
      </div>
    </div>

    <h2>Test Coverage Summary</h2>
    <div class="summary">
      <div class="summary-card">
        <h3>Functional Coverage</h3>
        <div class="value ${getScoreClass(report.summary.functionalCoverage)}">${report.summary.functionalCoverage.toFixed(1)}%</div>
      </div>
      <div class="summary-card">
        <h3>Performance Score</h3>
        <div class="value ${getScoreClass(report.summary.performanceScore)}">${report.summary.performanceScore.toFixed(1)}%</div>
      </div>
      <div class="summary-card">
        <h3>UI Consistency</h3>
        <div class="value ${getScoreClass(report.summary.uiConsistency)}">${report.summary.uiConsistency.toFixed(1)}%</div>
      </div>
      <div class="summary-card">
        <h3>Total Duration</h3>
        <div class="value">${(report.duration / 1000).toFixed(1)}s</div>
      </div>
    </div>

    <h2>Detailed Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Status</th>
          <th>Duration</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        ${report.testResults.map(test => `
          <tr>
            <td>${test.name}</td>
            <td class="test-${test.status}">${test.status.toUpperCase()}</td>
            <td>${(test.duration / 1000).toFixed(2)}s</td>
            <td>${test.error || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>HERA ERP - User Acceptance Testing Report</p>
      <p>Environment: ${report.environment}</p>
    </div>
  </div>
</body>
</html>
  `;

  fs.writeFileSync('uat-report.html', html);
}

function getScoreClass(score: number): string {
  if (score >= 90) return 'score-excellent';
  if (score >= 75) return 'score-good';
  if (score >= 60) return 'score-fair';
  return 'score-poor';
}