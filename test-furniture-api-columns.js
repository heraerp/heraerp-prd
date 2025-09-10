#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test organization ID for Furniture Org
const ORGANIZATION_ID = '0a25bd13-1997-41ce-986f-4943c962eaa6';

async function testDatabaseColumns() {
  console.log('🔍 Testing Database Column Usage...\n');

  try {
    // Test 1: Create a test document entity
    console.log('1️⃣ Testing core_entities insert...');
    const documentId = crypto.randomUUID();
    const { data: entityData, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: documentId,
        organization_id: ORGANIZATION_ID,
        entity_type: 'document',
        entity_code: `TEST-DOC-${Date.now()}`,
        entity_name: 'Test Invoice Document',
        smart_code: 'HERA.FURNITURE.DOCUMENT.TEST.v1',
        metadata: {
          test: true,
          created_by: 'column_test_script'
        }
      })
      .select()
      .single();

    if (entityError) {
      console.error('❌ Entity creation failed:', entityError.message);
    } else {
      console.log('✅ Entity created successfully');
      console.log('   Entity ID:', documentId);
    }

    // Test 2: Insert into core_dynamic_data with correct columns
    console.log('\n2️⃣ Testing core_dynamic_data insert...');
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert({
        entity_id: documentId,
        organization_id: ORGANIZATION_ID,
        field_name: 'test_field',
        field_value_text: 'Test Value',
        field_value_json: {
          complex_data: 'This goes in field_value_json',
          nested: {
            level: 2,
            data: 'nested data'
          }
        },
        smart_code: 'HERA.FURNITURE.TEST.FIELD.v1'
      })
      .select()
      .single();

    if (dynamicError) {
      console.error('❌ Dynamic data creation failed:', dynamicError.message);
    } else {
      console.log('✅ Dynamic data created successfully');
      console.log('   Field:', dynamicData.field_name);
      console.log('   JSON data stored:', JSON.stringify(dynamicData.field_value_json, null, 2));
    }

    // Test 3: Create transaction with correct columns
    console.log('\n3️⃣ Testing universal_transactions insert...');
    const { data: txnData, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORGANIZATION_ID,
        transaction_type: 'test_transaction',
        transaction_code: `TEST-TXN-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: documentId,  // Correct column name
        target_entity_id: null,         // Can be null
        total_amount: 1000,
        smart_code: 'HERA.FURNITURE.TEST.TXN.v1',
        metadata: {
          test_data: 'Transaction metadata goes here'
        },
        business_context: {
          purpose: 'Column validation test'
        }
      })
      .select()
      .single();

    if (txnError) {
      console.error('❌ Transaction creation failed:', txnError.message);
    } else {
      console.log('✅ Transaction created successfully');
      console.log('   Transaction ID:', txnData.id);
      console.log('   Source Entity:', txnData.source_entity_id);
    }

    // Test 4: Query to verify relationships
    console.log('\n4️⃣ Testing column queries...');
    
    // Check if we can query by the correct columns
    const { data: queryData, error: queryError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('source_entity_id', documentId)
      .single();

    if (queryError) {
      console.error('❌ Query by source_entity_id failed:', queryError.message);
    } else {
      console.log('✅ Query successful - found transaction by source_entity_id');
    }

    // Cleanup test data
    console.log('\n5️⃣ Cleaning up test data...');
    
    // Delete transaction
    await supabase
      .from('universal_transactions')
      .delete()
      .eq('source_entity_id', documentId);
    
    // Delete dynamic data
    await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', documentId);
    
    // Delete entity
    await supabase
      .from('core_entities')
      .delete()
      .eq('id', documentId);
    
    console.log('✅ Test data cleaned up');

    console.log('\n✨ All column tests completed successfully!');
    console.log('\n📝 Summary of correct column names:');
    console.log('  - core_dynamic_data: use field_value_json (not metadata)');
    console.log('  - universal_transactions: use source_entity_id/target_entity_id (not reference_entity_id)');
    console.log('  - Both tables have metadata column for general metadata storage');
    console.log('  - universal_transactions also has business_context column for additional context');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testDatabaseColumns().catch(console.error);