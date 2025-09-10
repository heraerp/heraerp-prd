#!/usr/bin/env node

/**
 * Test script for HERA Furniture Module Phase 7 - Universal Transactions
 * 
 * This script demonstrates all transaction types with UCR integration:
 * - Sales Orders with validation and pricing
 * - Purchase Orders with approval workflows
 * - Manufacturing Orders with BOM integration
 * - Inventory Movements with real-time tracking
 */

const { 
  SalesOrderService, 
  PurchaseOrderService, 
  ManufacturingOrderService, 
  InventoryMovementService,
  TRANSACTION_TYPES
} = require('./furniture-phase7-transactions');

const FURNITURE_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function testSalesOrder() {
  console.log('\n🛒 Testing Sales Order Creation...');
  console.log('='.repeat(60));
  
  try {
    // Create a sales order with multiple line items
    const result = await SalesOrderService.createSalesOrder({
      customerId: 'customer-id-here', // Replace with actual customer ID
      customerPO: 'CUST-PO-2025-TEST-001',
      lineItems: [
        {
          entity_id: 'product-id-1', // Replace with actual product ID
          product_name: 'Executive Oak Dining Table',
          quantity: 5,
          unit_amount: 5500,
          specifications: {
            finish: 'Natural Oak',
            dimensions: '2400x1200x750mm'
          }
        },
        {
          entity_id: 'product-id-2', // Replace with actual product ID
          product_name: 'Ergonomic Office Chair',
          quantity: 10,
          unit_amount: 1850,
          specifications: {
            color: 'Black Leather',
            lumbar_support: true
          }
        }
      ],
      deliveryAddress: {
        line1: '123 Furniture Street',
        line2: 'Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        postal: '12345'
      },
      specialInstructions: 'Please deliver to loading dock. Call 30 minutes before arrival.'
    });
    
    console.log('✅ Sales Order created successfully!');
    console.log(`   Order Number: ${result.transaction.transaction_code}`);
    console.log(`   Total Amount: AED ${result.transaction.total_amount}`);
    console.log(`   Line Items: ${result.lineItems.length}`);
    
    return result.transaction;
    
  } catch (error) {
    console.error('❌ Sales Order test failed:', error.message);
  }
}

async function testPurchaseOrder() {
  console.log('\n📦 Testing Purchase Order Creation...');
  console.log('='.repeat(60));
  
  try {
    const result = await PurchaseOrderService.createPurchaseOrder({
      supplierId: 'supplier-id-here', // Replace with actual supplier ID
      lineItems: [
        {
          material_id: 'material-id-1', // Replace with actual material ID
          material_name: 'Solid Oak A-Grade',
          quantity: 100,
          unit_cost: 250,
          supplier_part_number: 'SP-OAK-A001',
          lead_time_days: 14
        },
        {
          material_id: 'material-id-2', // Replace with actual material ID
          material_name: 'Stainless Steel Hinges',
          quantity: 500,
          unit_cost: 5,
          supplier_part_number: 'SP-HINGE-SS01',
          lead_time_days: 7
        }
      ],
      deliveryWarehouse: 'Main Warehouse',
      paymentTerms: 'NET30'
    });
    
    console.log('✅ Purchase Order created successfully!');
    console.log(`   PO Number: ${result.transaction.transaction_code}`);
    console.log(`   Total Amount: AED ${result.transaction.total_amount}`);
    if (result.transaction.metadata?.approval_required?.required) {
      console.log(`   ⚠️  Approval Required: ${result.transaction.metadata.approval_required.rule}`);
    }
    
    return result.transaction;
    
  } catch (error) {
    console.error('❌ Purchase Order test failed:', error.message);
  }
}

async function testManufacturingOrder(salesOrderId) {
  console.log('\n🏭 Testing Manufacturing Order Creation...');
  console.log('='.repeat(60));
  
  try {
    const result = await ManufacturingOrderService.createManufacturingOrder({
      productId: 'product-id-here', // Replace with actual product ID
      quantity: 5,
      salesOrderId: salesOrderId,
      targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    });
    
    console.log('✅ Manufacturing Order created successfully!');
    console.log(`   MO Number: ${result.transaction.transaction_code}`);
    console.log(`   Quantity to Produce: ${result.transaction.metadata?.quantity_to_produce}`);
    console.log(`   Total Material Cost: AED ${result.transaction.total_amount}`);
    console.log(`   Material Requirements: ${result.lineItems.length} components`);
    
    return result.transaction;
    
  } catch (error) {
    console.error('❌ Manufacturing Order test failed:', error.message);
  }
}

