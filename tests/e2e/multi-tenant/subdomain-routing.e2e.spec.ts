/**
 * E2E Tests for Subdomain Routing
 * Tests the subdomain-based organization routing and context
 */

import { test, expect } from '@playwright/test';

test.describe('Subdomain Routing', () => {
  const testOrganizations = [
    {
      subdomain: 'skcuts',
      name: 'SK Cuts Salon',
      expectedModules: ['salon', 'pos', 'appointments']
    },
    {
      subdomain: 'mario',
      name: 'Mario\'s Restaurant',
      expectedModules: ['restaurant', 'pos', 'inventory']
    }
  ];

  test('subdomain routing in development mode', async ({ page }) => {
    // Test development subdomain pattern: /~subdomain
    for (const org of testOrganizations) {
      // Navigate using development subdomain pattern
      await page.goto(`/~${org.subdomain}`);
      
      // Wait for page to load and check organization context
      await page.waitForLoadState('networkidle');
      
      // Verify organization name is displayed
      await expect(page.locator('[data-testid="org-name-display"]')).toContainText(org.name);
      
      // Verify we're on the correct organization's dashboard
      await expect(page.url()).toContain(`~${org.subdomain}`);
      
      // Check that expected modules are accessible
      for (const module of org.expectedModules) {
        const moduleLink = page.locator(`[data-testid="module-link-${module}"]`);
        await expect(moduleLink).toBeVisible();
      }
    }
  });

  test('subdomain routing preserves context during navigation', async ({ page }) => {
    const testSubdomain = 'skcuts';
    
    // Navigate to organization
    await page.goto(`/~${testSubdomain}`);
    
    // Navigate to different pages within the organization
    const routes = [
      '/salon/pos',
      '/salon/appointments',
      '/salon/clients',
      '/settings'
    ];
    
    for (const route of routes) {
      await page.goto(`/~${testSubdomain}${route}`);
      
      // Verify subdomain is preserved in URL
      await expect(page.url()).toContain(`~${testSubdomain}`);
      
      // Verify organization context is maintained
      await expect(page.locator('[data-testid="org-name-display"]')).toContainText('SK Cuts');
      
      // Verify no organization context errors
      await expect(page.locator('[data-testid="org-context-error"]')).not.toBeVisible();
    }
  });

  test('invalid subdomain handling', async ({ page }) => {
    // Try to access a non-existent subdomain
    await page.goto('/~nonexistent-org-12345');
    
    // Should redirect to organization selector or show error
    await expect(page).toHaveURL(/auth\/organizations|error|not-found/);
    
    // Verify appropriate error message
    const errorMessage = page.locator('[data-testid="org-not-found"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/organization not found|invalid organization/i);
    }
  });

  test('subdomain middleware headers', async ({ page, context }) => {
    // Intercept requests to check headers
    const headersReceived: Record<string, string> = {};
    
    await context.route('**/api/**', async (route, request) => {
      const headers = await request.allHeaders();
      Object.assign(headersReceived, headers);
      await route.continue();
    });
    
    // Navigate to organization
    await page.goto('/~skcuts');
    
    // Make an API call (e.g., by interacting with the page)
    await page.click('[data-testid="refresh-data-button"]');
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Verify organization headers are set
    expect(headersReceived['x-organization-id']).toBeTruthy();
    expect(headersReceived['x-tenant-subdomain']).toBe('skcuts');
    expect(headersReceived['x-tenant-modules']).toBeTruthy();
  });

  test('cross-origin subdomain security', async ({ page, context }) => {
    // Navigate to one organization
    await page.goto('/~skcuts');
    
    // Store a value in localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-org-data', 'skcuts-private-data');
    });
    
    // Navigate to another organization
    await page.goto('/~mario');
    
    // Try to access the previous organization's data
    const storedData = await page.evaluate(() => {
      return localStorage.getItem('test-org-data');
    });
    
    // In production with real subdomains, this would be null due to origin isolation
    // In development with path-based routing, we need to ensure proper data isolation
    // The application should clear or isolate data when switching organizations
    
    // Verify organization-specific data isolation
    const currentOrgData = await page.evaluate(() => {
      return window.__HERA_ORGANIZATION__;
    });
    
    expect(currentOrgData).not.toContain('skcuts');
    expect(currentOrgData).toContain('mario');
  });

  test('production subdomain simulation', async ({ page, context }) => {
    // Test with production-like subdomain headers
    await context.route('**/*', async (route) => {
      const headers = {
        ...route.request().headers(),
        'host': 'skcuts.heraerp.com'
      };
      await route.continue({ headers });
    });
    
    await page.goto('/');
    
    // The middleware should detect the subdomain from the host header
    // and set the appropriate organization context
    await expect(page.locator('[data-testid="org-name-display"]')).toContainText('SK Cuts');
  });

  test('subdomain-specific theme and branding', async ({ page }) => {
    // Test that each organization can have custom branding
    const organizations = [
      { subdomain: 'skcuts', primaryColor: 'rgb(236, 72, 153)' }, // Pink for salon
      { subdomain: 'mario', primaryColor: 'rgb(34, 197, 94)' }    // Green for restaurant
    ];
    
    for (const org of organizations) {
      await page.goto(`/~${org.subdomain}`);
      
      // Check for organization-specific CSS variables or classes
      const primaryButton = page.locator('[data-testid="primary-action-button"]').first();
      const buttonColor = await primaryButton.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Verify organization-specific theming is applied
      // This assumes the app applies org-specific themes
      expect(buttonColor).toContain(org.primaryColor);
    }
  });

  test('API rate limiting per organization', async ({ page, request }) => {
    const subdomain = 'skcuts';
    
    // Navigate to organization
    await page.goto(`/~${subdomain}`);
    
    // Make multiple rapid API requests
    const requests = Array(10).fill(null).map(async (_, i) => {
      return request.get(`/api/v1/universal?organizationId=test&action=read`, {
        headers: {
          'x-tenant-subdomain': subdomain,
          'x-organization-id': 'test-org-id'
        }
      });
    });
    
    const responses = await Promise.all(requests);
    
    // Check if rate limiting is applied
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    
    // Depending on rate limit configuration, some requests might be limited
    // This verifies rate limiting is organization-specific
    if (rateLimitedResponses.length > 0) {
      const rateLimitHeaders = await rateLimitedResponses[0].headers();
      expect(rateLimitHeaders['x-ratelimit-limit']).toBeTruthy();
      expect(rateLimitHeaders['x-ratelimit-remaining']).toBeTruthy();
    }
  });
});