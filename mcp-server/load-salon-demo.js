#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DEMO_ORG_ID = '519d9c67-6fa4-4c73-9c56-6d132a6649c1';

async function loadSalonDemo() {
  console.log('🚀 Loading Salon ERP Demo Data...\n');
  
  try {
    // 1. Create Entities
    console.log('📦 Creating entities...');
    const entities = [
      { 
        entity_type: 'customer', 
        entity_name: 'Sarah Johnson', 
        entity_code: 'CUST-001',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.v1'
      },
      { 
        entity_type: 'stylist', 
        entity_name: 'Emma Wilson', 
        entity_code: 'STYLIST-001',
        smart_code: 'HERA.SALON.RESOURCE.STYLIST.v1'
      },
      { 
        entity_type: 'service', 
        entity_name: 'Premium Hair Color', 
        entity_code: 'SVC-COLOR-001',
        smart_code: 'HERA.SALON.SERVICE.SERVICE.v1'
      },
      { 
        entity_type: 'product', 
        entity_name: 'Professional Hair Color', 
        entity_code: 'PROD-COLOR-001',
        smart_code: 'HERA.SALON.INVENTORY.PRODUCT.v1'
      },
      { 
        entity_type: 'tax_profile', 
        entity_name: 'VAT 5%', 
        entity_code: 'TAX-VAT-5',
        smart_code: 'HERA.SALON.FINANCE.TAX_PROFILE.v1'
      },
      { 
        entity_type: 'asset', 
        entity_name: 'Styling Chair #1', 
        entity_code: 'ASSET-CHAIR-001',
        smart_code: 'HERA.SALON.ASSET.EQUIPMENT.v1'
      }
    ];

    const entityIds = {};
    
    for (const entity of entities) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: DEMO_ORG_ID,
          ...entity
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating ${entity.entity_type}:`, error.message);
      } else {
        entityIds[entity.entity_type] = data.id;
        console.log(`✅ Created ${entity.entity_type}: ${data.entity_name} (${data.id})`);
      }
    }

    // 2. Add Dynamic Data
    console.log('\n📝 Adding dynamic data...');
    const dynamicData = [
      { entity_id: entityIds.customer, field_name: 'phone', field_type: 'text', field_value_text: '+971555123456', smart_code: 'HERA.SALON.CRM.CUSTOMER.v1' },
      { entity_id: entityIds.customer, field_name: 'email', field_type: 'text', field_value_text: 'sarah.johnson@email.com', smart_code: 'HERA.SALON.CRM.CUSTOMER.v1' },
      { entity_id: entityIds.service, field_name: 'duration_minutes', field_type: 'number', field_value_number: 90, smart_code: 'HERA.SALON.SERVICE.SERVICE.v1' },
      { entity_id: entityIds.service, field_name: 'base_price', field_type: 'number', field_value_number: 250, smart_code: 'HERA.SALON.SERVICE.SERVICE.v1' },
      { entity_id: entityIds.product, field_name: 'cost_price', field_type: 'number', field_value_number: 20, smart_code: 'HERA.SALON.INVENTORY.PRODUCT.v1' },
      { entity_id: entityIds.tax_profile, field_name: 'tax_rate', field_type: 'number', field_value_number: 0.05, smart_code: 'HERA.SALON.FINANCE.TAX_PROFILE.v1' },
      { entity_id: entityIds.asset, field_name: 'purchase_price', field_type: 'number', field_value_number: 30000, smart_code: 'HERA.SALON.ASSET.EQUIPMENT.v1' },
      { entity_id: entityIds.asset, field_name: 'useful_life_months', field_type: 'number', field_value_number: 60, smart_code: 'HERA.SALON.ASSET.EQUIPMENT.v1' }
    ];

    for (const field of dynamicData) {
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: DEMO_ORG_ID,
          ...field
        });
      
      if (error) {
        console.error(`❌ Error adding field ${field.field_name}:`, error.message);
      } else {
        console.log(`✅ Added ${field.field_name} = ${field.field_value_text || field.field_value_number}`);
      }
    }

    // 3. Create Transactions
    console.log('\n💸 Creating transactions...');
    const transactions = [
      {
        transaction_type: 'appointment',
        transaction_date: '2024-01-15T10:00:00Z',
        transaction_code: 'APPT-2024-DEMO-001',
        smart_code: 'HERA.SALON.APPT.BOOK.CREATE.v1',
        source_entity_id: entityIds.customer,
        target_entity_id: entityIds.stylist,
        total_amount: 0,
        transaction_currency_code: 'AED',
        business_context: {
          appointment_datetime: '2024-01-20T15:00:00Z',
          duration_minutes: 90,
          status: 'confirmed'
        }
      },
      {
        transaction_type: 'pos_sale',
        transaction_date: '2024-01-20T16:30:00Z',
        transaction_code: 'POS-2024-DEMO-001',
        smart_code: 'HERA.SALON.POS.SALE.CREATE.v1',
        source_entity_id: entityIds.customer,
        target_entity_id: DEMO_ORG_ID,
        total_amount: 262.50,
        transaction_currency_code: 'AED',
        business_context: {
          payment_method: 'card',
          stylist_id: entityIds.stylist
        }
      },
      {
        transaction_type: 'inventory_consumption',
        transaction_date: '2024-01-20T16:00:00Z',
        transaction_code: 'CONS-2024-DEMO-001',
        smart_code: 'HERA.SALON.INV.MOVE.CONSUME.v1',
        source_entity_id: DEMO_ORG_ID,
        target_entity_id: DEMO_ORG_ID,
        total_amount: 30.00,
        transaction_currency_code: 'AED',
        business_context: {
          service_performed: entityIds.service,
          stylist_id: entityIds.stylist
        }
      }
    ];

    const transactionIds = {};
    
    for (const txn of transactions) {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: DEMO_ORG_ID,
          ...txn
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating transaction ${txn.transaction_code}:`, error.message);
      } else {
        transactionIds[txn.transaction_type] = data.id;
        console.log(`✅ Created ${txn.transaction_type}: ${txn.transaction_code} (${data.id})`);
      }
    }

    // 4. Create Transaction Lines
    console.log('\n📋 Creating transaction lines...');
    const lines = [
      {
        transaction_id: transactionIds.appointment,
        line_number: 1,
        line_type: 'SERVICE',
        entity_id: entityIds.service,
        quantity: 1,
        unit_amount: 250.00,
        line_amount: 250.00,
        smart_code: 'HERA.SALON.APPT.LINE.SERVICE.v1',
        line_data: { duration_minutes: 90 }
      },
      {
        transaction_id: transactionIds.pos_sale,
        line_number: 1,
        line_type: 'SERVICE',
        entity_id: entityIds.service,
        quantity: 1,
        unit_amount: 250.00,
        line_amount: 250.00,
        smart_code: 'HERA.SALON.POS.LINE.SERVICE.v1',
        line_data: { stylist_id: entityIds.stylist }
      },
      {
        transaction_id: transactionIds.pos_sale,
        line_number: 2,
        line_type: 'TAX',
        entity_id: entityIds.tax_profile,
        quantity: 1,
        unit_amount: 12.50,
        line_amount: 12.50,
        smart_code: 'HERA.SALON.POS.LINE.TAX.v1',
        line_data: { tax_base: 250, tax_rate: 0.05 }
      },
      {
        transaction_id: transactionIds.inventory_consumption,
        line_number: 1,
        line_type: 'PRODUCT',
        entity_id: entityIds.product,
        quantity: 1.5,
        unit_amount: 20.00,
        line_amount: 30.00,
        smart_code: 'HERA.SALON.INV.LINE.CONSUME.v1',
        line_data: { unit_of_measure: 'tubes' }
      }
    ];

    for (const line of lines) {
      const { error } = await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: DEMO_ORG_ID,
          ...line
        });
      
      if (error) {
        console.error(`❌ Error creating line:`, error.message);
      } else {
        console.log(`✅ Created line ${line.line_number} for ${line.line_type}`);
      }
    }

    console.log('\n🎉 Salon ERP Demo Data Loaded Successfully!');
    
    // Show summary
    console.log('\n📊 Summary:');
    console.log(`Organization: Demo Hair Salon (${DEMO_ORG_ID})`);
    console.log(`Entities Created: ${Object.keys(entityIds).length}`);
    console.log(`Transactions Created: ${Object.keys(transactionIds).length}`);
    console.log(`Transaction Lines Created: ${lines.length}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the loader
loadSalonDemo();