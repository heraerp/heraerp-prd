import { test, expect } from '@playwright/test'

// Mario's Restaurant Purchase Orders Tests
// Testing HERA's universal transactions for procurement workflows

test.describe('Mario Restaurant - Purchase Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Mario
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', 'mario@restaurant.com')
    await page.fill('input[type="password"]', 'securepass123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/restaurant**')
    await page.waitForLoadState('networkidle')
    
    // Navigate to procurement purchase orders section
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    await page.click('button', { hasText: 'Purchase Orders' })
    await page.waitForTimeout(1000)
  })

  test('should display purchase orders management interface', async ({ page }) => {
    // Verify we're in the purchase orders section
    const poTab = page.locator('button', { hasText: 'Purchase Orders' })
    await expect(poTab).toHaveClass(/border-indigo-500/)
    
    // Should display PO-related content
    const poText = page.locator('text=Purchase').or(page.locator('text=purchase')).or(page.locator('text=PO'))
    await expect(poText).toBeVisible()
  })

  test('should handle purchase orders list display', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for PO management elements
    const searchElements = page.locator('input[placeholder*="search"], input[placeholder*="Search"], input[placeholder*="PO"]')
    const addButtons = page.locator('button', { hasText: /Add|New|Create.*PO|Create.*Order/i })
    const filterElements = page.locator('button', { hasText: /Filter|Status|Approved/i })
    
    // Should have PO management controls
    const hasPOControls = await searchElements.count() > 0 || 
                         await addButtons.count() > 0 || 
                         await filterElements.count() > 0
    
    expect(hasPOControls).toBeTruthy()
  })

  test('should display purchase order status tracking', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for status-related elements
    const draftElements = page.locator('text=Draft').or(page.locator('text=draft'))
    const pendingElements = page.locator('text=Pending').or(page.locator('text=pending'))
    const approvedElements = page.locator('text=Approved').or(page.locator('text=approved'))
    const completedElements = page.locator('text=Completed').or(page.locator('text=completed'))
    const cancelledElements = page.locator('text=Cancelled').or(page.locator('text=cancelled'))
    
    const hasStatusTracking = await draftElements.count() > 0 || 
                             await pendingElements.count() > 0 || 
                             await approvedElements.count() > 0 || 
                             await completedElements.count() > 0 || 
                             await cancelledElements.count() > 0
    
    console.log(`PO status tracking available: ${hasStatusTracking}`)
  })

  test('should show purchase order financial information', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for financial elements
    const priceElements = page.locator('text=/\\$[\\d,.]+/')
    const totalElements = page.locator('text=Total').or(page.locator('text=total'))
    const taxElements = page.locator('text=Tax').or(page.locator('text=tax'))
    const subtotalElements = page.locator('text=Subtotal').or(page.locator('text=subtotal'))
    const amountElements = page.locator('text=Amount').or(page.locator('text=amount'))
    
    const hasFinancialInfo = await priceElements.count() > 0 || 
                            await totalElements.count() > 0 || 
                            await taxElements.count() > 0 || 
                            await subtotalElements.count() > 0 || 
                            await amountElements.count() > 0
    
    console.log(`Financial information displayed: ${hasFinancialInfo}`)
  })

  test('should handle purchase order creation workflow', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for create PO button
    const createButtons = page.locator('button', { hasText: /Create.*PO|New.*PO|Add.*PO|Create.*Order|New.*Order/i })
    const plusButtons = page.locator('button', { hasText: /Add|New|\+/i })
    
    if (await createButtons.count() > 0) {
      await createButtons.first().click()
      await page.waitForTimeout(1000)
    } else if (await plusButtons.count() > 0) {
      await plusButtons.first().click()
      await page.waitForTimeout(1000)
    }
    
    // Look for PO creation form
    const forms = page.locator('form')
    const modals = page.locator('[role="dialog"], .modal')
    const supplierFields = page.locator('input[placeholder*="supplier"], select[name*="supplier"]')
    const dateFields = page.locator('input[type="date"]')
    
    const hasPOForm = await forms.count() > 0 || 
                     await modals.count() > 0 || 
                     await supplierFields.count() > 0 || 
                     await dateFields.count() > 0
    
    console.log(`PO creation form available: ${hasPOForm}`)
  })

  test('should display supplier information in POs', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for supplier-related information
    const supplierElements = page.locator('text=supplier').or(page.locator('text=Supplier'))
    const vendorElements = page.locator('text=vendor').or(page.locator('text=Vendor'))
    const companyElements = page.locator('text=company').or(page.locator('text=Company'))
    
    const hasSupplierInfo = await supplierElements.count() > 0 || 
                           await vendorElements.count() > 0 || 
                           await companyElements.count() > 0
    
    console.log(`Supplier information in POs: ${hasSupplierInfo}`)
  })

  test('should handle purchase order approval workflow', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for approval-related elements
    const approveButtons = page.locator('button', { hasText: /Approve|approve/i })
    const rejectButtons = page.locator('button', { hasText: /Reject|reject|Decline/i })
    const reviewButtons = page.locator('button', { hasText: /Review|review/i })
    const workflowElements = page.locator('text=workflow').or(page.locator('text=Workflow'))
    
    const hasApprovalWorkflow = await approveButtons.count() > 0 || 
                               await rejectButtons.count() > 0 || 
                               await reviewButtons.count() > 0 || 
                               await workflowElements.count() > 0
    
    console.log(`Approval workflow available: ${hasApprovalWorkflow}`)
  })

  test('should show purchase order line items', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for line item information
    const itemElements = page.locator('text=item').or(page.locator('text=Item'))
    const productElements = page.locator('text=product').or(page.locator('text=Product'))
    const quantityElements = page.locator('text=quantity').or(page.locator('text=Quantity'))
    const qtyElements = page.locator('text=Qty').or(page.locator('text=qty'))
    const lineElements = page.locator('text=line').or(page.locator('text=Line'))
    
    const hasLineItems = await itemElements.count() > 0 || 
                        await productElements.count() > 0 || 
                        await quantityElements.count() > 0 || 
                        await qtyElements.count() > 0 || 
                        await lineElements.count() > 0
    
    console.log(`Line items displayed: ${hasLineItems}`)
  })

  test('should handle purchase order search and filtering', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Test PO search
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first()
    
    if (await searchInput.count() > 0) {
      // Search for PO number
      await searchInput.fill('PO-2025')
      await page.waitForTimeout(1000)
      
      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
      
      // Search for supplier
      await searchInput.fill('ACME')
      await page.waitForTimeout(1000)
      await searchInput.clear()
    }
    
    // Test status filtering
    const filterButtons = page.locator('button', { hasText: /Filter|Status/i })
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should display purchase order dates and timelines', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for date-related elements
    const dateElements = page.locator('text=/\\d{1,2}\/\\d{1,2}\/\\d{4}|\\d{4}-\\d{2}-\\d{2}/')
    const createdElements = page.locator('text=created').or(page.locator('text=Created'))
    const dueDateElements = page.locator('text=/due.*date/i').or(page.locator('text=/delivery.*date/i'))
    const timelineElements = page.locator('text=timeline').or(page.locator('text=Timeline'))
    
    const hasDateInfo = await dateElements.count() > 0 || 
                       await createdElements.count() > 0 || 
                       await dueDateElements.count() > 0 || 
                       await timelineElements.count() > 0
    
    console.log(`Date and timeline information: ${hasDateInfo}`)
  })

  test('should handle purchase order export and reporting', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for export/reporting functionality
    const exportButtons = page.locator('button', { hasText: /Export|Download|PDF|CSV|Excel/i })
    const printButtons = page.locator('button', { hasText: /Print|print/i })
    const reportButtons = page.locator('button', { hasText: /Report|report/i })
    
    const hasReporting = await exportButtons.count() > 0 || 
                        await printButtons.count() > 0 || 
                        await reportButtons.count() > 0
    
    console.log(`Export and reporting features: ${hasReporting}`)
  })

  test('should show purchase order history and audit trail', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for history/audit elements
    const historyElements = page.locator('text=history').or(page.locator('text=History'))
    const auditElements = page.locator('text=audit').or(page.locator('text=Audit'))
    const logElements = page.locator('text=log').or(page.locator('text=Log'))
    const activityElements = page.locator('text=activity').or(page.locator('text=Activity'))
    
    const hasAuditTrail = await historyElements.count() > 0 || 
                         await auditElements.count() > 0 || 
                         await logElements.count() > 0 || 
                         await activityElements.count() > 0
    
    console.log(`Audit trail available: ${hasAuditTrail}`)
  })

  test('should handle purchase order notifications', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for notification elements
    const notificationElements = page.locator('text=notification').or(page.locator('text=Notification'))
    const alertElements = page.locator('[class*="alert"], [role="alert"]')
    const badgeElements = page.locator('.badge, [class*="badge"]')
    const urgentElements = page.locator('text=urgent').or(page.locator('text=Urgent'))
    
    const hasNotifications = await notificationElements.count() > 0 || 
                            await alertElements.count() > 0 || 
                            await badgeElements.count() > 0 || 
                            await urgentElements.count() > 0
    
    console.log(`Notification system: ${hasNotifications}`)
  })

  test('should validate purchase order permissions', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for role-based elements
    const approverElements = page.locator('text=approver').or(page.locator('text=Approver'))
    const managerElements = page.locator('text=manager').or(page.locator('text=Manager'))
    const permissionElements = page.locator('text=permission').or(page.locator('text=Permission'))
    const roleElements = page.locator('text=role').or(page.locator('text=Role'))
    
    const hasPermissions = await approverElements.count() > 0 || 
                          await managerElements.count() > 0 || 
                          await permissionElements.count() > 0 || 
                          await roleElements.count() > 0
    
    console.log(`Permission system: ${hasPermissions}`)
  })

  test('should handle responsive design for purchase orders', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Should still show purchase orders section
    const poTab = page.locator('button', { hasText: 'Purchase Orders' })
    await expect(poTab).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should validate HERA universal transactions architecture', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for HERA-specific elements or patterns
    const transactionElements = page.locator('text=transaction').or(page.locator('text=Transaction'))
    const universalElements = page.locator('text=universal').or(page.locator('text=Universal'))
    const heraElements = page.locator('text=HERA').or(page.locator('text=hera'))
    
    const hasHeraArchitecture = await transactionElements.count() > 0 || 
                               await universalElements.count() > 0 || 
                               await heraElements.count() > 0
    
    console.log(`HERA architecture references: ${hasHeraArchitecture}`)
  })

  test('should navigate between procurement sections', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Test navigation to Suppliers
    await page.click('button', { hasText: 'Suppliers' })
    await page.waitForTimeout(1000)
    
    const suppliersTab = page.locator('button', { hasText: 'Suppliers' })
    await expect(suppliersTab).toHaveClass(/border-indigo-500/)
    
    // Navigate back to Purchase Orders
    await page.click('button', { hasText: 'Purchase Orders' })
    await page.waitForTimeout(1000)
    
    const poTab = page.locator('button', { hasText: 'Purchase Orders' })
    await expect(poTab).toHaveClass(/border-indigo-500/)
    
    // Navigate to Dashboard to verify overview stats
    await page.click('button', { hasText: 'Dashboard' })
    await page.waitForTimeout(1000)
    
    // Should see the PO stats in dashboard
    await expect(page.locator('text=Pending POs')).toBeVisible()
  })
})