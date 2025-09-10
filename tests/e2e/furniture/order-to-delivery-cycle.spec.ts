/**
 * E2E Test: Complete Order-to-Delivery Cycle
 * Tests the full business cycle from customer order to final delivery
 */

import { test, expect } from './fixtures/auth.fixture';
import { setupFurnitureContext } from './fixtures/auth.fixture';
import { createEntity, createTransaction, addDynamicField } from './helpers/api-helpers';
import { testCustomers, testProducts } from './fixtures/test-data.fixture';
import { TableHelper } from './helpers/table-helpers';
import { DynamicFieldHelper } from './helpers/dynamic-field-helpers';

test.describe('Furniture Module - Order to Delivery Cycle', () => {
  let organizationId: string;
  let customerId: string;

  test.beforeEach(async ({ page, request, authenticatedUser, furnitureOrganization }) => {
    organizationId = furnitureOrganization.id!;
    
    // Setup furniture context
    await setupFurnitureContext(page, authenticatedUser, furnitureOrganization);
    
    // Create customer with full details
    customerId = await createEntity(request, organizationId, {
      entity_type: 'customer',
      entity_name: 'Premium Furniture Corp',
      entity_code: 'CUST-PREM-001',
      smart_code: 'HERA.FURN.CUST.PREMIUM.v1'
    });
    
    // Add comprehensive customer details
    const customerFields = [
      { field_name: 'email', field_value_text: 'orders@premiumfurniture.com' },
      { field_name: 'phone', field_value_text: '+1-555-9876' },
      { field_name: 'credit_limit', field_value_number: 100000 },
      { field_name: 'payment_terms', field_value_text: 'NET30' },
      { field_name: 'customer_tier', field_value_text: 'platinum' }
    ];
    
    for (const field of customerFields) {
      await addDynamicField(request, organizationId, customerId, field);
    }
  });

  test('Complete order-to-delivery cycle with all business processes', async ({ page, request }) => {
    const orderId = `ORD-${Date.now()}`;
    let salesOrderEntityId: string;
    let invoiceId: string;
    let shipmentId: string;

    // Step 1: Customer Inquiry and Quote
    await test.step('Create customer inquiry and quote', async () => {
      await page.goto('/furniture/sales');
      await page.click('[data-testid="create-quote-button"]');
      
      // Fill quote details
      await page.selectOption('[data-testid="customer-select"]', 'CUST-PREM-001');
      await page.fill('[data-testid="quote-date-input"]', new Date().toISOString().split('T')[0]);
      await page.fill('[data-testid="valid-until-input"]', 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      // Add multiple products to quote
      const quoteItems = [
        { product: testProducts.chair.code, qty: 20, price: 450, discount: 10 },
        { product: testProducts.desk.code, qty: 10, price: 850, discount: 15 },
        { product: testProducts.cabinet.code, qty: 15, price: 280, discount: 5 }
      ];
      
      for (const item of quoteItems) {
        await page.click('[data-testid="add-quote-item-button"]');
        await page.selectOption('[data-testid="product-select-new"]', item.product);
        await page.fill('[data-testid="quantity-input-new"]', item.qty.toString());
        await page.fill('[data-testid="unit-price-input-new"]', item.price.toString());
        await page.fill('[data-testid="discount-input-new"]', item.discount.toString());
        await page.click('[data-testid="save-quote-item-button"]');
      }
      
      // Add custom terms
      await page.fill('[data-testid="quote-notes-input"]', 
        'Premium customer - expedited delivery included. Free installation service.');
      
      // Save quote
      await page.click('[data-testid="save-quote-button"]');
      await page.waitForSelector('[role="alert"]');
      
      // Send quote to customer
      await page.click('[data-testid="send-quote-button"]');
      await page.fill('[data-testid="recipient-email-input"]', 'orders@premiumfurniture.com');
      await page.click('[data-testid="confirm-send-button"]');
      
      await page.waitForSelector('[role="alert"]');
      const quoteMessage = await page.locator('[role="alert"]').textContent();
      expect(quoteMessage).toContain('Quote sent successfully');
    });

    // Step 2: Convert Quote to Sales Order
    await test.step('Convert quote to sales order', async () => {
      // Simulate customer approval
      await page.goto('/furniture/sales');
      
      const quotesTable = new TableHelper(page, '[data-testid="quotes-table"]');
      await quotesTable.initialize();
      
      // Find and convert quote
      await quotesTable.clickRowAction('customer_name', 'Premium Furniture Corp', 'convert-to-order');
      
      // Review and confirm order details
      await page.fill('[data-testid="po-number-input"]', `PO-${Date.now()}`);
      await page.fill('[data-testid="delivery-instructions-input"]', 
        'Deliver to loading dock. Contact John at 555-1234 upon arrival.');
      
      // Apply customer-specific pricing
      const dynamicFields = new DynamicFieldHelper(page);
      await dynamicFields.fillDynamicField('special_handling', 'White glove delivery service');
      await dynamicFields.fillDynamicField('installation_required', true);
      
      // Confirm order
      await page.click('[data-testid="confirm-order-button"]');
      await page.waitForSelector('[role="alert"]');
      
      const orderMessage = await page.locator('[role="alert"]').textContent();
      const orderMatch = orderMessage?.match(/Order #(\w+)/);
      salesOrderEntityId = orderMatch?.[1] || '';
      
      expect(salesOrderEntityId).toBeTruthy();
    });

    // Step 3: Check Inventory and Create Production Orders
    await test.step('Check inventory and create production orders', async () => {
      await page.goto('/furniture/sales/orders');
      
      // Find the order
      const ordersTable = new TableHelper(page, '[data-testid="orders-table"]');
      await ordersTable.initialize();
      
      await ordersTable.clickRowAction('order_number', salesOrderEntityId, 'check-availability');
      
      // View availability report
      await page.waitForSelector('[data-testid="availability-modal"]');
      
      const availabilityTable = new TableHelper(page, '[data-testid="availability-table"]');
      await availabilityTable.initialize();
      
      const rows = await availabilityTable.getAllRows();
      
      // Create production orders for items not in stock
      for (const row of rows) {
        if (row.status === 'Out of Stock' || row.available_qty < row.required_qty) {
          await page.click(`[data-testid="create-production-${row.product_code}"]`);
          
          // Fill production details
          const qtyNeeded = row.required_qty - (row.available_qty || 0);
          await page.fill('[data-testid="production-qty-input"]', qtyNeeded.toString());
          await page.selectOption('[data-testid="priority-select"]', 'urgent');
          await page.click('[data-testid="create-production-confirm"]');
          
          await page.waitForTimeout(500);
        }
      }
      
      await page.click('[data-testid="close-availability-modal"]');
    });

    // Step 4: Production and Quality Control
    await test.step('Complete production with quality control', async () => {
      await page.goto('/furniture/production/tracking');
      
      // Filter for urgent orders
      await page.selectOption('[data-testid="priority-filter"]', 'urgent');
      
      const productionTable = new TableHelper(page, '[data-testid="production-orders-table"]');
      await productionTable.initialize();
      
      const productionOrders = await productionTable.getAllRows();
      
      // Process each production order
      for (const order of productionOrders) {
        if (order.sales_order === salesOrderEntityId) {
          // Open production order
          await productionTable.clickRowAction('order_number', order.order_number, 'view');
          
          // Fast-track production
          await page.click('[data-testid="fast-track-production"]');
          
          // Quality inspection
          await page.fill('[data-testid="qc-checklist-finish"]', 'Smooth, no defects');
          await page.fill('[data-testid="qc-checklist-assembly"]', 'Sturdy, all joints secure');
          await page.fill('[data-testid="qc-checklist-function"]', 'All functions working');
          await page.selectOption('[data-testid="qc-result"]', 'pass');
          
          // Complete production
          await page.click('[data-testid="complete-production-button"]');
          await page.waitForSelector('[role="alert"]');
          
          // Go back to list
          await page.click('[data-testid="back-to-list"]');
        }
      }
    });

    // Step 5: Generate Invoice
    await test.step('Generate and send invoice', async () => {
      await page.goto('/furniture/sales/orders');
      
      const ordersTable = new TableHelper(page, '[data-testid="orders-table"]');
      await ordersTable.initialize();
      
      await ordersTable.clickRowAction('order_number', salesOrderEntityId, 'create-invoice');
      
      // Review invoice details
      await page.waitForSelector('[data-testid="invoice-preview"]');
      
      // Add payment instructions
      await page.fill('[data-testid="payment-instructions-input"]', 
        'Wire transfer to account: 1234567890. Reference order number.');
      
      // Apply taxes
      await page.selectOption('[data-testid="tax-rate-select"]', '8.5');
      
      // Generate invoice
      await page.click('[data-testid="generate-invoice-button"]');
      await page.waitForSelector('[role="alert"]');
      
      const invoiceMessage = await page.locator('[role="alert"]').textContent();
      const invoiceMatch = invoiceMessage?.match(/Invoice #(\w+)/);
      invoiceId = invoiceMatch?.[1] || '';
      
      // Send invoice
      await page.click('[data-testid="send-invoice-button"]');
      await page.click('[data-testid="confirm-send-invoice"]');
    });

    // Step 6: Process Payment
    await test.step('Process customer payment', async () => {
      await page.goto('/furniture/finance');
      await page.click('[data-testid="record-payment-button"]');
      
      // Fill payment details
      await page.selectOption('[data-testid="customer-select"]', 'CUST-PREM-001');
      await page.selectOption('[data-testid="invoice-select"]', invoiceId);
      
      const paymentAmount = await page.locator('[data-testid="invoice-amount"]').textContent();
      await page.fill('[data-testid="payment-amount-input"]', paymentAmount!.replace(/[^0-9.-]+/g, ''));
      
      await page.selectOption('[data-testid="payment-method-select"]', 'wire_transfer');
      await page.fill('[data-testid="reference-number-input"]', `WIRE-${Date.now()}`);
      await page.fill('[data-testid="payment-date-input"]', new Date().toISOString().split('T')[0]);
      
      // Save payment
      await page.click('[data-testid="save-payment-button"]');
      await page.waitForSelector('[role="alert"]');
      
      const paymentMessage = await page.locator('[role="alert"]').textContent();
      expect(paymentMessage).toContain('Payment recorded successfully');
    });

    // Step 7: Prepare Shipment
    await test.step('Prepare and dispatch shipment', async () => {
      await page.goto('/furniture/sales/orders');
      
      const ordersTable = new TableHelper(page, '[data-testid="orders-table"]');
      await ordersTable.initialize();
      
      await ordersTable.clickRowAction('order_number', salesOrderEntityId, 'prepare-shipment');
      
      // Create packing list
      await page.click('[data-testid="generate-packing-list"]');
      
      // Verify all items
      const packingTable = new TableHelper(page, '[data-testid="packing-items-table"]');
      await packingTable.initialize();
      
      const itemCount = await packingTable.getRowCount();
      for (let i = 0; i < itemCount; i++) {
        await page.check(`[data-testid="verify-item-${i}"]`);
      }
      
      // Add shipping details
      await page.selectOption('[data-testid="shipping-method-select"]', 'white_glove_delivery');
      await page.selectOption('[data-testid="carrier-select"]', 'Premium Logistics');
      await page.fill('[data-testid="estimated-delivery-date"]', 
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      // Schedule installation
      await page.check('[data-testid="schedule-installation-checkbox"]');
      await page.fill('[data-testid="installation-date-input"]', 
        new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      await page.selectOption('[data-testid="installation-team-select"]', 'Team A');
      
      // Create shipment
      await page.click('[data-testid="create-shipment-button"]');
      await page.waitForSelector('[role="alert"]');
      
      const shipmentMessage = await page.locator('[role="alert"]').textContent();
      const shipmentMatch = shipmentMessage?.match(/Shipment #(\w+)/);
      shipmentId = shipmentMatch?.[1] || '';
    });

    // Step 8: Track Delivery and Installation
    await test.step('Track delivery and complete installation', async () => {
      await page.goto('/furniture/logistics');
      
      // Find shipment
      await page.fill('[data-testid="shipment-search"]', shipmentId);
      await page.press('[data-testid="shipment-search"]', 'Enter');
      
      // Update delivery status
      await page.click('[data-testid="update-status-button"]');
      await page.selectOption('[data-testid="status-select"]', 'in_transit');
      await page.fill('[data-testid="location-update-input"]', 'Distribution Center - City A');
      await page.click('[data-testid="save-status-button"]');
      
      // Simulate delivery
      await page.waitForTimeout(1000);
      await page.click('[data-testid="update-status-button"]');
      await page.selectOption('[data-testid="status-select"]', 'delivered');
      await page.fill('[data-testid="delivery-notes-input"]', 'Delivered to loading dock as requested');
      await page.fill('[data-testid="recipient-name-input"]', 'John Smith');
      
      // Upload signature
      await page.click('[data-testid="capture-signature-button"]');
      // In real test, would handle signature capture
      await page.click('[data-testid="save-delivery-button"]');
      
      // Complete installation
      await page.click('[data-testid="complete-installation-button"]');
      await page.fill('[data-testid="installation-notes"]', 
        'All items installed as per plan. Customer satisfied.');
      await page.check('[data-testid="customer-training-completed"]');
      await page.click('[data-testid="save-installation-button"]');
    });

    // Step 9: Customer Feedback and After-Sales
    await test.step('Collect customer feedback and setup warranty', async () => {
      await page.goto('/furniture/customers');
      await page.fill('[data-testid="customer-search"]', 'Premium Furniture Corp');
      await page.press('[data-testid="customer-search"]', 'Enter');
      
      await page.click('[data-testid="view-customer-button"]');
      
      // Add feedback
      await page.click('[data-testid="add-feedback-button"]');
      await page.selectOption('[data-testid="order-select"]', salesOrderEntityId);
      await page.selectOption('[data-testid="rating-select"]', '5');
      await page.fill('[data-testid="feedback-comments"]', 
        'Excellent quality and service. Installation team was professional.');
      await page.click('[data-testid="save-feedback-button"]');
      
      // Register warranty
      await page.click('[data-testid="warranties-tab"]');
      await page.click('[data-testid="register-warranty-button"]');
      
      const warrantyItems = await page.locator('[data-testid="warranty-item-checkbox"]').all();
      for (const item of warrantyItems) {
        await item.check();
      }
      
      await page.selectOption('[data-testid="warranty-period-select"]', '5_years');
      await page.fill('[data-testid="warranty-start-date"]', new Date().toISOString().split('T')[0]);
      await page.click('[data-testid="create-warranty-button"]');
      
      await page.waitForSelector('[role="alert"]');
      const warrantyMessage = await page.locator('[role="alert"]').textContent();
      expect(warrantyMessage).toContain('Warranty registered successfully');
    });

    // Final Verification
    await test.step('Verify complete order cycle', async () => {
      await page.goto('/furniture/sales/orders');
      
      const ordersTable = new TableHelper(page, '[data-testid="orders-table"]');
      await ordersTable.initialize();
      
      const orderRow = await ordersTable.findRow('order_number', salesOrderEntityId);
      const status = await orderRow!.locator('[data-testid="order-status"]').textContent();
      
      expect(status).toBe('Completed');
      
      // Verify all related documents
      await ordersTable.clickRowAction('order_number', salesOrderEntityId, 'view-documents');
      
      const documents = [
        'Quote',
        'Sales Order',
        'Production Orders',
        'Quality Reports',
        'Invoice',
        'Payment Receipt',
        'Packing List',
        'Delivery Note',
        'Installation Report',
        'Warranty Certificate'
      ];
      
      for (const doc of documents) {
        const docExists = await page.locator(`[data-testid="document-${doc.toLowerCase().replace(' ', '-')}"]`).isVisible();
        expect(docExists).toBe(true);
      }
    });
  });
});