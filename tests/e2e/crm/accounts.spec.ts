import { test, expect } from '@playwright/test'

test.describe('CRM Accounts - Add Account', () => {
  test('creates a new account from the Accounts page', async ({ page }) => {
    await page.goto('/crm/accounts')

    // Open create form
    await page.getByTestId('new-account-button').click()
    await expect(page.getByTestId('create-account-form')).toBeVisible()

    // Fill minimal details
    const name = `Test Account ${Date.now()}`
    await page.getByTestId('account-name-input').fill(name)
    await page.getByTestId('create-account-submit').click()

    // Verify it appears in the list
    const list = page.getByTestId('accounts-list')
    await expect(list).toContainText(name)
  })
})

