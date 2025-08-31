#!/usr/bin/env node

// Create test data for Analytics MCP testing
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

async function createTestSmartCodes() {
  console.log('📝 Creating test smart codes for Analytics MCP...\n');
  
  // Smart code entities for testing
  const smartCodeEntities = [
    // Sales-related
    {
      entity_type: 'smart_code_registry',
      entity_name: 'Sales Transaction Smart Code',
      entity_code: 'SC-SALE-001',
      smart_code: 'HERA.SALON.SALE.TRANSACTION.v1',
      metadata: { description: 'Standard salon sale transaction' }
    },
    {
      entity_type: 'smart_code_registry',
      entity_name: 'Refund Smart Code',
      entity_code: 'SC-REFUND-001',
      smart_code: 'HERA.SALON.REFUND.ISSUED.v1',
      metadata: { description: 'Salon service refund' }
    },
    
    // Inventory-related
    {
      entity_type: 'smart_code_registry',
      entity_name: 'Inventory Adjustment',
      entity_code: 'SC-INV-ADJ-001',
      smart_code: 'HERA.SALON.INVENTORY.ADJUSTMENT.v1',
      metadata: { description: 'Inventory adjustment entry' }
    },
    {
      entity_type: 'smart_code_registry',
      entity_name: 'Inventory Write-off',
      entity_code: 'SC-INV-WO-001',
      smart_code: 'HERA.MFG.INVENTORY.WRITE_OFF.v1',
      metadata: { description: 'Inventory write-off for damaged goods' }
    },
    
    // GL-related
    {
      entity_type: 'smart_code_registry',
      entity_name: 'GL Journal Entry',
      entity_code: 'SC-GL-JE-001',
      smart_code: 'HERA.ACCOUNTING.GL.JOURNAL.v1',
      metadata: { description: 'General ledger journal entry' }
    },
    {
      entity_type: 'smart_code_registry',
      entity_name: 'GL Adjustment',
      entity_code: 'SC-GL-ADJ-001',
      smart_code: 'HERA.ACCOUNTING.GL.ADJUSTMENT.v1',
      metadata: { description: 'General ledger adjustment' }
    },
    {
      entity_type: 'smart_code_registry',
      entity_name: 'GL Line Item',
      entity_code: 'SC-GL-LINE-001',
      smart_code: 'HERA.ACCOUNTING.GL.LINE.v1',
      metadata: { description: 'GL journal line item' }
    }
  ];
  
  for (const entity of smartCodeEntities) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', TEST_ORG_ID)
        .eq('smart_code', entity.smart_code)
        .single();
        
      if (!existing) {
        const { error } = await supabase
          .from('core_entities')
          .insert({
            organization_id: TEST_ORG_ID,
            ...entity,
            status: 'active'
          });
          
        if (error) throw error;
        console.log(`✅ Created smart code: ${entity.smart_code}`);
      } else {
        console.log(`✓ Smart code exists: ${entity.smart_code}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${entity.smart_code}:`, error.message);
    }
  }
}

async function createTestRelationships() {
  console.log('\n🔗 Creating test relationships...\n');
  
  // Get some entities to create relationships between
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(3);
    
  const { data: staff } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'employee')
    .limit(3);
    
  const { data: services } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'salon_service')
    .limit(3);
    
  if (customers?.length && staff?.length && services?.length) {
    // Create customer -> staff relationships (preferred stylist)
    for (let i = 0; i < Math.min(customers.length, staff.length); i++) {
      try {
        const { error } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: TEST_ORG_ID,
            from_entity_id: customers[i].id,
            to_entity_id: staff[i].id,
            relationship_type: 'preferred_stylist',
            relationship_strength: 0.9,
            metadata: { 
              since: '2024-01-01',
              visits_together: Math.floor(Math.random() * 20) + 5
            }
          });
          
        if (!error) {
          console.log(`✅ Created relationship: ${customers[i].entity_name} -> ${staff[i].entity_name} (preferred_stylist)`);
        }
      } catch (error) {
        console.error('Relationship error:', error.message);
      }
    }
    
    // Create customer -> service relationships (favorite service)
    for (let i = 0; i < Math.min(customers.length, services.length); i++) {
      try {
        const { error } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: TEST_ORG_ID,
            from_entity_id: customers[i].id,
            to_entity_id: services[i].id,
            relationship_type: 'favorite_service',
            relationship_strength: 0.8,
            metadata: { 
              frequency: 'monthly',
              last_booking: '2025-08-15'
            }
          });
          
        if (!error) {
          console.log(`✅ Created relationship: ${customers[i].entity_name} -> ${services[i].entity_name} (favorite_service)`);
        }
      } catch (error) {
        console.error('Relationship error:', error.message);
      }
    }
  }
}

async function createSalesTransactions() {
  console.log('\n💰 Creating sales transactions with proper smart codes...\n');
  
  // Create some sale transactions with the new smart codes
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(5);
    
  if (customers?.length) {
    for (let i = 0; i < 5; i++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));
      
      try {
        const { error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: TEST_ORG_ID,
            transaction_type: 'sale',
            transaction_code: `SALE-TEST-${Date.now()}-${i}`,
            smart_code: 'HERA.SALON.SALE.TRANSACTION.v1',
            transaction_date: saleDate.toISOString(),
            source_entity_id: customers[i % customers.length].id,
            total_amount: Math.floor(Math.random() * 300) + 50,
            transaction_status: 'completed',
            metadata: {
              payment_method: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)],
              channel: 'in-store'
            }
          });
          
        if (!error) {
          console.log(`✅ Created sale transaction: ${saleDate.toLocaleDateString()}`);
        }
      } catch (error) {
        console.error('Transaction error:', error.message);
      }
    }
  }
}

async function runSetup() {
  console.log('\n🚀 Setting up Analytics MCP test data...\n');
  console.log(`Organization ID: ${TEST_ORG_ID}\n`);
  
  await createTestSmartCodes();
  await createTestRelationships();
  await createSalesTransactions();
  
  console.log('\n✨ Analytics test data setup complete!\n');
  
  // Summary
  const { count: smartCodes } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'smart_code_registry');
    
  const { count: relationships } = await supabase
    .from('core_relationships')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', TEST_ORG_ID);
    
  console.log('📊 Summary:');
  console.log(`  • Smart codes: ${smartCodes || 0}`);
  console.log(`  • Relationships: ${relationships || 0}`);
  console.log(`  • Ready for Analytics MCP testing!\n`);
}

// Run setup
runSetup().catch(console.error);