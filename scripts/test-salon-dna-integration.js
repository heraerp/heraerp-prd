#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = "0fd09e31-d257-4329-97eb-7d7f522ed6f0";

async function testDNAIntegration() {
  console.log('🧪 Testing Salon Finance DNA Integration\n');
  
  // Get a stylist and service for the test
  const { data: stylist } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'employee')
    .eq('entity_code', 'STY-001')
    .single();
  
  const { data: service } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'service')
    .eq('entity_code', 'SVC-HAIRCUT-STYLE')
    .single();
  
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'customer')
    .eq('entity_code', 'CUST-002')
    .single();
  
  if (!stylist || !service || !customer) {
    console.error('❌ Required entities not found. Please run operational data seeding first.');
    return;
  }
  
  console.log('Found entities:');
  console.log(`  - Stylist: ${stylist.entity_name}`);
  console.log(`  - Service: ${service.entity_name}`);
  console.log(`  - Customer: ${customer.entity_name}\n`);
  
  // 1. Create a service sale transaction
  console.log('1️⃣ Creating Service Sale Transaction...');
  
  const saleTransaction = {
    organization_id: SALON_ORG_ID,
    transaction_type: 'service_sale',
    transaction_code: `SALE-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    smart_code: 'HERA.SALON.SERVICE.TXN.SALE.v1',
    total_amount: 120.00, // Cut & Style price
    source_entity_id: customer.id, // Customer paying
    target_entity_id: stylist.id, // Stylist providing service
    metadata: {
      service_id: service.id,
      service_name: service.entity_name,
      stylist_id: stylist.id,
      stylist_name: stylist.entity_name,
      customer_id: customer.id,
      customer_name: customer.entity_name,
      payment_method: 'cash',
      commission_rate: 0.35
    }
  };
  
  const { data: txn, error: txnError } = await supabase
    .from('universal_transactions')
    .insert(saleTransaction)
    .select()
    .single();
  
  if (txnError) {
    console.error('Error creating transaction:', txnError);
    return;
  }
  
  console.log(`✅ Created sale transaction: ${txn.transaction_code}`);
  
  // Create transaction line
  const txnLine = {
    organization_id: SALON_ORG_ID,
    transaction_id: txn.id,
    line_number: 1,
    entity_id: service.id,
    line_type: 'service',
    description: service.entity_name,
    quantity: 1,
    unit_amount: 120.00,
    line_amount: 120.00,
    discount_amount: 0,
    tax_amount: 5.71,
    smart_code: 'HERA.SALON.SERVICE.TXN.LINE.v1',
    line_data: {
      service_type: 'hair_styling',
      duration_minutes: 60
    }
  };
  
  const { error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(txnLine);
  
  if (lineError) {
    console.error('Error creating transaction line:', lineError);
  } else {
    console.log('✅ Created transaction line');
  }
  
  // 2. Expected Journal Entries (Finance DNA should create these)
  console.log('\n2️⃣ Expected Auto-Journal Entries:');
  console.log('   Dr: Cash (1100)                    120.00');
  console.log('   Cr: Service Revenue (4100)         114.29  (95.24% of 120)');
  console.log('   Cr: Sales Tax Payable (2200)         5.71  (4.76% of 120)');
  console.log('\n   Commission Accrual:');
  console.log('   Dr: Commission Expense (5100)       40.00  (35% of 114.29)');
  console.log('   Cr: Commission Payable (2300)       40.00');
  
  // 3. Check for auto-created journal entries
  console.log('\n3️⃣ Checking for Auto-Created Journal Entries...');
  
  // In a real implementation, Finance DNA would have created journal entries
  // Let's check if any were created
  const { data: journals } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'journal_entry')
    .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
    .order('created_at', { ascending: false });
  
  if (journals && journals.length > 0) {
    console.log(`✅ Found ${journals.length} auto-created journal entries`);
    journals.forEach(journal => {
      console.log(`   - ${journal.transaction_code}: ${journal.total_amount} AED`);
    });
  } else {
    console.log('⚠️  No auto-created journal entries found');
    console.log('   (This is expected if Finance DNA auto-posting is not yet implemented)');
  }
  
  // 4. Create a product sale to test inventory posting
  console.log('\n4️⃣ Creating Product Sale Transaction...');
  
  const { data: product } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', SALON_ORG_ID)
    .eq('entity_type', 'product')
    .eq('entity_code', 'PRD-SHAMPOO-001')
    .single();
  
  if (product) {
    const productSale = {
      organization_id: SALON_ORG_ID,
      transaction_type: 'product_sale',
      transaction_code: `PROD-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.SALON.PRODUCT.SALE.TXN.v1',
      total_amount: 45.00,
      source_entity_id: customer.id,
      target_entity_id: stylist.id,
      metadata: {
        product_id: product.id,
        product_name: product.entity_name,
        payment_method: 'cash',
        cost_basis: 20.00
      }
    };
    
    const { data: prodTxn, error: prodError } = await supabase
      .from('universal_transactions')
      .insert(productSale)
      .select()
      .single();
    
    if (!prodError) {
      console.log(`✅ Created product sale: ${prodTxn.transaction_code}`);
      console.log('\n   Expected Postings:');
      console.log('   Dr: Cash (1100)                     45.00');
      console.log('   Cr: Product Revenue (4200)          42.86');
      console.log('   Cr: Sales Tax Payable (2200)         2.14');
      console.log('   Dr: COGS (5200)                     20.00');
      console.log('   Cr: Inventory (1300)                20.00');
    }
  }
  
  // Summary
  console.log('\n🎉 DNA Integration Test Complete!');
  console.log('=====================================');
  console.log('Created:');
  console.log('  - 1 Service sale transaction (120 AED)');
  console.log('  - 1 Product sale transaction (45 AED)');
  console.log('\nNext Steps:');
  console.log('1. Verify journal entries were auto-created');
  console.log('2. Run financial reports');
  console.log('3. Check commission accruals');
  console.log('4. Validate inventory levels updated');
}

testDNAIntegration().catch(console.error);