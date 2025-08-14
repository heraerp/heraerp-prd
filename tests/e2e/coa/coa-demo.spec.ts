import { test, expect } from '@playwright/test';

test.describe('COA Interactive Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coa/demo');
    
    // Wait for demo to load
    await expect(page.getByText('Welcome to the Universal Global COA Demo')).toBeVisible();
  });

  test('should complete full demo walkthrough', async ({ page }) => {
    // Step 1: Welcome screen
    await expect(page.getByRole('heading', { name: 'Universal Global COA Demo' })).toBeVisible();
    await expect(page.getByText('Experience the world\'s most advanced')).toBeVisible();
    
    // Check feature highlights
    await expect(page.getByText('Universal Foundation')).toBeVisible();
    await expect(page.getByText('Global Compliance')).toBeVisible();
    await expect(page.getByText('Industry Optimized')).toBeVisible();
    
    // Start demo
    await page.getByRole('button', { name: 'Start Demo' }).click();
    
    // Step 2: Templates Dashboard
    await expect(page.getByText('Templates Dashboard Demo')).toBeVisible();
    await expect(page.getByText('This dashboard shows all available COA templates')).toBeVisible();
    
    // Templates dashboard should be visible
    await expect(page.getByRole('heading', { name: 'COA Templates Dashboard' })).toBeVisible();
    
    // Click Next Step
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Step 3: Template Builder
    await expect(page.getByText('Template Builder Demo')).toBeVisible();
    await expect(page.getByText('The 4-step wizard guides you through')).toBeVisible();
    
    // Template builder should be visible
    await expect(page.getByText('Universal Chart of Accounts Builder')).toBeVisible();
    
    // Click Next Step
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Step 4: COA Structure Viewer
    await expect(page.getByText('COA Structure Viewer Demo')).toBeVisible();
    await expect(page.getByText('Browse your complete Chart of Accounts')).toBeVisible();
    
    // Structure viewer should be visible
    await expect(page.getByText('Chart of Accounts')).toBeVisible();
    
    // Click Next Step
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Step 5: GL Accounts CRUD
    await expect(page.getByText('GL Accounts CRUD Demo')).toBeVisible();
    await expect(page.getByText('Create, edit, and manage individual GL accounts')).toBeVisible();
    
    // GL Accounts should be visible
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // Click Complete Demo
    await page.getByRole('button', { name: 'Complete Demo' }).click();
    
    // Step 6: Demo Complete
    await expect(page.getByRole('heading', { name: 'Demo Complete! 🎉' })).toBeVisible();
    await expect(page.getByText('You\'ve experienced the complete')).toBeVisible();
  });

  test('should show progress indicators correctly', async ({ page }) => {
    // Check initial progress
    const progressSteps = page.locator('.flex.items-center.justify-center.w-10.h-10');
    await expect(progressSteps).toHaveCount(6);
    
    // First step should be active
    const firstStep = progressSteps.first();
    await expect(firstStep).toHaveClass(/bg-primary/);
    
    // Start demo
    await page.getByRole('button', { name: 'Start Demo' }).click();
    
    // Check progress updates
    const secondStep = progressSteps.nth(1);
    await expect(secondStep).toHaveClass(/bg-primary/);
    
    // First step should now show as completed
    await expect(page.locator('.bg-green-500').first()).toBeVisible();
  });

  test('should allow navigation between steps', async ({ page }) => {
    // Start demo
    await page.getByRole('button', { name: 'Start Demo' }).click();
    
    // Go to next step
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Check we're on Template Builder step
    await expect(page.getByText('Template Builder Demo')).toBeVisible();
    
    // Go back
    await page.getByRole('button', { name: 'Previous' }).click();
    
    // Check we're back on Templates Dashboard
    await expect(page.getByText('Templates Dashboard Demo')).toBeVisible();
  });

  test('should reset demo properly', async ({ page }) => {
    // Start demo and go through a few steps
    await page.getByRole('button', { name: 'Start Demo' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Reset demo
    await page.getByRole('button', { name: 'Reset Demo' }).click();
    
    // Should be back at welcome screen
    await expect(page.getByText('Welcome to the Universal Global COA Demo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Demo' })).toBeVisible();
  });

  test('should display completion summary', async ({ page }) => {
    // Navigate to completion (skip through steps)
    await page.getByRole('button', { name: 'Start Demo' }).click();
    
    // Skip through all steps
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: i === 3 ? 'Complete Demo' : 'Next Step' }).click();
    }
    
    // Check completion screen content
    await expect(page.getByRole('heading', { name: 'Demo Complete! 🎉' })).toBeVisible();
    
    // Check summary sections
    await expect(page.getByText("What You've Seen:")).toBeVisible();
    await expect(page.getByText('Templates Dashboard with global overview')).toBeVisible();
    await expect(page.getByText('4-step Template Builder wizard')).toBeVisible();
    await expect(page.getByText('Interactive COA Structure Viewer')).toBeVisible();
    await expect(page.getByText('Complete GL Accounts CRUD interface')).toBeVisible();
    
    // Check key benefits
    await expect(page.getByText('Key Benefits:')).toBeVisible();
    await expect(page.getByText('Universal compatibility for any business')).toBeVisible();
    await expect(page.getByText('Built-in compliance for multiple countries')).toBeVisible();
  });

  test('should display step counter', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Demo' }).click();
    
    // Check step counter
    await expect(page.getByText('Step 2 of 6')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Step 3 of 6')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Step 4 of 6')).toBeVisible();
  });

  test('should have proper demo content for each step', async ({ page }) => {
    await page.getByRole('button', { name: 'Start Demo' }).click();
    
    // Templates Dashboard step
    const templatesDemoCard = page.locator('.bg-blue-50');
    await expect(templatesDemoCard).toBeVisible();
    await expect(templatesDemoCard.getByText('Templates Dashboard Demo')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Template Builder step
    const builderDemoCard = page.locator('.bg-green-50');
    await expect(builderDemoCard).toBeVisible();
    await expect(builderDemoCard.getByText('Template Builder Demo')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // COA Structure step
    const structureDemoCard = page.locator('.bg-purple-50');
    await expect(structureDemoCard).toBeVisible();
    await expect(structureDemoCard.getByText('COA Structure Viewer Demo')).toBeVisible();
    
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // GL Accounts step
    const accountsDemoCard = page.locator('.bg-orange-50');
    await expect(accountsDemoCard).toBeVisible();
    await expect(accountsDemoCard.getByText('GL Accounts CRUD Demo')).toBeVisible();
  });

  test('should handle completion actions', async ({ page }) => {
    // Navigate to completion
    await page.getByRole('button', { name: 'Start Demo' }).click();
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: i === 3 ? 'Complete Demo' : 'Next Step' }).click();
    }
    
    // Check completion actions
    await expect(page.getByRole('button', { name: 'Run Demo Again' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Using COA' })).toBeVisible();
    
    // Click Run Demo Again
    await page.getByRole('button', { name: 'Run Demo Again' }).click();
    
    // Should be back at welcome
    await expect(page.getByText('Welcome to the Universal Global COA Demo')).toBeVisible();
  });

  test('should show proper icons for each step', async ({ page }) => {
    // Check step icons in progress bar
    const steps = page.locator('.flex.flex-col.items-center');
    
    // Each step should have an icon and label
    await expect(steps).toHaveCount(6);
    
    // Check step labels
    await expect(page.getByText('Welcome')).toBeVisible();
    await expect(page.getByText('Templates Dashboard')).toBeVisible();
    await expect(page.getByText('Template Builder')).toBeVisible();
    await expect(page.getByText('COA Structure')).toBeVisible();
    await expect(page.getByText('GL Accounts')).toBeVisible();
    await expect(page.getByText('Complete')).toBeVisible();
  });
});