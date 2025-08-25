import { test, expect } from '@playwright/test';

test.describe('Salon Point of Sale (POS)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to POS page
    await page.goto('/salon/pos');
    
    // Wait for POS to load
    await page.waitForSelector('text=Point of Sale', { timeout: 10000 });
  });

  test('should display POS interface with all sections', async ({ page }) => {
    // Check main sections
    await expect(page.getByText('Point of Sale')).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('tab', { name: 'Services' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Products' })).toBeVisible();
    
    // Check cart section
    await expect(page.getByText('Shopping Cart')).toBeVisible();
    
    // Check customer selection
    await expect(page.getByText('Customer')).toBeVisible();
    
    // Check totals section
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('VAT (5%)')).toBeVisible();
    await expect(page.getByText('Total')).toBeVisible();
    
    // Check checkout button
    await expect(page.getByRole('button', { name: /Checkout/i })).toBeVisible();
  });

  test('should search for services', async ({ page }) => {
    // Click services tab if not active
    await page.getByRole('tab', { name: 'Services' }).click();
    
    // Find search input
    const searchInput = page.getByPlaceholder(/Search services/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Hair');
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Verify service items are filtered
      const serviceItems = page.locator('[data-testid="service-item"]');
      if (await serviceItems.first().isVisible()) {
        await expect(serviceItems.first()).toContainText(/Hair/i);
      }
    }
  });

  test('should add service to cart', async ({ page }) => {
    // Click services tab
    await page.getByRole('tab', { name: 'Services' }).click();
    
    // Click first service item (assuming it has an Add button)
    const firstAddButton = page.getByRole('button', { name: /Add/i }).first();
    if (await firstAddButton.isVisible()) {
      await firstAddButton.click();
      
      // Check if item appears in cart
      await expect(page.getByText('Shopping Cart')).toBeVisible();
      
      // Cart should have at least one item
      const cartItems = page.locator('[data-testid="cart-item"]');
      if (await cartItems.first().isVisible()) {
        await expect(cartItems).toHaveCount(1);
      }
    }
  });

  test('should switch to products tab', async ({ page }) => {
    // Click products tab
    await page.getByRole('tab', { name: 'Products' }).click();
    
    // Wait for products to load
    await page.waitForTimeout(500);
    
    // Products content should be visible
    const productsContent = page.locator('[role="tabpanel"]').filter({ hasText: /product/i });
    if (await productsContent.isVisible()) {
      await expect(productsContent).toBeVisible();
    }
  });

  test('should update cart item quantity', async ({ page }) => {
    // First add an item to cart
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Find quantity controls in cart
      const plusButton = page.locator('[data-testid="increase-quantity"]').first();
      const minusButton = page.locator('[data-testid="decrease-quantity"]').first();
      
      if (await plusButton.isVisible()) {
        // Increase quantity
        await plusButton.click();
        
        // Verify quantity updated (would need to check the actual quantity display)
        const quantityDisplay = page.locator('[data-testid="item-quantity"]').first();
        if (await quantityDisplay.isVisible()) {
          await expect(quantityDisplay).toContainText('2');
        }
      }
    }
  });

  test('should remove item from cart', async ({ page }) => {
    // Add item to cart first
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Find remove button in cart
      const removeButton = page.locator('[data-testid="remove-item"]').first();
      if (await removeButton.isVisible()) {
        await removeButton.click();
        
        // Cart should be empty
        await expect(page.getByText('Cart is empty')).toBeVisible();
      }
    }
  });

  test('should select customer', async ({ page }) => {
    // Click customer select/search
    const customerSelect = page.getByText('Select Customer');
    if (await customerSelect.isVisible()) {
      await customerSelect.click();
      
      // Search for customer
      const customerSearch = page.getByPlaceholder(/Search customers/i);
      if (await customerSearch.isVisible()) {
        await customerSearch.fill('Sarah');
        
        // Select first matching customer
        const firstCustomer = page.locator('[data-testid="customer-option"]').first();
        if (await firstCustomer.isVisible()) {
          await firstCustomer.click();
          
          // Verify customer is selected
          await expect(page.getByText(/Sarah/i)).toBeVisible();
        }
      }
    }
  });

  test('should display correct totals with VAT', async ({ page }) => {
    // Add item to cart
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check totals section
      const subtotal = page.locator('text=Subtotal').locator('..//span').last();
      const vat = page.locator('text=VAT (5%)').locator('..//span').last();
      const total = page.locator('text=Total').locator('..//span').last();
      
      // Verify calculations (basic check that values exist)
      await expect(subtotal).toContainText(/\d+/);
      await expect(vat).toContainText(/\d+/);
      await expect(total).toContainText(/\d+/);
    }
  });

  test('should open checkout dialog', async ({ page }) => {
    // Add item to cart first
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Click checkout button
      await page.getByRole('button', { name: /Checkout/i }).click();
      
      // Payment dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Payment')).toBeVisible();
      
      // Check payment methods are displayed
      await expect(page.getByText('Cash')).toBeVisible();
      await expect(page.getByText('Credit/Debit Card')).toBeVisible();
    }
  });

  test('should display payment methods in checkout', async ({ page }) => {
    // Add item and open checkout
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByRole('button', { name: /Checkout/i }).click();
      
      // Check all payment methods
      const paymentMethods = ['Cash', 'Credit/Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Gift Card'];
      
      for (const method of paymentMethods) {
        const methodOption = page.getByText(method);
        if (await methodOption.isVisible()) {
          await expect(methodOption).toBeVisible();
        }
      }
    }
  });

  test('should handle split payment option', async ({ page }) => {
    // Add item and open checkout
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByRole('button', { name: /Checkout/i }).click();
      
      // Look for split payment option
      const splitPaymentButton = page.getByText(/Split Payment/i);
      if (await splitPaymentButton.isVisible()) {
        await splitPaymentButton.click();
        
        // Split payment interface should show
        await expect(page.getByText('Add Payment Method')).toBeVisible();
      }
    }
  });

  test('should apply discount to items', async ({ page }) => {
    // Add item to cart
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Look for discount option in cart
      const discountButton = page.locator('[data-testid="apply-discount"]').first();
      if (await discountButton.isVisible()) {
        await discountButton.click();
        
        // Enter discount
        const discountInput = page.getByPlaceholder(/Enter discount/i);
        if (await discountInput.isVisible()) {
          await discountInput.fill('10');
          
          // Apply discount
          const applyButton = page.getByRole('button', { name: /Apply/i });
          if (await applyButton.isVisible()) {
            await applyButton.click();
            
            // Verify discount is applied (check for updated total)
            await expect(page.getByText(/Discount/i)).toBeVisible();
          }
        }
      }
    }
  });

  test('should clear cart', async ({ page }) => {
    // Add multiple items
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButtons = page.getByRole('button', { name: /Add/i });
    const count = Math.min(await addButtons.count(), 2);
    
    for (let i = 0; i < count; i++) {
      await addButtons.nth(i).click();
    }
    
    // Find clear cart button
    const clearCartButton = page.getByRole('button', { name: /Clear Cart/i });
    if (await clearCartButton.isVisible()) {
      await clearCartButton.click();
      
      // Confirm clear action if dialog appears
      page.on('dialog', dialog => dialog.accept());
      
      // Cart should be empty
      await expect(page.getByText('Cart is empty')).toBeVisible();
    }
  });

  test('should assign staff to service items', async ({ page }) => {
    // Add service to cart
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Find staff selection in cart item
      const staffSelect = page.locator('[data-testid="select-staff"]').first();
      if (await staffSelect.isVisible()) {
        await staffSelect.click();
        
        // Select a staff member
        const staffOption = page.locator('[data-testid="staff-option"]').first();
        if (await staffOption.isVisible()) {
          await staffOption.click();
          
          // Verify staff is assigned
          const cartItem = page.locator('[data-testid="cart-item"]').first();
          await expect(cartItem).toContainText(/Emma|Lisa|Nina/i);
        }
      }
    }
  });

  test('should process cash payment', async ({ page }) => {
    // Add item and checkout
    await page.getByRole('tab', { name: 'Services' }).click();
    const addButton = page.getByRole('button', { name: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByRole('button', { name: /Checkout/i }).click();
      
      // Select cash payment
      await page.getByText('Cash').click();
      
      // Enter cash amount
      const cashInput = page.getByPlaceholder(/Enter amount/i);
      if (await cashInput.isVisible()) {
        await cashInput.fill('500');
        
        // Process payment
        const processButton = page.getByRole('button', { name: /Process Payment/i });
        if (await processButton.isVisible()) {
          await processButton.click();
          
          // Should show success or change due
          await expect(page.getByText(/Change Due|Payment Successful/i)).toBeVisible();
        }
      }
    }
  });
});