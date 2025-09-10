/**
 * E2E Test: Manufacturing Workflow
 * Tests the complete manufacturing process from sales order to production to inventory
 */

import { test, expect } from './fixtures/auth.fixture';
import { setupFurnitureContext } from './fixtures/auth.fixture';
import { createEntity, createTransaction, addDynamicField, getEntityByCode } from './helpers/api-helpers';
import { testSalesOrder, testProductionOrder, testProducts, testCustomers } from './fixtures/test-data.fixture';
import { TableHelper } from './helpers/table-helpers';

test.describe('Furniture Module - Manufacturing Workflow', () => {
  let organizationId: string;
  let customerId: string;
  let chairProductId: string;
  let deskProductId: string;

  test.beforeEach(async ({ page, request, authenticatedUser, furnitureOrganization }) => {
    organizationId = furnitureOrganization.id!;
    
    // Setup furniture context
    await setupFurnitureContext(page, authenticatedUser, furnitureOrganization);
    
    // Create test customer
    customerId = await createEntity(request, organizationId, {
      entity_type: 'customer',
      entity_name: testCustomers.corporate.name,
      entity_code: testCustomers.corporate.code,
      smart_code: 'HERA.FURN.CUST.CORPORATE.v1'
    });
    
    // Add customer details
    await addDynamicField(request, organizationId, customerId, {
      field_name: 'email',
      field_value_text: testCustomers.corporate.email
    });
    
    await addDynamicField(request, organizationId, customerId, {
      field_name: 'credit_limit',
      field_value_number: testCustomers.corporate.creditLimit
    });
    
    // Get product IDs (assuming products exist from previous tests)
    chairProductId = (await getEntityByCode(request, organizationId, testProducts.chair.code))?.id;
    deskProductId = (await getEntityByCode(request, organizationId, testProducts.desk.code))?.id;
  });

  test('Complete manufacturing workflow - Sales order → Production order → Inventory', async ({ page, request }) => {
    let salesOrderId: string;
    let productionOrderId: string;

    // Step 1: Create Sales Order
    await test.step('Create sales order', async () => {
      await page.goto('/furniture/sales/orders');
      await page.waitForLoadState('networkidle');
      
      // Click create order button
      await page.click('[data-testid="create-sales-order-button"]');
      
      // Fill order details
      await page.selectOption('[data-testid="customer-select"]', testCustomers.corporate.code);
      await page.fill('[data-testid="order-date-input"]', testSalesOrder.orderDate);
      await page.fill('[data-testid="delivery-date-input"]', testSalesOrder.deliveryDate);
      
      // Add line items
      for (const item of testSalesOrder.items) {
        await page.click('[data-testid="add-line-item-button"]');
        
        await page.selectOption('[data-testid="product-select-new"]', item.productCode);
        await page.fill('[data-testid="quantity-input-new"]', item.quantity.toString());
        await page.fill('[data-testid="unit-price-input-new"]', item.unitPrice.toString());
        await page.fill('[data-testid="discount-input-new"]', item.discount.toString());
        
        await page.click('[data-testid="save-line-item-button"]');
      }
      
      // Fill shipping address
      await page.fill('[data-testid="shipping-line1-input"]', testSalesOrder.shippingAddress.line1);
      await page.fill('[data-testid="shipping-line2-input"]', testSalesOrder.shippingAddress.line2);
      await page.fill('[data-testid="shipping-city-input"]', testSalesOrder.shippingAddress.city);
      await page.fill('[data-testid="shipping-state-input"]', testSalesOrder.shippingAddress.state);
      await page.fill('[data-testid="shipping-zip-input"]', testSalesOrder.shippingAddress.zipCode);
      
      // Save order
      await page.click('[data-testid="save-sales-order-button"]');
      await page.waitForSelector('[role="alert"]');
      
      // Get order ID from success message
      const successMessage = await page.locator('[role="alert"]').textContent();
      const orderMatch = successMessage?.match(/Order #(\w+)/);
      salesOrderId = orderMatch?.[1] || '';
      
      expect(salesOrderId).toBeTruthy();
    });

    // Step 2: Create Production Order
    await test.step('Create production order from sales order', async () => {
      await page.goto('/furniture/production/planning');
      await page.waitForLoadState('networkidle');
      
      // Create production order
      await page.click('[data-testid="create-production-order-button"]');
      
      // Link to sales order
      await page.selectOption('[data-testid="sales-order-select"]', salesOrderId);
      
      // Select product to manufacture
      await page.selectOption('[data-testid="product-select"]', testProductionOrder.productCode);
      await page.fill('[data-testid="production-quantity-input"]', testProductionOrder.quantity.toString());
      await page.selectOption('[data-testid="priority-select"]', testProductionOrder.priority);
      await page.fill('[data-testid="start-date-input"]', testProductionOrder.startDate);
      await page.fill('[data-testid="due-date-input"]', testProductionOrder.dueDate);
      
      // Save production order
      await page.click('[data-testid="save-production-order-button"]');
      await page.waitForSelector('[role="alert"]');
      
      // Verify production order created
      const prodMessage = await page.locator('[role="alert"]').textContent();
      expect(prodMessage).toContain('Production order created');
      
      // Get production order ID
      const prodMatch = prodMessage?.match(/Production Order #(\w+)/);
      productionOrderId = prodMatch?.[1] || '';
    });

    // Step 3: Track Production Progress
    await test.step('Track production progress', async () => {
      await page.goto('/furniture/production/tracking');
      await page.waitForLoadState('networkidle');
      
      // Find production order in table
      const productionTable = new TableHelper(page, '[data-testid="production-orders-table"]');
      await productionTable.initialize();
      
      const orderRow = await productionTable.findRow('order_number', productionOrderId);
      expect(orderRow).not.toBeNull();
      
      // Click on order to view details
      await orderRow!.click();
      await page.waitForLoadState('networkidle');
      
      // Start production
      await page.click('[data-testid="start-production-button"]');
      await page.waitForSelector('[role="alert"]');
      
      // Complete operations
      const operations = ['cutting', 'assembly', 'finishing', 'quality', 'packaging'];
      
      for (const operation of operations) {
        const opRow = page.locator(`[data-operation="${operation}"]`);
        
        // Start operation
        await opRow.locator('[data-testid="start-operation-button"]').click();
        await page.waitForTimeout(500);
        
        // Complete operation
        await opRow.locator('[data-testid="complete-operation-button"]').click();
        
        // For quality checkpoint, add inspection result
        if (operation === 'quality') {
          await page.fill('[data-testid="inspection-notes-input"]', 'Quality check passed');
          await page.selectOption('[data-testid="inspection-result-select"]', 'pass');
          await page.click('[data-testid="save-inspection-button"]');
        }
        
        await page.waitForTimeout(500);
      }
      
      // Complete production order
      await page.click('[data-testid="complete-production-button"]');
      await page.waitForSelector('[role="alert"]');
      
      const completionMessage = await page.locator('[role="alert"]').textContent();
      expect(completionMessage).toContain('Production completed');
    });

    // Step 4: Update Inventory
    await test.step('Verify inventory update', async () => {
      await page.goto('/furniture/inventory');
      await page.waitForLoadState('networkidle');
      
      // Search for the produced product
      await page.fill('[data-testid="inventory-search-input"]', testProductionOrder.productCode);
      await page.press('[data-testid="inventory-search-input"]', 'Enter');
      
      // Wait for results
      await page.waitForTimeout(1000);
      
      // Check inventory level
      const inventoryTable = new TableHelper(page, '[data-testid="inventory-table"]');
      await inventoryTable.initialize();
      
      const inventoryRow = await inventoryTable.findRow('product_code', testProductionOrder.productCode);
      expect(inventoryRow).not.toBeNull();
      
      // Get quantity on hand
      const qtyOnHand = await inventoryRow!.locator('[data-testid="qty-on-hand"]').textContent();
      const quantity = parseInt(qtyOnHand || '0');
      
      // Verify quantity increased by production amount
      expect(quantity).toBeGreaterThanOrEqual(testProductionOrder.quantity);
      
      // Check transaction history
      await inventoryRow!.locator('[data-testid="view-history-button"]').click();
      await page.waitForLoadState('networkidle');
      
      // Verify production receipt transaction
      const transactionTable = new TableHelper(page, '[data-testid="transaction-history-table"]');
      await transactionTable.initialize();
      
      const receiptRow = await transactionTable.findRow('transaction_type', 'production_receipt');
      expect(receiptRow).not.toBeNull();
      
      const receiptQty = await receiptRow!.locator('[data-testid="transaction-quantity"]').textContent();
      expect(parseInt(receiptQty || '0')).toBe(testProductionOrder.quantity);
    });

    // Step 5: Ship Sales Order
    await test.step('Ship sales order', async () => {
      await page.goto('/furniture/sales/orders');
      await page.waitForLoadState('networkidle');
      
      // Find sales order
      const salesTable = new TableHelper(page, '[data-testid="sales-orders-table"]');
      await salesTable.initialize();
      
      const salesRow = await salesTable.findRow('order_number', salesOrderId);
      expect(salesRow).not.toBeNull();
      
      // Click ship button
      await salesRow!.locator('[data-testid="ship-order-button"]').click();
      await page.waitForLoadState('networkidle');
      
      // Fill shipment details
      await page.fill('[data-testid="tracking-number-input"]', `TRACK-${Date.now()}`);
      await page.selectOption('[data-testid="carrier-select"]', 'FedEx');
      await page.fill('[data-testid="shipment-date-input"]', new Date().toISOString().split('T')[0]);
      
      // Confirm shipment
      await page.click('[data-testid="confirm-shipment-button"]');
      await page.waitForSelector('[role="alert"]');
      
      const shipMessage = await page.locator('[role="alert"]').textContent();
      expect(shipMessage).toContain('Order shipped successfully');
      
      // Verify inventory deduction
      await page.goto('/furniture/inventory');
      await page.fill('[data-testid="inventory-search-input"]', testProductionOrder.productCode);
      await page.press('[data-testid="inventory-search-input"]', 'Enter');
      
      // Check that inventory was reduced by shipped quantity
      const updatedInventoryRow = await inventoryTable.findRow('product_code', testProductionOrder.productCode);
      const updatedQty = await updatedInventoryRow!.locator('[data-testid="qty-on-hand"]').textContent();
      
      expect(parseInt(updatedQty || '0')).toBe(quantity - testSalesOrder.items[0].quantity);
    });
  });

  test('Production order with material shortage handling', async ({ page, request }) => {
    // This test verifies the system handles material shortages correctly
    
    await page.goto('/furniture/production/planning');
    await page.click('[data-testid="create-production-order-button"]');
    
    // Try to create production order for a product
    await page.selectOption('[data-testid="product-select"]', testProducts.chair.code);
    await page.fill('[data-testid="production-quantity-input"]', '100'); // Large quantity
    
    // Check material availability
    await page.click('[data-testid="check-materials-button"]');
    await page.waitForLoadState('networkidle');
    
    // Verify shortage warning appears
    const shortageWarning = await page.locator('[data-testid="material-shortage-warning"]').isVisible();
    expect(shortageWarning).toBe(true);
    
    // View shortage details
    await page.click('[data-testid="view-shortage-details-button"]');
    
    // Verify shortage table shows missing materials
    const shortageTable = new TableHelper(page, '[data-testid="shortage-table"]');
    await shortageTable.initialize();
    
    const shortageCount = await shortageTable.getRowCount();
    expect(shortageCount).toBeGreaterThan(0);
    
    // Create purchase requisition
    await page.click('[data-testid="create-purchase-requisition-button"]');
    await page.waitForSelector('[role="alert"]');
    
    const reqMessage = await page.locator('[role="alert"]').textContent();
    expect(reqMessage).toContain('Purchase requisition created');
  });
});