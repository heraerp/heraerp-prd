/**
 * Authentication helpers for E2E tests
 */

import { Page, APIRequestContext } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name?: string;
  organizationId?: string;
}

export interface TestOrganization {
  id?: string;
  name: string;
  subdomain: string;
  businessType: string;
  modules?: string[];
}

/**
 * Create a test user via API
 */
export async function createTestUser(request: APIRequestContext, user: TestUser): Promise<{ userId: string; token: string }> {
  const response = await request.post('/api/v1/auth/signup', {
    data: {
      email: user.email,
      password: user.password,
      name: user.name || 'Test User'
    }
  });

  const data = await response.json();
  return {
    userId: data.user.id,
    token: data.token
  };
}

/**
 * Login as a test user
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect after successful login
  await page.waitForURL(url => !url.pathname.includes('/auth/login'), { timeout: 10000 });
}

/**
 * Create a test organization via API
 */
export async function createTestOrganization(
  request: APIRequestContext, 
  org: TestOrganization,
  authToken: string
): Promise<TestOrganization> {
  const response = await request.post('/api/v1/provisioning', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    data: {
      organizationName: org.name,
      subdomain: org.subdomain,
      businessType: org.businessType,
      modules: org.modules || ['pos', 'inventory']
    }
  });

  const data = await response.json();
  return {
    ...org,
    id: data.organizationId
  };
}

/**
 * Delete a test organization via API
 */
export async function deleteTestOrganization(
  request: APIRequestContext, 
  organizationId: string,
  authToken: string
): Promise<void> {
  await request.delete('/api/v1/provisioning', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    data: {
      organizationId
    }
  });
}

/**
 * Switch to a different organization
 */
export async function switchOrganization(page: Page, subdomain: string) {
  // Click organization switcher
  await page.click('[data-testid="org-switcher"]');
  
  // Click on the organization with the given subdomain
  await page.click(`[data-testid="org-option-${subdomain}"]`);
  
  // Wait for redirect to new organization
  await page.waitForURL(url => url.href.includes(subdomain), { timeout: 10000 });
}

/**
 * Get current organization context
 */
export async function getCurrentOrganization(page: Page): Promise<{ name: string; subdomain: string }> {
  const name = await page.locator('[data-testid="org-name-display"]').textContent() || '';
  
  // Extract subdomain from URL
  const url = page.url();
  let subdomain = '';
  
  if (url.includes('~')) {
    // Development pattern: /~subdomain
    const match = url.match(/~([^/]+)/);
    subdomain = match ? match[1] : '';
  } else {
    // Production pattern: subdomain.heraerp.com
    const match = url.match(/^https?:\/\/([^.]+)\.heraerp\.com/);
    subdomain = match ? match[1] : '';
  }
  
  return { name, subdomain };
}

/**
 * Setup authentication state for tests
 */
export async function setupAuthState(page: Page, user: TestUser) {
  // This could be extended to save/load auth state from storage
  await loginUser(page, user.email, user.password);
}

/**
 * Clear all authentication state
 */
export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}