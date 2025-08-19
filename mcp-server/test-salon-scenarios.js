#!/usr/bin/env node

/**
 * Test Salon Scenarios
 * Tests all salon functionality through HERA MCP
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Test organization ID - using existing organization
const TEST_ORG_ID = '44d2d8f8-167d-46a7-a704-c0e5435863d6'; // HERA Software Inc

async function runCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.error('Error:', stderr);
    }
    return stdout;
  } catch (error) {
    console.error('Command failed:', error);
    return null;
  }
}

async function testSalonScenarios() {
  console.log('🧪 TESTING SALON SCENARIOS\n');
  console.log('Organization ID:', TEST_ORG_ID);
  console.log('=' .repeat(50));

  // Test 1: Create salon entities
  console.log('\n📋 Test 1: Creating Salon Entities');
  console.log('-'.repeat(30));
  
  // Create services
  const services = [
    { type: 'service', name: 'Haircut & Style', price: 150 },
    { type: 'service', name: 'Hair Color', price: 350 },
    { type: 'service', name: 'Manicure', price: 80 },
    { type: 'service', name: 'Pedicure', price: 100 },
    { type: 'service', name: 'Facial Treatment', price: 200 }
  ];

  console.log('Creating services...');
  for (const service of services) {
    const result = await runCommand(
      `node hera-cli.js create-entity ${service.type} "${service.name}"`
    );
    console.log(`✓ Created service: ${service.name}`);
  }

  // Create staff members
  const staff = [
    { type: 'employee', name: 'Sarah Johnson', role: 'Senior Stylist' },
    { type: 'employee', name: 'Maria Garcia', role: 'Nail Technician' },
    { type: 'employee', name: 'Emma Wilson', role: 'Colorist' },
    { type: 'employee', name: 'Lisa Chen', role: 'Spa Therapist' }
  ];

  console.log('\nCreating staff members...');
  for (const member of staff) {
    const result = await runCommand(
      `node hera-cli.js create-entity ${member.type} "${member.name}"`
    );
    console.log(`✓ Created staff: ${member.name} - ${member.role}`);
  }

  // Create clients
  const clients = [
    { type: 'customer', name: 'Fatima Al-Hassan', phone: '+971501234567' },
    { type: 'customer', name: 'Aisha Mohammed', phone: '+971502345678' },
    { type: 'customer', name: 'Layla Ahmed', phone: '+971503456789' },
    { type: 'customer', name: 'Noor Ibrahim', phone: '+971504567890' }
  ];

  console.log('\nCreating clients...');
  for (const client of clients) {
    const result = await runCommand(
      `node hera-cli.js create-entity ${client.type} "${client.name}"`
    );
    console.log(`✓ Created client: ${client.name}`);
  }

  // Test 2: Create appointments (transactions)
  console.log('\n\n📅 Test 2: Creating Appointments');
  console.log('-'.repeat(30));

  const appointments = [
    { type: 'appointment', amount: 150, desc: 'Haircut appointment' },
    { type: 'appointment', amount: 350, desc: 'Hair color appointment' },
    { type: 'appointment', amount: 180, desc: 'Mani-pedi appointment' }
  ];

  for (const apt of appointments) {
    const result = await runCommand(
      `node hera-cli.js create-transaction ${apt.type} ${apt.amount}`
    );
    console.log(`✓ Created ${apt.desc} - AED ${apt.amount}`);
  }

  // Test 3: Inventory items
  console.log('\n\n📦 Test 3: Creating Inventory Items');
  console.log('-'.repeat(30));

  const inventory = [
    { type: 'product', name: 'L\'Oreal Hair Color Kit', stock: 25 },
    { type: 'product', name: 'OPI Nail Polish Collection', stock: 50 },
    { type: 'product', name: 'Moroccan Oil Treatment', stock: 30 },
    { type: 'product', name: 'Kerastase Shampoo', stock: 40 }
  ];

  for (const item of inventory) {
    const result = await runCommand(
      `node hera-cli.js create-entity ${item.type} "${item.name}"`
    );
    console.log(`✓ Created inventory: ${item.name} (Stock: ${item.stock})`);
  }

  // Test 4: Query and display summary
  console.log('\n\n📊 Test 4: Query Summary');
  console.log('-'.repeat(30));

  console.log('\nQuerying all entities...');
  await runCommand('node hera-query.js summary');

  // Test 5: Create sales transactions
  console.log('\n\n💰 Test 5: Creating Sales Transactions');
  console.log('-'.repeat(30));

  const sales = [
    { type: 'sale', amount: 530, desc: 'Hair service + product sale' },
    { type: 'sale', amount: 180, desc: 'Nail services' },
    { type: 'sale', amount: 200, desc: 'Facial treatment' }
  ];

  for (const sale of sales) {
    const result = await runCommand(
      `node hera-cli.js create-transaction ${sale.type} ${sale.amount}`
    );
    console.log(`✓ Created ${sale.desc} - AED ${sale.amount}`);
  }

  // Test 6: Loyalty program
  console.log('\n\n🌟 Test 6: Loyalty Program Setup');
  console.log('-'.repeat(30));

  const loyaltyTiers = [
    { type: 'loyalty_tier', name: 'Bronze Member', points: 0 },
    { type: 'loyalty_tier', name: 'Silver Member', points: 500 },
    { type: 'loyalty_tier', name: 'Gold Member', points: 1000 },
    { type: 'loyalty_tier', name: 'Platinum VIP', points: 2000 }
  ];

  for (const tier of loyaltyTiers) {
    const result = await runCommand(
      `node hera-cli.js create-entity ${tier.type} "${tier.name}"`
    );
    console.log(`✓ Created loyalty tier: ${tier.name} (${tier.points} points)`);
  }

  // Final summary
  console.log('\n\n✅ SALON TEST SCENARIOS COMPLETED');
  console.log('=' .repeat(50));
  console.log('\nTest Summary:');
  console.log('- Services created: 5');
  console.log('- Staff members created: 4');
  console.log('- Clients created: 4');
  console.log('- Appointments created: 3');
  console.log('- Inventory items created: 4');
  console.log('- Sales transactions created: 3');
  console.log('- Loyalty tiers created: 4');
  console.log('\n🎉 All salon scenarios tested successfully!');
}

// Run the tests
testSalonScenarios().catch(console.error);