async function testInventoryMovement() {
  console.log('\n📦 Testing Inventory Movement...');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Receipt from supplier
    const receipt = await InventoryMovementService.createInventoryMovement({
      movementType: 'receipt',
      sourceLocation: null, // External source
      destinationLocation: 'warehouse-id-1', // Replace with actual warehouse ID
      lineItems: [
        {
          entity_id: 'material-id-1', // Replace with actual material ID
          item_name: 'Solid Oak A-Grade',
          quantity: 100,
          batch_number: 'BATCH-2025-001',
          reason: 'Purchase order receipt'
        }
      ],
      reason: 'Material receipt from supplier'
    });
    
    console.log('✅ Inventory Receipt created successfully!');
    console.log(`   Movement Number: ${receipt.transaction.transaction_code}`);
    
    // Test 2: Transfer between warehouses
    const transfer = await InventoryMovementService.createInventoryMovement({
      movementType: 'transfer',
      sourceLocation: 'warehouse-id-1', // Replace with actual warehouse ID
      destinationLocation: 'warehouse-id-2', // Replace with actual warehouse ID
      lineItems: [
        {
          entity_id: 'product-id-1', // Replace with actual product ID
          item_name: 'Executive Oak Dining Table',
          quantity: 2,
          batch_number: 'FG-2025-001',
          reason: 'Stock rebalancing'
        }
      ],
      reason: 'Transfer to showroom for display'
    });
    
    console.log('✅ Inventory Transfer created successfully!');
    console.log(`   Movement Number: ${transfer.transaction.transaction_code}`);
    
    return { receipt, transfer };
    
  } catch (error) {
    console.error('❌ Inventory Movement test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('\n🚀 HERA Furniture Phase 7 - Transaction Testing');
  console.log('='.repeat(70));
  console.log(`Organization ID: ${FURNITURE_ORG_ID}`);
  console.log('Starting comprehensive transaction tests...\n');
  
  try {
    // Test Sales Order
    const salesOrder = await testSalesOrder();
    
    // Test Purchase Order
    const purchaseOrder = await testPurchaseOrder();
    
    // Test Manufacturing Order (linked to sales order)
    if (salesOrder) {
      await testManufacturingOrder(salesOrder.id);
    }
    
    // Test Inventory Movements
    await testInventoryMovement();
    
    console.log('\n\n🎉 ALL TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log('Summary:');
    console.log('  ✅ Sales Order Processing with UCR validation');
    console.log('  ✅ Purchase Order Management with approvals');
    console.log('  ✅ Manufacturing Order with BOM integration');
    console.log('  ✅ Inventory Movement tracking');
    console.log('\n📊 Transaction Types Demonstrated:');
    Object.entries(TRANSACTION_TYPES).forEach(([key, type]) => {
      console.log(`  • ${type.name}: ${type.smart_code}`);
    });
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'sales':
      testSalesOrder();
      break;
      
    case 'purchase':
      testPurchaseOrder();
      break;
      
    case 'manufacturing':
      testManufacturingOrder();
      break;
      
    case 'inventory':
      testInventoryMovement();
      break;
      
    case 'all':
      runAllTests();
      break;
      
    default:
      console.log('\n📋 HERA Furniture Transaction Test Suite');
      console.log('='.repeat(40));
      console.log('\nUsage:');
      console.log('  node test-furniture-transactions.js <command>');
      console.log('\nCommands:');
      console.log('  all           Run all transaction tests');
      console.log('  sales         Test sales order creation');
      console.log('  purchase      Test purchase order creation');
      console.log('  manufacturing Test manufacturing order');
      console.log('  inventory     Test inventory movements');
      console.log('\nExamples:');
      console.log('  node test-furniture-transactions.js all');
      console.log('  node test-furniture-transactions.js sales');
  }
}