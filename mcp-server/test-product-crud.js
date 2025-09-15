#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function testProductCRUD() {
  console.log('🧪 Testing Product CRUD Operations\n');
  
  // 1. Create a test product
  console.log('1️⃣ Creating test product...');
  const testProduct = {
    entity_type: 'product',
    entity_name: 'Test Furniture Product',
    entity_code: 'TEST-PROD-001',
    organization_id: KERALA_FURNITURE_ORG_ID,
    smart_code: 'HERA.FURNITURE.PRODUCT.OFFICE.TEST.v1',
    metadata: {
      category: 'test'
    }
  };
  
  const { data: created, error: createError } = await supabase
    .from('core_entities')
    .insert(testProduct)
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Create failed:', createError);
    return;
  }
  
  console.log(`✅ Created product: ${created.entity_name} (ID: ${created.id})`);
  
  // 2. Update the product
  console.log('\n2️⃣ Updating product name...');
  const { data: updated, error: updateError } = await supabase
    .from('core_entities')
    .update({ entity_name: 'Updated Test Product' })
    .eq('id', created.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ Update failed:', updateError);
  } else {
    console.log(`✅ Updated product name to: ${updated.entity_name}`);
  }
  
  // 3. Add dynamic fields
  console.log('\n3️⃣ Adding dynamic fields...');
  const dynamicField = {
    entity_id: created.id,
    organization_id: KERALA_FURNITURE_ORG_ID,
    field_name: 'test_price',
    field_value_number: 9999,
    smart_code: 'HERA.FURNITURE.PRODUCT.DYN.PRICE.v1'
  };
  
  const { error: fieldError } = await supabase
    .from('core_dynamic_data')
    .insert(dynamicField);
  
  if (fieldError) {
    console.error('❌ Dynamic field creation failed:', fieldError);
  } else {
    console.log('✅ Added dynamic price field');
  }
  
  // 4. Read the product with dynamic data
  console.log('\n4️⃣ Reading product with dynamic data...');
  const { data: readProduct, error: readError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', created.id)
    .single();
  
  const { data: dynamicData, error: dynError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', created.id);
  
  if (!readError && !dynError) {
    console.log('✅ Product data:', {
      name: readProduct.entity_name,
      code: readProduct.entity_code,
      dynamicFields: dynamicData.length
    });
  }
  
  // 5. Delete the product
  console.log('\n5️⃣ Deleting test product...');
  
  // First delete dynamic data
  const { error: deleteDynError } = await supabase
    .from('core_dynamic_data')
    .delete()
    .eq('entity_id', created.id);
  
  if (deleteDynError) {
    console.error('❌ Failed to delete dynamic data:', deleteDynError);
  }
  
  // Then delete the entity
  const { error: deleteError } = await supabase
    .from('core_entities')
    .delete()
    .eq('id', created.id);
  
  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
  } else {
    console.log('✅ Product deleted successfully');
  }
  
  // 6. Verify deletion
  console.log('\n6️⃣ Verifying deletion...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('core_entities')
    .select('id')
    .eq('id', created.id)
    .single();
  
  if (verifyError && verifyError.code === 'PGRST116') {
    console.log('✅ Product successfully deleted (not found)');
  } else if (verifyData) {
    console.error('❌ Product still exists after deletion');
  }
  
  console.log('\n✅ CRUD operations test complete!');
}

testProductCRUD().catch(console.error);