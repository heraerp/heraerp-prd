import { test, expect } from '@playwright/test'

test.describe('Furniture Tender - Documents @smoke', () => {
  test('loads documents page and shows mock documents', async ({ page }) => {
    await page.goto('/furniture/tender/documents')

    await expect(page.getByRole('heading', { name: 'Document Management' })).toBeVisible()
    await expect(
      page.getByText('Centralized repository for all tender documents and templates')
    ).toBeVisible()

    // Tabs with counts render
    await expect(page.getByRole('tab', { name: /All Documents/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Templates/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Documents/ })).toBeVisible()

    // Table headers render
    await expect(page.getByRole('columnheader', { name: 'Document' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Category' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Uploaded By' })).toBeVisible()

    // Mock entries visible
    await expect(page.getByText('Standard Bid Template')).toBeVisible()
    await expect(page.getByText('Company Registration Certificate')).toBeVisible()
  })
})

