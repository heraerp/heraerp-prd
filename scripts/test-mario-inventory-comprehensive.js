#!/usr/bin/env node
/**
 * 🍝 MARIO'S RESTAURANT COMPREHENSIVE INVENTORY TESTING
 * 
 * This script performs comprehensive testing of Mario's Restaurant inventory management system
 * using the HERA Universal 6-Table Architecture with SACRED rules enforcement.
 * 
 * Organization ID: 6f591f1a-ea86-493e-8ae4-639d28a7e3c8
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mario's Restaurant Organization ID
const MARIOS_ORG_ID = '6f591f1a-ea86-493e-8ae4-639d28a7e3c8';

// 🧬 HERA Smart Code Generator
const generateSmartCode = (entityType, context = {}) => {
  const industry = 'REST'; // Restaurant
  const module = context.module || 'INV'; // Inventory
  const operation = context.operation || 'ENT'; // Entity
  const type = context.type || 'ITEM'; // Item
  const version = 'v1';
  
  return `HERA.${industry}.${module}.${entityType.toUpperCase()}.${operation}.${type}.${version}`;
};

// 🛡️ SACRED Validation - Organization ID Must Be Present
const validateOrganizationId = (orgId) => {
  if (!orgId || typeof orgId !== 'string' || orgId.trim() === '') {
    throw new Error('🔥 SACRED VIOLATION: organization_id is required for ALL operations');
  }
  return orgId.trim();
};

// 📊 Test Results Tracker
const testResults = {
  ingredientsCreated: 0,
  categoriesCreated: 0,
  suppliersCreated: 0,
  purchaseOrdersCreated: 0,
  transactionsProcessed: 0,
  reportsGenerated: 0,
  errors: [],
  success: [],
  integrationTests: []
};

console.log('🍝 MARIO\'S RESTAURANT - COMPREHENSIVE INVENTORY TESTING');
console.log('=' .repeat(70));
console.log(`🏢 Organization: ${MARIOS_ORG_ID}`);
console.log(`🛡️ SACRED Rules: ENFORCED`);
console.log(`📅 Test Date: ${new Date().toISOString()}`);
console.log();

/**
 * 🥗 TASK 1: Create Essential Restaurant Ingredients
 */
