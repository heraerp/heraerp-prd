#!/usr/bin/env node

// Create test transactions with service metadata
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

async function createServiceTransactions() {
  console.log('💇 Creating service-specific transactions...\n');
  
  // Service types with realistic pricing
  const services = [
    { name: 'haircut', price_range: [45, 85], count: 15 },
    { name: 'color', price_range: [120, 250], count: 8 },
    { name: 'highlights', price_range: [150, 300], count: 5 },
    { name: 'treatment', price_range: [80, 150], count: 10 },
    { name: 'blowdry', price_range: [35, 60], count: 20 },
    { name: 'facial', price_range: [90, 180], count: 6 },
    { name: 'manicure', price_range: [40, 80], count: 12 },
    { name: 'pedicure', price_range: [50, 90], count: 8 }
  ];
  
  // Get some customers
  const { data: customers } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'customer')
    .limit(10);
    
  if (!customers || customers.length === 0) {
    console.log('❌ No customers found. Please run create-analytics-test-data.js first');
    return;
  }
  
  let totalCreated = 0;
  let totalRevenue = 0;
  
  // Create transactions for each service type
  for (const service of services) {
    console.log(`\n📝 Creating ${service.count} ${service.name} transactions...`);
    
    for (let i = 0; i < service.count; i++) {
      const transactionDate = new Date();
      // Spread transactions over the last 30 days
      transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 30));
      
      const amount = Math.floor(
        Math.random() * (service.price_range[1] - service.price_range[0]) + 
        service.price_range[0]
      );
      
      try {
        const { error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: TEST_ORG_ID,
            transaction_type: 'sale',
            transaction_code: `SALE-${service.name.toUpperCase()}-${Date.now()}-${i}`,
            smart_code: 'HERA.SALON.SALE.TRANSACTION.v1',
            transaction_date: transactionDate.toISOString(),
            source_entity_id: customers[Math.floor(Math.random() * customers.length)].id,
            total_amount: amount,
            transaction_status: 'completed',
            metadata: {
              service_name: service.name,
              service_category: getServiceCategory(service.name),
              payment_method: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)],
              channel: 'in-store',
              staff_name: ['Sarah', 'Maria', 'Jessica', 'Amanda'][Math.floor(Math.random() * 4)]
            }
          });
          
        if (!error) {
          totalCreated++;
          totalRevenue += amount;
        } else {
          console.error(`Error creating ${service.name} transaction:`, error.message);
        }
      } catch (error) {
        console.error('Transaction error:', error.message);
      }
    }
  }
  
  // Summary
  console.log('\n📊 Transaction Summary:');
  console.log(`  • Total transactions created: ${totalCreated}`);
  console.log(`  • Total revenue generated: $${totalRevenue.toLocaleString()}`);
  console.log(`  • Average transaction: $${Math.floor(totalRevenue / totalCreated)}`);
  
  // Show revenue by service
  const { data: summary } = await supabase
    .from('universal_transactions')
    .select('metadata, total_amount')
    .eq('organization_id', TEST_ORG_ID)
    .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
  if (summary) {
    const byService = {};
    summary.forEach(t => {
      const service = t.metadata?.service_name || 'other';
      if (!byService[service]) {
        byService[service] = { count: 0, total: 0 };
      }
      byService[service].count++;
      byService[service].total += t.total_amount || 0;
    });
    
    console.log('\n💰 Revenue by Service (Last 30 Days):');
    Object.entries(byService)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([service, stats]) => {
        console.log(`  • ${service}: $${stats.total.toLocaleString()} (${stats.count} transactions)`);
      });
  }
  
  console.log('\n✨ Service transaction setup complete!\n');
}

function getServiceCategory(serviceName) {
  const categories = {
    haircut: 'hair',
    color: 'hair',
    highlights: 'hair',
    treatment: 'hair',
    blowdry: 'hair',
    facial: 'beauty',
    manicure: 'nails',
    pedicure: 'nails'
  };
  return categories[serviceName] || 'other';
}

// Run setup
createServiceTransactions().catch(console.error);