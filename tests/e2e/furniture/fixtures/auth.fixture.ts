/**
 * Authentication fixture for Furniture Module tests
 */

import { test as base } from '@playwright/test';
import { loginUser, createTestOrganization, TestUser, TestOrganization } from '../../helpers/auth-helpers';

export interface AuthFixture {
  authenticatedUser: TestUser;
  furnitureOrganization: TestOrganization;
}

export const test = base.extend<AuthFixture>({
  authenticatedUser: async ({ request }, use) => {
    // Create a test user for furniture module
    const user: TestUser = {
      email: `furniture.test.${Date.now()}@heraerp.com`,
      password: 'Test@123456',
      name: 'Furniture Test User'
    };

    // Sign up user
    const signupResponse = await request.post('/api/v1/auth/signup', {
      data: {
        email: user.email,
        password: user.password,
        name: user.name
      }
    });

    const signupData = await signupResponse.json();
    const token = signupData.token;

    await use({ ...user, organizationId: signupData.organizationId });

    // Cleanup: Delete user after test
    // Note: In a real implementation, you'd have an API endpoint to delete test users
  },

  furnitureOrganization: async ({ request, authenticatedUser }, use) => {
    // Get auth token
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: authenticatedUser.email,
        password: authenticatedUser.password
      }
    });

    const { token } = await loginResponse.json();

    // Create furniture organization
    const org: TestOrganization = {
      name: `Furniture Test Org ${Date.now()}`,
      subdomain: `furniture-test-${Date.now()}`,
      businessType: 'furniture',
      modules: ['products', 'inventory', 'production', 'sales', 'finance']
    };

    const createdOrg = await createTestOrganization(request, org, token);

    await use(createdOrg);

    // Cleanup: Delete organization after test
    // Note: In a real implementation, you'd have an API endpoint to delete test organizations
  }
});

export { expect } from '@playwright/test';

/**
 * Helper function to login and setup organization context
 */
export async function setupFurnitureContext(page: any, user: TestUser, org: TestOrganization) {
  // Login
  await loginUser(page, user.email, user.password);
  
  // Wait for organization context to be set
  await page.waitForFunction(
    (orgId) => localStorage.getItem('current_organization_id') === orgId,
    org.id
  );
  
  // Navigate to furniture module
  await page.goto('/furniture');
  await page.waitForLoadState('networkidle');
}