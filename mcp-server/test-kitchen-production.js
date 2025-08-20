#!/usr/bin/env node

/**
 * Test Production Kitchen Display System with HERA Database
 * This script creates real entries in the database for testing the KDS
 */

const { createClient } = require('@supabase/supabase-js');

// Hardcoded values for testing (in production, use environment variables)
const SUPABASE_URL = 'https://hsumtzuqzoqccpjiaikh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA3ODcsImV4cCI6MjA2OTE3Njc4N30.MeQGn3wi7WFDLfw_DNUKzvfOYle9vGX9BEN67wuSTLQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test organization for restaurant
const RESTAURANT_ORG_ID = 'rest-test-' + Date.now();

async function setupRestaurantOrganization() {
  console.log('\n🏢 Creating Restaurant Organization...\n');
  
  const orgData = {
    id: RESTAURANT_ORG_ID,
    organization_name: "Mario's Kitchen Test",
    organization_code: 'MARIO-TEST-' + Date.now(),
    organization_type: 'restaurant',
    industry: 'food_service',
    email: 'test@marioskitchen.com',
    phone: '555-0100',
    status: 'active',
    settings: {
      currency: 'USD',
      timezone: 'America/New_York',
      features: ['kitchen_display', 'pos', 'inventory']
    }
  };

  const { data, error } = await supabase
    .from('core_organizations')
    .insert([orgData])
    .select()
    .single();

  if (error) {
    console.error('Error creating organization:', error);
    return null;
  }

  console.log('✅ Organization created:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Name: ${data.organization_name}`);
  console.log(`   Code: ${data.organization_code}`);
  
  return data.id;
}

async function createMenuItems(orgId) {
  console.log('\n🍽️ Creating Menu Items as Entities...\n');
  
  const menuItems = [
    {
      organization_id: orgId,
      entity_type: 'menu_item',
      entity_name: 'Grilled Salmon',
      entity_code: 'MENU-SALMON',
      entity_category: 'main_course',
      smart_code: 'HERA.REST.MENU.ITEM.SALMON.v1',
      metadata: {
        price: 24.00,
        cost: 5.31,
        prep_time: 12,
        station: 'grill',
        allergens: ['fish'],
        calories: 450
      },
      status: 'active'
    },
    {
      organization_id: orgId,
      entity_type: 'menu_item',
      entity_name: 'Caesar Salad',
      entity_code: 'MENU-CAESAR',
      entity_category: 'appetizer',
      smart_code: 'HERA.REST.MENU.ITEM.CAESAR.v1',
      metadata: {
        price: 9.00,
        cost: 2.00,
        prep_time: 5,
        station: 'salad',
        allergens: ['dairy', 'gluten'],
        calories: 280
      },
      status: 'active'
    },
    {
      organization_id: orgId,
      entity_type: 'menu_item',
      entity_name: 'Truffle Pasta',
      entity_code: 'MENU-PASTA',
      entity_category: 'main_course',
      smart_code: 'HERA.REST.MENU.ITEM.PASTA.v1',
      metadata: {
        price: 25.00,
        cost: 3.23,
        prep_time: 15,
        station: 'grill',
        allergens: ['gluten', 'dairy'],
        calories: 580
      },
      status: 'active'
    },
    {
      organization_id: orgId,
      entity_type: 'menu_item', 
      entity_name: 'Chocolate Lava Cake',
      entity_code: 'MENU-CHOCO',
      entity_category: 'dessert',
      smart_code: 'HERA.REST.MENU.ITEM.DESSERT.v1',
      metadata: {
        price: 9.00,
        cost: 2.10,
        prep_time: 2,
        station: 'dessert',
        allergens: ['dairy', 'eggs', 'gluten'],
        calories: 420
      },
      status: 'active'
    }
  ];

  const { data, error } = await supabase
    .from('core_entities')
    .insert(menuItems)
    .select();

  if (error) {
    console.error('Error creating menu items:', error);
    return null;
  }

  console.log('✅ Menu items created:');
  data.forEach(item => {
    console.log(`   - ${item.entity_name} (${item.entity_code})`);
  });

  return data;
}

async function createKitchenOrders(orgId, menuItems) {
  console.log('\n📝 Creating Kitchen Orders as Transactions...\n');
  
  const orders = [
    {
      organization_id: orgId,
      transaction_type: 'kitchen_order',
      transaction_code: 'ORD-' + Date.now() + '-001',
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.REST.ORDER.DINE_IN.v1',
      total_amount: 33.00,
      status: 'preparing',
      workflow_state: 'acknowledged',
      metadata: {
        order_type: 'dine-in',
        table_number: '12',
        server: 'Sarah',
        priority: 'normal',
        customer_count: 2,
        created_at: new Date(Date.now() - 10 * 60000).toISOString(),
        target_time: new Date(Date.now() + 10 * 60000).toISOString()
      }
    },
    {
      organization_id: orgId,
      transaction_type: 'kitchen_order',
      transaction_code: 'ORD-' + Date.now() + '-002',
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.REST.ORDER.TAKEOUT.v1',
      total_amount: 25.00,
      status: 'new',
      workflow_state: 'pending',
      metadata: {
        order_type: 'takeout',
        customer_name: 'John Smith',
        customer_phone: '555-0123',
        priority: 'rush',
        pickup_time: new Date(Date.now() + 20 * 60000).toISOString(),
        created_at: new Date(Date.now() - 5 * 60000).toISOString(),
        target_time: new Date(Date.now() + 15 * 60000).toISOString()
      }
    },
    {
      organization_id: orgId,
      transaction_type: 'kitchen_order',
      transaction_code: 'ORD-' + Date.now() + '-003',
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.REST.ORDER.DELIVERY.v1',
      total_amount: 34.00,
      status: 'new',
      workflow_state: 'pending',
      metadata: {
        order_type: 'delivery',
        customer_name: 'Lisa Wang',
        customer_phone: '555-0456',
        delivery_address: '123 Main St, Apt 4B',
        priority: 'vip',
        delivery_time: new Date(Date.now() + 30 * 60000).toISOString(),
        created_at: new Date(Date.now() - 2 * 60000).toISOString(),
        target_time: new Date(Date.now() + 25 * 60000).toISOString(),
        notes: 'VIP customer - Extra care'
      }
    }
  ];

  const { data, error } = await supabase
    .from('universal_transactions')
    .insert(orders)
    .select();

  if (error) {
    console.error('Error creating orders:', error);
    return null;
  }

  console.log('✅ Kitchen orders created:');
  data.forEach(order => {
    console.log(`   - ${order.transaction_code} (${order.metadata?.order_type})`);
  });

  return data;
}

async function createOrderLineItems(orgId, orders, menuItems) {
  console.log('\n🍴 Creating Order Line Items...\n');
  
  // Map menu items for easy lookup
  const menuMap = {};
  menuItems.forEach(item => {
    menuMap[item.entity_name] = item.id;
  });

  const lineItems = [
    // Order 1 - Dine in (Table 12)
    {
      transaction_id: orders[0].id,
      organization_id: orgId,
      line_entity_id: menuMap['Grilled Salmon'],
      line_description: 'Grilled Salmon - No butter',
      line_order: 1,
      quantity: 2,
      unit_price: 24.00,
      line_amount: 48.00,
      smart_code: 'HERA.REST.ORDER.LINE.MAIN.v1',
      metadata: {
        modifiers: ['No butter'],
        station: 'grill',
        prep_time: 12,
        status: 'preparing',
        started_at: new Date(Date.now() - 5 * 60000).toISOString()
      }
    },
    {
      transaction_id: orders[0].id,
      organization_id: orgId,
      line_entity_id: menuMap['Caesar Salad'],
      line_description: 'Caesar Salad - Extra dressing',
      line_order: 2,
      quantity: 2,
      unit_price: 9.00,
      line_amount: 18.00,
      smart_code: 'HERA.REST.ORDER.LINE.APPETIZER.v1',
      metadata: {
        modifiers: ['Extra dressing'],
        station: 'salad',
        prep_time: 5,
        status: 'ready',
        completed_at: new Date(Date.now() - 2 * 60000).toISOString()
      }
    },
    // Order 2 - Takeout
    {
      transaction_id: orders[1].id,
      organization_id: orgId,
      line_entity_id: menuMap['Truffle Pasta'],
      line_description: 'Truffle Pasta - Extra truffle oil',
      line_order: 1,
      quantity: 1,
      unit_price: 25.00,
      line_amount: 25.00,
      smart_code: 'HERA.REST.ORDER.LINE.MAIN.v1',
      metadata: {
        special_instructions: 'Extra truffle oil',
        station: 'grill',
        prep_time: 15,
        status: 'pending'
      }
    },
    // Order 3 - Delivery (VIP)
    {
      transaction_id: orders[2].id,
      organization_id: orgId,
      line_entity_id: menuMap['Truffle Pasta'],
      line_description: 'Truffle Pasta',
      line_order: 1,
      quantity: 1,
      unit_price: 25.00,
      line_amount: 25.00,
      smart_code: 'HERA.REST.ORDER.LINE.MAIN.v1',
      metadata: {
        station: 'grill',
        prep_time: 15,
        status: 'pending',
        allergen_alert: true
      }
    },
    {
      transaction_id: orders[2].id,
      organization_id: orgId,
      line_entity_id: menuMap['Chocolate Lava Cake'],
      line_description: 'Chocolate Lava Cake',
      line_order: 2,
      quantity: 1,
      unit_price: 9.00,
      line_amount: 9.00,
      smart_code: 'HERA.REST.ORDER.LINE.DESSERT.v1',
      metadata: {
        station: 'dessert',
        prep_time: 2,
        status: 'pending'
      }
    }
  ];

  const { data, error } = await supabase
    .from('universal_transaction_lines')
    .insert(lineItems)
    .select();

  if (error) {
    console.error('Error creating line items:', error);
    return null;
  }

  console.log('✅ Order line items created:');
  data.forEach(item => {
    console.log(`   - ${item.line_description} (Qty: ${item.quantity})`);
  });

  return data;
}

async function createStatusWorkflow(orgId) {
  console.log('\n🔄 Creating Status Workflow Entities...\n');
  
  // Create status entities (following HERA pattern - no status columns!)
  const statuses = [
    { code: 'NEW', name: 'New Order', color: 'blue', order: 1 },
    { code: 'ACKNOWLEDGED', name: 'Acknowledged', color: 'yellow', order: 2 },
    { code: 'PREPARING', name: 'Preparing', color: 'orange', order: 3 },
    { code: 'READY', name: 'Ready for Service', color: 'green', order: 4 },
    { code: 'SERVED', name: 'Served', color: 'purple', order: 5 },
    { code: 'COMPLETED', name: 'Completed', color: 'gray', order: 6 }
  ];

  const statusEntities = statuses.map(status => ({
    organization_id: orgId,
    entity_type: 'order_status',
    entity_name: status.name,
    entity_code: `STATUS-${status.code}`,
    smart_code: `HERA.REST.STATUS.${status.code}.v1`,
    metadata: {
      color: status.color,
      display_order: status.order,
      is_terminal: status.code === 'COMPLETED'
    },
    status: 'active'
  }));

  const { data, error } = await supabase
    .from('core_entities')
    .insert(statusEntities)
    .select();

  if (error) {
    console.error('Error creating status entities:', error);
    return null;
  }

  console.log('✅ Status workflow entities created:');
  data.forEach(status => {
    console.log(`   - ${status.entity_name} (${status.entity_code})`);
  });

  return data;
}

async function assignOrderStatuses(orgId, orders, statusEntities) {
  console.log('\n🔗 Assigning Order Statuses via Relationships...\n');
  
  // Map statuses for easy lookup
  const statusMap = {};
  statusEntities.forEach(status => {
    const code = status.entity_code.replace('STATUS-', '');
    statusMap[code] = status.id;
  });

  // Create relationships between orders and their current status
  const relationships = [
    {
      organization_id: orgId,
      from_entity_id: orders[0].id, // Order 1
      to_entity_id: statusMap['PREPARING'],
      relationship_type: 'has_status',
      smart_code: 'HERA.REST.WORKFLOW.STATUS.ASSIGN.v1',
      metadata: {
        assigned_at: new Date(Date.now() - 8 * 60000).toISOString(),
        assigned_by: 'system'
      }
    },
    {
      organization_id: orgId,
      from_entity_id: orders[1].id, // Order 2
      to_entity_id: statusMap['ACKNOWLEDGED'],
      relationship_type: 'has_status',
      smart_code: 'HERA.REST.WORKFLOW.STATUS.ASSIGN.v1',
      metadata: {
        assigned_at: new Date(Date.now() - 4 * 60000).toISOString(),
        assigned_by: 'system'
      }
    },
    {
      organization_id: orgId,
      from_entity_id: orders[2].id, // Order 3
      to_entity_id: statusMap['NEW'],
      relationship_type: 'has_status',
      smart_code: 'HERA.REST.WORKFLOW.STATUS.ASSIGN.v1',
      metadata: {
        assigned_at: new Date(Date.now() - 2 * 60000).toISOString(),
        assigned_by: 'system',
        notes: 'VIP order - priority handling'
      }
    }
  ];

  const { data, error } = await supabase
    .from('core_relationships')
    .insert(relationships)
    .select();

  if (error) {
    console.error('Error creating status relationships:', error);
    return null;
  }

  console.log('✅ Order status relationships created:');
  data.forEach(rel => {
    console.log(`   - Order linked to status`);
  });

  return data;
}

async function verifyData(orgId) {
  console.log('\n✅ Verifying All Data...\n');
  
  // Count records in each table
  const tables = [
    'core_organizations',
    'core_entities',
    'universal_transactions',
    'universal_transaction_lines',
    'core_relationships'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (!error) {
      console.log(`   ${table}: ${count || 0} records`);
    }
  }

  // Get a sample order with its status
  console.log('\n📋 Sample Order with Status (via relationships):');
  
  const { data: orderWithStatus, error: queryError } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      status_relationship:core_relationships!from_entity_id(
        to_entity:core_entities!to_entity_id(
          entity_name,
          entity_code,
          metadata
        )
      )
    `)
    .eq('organization_id', orgId)
    .limit(1)
    .single();

  if (!queryError && orderWithStatus) {
    console.log(`\n   Order: ${orderWithStatus.transaction_code}`);
    console.log(`   Type: ${orderWithStatus.metadata?.order_type}`);
    console.log(`   Amount: $${orderWithStatus.total_amount}`);
    
    if (orderWithStatus.status_relationship?.[0]?.to_entity) {
      console.log(`   Current Status: ${orderWithStatus.status_relationship[0].to_entity.entity_name}`);
    }
  }
}

async function runCompleteTest() {
  console.log('====================================');
  console.log('🍽️  HERA KITCHEN DISPLAY SYSTEM TEST');
  console.log('====================================');
  console.log('\nThis will create real data in the database for testing.');
  console.log('Using HERA\'s universal 6-table architecture.\n');

  try {
    // 1. Create Organization
    const orgId = await setupRestaurantOrganization();
    if (!orgId) {
      console.error('Failed to create organization. Exiting.');
      return;
    }

    // 2. Create Menu Items
    const menuItems = await createMenuItems(orgId);
    if (!menuItems) {
      console.error('Failed to create menu items. Exiting.');
      return;
    }

    // 3. Create Kitchen Orders
    const orders = await createKitchenOrders(orgId, menuItems);
    if (!orders) {
      console.error('Failed to create orders. Exiting.');
      return;
    }

    // 4. Create Order Line Items
    const lineItems = await createOrderLineItems(orgId, orders, menuItems);
    if (!lineItems) {
      console.error('Failed to create line items. Exiting.');
      return;
    }

    // 5. Create Status Workflow
    const statusEntities = await createStatusWorkflow(orgId);
    if (!statusEntities) {
      console.error('Failed to create status workflow. Exiting.');
      return;
    }

    // 6. Assign Statuses to Orders
    const relationships = await assignOrderStatuses(orgId, orders, statusEntities);
    if (!relationships) {
      console.error('Failed to assign statuses. Exiting.');
      return;
    }

    // 7. Verify Everything
    await verifyData(orgId);

    console.log('\n====================================');
    console.log('✅ TEST COMPLETE!');
    console.log('====================================');
    console.log(`\nOrganization ID: ${orgId}`);
    console.log('\nYou can now:');
    console.log('1. Use this organization ID in the Kitchen Display System');
    console.log('2. View the orders in the production KDS component');
    console.log('3. Update order statuses and see real-time changes');
    console.log('\nAll data follows HERA\'s universal architecture:');
    console.log('- Menu items → core_entities');
    console.log('- Orders → universal_transactions');
    console.log('- Order items → universal_transaction_lines');
    console.log('- Status workflow → core_relationships (no status columns!)');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
runCompleteTest();