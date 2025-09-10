/**
 * E2E Test: UCR Business Rules Validation
 * Tests the Universal Configuration Rules (UCR) for furniture module business logic
 */

import { test, expect } from './fixtures/auth.fixture';
import { setupFurnitureContext } from './fixtures/auth.fixture';
import { executeUCRRule, createEntity, addDynamicField } from './helpers/api-helpers';
import { testUCRRules, testProducts, testCustomers } from './fixtures/test-data.fixture';

test.describe('Furniture Module - UCR Business Rules', () => {
  let organizationId: string;
  let customerId: string;
  let productId: string;

  test.beforeEach(async ({ page, request, authenticatedUser, furnitureOrganization }) => {
    organizationId = furnitureOrganization.id!;
    
    // Setup furniture context
    await setupFurnitureContext(page, authenticatedUser, furnitureOrganization);
    
    // Create test data
    customerId = await createEntity(request, organizationId, {
      entity_type: 'customer',
      entity_name: testCustomers.retail.name,
      entity_code: testCustomers.retail.code,
      smart_code: 'HERA.FURN.CUST.RETAIL.v1'
    });
    
    await addDynamicField(request, organizationId, customerId, {
      field_name: 'credit_limit',
      field_value_number: testCustomers.retail.creditLimit
    });
    
    productId = await createEntity(request, organizationId, {
      entity_type: 'product',
      entity_name: testProducts.chair.name,
      entity_code: testProducts.chair.code,
      smart_code: 'HERA.FURN.PROD.CHAIR.v1'
    });
  });

  test('UCR validation for minimum order quantity', async ({ page, request }) => {
    await page.goto('/furniture/sales/orders');
    await page.click('[data-testid="create-sales-order-button"]');
    
    // Try to create order with quantity below minimum
    await page.selectOption('[data-testid="customer-select"]', testCustomers.retail.code);
    await page.click('[data-testid="add-line-item-button"]');
    
    await page.selectOption('[data-testid="product-select-new"]', testProducts.chair.code);
    await page.fill('[data-testid="quantity-input-new"]', '3'); // Below minimum of 5
    await page.fill('[data-testid="unit-price-input-new"]', testProducts.chair.price.toString());
    
    // Try to save line item
    await page.click('[data-testid="save-line-item-button"]');
    
    // Verify UCR validation error
    const errorMessage = await page.locator('[data-testid="ucr-validation-error"]').textContent();
    expect(errorMessage).toContain(testUCRRules.minimumOrderQuantity.message);
    
    // Fix quantity and retry
    await page.fill('[data-testid="quantity-input-new"]', '5');
    await page.click('[data-testid="save-line-item-button"]');
    
    // Verify line item saved successfully
    await page.waitForSelector('[data-testid="line-item-row"]');
    const lineItemCount = await page.locator('[data-testid="line-item-row"]').count();
    expect(lineItemCount).toBe(1);
  });

  test('UCR validation for maximum discount limit', async ({ page, request }) => {
    await page.goto('/furniture/sales/orders');
    await page.click('[data-testid="create-sales-order-button"]');
    
    await page.selectOption('[data-testid="customer-select"]', testCustomers.retail.code);
    await page.click('[data-testid="add-line-item-button"]');
    
    await page.selectOption('[data-testid="product-select-new"]', testProducts.chair.code);
    await page.fill('[data-testid="quantity-input-new"]', '10');
    await page.fill('[data-testid="unit-price-input-new"]', testProducts.chair.price.toString());
    await page.fill('[data-testid="discount-input-new"]', '25'); // Above maximum of 20%
    
    await page.click('[data-testid="save-line-item-button"]');
    
    // Verify UCR warning
    const warningMessage = await page.locator('[data-testid="ucr-validation-warning"]').textContent();
    expect(warningMessage).toContain(testUCRRules.discountLimit.message);
    
    // Proceed with warning
    await page.click('[data-testid="proceed-with-warning-button"]');
    
    // Verify line item saved with warning flag
    const lineItem = page.locator('[data-testid="line-item-row"]').first();
    const hasWarning = await lineItem.locator('[data-testid="warning-indicator"]').isVisible();
    expect(hasWarning).toBe(true);
  });

  test('UCR validation for customer credit limit', async ({ page, request }) => {
    await page.goto('/furniture/sales/orders');
    await page.click('[data-testid="create-sales-order-button"]');
    
    await page.selectOption('[data-testid="customer-select"]', testCustomers.retail.code);
    
    // Add multiple high-value items to exceed credit limit
    const items = [
      { product: testProducts.chair.code, qty: 20, price: 500 },
      { product: testProducts.desk.code, qty: 15, price: 900 },
      { product: testProducts.cabinet.code, qty: 10, price: 300 }
    ];
    
    for (const item of items) {
      await page.click('[data-testid="add-line-item-button"]');
      await page.selectOption('[data-testid="product-select-new"]', item.product);
      await page.fill('[data-testid="quantity-input-new"]', item.qty.toString());
      await page.fill('[data-testid="unit-price-input-new"]', item.price.toString());
      await page.click('[data-testid="save-line-item-button"]');
    }
    
    // Try to save order
    await page.click('[data-testid="save-sales-order-button"]');
    
    // Verify credit limit error
    const errorDialog = await page.locator('[data-testid="credit-limit-error-dialog"]').isVisible();
    expect(errorDialog).toBe(true);
    
    const errorText = await page.locator('[data-testid="credit-limit-error-message"]').textContent();
    expect(errorText).toContain(testUCRRules.creditCheck.message);
    
    // View credit details
    await page.click('[data-testid="view-credit-details-button"]');
    
    const creditLimit = await page.locator('[data-testid="customer-credit-limit"]').textContent();
    const orderTotal = await page.locator('[data-testid="order-total-amount"]').textContent();
    
    expect(parseFloat(orderTotal!.replace(/[^0-9.-]+/g, ''))).toBeGreaterThan(testCustomers.retail.creditLimit);
  });

  test('UCR API validation', async ({ request }) => {
    // Test UCR validation via API
    const ruleContext = {
      quantity: 3,
      minimumQuantity: 5
    };
    
    const result = await executeUCRRule(request, organizationId, {
      ruleName: 'minimum_order_quantity',
      context: ruleContext,
      entity_id: productId
    });
    
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('error');
  });

  test('Complex UCR rule with multiple conditions', async ({ page, request }) => {
    // Create a complex UCR rule for furniture warranty
    await page.goto('/furniture/settings/ucr');
    await page.click('[data-testid="create-ucr-rule-button"]');
    
    // Fill rule details
    await page.fill('[data-testid="rule-name-input"]', 'Furniture Warranty Eligibility');
    await page.fill('[data-testid="rule-description-input"]', 
      'Determines warranty coverage based on product type and customer tier');
    
    // Add conditions
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-field-select"]', 'product_category');
    await page.selectOption('[data-testid="condition-operator-select"]', 'equals');
    await page.fill('[data-testid="condition-value-input"]', 'premium');
    
    await page.click('[data-testid="add-condition-button"]');
    await page.selectOption('[data-testid="condition-field-select-1"]', 'customer_tier');
    await page.selectOption('[data-testid="condition-operator-select-1"]', 'in');
    await page.fill('[data-testid="condition-value-input-1"]', 'gold,platinum');
    
    // Set rule logic
    await page.selectOption('[data-testid="rule-logic-select"]', 'and');
    
    // Add actions
    await page.click('[data-testid="add-action-button"]');
    await page.selectOption('[data-testid="action-type-select"]', 'set_field');
    await page.fill('[data-testid="action-field-input"]', 'warranty_years');
    await page.fill('[data-testid="action-value-input"]', '5');
    
    // Save rule
    await page.click('[data-testid="save-ucr-rule-button"]');
    await page.waitForSelector('[role="alert"]');
    
    const successMessage = await page.locator('[role="alert"]').textContent();
    expect(successMessage).toContain('UCR rule created successfully');
    
    // Test the rule
    await page.goto('/furniture/sales/orders');
    await page.click('[data-testid="create-sales-order-button"]');
    
    // Select a premium customer
    await page.selectOption('[data-testid="customer-select"]', testCustomers.corporate.code);
    
    // Add a premium product
    await page.click('[data-testid="add-line-item-button"]');
    await page.selectOption('[data-testid="product-select-new"]', 'PROD-PREMIUM-001');
    await page.fill('[data-testid="quantity-input-new"]', '5');
    
    // Verify warranty automatically applied
    const warrantyField = await page.locator('[data-testid="warranty-years-display"]').textContent();
    expect(warrantyField).toBe('5');
  });

  test('UCR rule activation and deactivation', async ({ page }) => {
    await page.goto('/furniture/settings/ucr');
    
    // Find minimum order quantity rule
    const ruleRow = page.locator('[data-testid="ucr-rule-row"]')
      .filter({ hasText: 'Minimum Order Quantity' })
      .first();
    
    // Deactivate rule
    await ruleRow.locator('[data-testid="toggle-rule-active"]').click();
    await page.waitForTimeout(500);
    
    // Verify rule is inactive
    const isActive = await ruleRow.locator('[data-testid="rule-status"]').textContent();
    expect(isActive).toBe('Inactive');
    
    // Test that rule is not enforced
    await page.goto('/furniture/sales/orders');
    await page.click('[data-testid="create-sales-order-button"]');
    
    await page.selectOption('[data-testid="customer-select"]', testCustomers.retail.code);
    await page.click('[data-testid="add-line-item-button"]');
    
    await page.selectOption('[data-testid="product-select-new"]', testProducts.chair.code);
    await page.fill('[data-testid="quantity-input-new"]', '1'); // Below minimum
    await page.click('[data-testid="save-line-item-button"]');
    
    // Should save without error
    await page.waitForSelector('[data-testid="line-item-row"]');
    const saved = await page.locator('[data-testid="line-item-row"]').count();
    expect(saved).toBe(1);
    
    // Reactivate rule
    await page.goto('/furniture/settings/ucr');
    await ruleRow.locator('[data-testid="toggle-rule-active"]').click();
  });
});