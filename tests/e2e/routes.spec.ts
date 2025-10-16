/**
 * Route Smoke Tests
 * Ensures all generated CRUD pages return 200 OK
 */

import { test, expect } from '@playwright/test'

const routes = [
  '/crm/contacts',  // Original CRM page
  '/accounts',      // Generated with simple generator
  '/leads',         // Generated with simple generator  
  '/opportunities', // Generated with enterprise generator
  '/activities'     // Generated with enterprise generator
]

const routeMetadata = {
  '/crm/contacts': { title: 'Contacts', entity: 'CONTACT' },
  '/accounts': { title: 'Accounts', entity: 'ACCOUNT' },
  '/leads': { title: 'Leads', entity: 'LEAD' },
  '/opportunities': { title: 'Opportunities', entity: 'OPPORTUNITY' },
  '/activities': { title: 'Activities', entity: 'ACTIVITY' }
}

// Smoke tests - just verify pages load
for (const path of routes) {
  test(`GET ${path} -> 200 OK`, async ({ page }) => {
    const response = await page.goto(`http://localhost:3001${path}`)
    expect(response?.status()).toBe(200)
  })
}

// Content validation tests
for (const path of routes) {
  const metadata = routeMetadata[path]
  
  test(`${path} renders expected content`, async ({ page }) => {
    await page.goto(`http://localhost:3001${path}`)
    
    // Check for page title
    await expect(page).toHaveTitle(new RegExp(metadata.title, 'i'))
    
    // Check for HERA-specific elements
    await expect(page.locator('[data-testid="mobile-page-layout"]')).toBeVisible()
    
    // Check for KPI cards
    const kpiCards = page.locator('.grid').first()
    await expect(kpiCards).toBeVisible()
    
    // Check for floating action button (Add button)
    const fab = page.locator('button[class*="fixed bottom"]')
    await expect(fab).toBeVisible()
  })
}

// Mobile responsiveness tests
for (const path of routes) {
  test(`${path} is mobile responsive`, async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`http://localhost:3001${path}`)
    
    // Mobile-specific elements should be visible
    const mobileLayout = page.locator('[data-testid="mobile-page-layout"]')
    await expect(mobileLayout).toBeVisible()
    
    // FAB should be accessible on mobile
    const fab = page.locator('button[class*="fixed bottom"]')
    await expect(fab).toBeVisible()
  })
}

// Desktop responsiveness tests
for (const path of routes) {
  test(`${path} works on desktop`, async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(`http://localhost:3001${path}`)
    
    // Should still work with mobile-first design
    const layout = page.locator('[data-testid="mobile-page-layout"]')
    await expect(layout).toBeVisible()
    
    // Desktop table should be visible if data exists
    const dataTable = page.locator('table, [class*="table"]')
    // Note: May not be visible if no data, so we don't assert visibility
  })
}

// Authentication flow tests
for (const path of routes) {
  test(`${path} handles authentication state`, async ({ page }) => {
    await page.goto(`http://localhost:3001${path}`)
    
    // Page should either show content (authenticated) or auth prompt
    const hasContent = await page.locator('[data-testid="mobile-page-layout"]').isVisible()
    const hasAuthPrompt = await page.locator('text=/log in|authenticate|sign in/i').isVisible()
    const hasOrgPrompt = await page.locator('text=/organization|select.*org/i').isVisible()
    
    // One of these should be true
    expect(hasContent || hasAuthPrompt || hasOrgPrompt).toBe(true)
  })
}

// Performance tests
for (const path of routes) {
  test(`${path} loads within performance budget`, async ({ page }) => {
    const start = Date.now()
    
    await page.goto(`http://localhost:3001${path}`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - start
    
    // Should load within 5 seconds (generous for development)
    expect(loadTime).toBeLessThan(5000)
  })
}

// Accessibility tests
test.describe('Accessibility Tests', () => {
  for (const path of routes) {
    test(`${path} meets basic accessibility standards`, async ({ page }) => {
      await page.goto(`http://localhost:3001${path}`)
      
      // Check for basic accessibility elements
      
      // Page should have a main landmark
      const main = page.locator('main, [role="main"]')
      await expect(main).toBeVisible()
      
      // Buttons should be focusable
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        // At least the FAB should be focusable
        const fab = page.locator('button[class*="fixed bottom"]')
        await expect(fab).toBeFocused()
      }
      
      // Check for reasonable color contrast (basic check)
      const styles = await page.evaluate(() => {
        const fab = document.querySelector('button[class*="fixed bottom"]')
        if (!fab) return null
        
        const computed = window.getComputedStyle(fab)
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        }
      })
      
      // Should have defined colors (not transparent/inherit)
      if (styles) {
        expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
      }
    })
  }
})

// Error boundary tests
test.describe('Error Handling', () => {
  test('Pages gracefully handle network errors', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort())
    
    for (const path of routes) {
      await page.goto(`http://localhost:3001${path}`)
      
      // Should not show unhandled error
      const errorBoundary = page.locator('text=/something went wrong|error|failed to load/i')
      
      // If error message appears, it should be user-friendly
      if (await errorBoundary.isVisible()) {
        const errorText = await errorBoundary.textContent()
        expect(errorText?.toLowerCase()).not.toContain('undefined')
        expect(errorText?.toLowerCase()).not.toContain('null')
        expect(errorText?.toLowerCase()).not.toContain('[object object]')
      }
    }
  })
})

// Generator-specific tests
test.describe('Generated Page Quality', () => {
  test('All pages use consistent HERA patterns', async ({ page }) => {
    for (const path of routes) {
      await page.goto(`http://localhost:3001${path}`)
      
      // Check for HERA Universal Entity usage patterns
      const pageSource = await page.content()
      
      // Should not contain deprecated patterns
      expect(pageSource).not.toContain('transaction_code')
      expect(pageSource).not.toContain('from_entity_id')
      expect(pageSource).not.toContain('to_entity_id')
      
      // Should contain HERA compliance markers
      if (pageSource.includes('useUniversalEntity')) {
        expect(pageSource).toContain('organization_id')
        expect(pageSource).toContain('smart_code')
      }
    }
  })
  
  test('No duplicate Lucide imports in page source', async ({ page }) => {
    for (const path of routes) {
      await page.goto(`http://localhost:3001${path}`)
      
      // Get the page's JavaScript bundles
      const scripts = await page.locator('script[src]').all()
      
      for (const script of scripts) {
        const src = await script.getAttribute('src')
        if (src?.includes('/_next/')) {
          // This is a Next.js bundle, check for duplicate imports
          const response = await page.request.get(`http://localhost:3001${src}`)
          const content = await response.text()
          
          // Look for Lucide import patterns - should not have duplicates
          const lucideImports = content.match(/from.*lucide-react/g) || []
          
          // Each unique component should only be imported once per bundle
          for (const importLine of lucideImports) {
            const icons = importLine.match(/({[^}]+})/)?.[1]
            if (icons) {
              const iconList = icons.replace(/[{}]/g, '').split(',').map(i => i.trim())
              const uniqueIcons = new Set(iconList)
              
              // Should not have duplicate icons in single import
              expect(iconList.length).toBe(uniqueIcons.size)
            }
          }
        }
      }
    }
  })
})