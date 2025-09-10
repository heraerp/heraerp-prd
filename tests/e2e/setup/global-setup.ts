/**
 * Global setup for E2E tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';
import { OrganizationFactory } from '../../__fixtures__/factories/organization.factory';
import { UserFactory } from '../../__fixtures__/factories/user.factory';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Reset factories
  OrganizationFactory.reset();
  UserFactory.reset();
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_RUN_ID = Date.now().toString();
  
  // Create test data in database if needed
  if (process.env.SETUP_TEST_DATA === 'true') {
    console.log('📦 Setting up test data...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Create test organizations via API
      const testOrgs = [
        OrganizationFactory.createSalon({ subdomain: 'test-salon' }),
        OrganizationFactory.createRestaurant({ subdomain: 'test-restaurant' }),
        OrganizationFactory.createHealthcare({ subdomain: 'test-clinic' })
      ];
      
      for (const org of testOrgs) {
        const response = await page.request.post(`${config.use?.baseURL}/api/v1/provisioning`, {
          data: {
            organizationName: org.name,
            subdomain: org.subdomain,
            businessType: org.businessType,
            modules: org.modules
          }
        });
        
        if (response.ok()) {
          console.log(`✅ Created test organization: ${org.subdomain}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error setting up test data:', error);
    } finally {
      await browser.close();
    }
  }
  
  // Set up authentication state if needed
  if (process.env.SETUP_AUTH_STATE === 'true') {
    console.log('🔐 Setting up authentication state...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Create and login test users
      const testUser = UserFactory.createOwner({
        email: 'test@heraerp.com',
        password: 'Test123!@#'
      });
      
      await page.goto(`${config.use?.baseURL}/auth/login`);
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      
      // Wait for successful login
      await page.waitForURL(url => !url.pathname.includes('/auth/login'));
      
      // Save authentication state
      await page.context().storageState({ path: 'tests/e2e/setup/.auth/user.json' });
      console.log('✅ Authentication state saved');
      
    } catch (error) {
      console.error('❌ Error setting up auth state:', error);
    } finally {
      await browser.close();
    }
  }
  
  console.log('✨ Global setup completed');
}

export default globalSetup;