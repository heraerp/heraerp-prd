import { test as setup } from '@playwright/test';

const authFile = 'tests/e2e/auth-state.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/login');
  
  // Perform authentication
  await page.getByPlaceholder('Email').fill(process.env.TEST_EMAIL || 'test@heraerp.com');
  await page.getByPlaceholder('Password').fill(process.env.TEST_PASSWORD || 'testpassword');
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect
  await page.waitForURL(/\/(auth\/organizations|org)/);
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});