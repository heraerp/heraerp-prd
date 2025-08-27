import { test, expect } from '@playwright/test';

test.describe('HERA Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/HERA/);
    
    // Check login form elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.getByPlaceholder('Email').fill('test@heraerp.com');
    await page.getByPlaceholder('Password').fill('testpassword123');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to organization selector or dashboard
    await expect(page).toHaveURL(/\/(auth\/organizations|org)/);
  });

  test('should navigate to signup page', async ({ page }) => {
    // Click signup link
    await page.getByText(/don't have an account/i).click();
    
    // Should be on signup page
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  });
});