import { test as setup, expect } from '@playwright/test'

const STORAGE = 'tests/.auth/state.json'

setup('authenticate', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  await page.goto(base)
  // TODO: implement project-specific login flow here
  await page.getByRole('textbox', { name: /email/i }).fill(process.env.E2E_USER_EMAIL!)
  await page.getByRole('textbox', { name: /password/i }).fill(process.env.E2E_USER_PASSWORD!)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/dashboard')
  await expect(page).toHaveURL(/dashboard/)
  await page.context().storageState({ path: STORAGE })
})

