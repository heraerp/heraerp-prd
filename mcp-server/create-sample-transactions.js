#!/usr/bin/env node

/**
 * Create sample transactions for today to show in dashboard
 */

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function createSampleTransactions() {
  try {
    console.log('Creating sample transactions for today...');

    // Get a salon location (or create one)
    const { data: salons } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'location')
      .limit(1);
    
    const salon = salons?.[0];

    // Get some customers
    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'customer')
      .limit(5);

    // Get services (they are stored as entity_type='product' with service smart codes)
    const { data: services } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')
      .limit(10);

    console.log('Found entities:', {
      salon: salon?.entity_name || 'None',
      customers: customers?.length || 0,
      services: services?.length || 0
    });

    if (!salon || !customers?.length || !services?.length) {
      console.error('Missing required entities');
      return;
    }

    // Create transactions for today
    const today = new Date();
    const transactions = [];

    for (let i = 0; i < 5; i++) {
      const customer = customers[i % customers.length];
      const service = services[i % services.length];
      const amount = [85, 185, 285, 325, 55][i % 5]; // Service prices

      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_type: 'sale',
          transaction_code: `SALE-${Date.now()}-${i}`,
          transaction_date: today.toISOString(),
          source_entity_id: customer.id,
          target_entity_id: salon.id,
          total_amount: amount,
          smart_code: 'HERA.SALON.POS.TXN.SERVICE.v1',
          metadata: {
            service_name: service.entity_name,
            customer_name: customer.entity_name,
            payment_method: 'card'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Transaction error:', error);
      } else {
        transactions.push(transaction);
        console.log(`✅ Created transaction for ${customer.entity_name}: $${amount}`);

        // Create transaction line
        await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: ORGANIZATION_ID,
            transaction_id: transaction.id,
            line_number: 1,
            line_type: 'service',
            entity_id: service.id,
            description: service.entity_name,
            quantity: 1,
            unit_amount: amount,
            line_amount: amount,
            smart_code: 'HERA.SALON.POS.LINE.SERVICE.v1'
          });
      }
    }

    // Create transactions for past 6 days
    for (let day = 1; day <= 6; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      const dailyCount = Math.floor(Math.random() * 5) + 3; // 3-7 transactions per day
      
      for (let i = 0; i < dailyCount; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const service = services[Math.floor(Math.random() * services.length)];
        const amount = [85, 185, 285, 325, 55][Math.floor(Math.random() * 5)];

        const { data: transaction, error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: ORGANIZATION_ID,
            transaction_type: 'sale',
            transaction_code: `SALE-${Date.now()}-${day}-${i}`,
            transaction_date: date.toISOString(),
            source_entity_id: customer.id,
            target_entity_id: salon.id,
            total_amount: amount,
            smart_code: 'HERA.SALON.POS.TXN.SERVICE.v1',
            metadata: {
              service_name: service.entity_name,
              customer_name: customer.entity_name,
              payment_method: Math.random() > 0.3 ? 'card' : 'cash'
            }
          })
          .select()
          .single();

        if (!error) {
          await supabase
            .from('universal_transaction_lines')
            .insert({
              organization_id: ORGANIZATION_ID,
              transaction_id: transaction.id,
              line_number: 1,
              line_type: 'service',
              entity_id: service.id,
              description: service.entity_name,
              quantity: 1,
              unit_amount: amount,
              line_amount: amount,
              smart_code: 'HERA.SALON.POS.LINE.SERVICE.v1'
            });
        }
      }
      
      console.log(`✅ Created ${dailyCount} transactions for ${date.toDateString()}`);
    }

    console.log('✅ Sample transactions created successfully!');
  } catch (error) {
    console.error('Error creating sample transactions:', error);
  }
}

createSampleTransactions();