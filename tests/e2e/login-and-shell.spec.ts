// ================================================================================
// HERA LOGIN AND SHELL E2E TESTS
// Smart Code: HERA.TEST.E2E.LOGIN.SHELL.v1
// End-to-end tests for login flow and app shell navigation
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Login and App Shell', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock environment
    await page.addInitScript(() => {
      window.localStorage.setItem('hera-use-mock', 'true')
    })
  })

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login')

    // Check page elements
    await expect(page.locator('h2')).toContainText('Welcome to HERA')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in')

    // Check demo credentials are shown
    await expect(page.locator('text=Demo Credentials')).toBeVisible()
    await expect(page.locator('text=owner@hairtalkz.com')).toBeVisible()
  })

  test('should handle login validation errors', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without email
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()

    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()

    // Enter valid email but short password
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
  })

  test('should complete successful login flow', async ({ page }) => {
    await page.goto('/login')

    // Fill in valid credentials
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Welcome back')
    await expect(page.locator('text=Today\'s Sales')).toBeVisible()
    await expect(page.locator('text=Upcoming Appointments')).toBeVisible()
  })

  test('should display app shell correctly after login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Check sidebar navigation
    await expect(page.locator('text=HERA')).toBeVisible()
    await expect(page.locator('nav a[href="/dashboard"]')).toContainText('Dashboard')
    await expect(page.locator('nav a[href="/appointments"]')).toContainText('Appointments')
    await expect(page.locator('nav a[href="/customers"]')).toContainText('Customers')
    await expect(page.locator('nav a[href="/services"]')).toContainText('Services')

    // Check user info in sidebar
    await expect(page.locator('text=Sarah Johnson')).toBeVisible() // Mock user name
    await expect(page.locator('text=owner')).toBeVisible() // User role

    // Check top bar
    await expect(page.locator('text=Dashboard')).toBeVisible() // Page title
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Sidebar should be hidden on mobile
    await expect(page.locator('nav a[href="/dashboard"]')).not.toBeVisible()

    // Click hamburger menu to open sidebar
    await page.click('button[aria-label="Open sidebar"]', { force: true })
    
    // Navigation should now be visible
    await expect(page.locator('nav a[href="/dashboard"]')).toBeVisible()

    // Click on a navigation item
    await page.click('nav a[href="/customers"]')
    
    // Should navigate and close sidebar
    await expect(page).toHaveURL('/customers')
    await expect(page.locator('nav a[href="/dashboard"]')).not.toBeVisible()
  })

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Click logout button
    await page.click('button:has-text("Sign out")')

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    
    // Should not be able to access protected routes
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should show loading states appropriately', async ({ page }) => {
    await page.goto('/login')

    // Fill credentials
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit and check loading state
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Signing in...')).toBeVisible()
    
    // Wait for login to complete
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle authentication errors', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials (will be caught by mock)
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', '12345') // Too short, will trigger validation

    await page.click('button[type="submit"]')

    // Should show validation error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
  })

  test('should protect routes correctly', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')

    // Try other protected routes
    await page.goto('/appointments')
    await expect(page).toHaveURL('/login')

    await page.goto('/customers')
    await expect(page).toHaveURL('/login')
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')

    // Refresh the page
    await page.reload()

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

  test('should display role-based navigation', async ({ page }) => {
    // Test with owner role (should see all navigation items)
    await page.goto('/login')
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Owner should see Sales and Settings
    await expect(page.locator('nav a[href="/sales"]')).toBeVisible()
    await expect(page.locator('nav a[href="/settings"]')).toBeVisible()

    // Logout and test with stylist role
    await page.click('button:has-text("Sign out")')
    await expect(page).toHaveURL('/login')

    await page.fill('input[type="email"]', 'stylist@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Stylist should not see Sales and Settings
    await expect(page.locator('nav a[href="/sales"]')).not.toBeVisible()
    await expect(page.locator('nav a[href="/settings"]')).not.toBeVisible()
  })

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.locator('button:has(svg)')

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle button
    await toggleButton.click()

    // Password should now be visible
    await expect(page.locator('input[type="text"]')).toBeVisible()

    // Click toggle again
    await toggleButton.click()

    // Should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})