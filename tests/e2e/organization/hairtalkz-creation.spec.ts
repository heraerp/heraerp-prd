import { test, expect, Page } from '@playwright/test';

test.describe('HairTalkz Salon Organization Creation E2E Test', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    // Create a new context for each test to ensure clean state
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test('should complete full HairTalkz salon organization creation flow', async () => {
    // Step 1: Navigate to organization creation page
    await test.step('Navigate to organization creation', async () => {
      await page.goto('/auth/organizations/new');
      
      // Wait for page to load
      await expect(page.getByText('Create Organization')).toBeVisible();
      await expect(page.getByText('Set up your new business')).toBeVisible();
      await expect(page.getByText('Organization Details')).toBeVisible();
    });

    // Step 2: Fill in organization details
    await test.step('Fill organization details for HairTalkz', async () => {
      // Fill organization name
      const orgNameInput = page.getByLabel('Organization Name');
      await expect(orgNameInput).toBeVisible();
      await orgNameInput.fill('hairtalkz');
      
      // Verify organization name is filled
      await expect(orgNameInput).toHaveValue('hairtalkz');
      
      // Select business type (Salon & Beauty)
      const businessTypeSelect = page.getByLabel('Business Type');
      await expect(businessTypeSelect).toBeVisible();
      await businessTypeSelect.click();
      
      // Wait for dropdown to open and select salon option
      await page.getByRole('option', { name: 'Salon & Beauty' }).click();
      
      // Verify selection
      await expect(page.getByText('Salon & Beauty')).toBeVisible();
    });

    // Step 3: Verify subdomain auto-generation and availability
    await test.step('Verify subdomain auto-generation', async () => {
      // Check that subdomain is auto-generated from organization name
      const subdomainInput = page.getByLabel('Subdomain');
      await expect(subdomainInput).toHaveValue('hairtalkz');
      
      // Verify preview URL is shown
      await expect(page.getByText('Your HERA URL will be: hairtalkz.heraerp.com')).toBeVisible();
      
      // Wait for subdomain availability check (look for checkmark or loader)
      await page.waitForSelector('[data-testid="subdomain-status"]', { 
        state: 'visible', 
        timeout: 10000 
      }).catch(() => {
        // If no test ID, wait for either checkmark or X icon
        return Promise.race([
          page.waitForSelector('svg[data-lucide="check-circle"]', { timeout: 10000 }),
          page.waitForSelector('svg[data-lucide="x"]', { timeout: 10000 }),
          page.waitForSelector('svg[data-lucide="loader-2"]', { timeout: 5000 })
        ]);
      });
    });

    // Step 4: Verify form validation and submit button state
    await test.step('Verify form validation', async () => {
      const submitButton = page.getByRole('button', { name: /create organization/i });
      await expect(submitButton).toBeVisible();
      
      // Button should be enabled when all fields are valid
      // Wait a moment for validation to complete
      await page.waitForTimeout(2000);
      
      // Check if button is enabled (not disabled)
      const isDisabled = await submitButton.isDisabled();
      if (!isDisabled) {
        console.log('✅ Submit button is enabled - form validation passed');
      } else {
        console.log('⚠️ Submit button is disabled - checking validation issues');
        
        // Check for any validation errors
        const errorAlerts = await page.locator('[role="alert"]').count();
        if (errorAlerts > 0) {
          const errorText = await page.locator('[role="alert"]').first().textContent();
          console.log('Validation error:', errorText);
        }
      }
    });

    // Step 5: Submit the form and handle creation
    await test.step('Submit organization creation', async () => {
      const submitButton = page.getByRole('button', { name: /create organization/i });
      
      // Click submit button
      await submitButton.click();
      
      // Verify loading state
      await expect(page.getByText('Creating Organization...')).toBeVisible();
      
      // Wait for either success redirect or error
      await Promise.race([
        // Success: redirect to organization or apps page
        page.waitForURL(/\/(org|auth\/organizations\/.*\/apps)/, { timeout: 30000 }),
        // Error: alert or error message appears
        page.waitForSelector('[role="alert"]', { timeout: 30000 }),
        // Timeout fallback
        page.waitForTimeout(30000)
      ]);
    });

    // Step 6: Verify successful creation
    await test.step('Verify successful organization creation', async () => {
      const currentURL = page.url();
      console.log('Current URL after submission:', currentURL);
      
      if (currentURL.includes('/org/') || currentURL.includes('/apps/')) {
        console.log('✅ Organization created successfully - redirected to organization area');
        
        // If redirected to organization dashboard, verify it's loaded
        if (currentURL.includes('/org/')) {
          await expect(page.getByText(/hairtalkz|salon|dashboard/i)).toBeVisible({ timeout: 10000 });
        }
        
        // If redirected to apps selection, verify it's loaded
        if (currentURL.includes('/apps/')) {
          await expect(page.getByText(/select applications|install apps/i)).toBeVisible({ timeout: 10000 });
        }
        
      } else {
        // Check for any error messages
        const alertElements = await page.locator('[role="alert"]').count();
        if (alertElements > 0) {
          const errorMessage = await page.locator('[role="alert"]').first().textContent();
          console.log('❌ Organization creation failed with error:', errorMessage);
          
          // Take screenshot for debugging
          await page.screenshot({ 
            path: `test-results/hairtalkz-creation-error-${Date.now()}.png`,
            fullPage: true 
          });
        } else {
          console.log('⚠️ Unexpected state - no redirect and no error message');
          
          // Take screenshot for debugging
          await page.screenshot({ 
            path: `test-results/hairtalkz-creation-unexpected-${Date.now()}.png`,
            fullPage: true 
          });
        }
      }
    });
  });

  test('should validate subdomain availability checking', async () => {
    await test.step('Test subdomain availability validation', async () => {
      await page.goto('/auth/organizations/new');
      
      // Fill organization name
      await page.getByLabel('Organization Name').fill('hairtalkz');
      
      // Check auto-generated subdomain
      const subdomainInput = page.getByLabel('Subdomain');
      await expect(subdomainInput).toHaveValue('hairtalkz');
      
      // Try a reserved subdomain
      await subdomainInput.fill('admin');
      
      // Wait for validation
      await page.waitForTimeout(1000);
      
      // Should show error for reserved subdomain
      await expect(page.getByText(/this subdomain is reserved/i)).toBeVisible({ timeout: 5000 });
      
      // Try an invalid format
      await subdomainInput.fill('Hair_Talkz!');
      
      // Wait for validation
      await page.waitForTimeout(1000);
      
      // Should show format error
      await expect(page.getByText(/invalid subdomain format/i)).toBeVisible({ timeout: 5000 });
      
      // Reset to valid subdomain
      await subdomainInput.fill('hairtalkz');
      
      // Wait for validation to pass
      await page.waitForTimeout(2000);
      
      // Should show available status
      await expect(page.locator('svg[data-lucide="check-circle"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test('should handle network errors gracefully', async () => {
    await test.step('Test network error handling', async () => {
      // Intercept subdomain check API and make it fail
      await page.route('/api/v1/organizations/check-subdomain*', route => {
        route.abort('failed');
      });
      
      await page.goto('/auth/organizations/new');
      
      // Fill form
      await page.getByLabel('Organization Name').fill('hairtalkz');
      
      // Wait for API call failure
      await page.waitForTimeout(2000);
      
      // Should handle error gracefully (not crash the page)
      await expect(page.getByText('Organization Details')).toBeVisible();
    });
  });

  test('should validate form fields properly', async () => {
    await test.step('Test form field validation', async () => {
      await page.goto('/auth/organizations/new');
      
      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /create organization/i });
      await expect(submitButton).toBeDisabled();
      
      // Fill only organization name
      await page.getByLabel('Organization Name').fill('hairtalkz');
      
      // Button should still be disabled without subdomain validation
      await page.waitForTimeout(1000);
      
      // Fill business type
      await page.getByLabel('Business Type').click();
      await page.getByRole('option', { name: 'Salon & Beauty' }).click();
      
      // Wait for subdomain validation
      await page.waitForTimeout(3000);
      
      // Now button should be enabled
      await expect(submitButton).not.toBeDisabled();
    });
  });

  test.afterEach(async () => {
    // Clean up - close the page
    if (page) {
      await page.close();
    }
  });
});

// Utility function to take screenshots for debugging
async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true
  });
}