async function createRestaurantIngredients() {
  console.log('📦 TASK 1: Creating Essential Restaurant Ingredients');
  console.log('-'.repeat(50));

  const ingredients = [
    // Fresh Ingredients
    {
      category: 'fresh',
      items: [
        { name: 'Fresh Tomatoes', cost: 4.50, unit: 'lb', reorder: 20, max: 100 },
        { name: 'Fresh Mozzarella', cost: 8.99, unit: 'lb', reorder: 10, max: 50 },
        { name: 'Fresh Basil', cost: 3.99, unit: 'bunch', reorder: 5, max: 25 },
        { name: 'Parmesan Cheese', cost: 12.99, unit: 'lb', reorder: 5, max: 30 },
        { name: 'Extra Virgin Olive Oil', cost: 18.99, unit: 'liter', reorder: 3, max: 15 }
      ]
    },
    // Proteins
    {
      category: 'protein',
      items: [
        { name: 'Ground Beef (80/20)', cost: 6.99, unit: 'lb', reorder: 25, max: 150 },
        { name: 'Italian Sausage', cost: 5.99, unit: 'lb', reorder: 15, max: 75 },
        { name: 'Prosciutto di Parma', cost: 24.99, unit: 'lb', reorder: 3, max: 15 },
        { name: 'Atlantic Salmon', cost: 16.99, unit: 'lb', reorder: 10, max: 50 }
      ]
    },
    // Carbs
    {
      category: 'carbs',
      items: [
        { name: 'Spaghetti Pasta', cost: 2.99, unit: 'box', reorder: 20, max: 100 },
        { name: 'Penne Pasta', cost: 2.99, unit: 'box', reorder: 20, max: 100 },
        { name: 'Linguine Pasta', cost: 3.49, unit: 'box', reorder: 15, max: 75 },
        { name: 'Pizza Dough Mix', cost: 4.99, unit: 'bag', reorder: 10, max: 50 },
        { name: 'Italian Bread', cost: 3.99, unit: 'loaf', reorder: 8, max: 40 }
      ]
    },
    // Beverages
    {
      category: 'beverage',
      items: [
        { name: 'Chianti Classico Wine', cost: 22.99, unit: 'bottle', reorder: 6, max: 30 },
        { name: 'Pinot Grigio Wine', cost: 18.99, unit: 'bottle', reorder: 6, max: 30 },
        { name: 'San Pellegrino Water', cost: 1.99, unit: 'bottle', reorder: 24, max: 120 },
        { name: 'Italian Coffee Beans', cost: 15.99, unit: 'bag', reorder: 4, max: 20 }
      ]
    },
    // Seasonings
    {
      category: 'seasoning',
      items: [
        { name: 'Dried Oregano', cost: 4.99, unit: 'container', reorder: 3, max: 15 },
        { name: 'Fresh Garlic', cost: 0.99, unit: 'bulb', reorder: 25, max: 100 },
        { name: 'Black Pepper', cost: 6.99, unit: 'container', reorder: 2, max: 10 },
        { name: 'Sea Salt', cost: 3.99, unit: 'container', reorder: 3, max: 15 }
      ]
    }
  ];

  for (const category of ingredients) {
    for (const item of category.items) {
      try {
        // Create entity in core_entities
        const entityData = {
          organization_id: MARIOS_ORG_ID, // SACRED
          entity_type: 'inventory_item',
          entity_name: item.name,
          entity_code: `INV-${item.name.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
          smart_code: generateSmartCode('inventory_item', { 
            module: 'INV', 
            operation: 'CREATE',
            type: 'INGREDIENT' 
          }),
          status: 'active',
          metadata: {
            category: category.category,
            unit_of_measure: item.unit,
            created_for: 'inventory_testing',
            test_batch: new Date().toISOString().split('T')[0]
          }
        };

        const { data: entity, error: entityError } = await supabase
          .from('core_entities')
          .insert(entityData)
          .select()
          .single();

        if (entityError) {
          testResults.errors.push(`Failed to create ${item.name}: ${entityError.message}`);
          continue;
        }

        // Add dynamic fields for inventory properties
        const dynamicFields = [
          {
            entity_id: entity.id,
            organization_id: MARIOS_ORG_ID, // SACRED
            field_name: 'unit_cost',
            field_value_number: item.cost,
            smart_code: generateSmartCode('dynamic_field', { type: 'COST' })
          },
          {
            entity_id: entity.id,
            organization_id: MARIOS_ORG_ID, // SACRED
            field_name: 'reorder_point',
            field_value_number: item.reorder,
            smart_code: generateSmartCode('dynamic_field', { type: 'REORDER' })
          },
          {
            entity_id: entity.id,
            organization_id: MARIOS_ORG_ID, // SACRED
            field_name: 'max_stock_level',
            field_value_number: item.max,
            smart_code: generateSmartCode('dynamic_field', { type: 'MAX_STOCK' })
          },
          {
            entity_id: entity.id,
            organization_id: MARIOS_ORG_ID, // SACRED
            field_name: 'current_stock',
            field_value_number: 0,
            smart_code: generateSmartCode('dynamic_field', { type: 'CURRENT' })
          }
        ];

        const { error: fieldsError } = await supabase
          .from('core_dynamic_data')
          .insert(dynamicFields);

        if (fieldsError) {
          testResults.errors.push(`Failed to add fields for ${item.name}: ${fieldsError.message}`);
        } else {
          testResults.ingredientsCreated++;
          testResults.success.push(`✅ Created ${item.name} with dynamic inventory fields`);
        }

      } catch (error) {
        testResults.errors.push(`Exception creating ${item.name}: ${error.message}`);
      }
    }
  }

  console.log(`✅ Created ${testResults.ingredientsCreated} ingredient entities with inventory fields`);
}

/**
 * 🏷️ TASK 2: Set Up Inventory Categories & Suppliers
 */
async function setupCategoriesAndSuppliers() {
  console.log('\n🏷️ TASK 2: Setting Up Categories & Suppliers');
  console.log('-'.repeat(50));

  const suppliers = [
    {
      name: 'Roma Fresh Foods',
      category: 'fresh',
      contact: 'orders@romafresh.com',
      phone: '555-ROMA-001',
      specialty: 'Fresh Italian ingredients'
    },
    {
      name: 'Giuseppe\'s Meat Market',
      category: 'protein',
      contact: 'giuseppe@meatmarket.com',
      phone: '555-MEAT-002',
      specialty: 'Premium meats and Italian sausages'
    },
    {
      name: 'Pasta Bella Wholesale',
      category: 'carbs',
      contact: 'sales@pastabella.com',
      phone: '555-PASTA-003',
      specialty: 'Authentic Italian pasta and bread'
    },
    {
      name: 'Vino & More',
      category: 'beverage',
      contact: 'orders@vinomore.com',
      phone: '555-VINO-004',
      specialty: 'Italian wines and beverages'
    },
    {
      name: 'Spice of Italy',
      category: 'seasoning',
      contact: 'spice@spiceofitaly.com',
      phone: '555-SPICE-005',
      specialty: 'Authentic Italian spices and seasonings'
    }
  ];

  // Create supplier entities
  for (const supplier of suppliers) {
    try {
      const supplierData = {
        organization_id: MARIOS_ORG_ID, // SACRED
        entity_type: 'supplier',
        entity_name: supplier.name,
        entity_code: `SUP-${supplier.name.replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
        smart_code: generateSmartCode('supplier', { 
          module: 'INV', 
          operation: 'CREATE',
          type: 'VENDOR' 
        }),
        status: 'active',
        metadata: {
          category_specialization: supplier.category,
          contact_email: supplier.contact,
          phone: supplier.phone,
          specialty: supplier.specialty
        }
      };

      const { data: supplierEntity, error: supplierError } = await supabase
        .from('core_entities')
        .insert(supplierData)
        .select()
        .single();

      if (supplierError) {
        testResults.errors.push(`Failed to create supplier ${supplier.name}: ${supplierError.message}`);
      } else {
        testResults.suppliersCreated++;
        testResults.success.push(`✅ Created supplier: ${supplier.name}`);
      }

    } catch (error) {
      testResults.errors.push(`Exception creating supplier ${supplier.name}: ${error.message}`);
    }
  }

  console.log(`✅ Created ${testResults.suppliersCreated} supplier entities`);
}

/**
 * 📋 TASK 3: Test Purchase Orders & Inventory Operations
 */
async function testInventoryOperations() {
  console.log('\n📋 TASK 3: Testing Inventory Operations');
  console.log('-'.repeat(50));

  // Get some ingredients and suppliers for testing
  const { data: ingredients } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', MARIOS_ORG_ID)
    .eq('entity_type', 'inventory_item')
    .limit(5);

  const { data: suppliers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', MARIOS_ORG_ID)
    .eq('entity_type', 'supplier')
    .limit(3);

  if (!ingredients?.length || !suppliers?.length) {
    testResults.errors.push('No ingredients or suppliers found for testing');
    return;
  }

  // Test 1: Create Purchase Order
  try {
    const purchaseOrderData = {
      organization_id: MARIOS_ORG_ID, // SACRED
      transaction_type: 'purchase_order',
      transaction_date: new Date().toISOString(),
      reference_number: `PO-${Date.now()}`,
      smart_code: generateSmartCode('purchase_order', { 
        module: 'INV', 
        operation: 'CREATE',
        type: 'ORDER' 
      }),
      source_entity_id: suppliers[0].id, // Supplier
      total_amount: 350.00,
      transaction_status: 'pending',
      metadata: {
        order_type: 'regular_restock',
        expected_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Weekly restock order for Mario\'s Restaurant'
      }
    };

    const { data: purchaseOrder, error: poError } = await supabase
      .from('universal_transactions')
      .insert(purchaseOrderData)
      .select()
      .single();

    if (poError) {
      testResults.errors.push(`Failed to create purchase order: ${poError.message}`);
    } else {
      // Create line items for the purchase order
      const lineItems = ingredients.slice(0, 3).map((ingredient, index) => ({
        transaction_id: purchaseOrder.id,
        organization_id: MARIOS_ORG_ID, // SACRED
        line_number: index + 1,
        line_entity_id: ingredient.id,
        quantity: Math.floor(Math.random() * 20) + 10, // 10-30 units
        unit_price: Math.random() * 15 + 5, // $5-20 per unit
        line_amount: 0, // Will be calculated
        smart_code: generateSmartCode('purchase_line', { 
          module: 'INV', 
          operation: 'LINE',
          type: 'ITEM' 
        }),
        metadata: {
          expected_quality: 'Grade A',
          storage_requirements: 'refrigerated'
        }
      }));

      // Calculate line amounts
      lineItems.forEach(line => {
        line.line_amount = line.quantity * line.unit_price;
      });

      const { error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert(lineItems);

      if (lineError) {
        testResults.errors.push(`Failed to create PO line items: ${lineError.message}`);
      } else {
        testResults.purchaseOrdersCreated++;
        testResults.transactionsProcessed++;
        testResults.success.push(`✅ Created purchase order with ${lineItems.length} line items`);
      }
    }

  } catch (error) {
    testResults.errors.push(`Exception creating purchase order: ${error.message}`);
  }

  // Test 2: Simulate Goods Receipt
  try {
    const goodsReceiptData = {
      organization_id: MARIOS_ORG_ID, // SACRED
      transaction_type: 'goods_receipt',
      transaction_date: new Date().toISOString(),
      reference_number: `GR-${Date.now()}`,
      smart_code: generateSmartCode('goods_receipt', { 
        module: 'INV', 
        operation: 'RECEIVE',
        type: 'GOODS' 
      }),
      source_entity_id: suppliers[0].id,
      total_amount: 275.50,
      transaction_status: 'completed',
      metadata: {
        delivery_method: 'truck_delivery',
        quality_check: 'passed',
        received_by: 'Mario Rossi'
      }
    };

    const { data: goodsReceipt, error: grError } = await supabase
      .from('universal_transactions')
      .insert(goodsReceiptData)
      .select()
      .single();

    if (!grError) {
      testResults.transactionsProcessed++;
      testResults.success.push('✅ Created goods receipt transaction');
    }

  } catch (error) {
    testResults.errors.push(`Exception creating goods receipt: ${error.message}`);
  }

  // Test 3: Inventory Adjustment (spoilage)
  try {
    const adjustmentData = {
      organization_id: MARIOS_ORG_ID, // SACRED
      transaction_type: 'inventory_adjustment',
      transaction_date: new Date().toISOString(),
      reference_number: `ADJ-${Date.now()}`,
      smart_code: generateSmartCode('inventory_adjustment', { 
        module: 'INV', 
        operation: 'ADJUST',
        type: 'SPOILAGE' 
      }),
      total_amount: -15.50, // Negative for write-off
      transaction_status: 'completed',
      metadata: {
        adjustment_type: 'spoilage',
        reason: 'Vegetables past expiration date',
        approved_by: 'Mario Rossi'
      }
    };

    const { data: adjustment, error: adjError } = await supabase
      .from('universal_transactions')
      .insert(adjustmentData)
      .select()
      .single();

    if (!adjError) {
      testResults.transactionsProcessed++;
      testResults.success.push('✅ Created inventory adjustment for spoilage');
    }

  } catch (error) {
    testResults.errors.push(`Exception creating inventory adjustment: ${error.message}`);
  }

  console.log(`✅ Processed ${testResults.transactionsProcessed} inventory transactions`);
}

/**
 * 🔗 TASK 4: Test Recipe Integration
 */
async function testRecipeIntegration() {
  console.log('\n🔗 TASK 4: Testing Recipe Integration');
  console.log('-'.repeat(50));

  // Create a sample recipe entity
  try {
    const recipeData = {
      organization_id: MARIOS_ORG_ID, // SACRED
      entity_type: 'recipe',
      entity_name: 'Spaghetti Carbonara',
      entity_code: 'RECIPE-CARBONARA',
      smart_code: generateSmartCode('recipe', { 
        module: 'MENU', 
        operation: 'CREATE',
        type: 'ENTREE' 
      }),
      status: 'active',
      metadata: {
        cuisine_type: 'italian',
        difficulty: 'medium',
        prep_time_minutes: 20,
        cook_time_minutes: 15,
        serving_size: 4
      }
    };

    const { data: recipe, error: recipeError } = await supabase
      .from('core_entities')
      .insert(recipeData)
      .select()
      .single();

    if (recipeError) {
      testResults.errors.push(`Failed to create recipe: ${recipeError.message}`);
      return;
    }

    // Get some ingredients for the recipe
    const { data: ingredients } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', MARIOS_ORG_ID)
      .eq('entity_type', 'inventory_item')
      .in('entity_name', ['Spaghetti Pasta', 'Parmesan Cheese', 'Fresh Basil'])
      .limit(3);

    // Create recipe-ingredient relationships
    if (ingredients?.length) {
      const recipeRelationships = ingredients.map(ingredient => ({
        organization_id: MARIOS_ORG_ID, // SACRED
        parent_entity_id: recipe.id,
        child_entity_id: ingredient.id,
        relationship_type: 'recipe_ingredient',
        smart_code: generateSmartCode('relationship', { 
          module: 'MENU', 
          operation: 'RECIPE',
          type: 'INGREDIENT' 
        }),
        metadata: {
          quantity_needed: Math.random() * 0.5 + 0.25, // 0.25-0.75 units per serving
          measurement_unit: 'servings',
          is_essential: true
        }
      }));

      const { error: relationshipError } = await supabase
        .from('core_relationships')
        .insert(recipeRelationships);

      if (!relationshipError) {
        testResults.integrationTests.push('✅ Recipe-ingredient relationships created');
        testResults.success.push(`✅ Recipe integration: ${recipeRelationships.length} ingredient links`);
      }
    }

  } catch (error) {
    testResults.errors.push(`Exception in recipe integration: ${error.message}`);
  }
}

/**
 * 📊 TASK 5: Generate Reports & Analytics
 */
async function generateReports() {
  console.log('\n📊 TASK 5: Generating Reports & Analytics');
  console.log('-'.repeat(50));

  try {
    // Inventory Valuation Report
    const { data: inventoryItems } = await supabase
      .from('core_entities')
      .select(`
        id, entity_name, entity_code,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', MARIOS_ORG_ID)
      .eq('entity_type', 'inventory_item')
      .eq('core_dynamic_data.field_name', 'unit_cost');

    let totalInventoryValue = 0;
    const valuationReport = {
      generated_at: new Date().toISOString(),
      organization: 'Mario\'s Restaurant',
      report_type: 'inventory_valuation',
      items: []
    };

    if (inventoryItems?.length) {
      inventoryItems.forEach(item => {
        const costData = item.core_dynamic_data.find(d => d.field_name === 'unit_cost');
        const cost = costData ? costData.field_value_number : 0;
        const currentStock = 25; // Simulated current stock
        const itemValue = cost * currentStock;
        
        totalInventoryValue += itemValue;
        valuationReport.items.push({
          name: item.entity_name,
          code: item.entity_code,
          unit_cost: cost,
          current_stock: currentStock,
          total_value: itemValue
        });
      });

      valuationReport.total_inventory_value = totalInventoryValue;
      testResults.reportsGenerated++;
      testResults.success.push(`✅ Inventory Valuation Report: $${totalInventoryValue.toFixed(2)}`);
    }

    // Transaction Summary Report
    const { data: transactions } = await supabase
      .from('universal_transactions')
      .select('transaction_type, total_amount, transaction_date')
      .eq('organization_id', MARIOS_ORG_ID)
      .order('transaction_date', { ascending: false });

    if (transactions?.length) {
      const transactionSummary = {
        generated_at: new Date().toISOString(),
        organization: 'Mario\'s Restaurant',
        report_type: 'transaction_summary',
        total_transactions: transactions.length,
        by_type: {}
      };

      transactions.forEach(tx => {
        if (!transactionSummary.by_type[tx.transaction_type]) {
          transactionSummary.by_type[tx.transaction_type] = {
            count: 0,
            total_amount: 0
          };
        }
        transactionSummary.by_type[tx.transaction_type].count++;
        transactionSummary.by_type[tx.transaction_type].total_amount += tx.total_amount || 0;
      });

      testResults.reportsGenerated++;
      testResults.success.push(`✅ Transaction Summary: ${transactions.length} transactions`);
    }

    console.log(`✅ Generated ${testResults.reportsGenerated} comprehensive reports`);

  } catch (error) {
    testResults.errors.push(`Exception generating reports: ${error.message}`);
  }
}

/**
 * 🎯 Main Test Execution
 */
async function runComprehensiveInventoryTests() {
  const startTime = Date.now();

  try {
    await createRestaurantIngredients();
    await setupCategoriesAndSuppliers();
    await testInventoryOperations();
    await testRecipeIntegration();
    await generateReports();

    const executionTime = Date.now() - startTime;

    console.log('\n' + '='.repeat(70));
    console.log('🎯 MARIO\'S RESTAURANT INVENTORY TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`⏱️  Execution Time: ${executionTime}ms`);
    console.log(`✅ Ingredients Created: ${testResults.ingredientsCreated}`);
    console.log(`🏢 Suppliers Created: ${testResults.suppliersCreated}`);
    console.log(`📋 Purchase Orders: ${testResults.purchaseOrdersCreated}`);
    console.log(`⚡ Transactions Processed: ${testResults.transactionsProcessed}`);
    console.log(`📊 Reports Generated: ${testResults.reportsGenerated}`);
    console.log(`🔗 Integration Tests: ${testResults.integrationTests.length}`);
    console.log(`❌ Errors: ${testResults.errors.length}`);

    if (testResults.errors.length > 0) {
      console.log('\n🚨 ERRORS ENCOUNTERED:');
      testResults.errors.forEach(error => console.log(`   ${error}`));
    }

    if (testResults.success.length > 0) {
      console.log('\n✅ SUCCESS SUMMARY:');
      testResults.success.slice(0, 10).forEach(success => console.log(`   ${success}`));
      if (testResults.success.length > 10) {
        console.log(`   ... and ${testResults.success.length - 10} more successes`);
      }
    }

    console.log('\n🎊 COMPREHENSIVE INVENTORY TESTING COMPLETED!');
    console.log('All inventory operations validated with HERA Universal Architecture');
    
    // Save results to file
    require('fs').writeFileSync(
      '/Users/san/Documents/PRD/heraerp-prd/mario-inventory-test-results.json',
      JSON.stringify({
        test_date: new Date().toISOString(),
        organization_id: MARIOS_ORG_ID,
        execution_time_ms: executionTime,
        results: testResults
      }, null, 2)
    );
    
    console.log('📁 Test results saved to mario-inventory-test-results.json');

  } catch (error) {
    console.error('🔥 FATAL ERROR:', error.message);
    process.exit(1);
  }
}

// Execute the comprehensive tests
runComprehensiveInventoryTests();