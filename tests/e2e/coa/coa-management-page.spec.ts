import { test, expect } from '@playwright/test';

test.describe('COA Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coa');
    
    // Wait for page to load
    await expect(page.getByText('Universal Chart of Accounts')).toBeVisible();
  });

  test('should display hero section with stats', async ({ page }) => {
    // Check hero title
    await expect(page.getByRole('heading', { name: 'Universal Chart of Accounts' })).toBeVisible();
    
    // Check tagline
    await expect(page.getByText("The world's most advanced COA system")).toBeVisible();
    
    // Check quick stats
    await expect(page.getByText('1,847')).toBeVisible();
    await expect(page.getByText('Organizations').first()).toBeVisible();
    
    await expect(page.getByText('324')).toBeVisible();
    await expect(page.getByText('Total Accounts')).toBeVisible();
    
    await expect(page.getByText('8').first()).toBeVisible();
    await expect(page.getByText('Templates').first()).toBeVisible();
  });

  test('should switch between Templates Dashboard and GL Accounts tabs', async ({ page }) => {
    // Default should be Templates Dashboard
    await expect(page.getByRole('tab', { name: 'Templates Dashboard' })).toHaveAttribute('data-state', 'active');
    
    // Switch to GL Accounts
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    await expect(page.getByRole('tab', { name: 'GL Accounts' })).toHaveAttribute('data-state', 'active');
    
    // Check GL Accounts content is visible
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // Switch back to Templates Dashboard
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'COA Templates Dashboard' })).toBeVisible();
  });

  test('should display quick start guide', async ({ page }) => {
    // Check quick start section
    await expect(page.getByText('Need Help Getting Started?')).toBeVisible();
    await expect(page.getByText('Follow our simple 3-step process')).toBeVisible();
    
    // Check 3 steps
    await expect(page.getByText('Choose Template')).toBeVisible();
    await expect(page.getByText('Customize Accounts')).toBeVisible();
    await expect(page.getByText('Start Using')).toBeVisible();
    
    // Check step numbers
    await expect(page.getByText('1').first()).toBeVisible();
    await expect(page.getByText('2').first()).toBeVisible();
    await expect(page.getByText('3').first()).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    // Universal Foundation card
    const universalCard = page.locator('text=Universal Foundation').locator('../..');
    await expect(universalCard).toBeVisible();
    await expect(universalCard.getByText('GAAP/IFRS compliant base template')).toBeVisible();
    await expect(universalCard.getByText('67 Base Accounts')).toBeVisible();
    
    // Multi-Country Support card
    const countryCard = page.locator('text=Multi-Country Support').locator('../..');
    await expect(countryCard).toBeVisible();
    await expect(countryCard.getByText('Built-in compliance for India, USA, UK')).toBeVisible();
    await expect(countryCard.getByText('3 Countries')).toBeVisible();
    
    // Industry Optimized card
    const industryCard = page.locator('text=Industry Optimized').locator('../..');
    await expect(industryCard).toBeVisible();
    await expect(industryCard.getByText('Specialized accounts for Restaurant')).toBeVisible();
    await expect(industryCard.getByText('4 Industries')).toBeVisible();
  });

  test('should display governance compliance notice', async ({ page }) => {
    // Check compliance card
    const complianceCard = page.locator('text=Governance & Compliance').locator('../..');
    await expect(complianceCard).toBeVisible();
    
    // Check warning text
    await expect(complianceCard.getByText(/This Universal Global COA system is mandatory/)).toBeVisible();
    
    // Check badges
    await expect(complianceCard.getByText('Governance Required')).toBeVisible();
    await expect(complianceCard.getByText('Zero Exceptions')).toBeVisible();
  });

  test('should have responsive layout', async ({ page, viewport }) => {
    // Test desktop view
    await expect(page.getByRole('tab', { name: 'Templates Dashboard' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'GL Accounts' })).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Tabs should still be visible but may be stacked
    await expect(page.getByRole('tab', { name: 'Templates Dashboard' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'GL Accounts' })).toBeVisible();
    
    // Feature cards should stack vertically
    const featureCards = page.locator('.grid > .text-center');
    await expect(featureCards).toHaveCount(3);
  });

  test('should maintain state when switching tabs', async ({ page }) => {
    // Go to GL Accounts and perform a search
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    await page.getByPlaceholder('Search by account name or code...').fill('Cash');
    
    // Switch to Templates Dashboard
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Switch back to GL Accounts
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Search should be cleared (component remounts)
    await expect(page.getByPlaceholder('Search by account name or code...')).toHaveValue('');
  });

  test('should handle loading states properly', async ({ page }) => {
    // Navigate to page
    await page.goto('/coa');
    
    // During initial load, check if any loading indicators appear
    // The components show loading states briefly
    
    // After load, content should be visible
    await expect(page.getByText('Universal Chart of Accounts')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'COA Templates Dashboard' })).toBeVisible({ timeout: 5000 });
  });

  test('should display all major sections in order', async ({ page }) => {
    // Hero section at top
    const heroSection = page.locator('.hera-card').first();
    await expect(heroSection.getByText('Universal Chart of Accounts')).toBeVisible();
    
    // Navigation tabs
    const tabsSection = page.locator('[role="tablist"]');
    await expect(tabsSection).toBeVisible();
    
    // Content area (templates dashboard by default)
    await expect(page.getByRole('heading', { name: 'COA Templates Dashboard' })).toBeVisible();
    
    // Quick start guide
    await expect(page.getByText('Need Help Getting Started?')).toBeVisible();
    
    // Feature cards
    await expect(page.getByText('Universal Foundation')).toBeVisible();
    
    // Governance notice at bottom
    await expect(page.getByText('Governance & Compliance')).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check tabs have proper ARIA attributes
    const templatesTab = page.getByRole('tab', { name: 'Templates Dashboard' });
    await expect(templatesTab).toHaveAttribute('aria-selected', 'true');
    
    const accountsTab = page.getByRole('tab', { name: 'GL Accounts' });
    await expect(accountsTab).toHaveAttribute('aria-selected', 'false');
    
    // Check headings hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('Universal Chart of Accounts');
    
    // Check buttons are properly labeled
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    await expect(page.getByRole('button', { name: 'New Account' })).toBeVisible();
  });
});