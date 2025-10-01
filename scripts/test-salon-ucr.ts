#!/usr/bin/env tsx
// scripts/test-salon-ucr.ts
// Test SALON UCR templates with the Universal API

import { EntityBuilder } from '@/lib/universal/entity-builder';
import { SmartCodeEngine } from '@/lib/universal/smart-code-engine';
import { callRPC } from '@/lib/universal/supabase';

// Test organization ID (replace with your actual org ID)
const TEST_ORG_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

async function testSalonCustomer() {
  console.log('\n🧪 Testing SALON Customer Entity...\n');
  
  const smartCode = 'HERA.SALON.CRM.ENT.CUST.v1';
  
  try {
    // 1. Load Smart Code Engine
    console.log('1️⃣ Loading Smart Code Engine...');
    const engine = new SmartCodeEngine(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const context = await engine.loadSmartCode(smartCode, TEST_ORG_ID);
    console.log('✅ Loaded context:', {
      smartCode: context.smartCode,
      rulesCount: context.rules.length,
      proceduresCount: context.procedures.length
    });
    
    // 2. Build Dynamic Schema
    console.log('\n2️⃣ Building Dynamic Schema...');
    const schema = await EntityBuilder.buildSchema(smartCode, TEST_ORG_ID);
    console.log('✅ Built schema with fields:', schema.field_schemas.map(f => f.field_name));
    
    // 3. Validate Sample Data
    console.log('\n3️⃣ Validating Sample Customer Data...');
    const testCustomer = {
      p_organization_id: TEST_ORG_ID,
      p_smart_code: smartCode,
      p_entity_name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890',
      loyalty_tier: 'gold',
      birthday: '1990-01-15',
      marketing_consent: true
    };
    
    try {
      const validated = schema.base_schema.parse(testCustomer);
      console.log('✅ Validation passed!');
    } catch (error: any) {
      console.error('❌ Validation failed:', error.errors);
    }
    
    // 4. Create Customer Entity
    console.log('\n4️⃣ Creating Customer Entity...');
    const result = await callRPC('hera_entity_upsert_v1', {
      p_organization_id: TEST_ORG_ID,
      p_entity_type: 'customer',
      p_entity_name: testCustomer.p_entity_name,
      p_smart_code: smartCode
    }, { mode: 'service' });
    
    if (result.error) {
      console.error('❌ Failed to create entity:', result.error);
    } else {
      console.log('✅ Created entity:', result.data);
      
      // 5. Store Dynamic Fields
      if (result.data?.entity_id) {
        console.log('\n5️⃣ Storing Dynamic Fields...');
        const dynamicFields = [
          { field_name: 'email', field_type: 'text', field_value: testCustomer.email },
          { field_name: 'phone', field_type: 'text', field_value: testCustomer.phone },
          { field_name: 'loyalty_tier', field_type: 'text', field_value: testCustomer.loyalty_tier },
          { field_name: 'birthday', field_type: 'date', field_value_date: testCustomer.birthday }
        ];
        
        for (const field of dynamicFields) {
          await callRPC('hera_dynamic_data_set_v1', {
            p_organization_id: TEST_ORG_ID,
            p_entity_id: result.data.entity_id,
            p_field_name: field.field_name,
            p_field_type: field.field_type,
            p_field_value: field.field_value || null,
            p_field_value_date: field.field_value_date || null,
            p_smart_code: smartCode
          }, { mode: 'service' });
        }
        
        console.log('✅ Stored dynamic fields');
      }
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

async function testSalonAppointment() {
  console.log('\n\n🧪 Testing SALON Appointment Transaction...\n');
  
  const smartCode = 'HERA.SALON.APPT.TXN.BOOKING.v1';
  
  try {
    // Create test appointment
    const testAppointment = {
      p_organization_id: TEST_ORG_ID,
      p_smart_code: smartCode,
      p_transaction_type: 'appointment',
      p_transaction_date: new Date().toISOString().split('T')[0],
      p_total_amount: 150.00,
      p_source_entity_id: TEST_ORG_ID, // Would be actual customer ID
      p_target_entity_id: TEST_ORG_ID, // Would be location ID
      p_transaction_currency_code: 'AED'
    };
    
    console.log('Creating appointment transaction...');
    const result = await callRPC('hera_transaction_create_v1', testAppointment, {
      mode: 'service'
    });
    
    if (result.error) {
      console.error('❌ Failed to create transaction:', result.error);
    } else {
      console.log('✅ Created transaction:', result.data);
      
      // Add line items
      if (result.data?.transaction_id) {
        const lines = [
          {
            p_transaction_id: result.data.transaction_id,
            p_organization_id: TEST_ORG_ID,
            p_line_number: 1,
            p_line_type: 'SERVICE',
            p_smart_code: 'HERA.SALON.SVC.LINE.HAIRCUT.v1',
            p_description: 'Premium Hair Cut',
            p_quantity: 1,
            p_unit_amount: 80.00,
            p_line_amount: 80.00
          },
          {
            p_transaction_id: result.data.transaction_id,
            p_organization_id: TEST_ORG_ID,
            p_line_number: 2,
            p_line_type: 'PRODUCT',
            p_smart_code: 'HERA.SALON.PROD.LINE.SHAMPOO.v1',
            p_description: 'Professional Shampoo',
            p_quantity: 1,
            p_unit_amount: 50.00,
            p_line_amount: 50.00
          },
          {
            p_transaction_id: result.data.transaction_id,
            p_organization_id: TEST_ORG_ID,
            p_line_number: 3,
            p_line_type: 'TAX',
            p_smart_code: 'HERA.SALON.TAX.LINE.VAT.v1',
            p_description: 'VAT 5%',
            p_quantity: 1,
            p_unit_amount: 6.50,
            p_line_amount: 6.50
          },
          {
            p_transaction_id: result.data.transaction_id,
            p_organization_id: TEST_ORG_ID,
            p_line_number: 4,
            p_line_type: 'TIP',
            p_smart_code: 'HERA.SALON.TIP.LINE.CASH.v1',
            p_description: 'Cash Tip',
            p_quantity: 1,
            p_unit_amount: 13.50,
            p_line_amount: 13.50
          }
        ];
        
        console.log('\nAdding transaction lines...');
        for (const line of lines) {
          await callRPC('hera_transaction_line_append_v1', line, {
            mode: 'service'
          });
        }
        
        console.log('✅ Added transaction lines');
      }
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run tests
async function main() {
  console.log('🚀 SALON UCR Template Testing\n');
  console.log('Organization:', TEST_ORG_ID);
  
  await testSalonCustomer();
  await testSalonAppointment();
  
  console.log('\n✨ Testing complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

export { testSalonCustomer, testSalonAppointment };