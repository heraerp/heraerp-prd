#!/usr/bin/env node

/**
 * Test Kitchen Display System using MCP approach
 * This creates test data for the KDS using HERA's universal architecture
 */

console.log('====================================');
console.log('🍽️  KITCHEN DISPLAY SYSTEM MCP TEST');
console.log('====================================');
console.log('\nThis test will create sample data for the Kitchen Display System');
console.log('using HERA\'s universal 6-table architecture.\n');

// Test data configuration
const testConfig = {
  organizationName: "Mario's Test Kitchen",
  organizationCode: 'MARIO-KDS-' + Date.now(),
  
  menuItems: [
    {
      name: 'Grilled Salmon',
      code: 'SALMON-001',
      price: 24.00,
      cost: 5.31,
      station: 'grill',
      prepTime: 12,
      category: 'main'
    },
    {
      name: 'Caesar Salad', 
      code: 'CAESAR-001',
      price: 9.00,
      cost: 2.00,
      station: 'salad',
      prepTime: 5,
      category: 'appetizer'
    },
    {
      name: 'Truffle Pasta',
      code: 'PASTA-001',
      price: 25.00,
      cost: 3.23,
      station: 'grill',
      prepTime: 15,
      category: 'main'
    },
    {
      name: 'Chocolate Lava Cake',
      code: 'CHOCO-001',
      price: 9.00,
      cost: 2.10,
      station: 'dessert',
      prepTime: 2,
      category: 'dessert'
    },
    {
      name: 'House Wine',
      code: 'WINE-001',
      price: 8.00,
      cost: 1.50,
      station: 'beverage',
      prepTime: 1,
      category: 'beverage'
    }
  ],
  
  orderStatuses: [
    { name: 'New Order', code: 'NEW', color: 'blue' },
    { name: 'Acknowledged', code: 'ACK', color: 'yellow' },
    { name: 'Preparing', code: 'PREP', color: 'orange' },
    { name: 'Ready', code: 'READY', color: 'green' },
    { name: 'Served', code: 'SERVED', color: 'purple' },
    { name: 'Completed', code: 'DONE', color: 'gray' }
  ],
  
  sampleOrders: [
    {
      type: 'dine-in',
      table: '12',
      server: 'Sarah',
      items: [
        { item: 'Grilled Salmon', qty: 2, mods: ['No butter'] },
        { item: 'Caesar Salad', qty: 2, mods: ['Extra dressing'] }
      ],
      status: 'PREP',
      priority: 'normal'
    },
    {
      type: 'takeout',
      customer: 'John Smith',
      phone: '555-0123',
      items: [
        { item: 'Truffle Pasta', qty: 1, mods: ['Extra truffle'] },
        { item: 'House Wine', qty: 2, mods: [] }
      ],
      status: 'ACK',
      priority: 'rush'
    },
    {
      type: 'delivery',
      customer: 'Lisa Wang',
      phone: '555-0456',
      address: '123 Main St',
      items: [
        { item: 'Truffle Pasta', qty: 1, mods: [] },
        { item: 'Chocolate Lava Cake', qty: 1, mods: [] }
      ],
      status: 'NEW',
      priority: 'vip'
    }
  ]
};

// Display test configuration
console.log('📋 Test Configuration:');
console.log(`   Organization: ${testConfig.organizationName}`);
console.log(`   Menu Items: ${testConfig.menuItems.length}`);
console.log(`   Order Statuses: ${testConfig.orderStatuses.length}`);
console.log(`   Sample Orders: ${testConfig.sampleOrders.length}`);

console.log('\n📝 Data Structure:');
console.log('   - Menu items → core_entities (entity_type: "menu_item")');
console.log('   - Order statuses → core_entities (entity_type: "order_status")');
console.log('   - Orders → universal_transactions (transaction_type: "kitchen_order")');
console.log('   - Order items → universal_transaction_lines');
console.log('   - Status assignments → core_relationships (relationship_type: "has_status")');
console.log('   - Menu properties → core_dynamic_data');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('   1. NO STATUS COLUMNS - All statuses use relationships');
console.log('   2. Organization ID required for all records');
console.log('   3. Smart codes provide business intelligence');
console.log('   4. All data follows HERA\'s 6-table architecture');

console.log('\n🚀 Next Steps:');
console.log('   1. Set up your .env file with Supabase credentials');
console.log('   2. Run: node hera-cli.js to test connection');
console.log('   3. Use the MCP tools to create the test data:');
console.log('      - hera-cli.js for creating entities and transactions');
console.log('      - hera-query.js for viewing data');
console.log('      - status-workflow-example.js for status patterns');
console.log('   4. View the Kitchen Display at /restaurant/kitchen');

console.log('\n📚 MCP Commands to Create Test Data:');
console.log('\n// Step 1: Check/create organization');
console.log('node hera-cli.js query core_organizations');
console.log('');
console.log('// Step 2: Create menu items');
testConfig.menuItems.forEach(item => {
  console.log(`node hera-cli.js create-entity menu_item "${item.name}"`);
});
console.log('');
console.log('// Step 3: Create status entities');
testConfig.orderStatuses.forEach(status => {
  console.log(`node hera-cli.js create-entity order_status "${status.name}"`);
});
console.log('');
console.log('// Step 4: Create orders');
testConfig.sampleOrders.forEach((order, i) => {
  const total = order.items.reduce((sum, item) => {
    const menuItem = testConfig.menuItems.find(m => m.name === item.item);
    return sum + (menuItem ? menuItem.price * item.qty : 0);
  }, 0);
  console.log(`node hera-cli.js create-transaction kitchen_order ${total}`);
});
console.log('');
console.log('// Step 5: View all data');
console.log('node hera-query.js summary');
console.log('node hera-query.js entities');
console.log('node hera-query.js transactions');
console.log('');
console.log('// Step 6: Test status workflow');
console.log('node status-workflow-example.js');

console.log('\n====================================');
console.log('✅ TEST CONFIGURATION COMPLETE');
console.log('====================================');
console.log('\nUse the commands above to create test data in your database.');
console.log('The Kitchen Display System will automatically display orders');
console.log('that match the organization_id and have transaction_type "kitchen_order".');

// Export configuration for use in other scripts
module.exports = testConfig;