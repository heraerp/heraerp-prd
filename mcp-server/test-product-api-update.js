#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function testAPIUpdate() {
  console.log('🧪 Testing Product Update via Universal API Pattern\n');
  
  // Get first product
  const { data: products, error: fetchError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'product')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .limit(1);
  
  if (fetchError || !products?.length) {
    console.error('❌ No products found to test');
    return;
  }
  
  const product = products[0];
  console.log(`📦 Testing with product: ${product.entity_name}`);
  console.log(`   Current price in dynamic data...`);
  
  // Get current dynamic data
  const { data: currentDynamic } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', product.id)
    .eq('field_name', 'price')
    .single();
  
  console.log(`   Current price: $${currentDynamic?.field_value_number || 'Not set'}`);
  
  // Update entity name
  console.log('\n📝 Updating product name...');
  const newName = product.entity_name + ' (Updated)';
  
  const { error: updateError } = await supabase
    .from('core_entities')
    .update({ entity_name: newName })
    .eq('id', product.id);
  
  if (updateError) {
    console.error('❌ Failed to update name:', updateError);
  } else {
    console.log('✅ Product name updated');
  }
  
  // Update dynamic price field
  console.log('\n💰 Updating price...');
  const newPrice = (currentDynamic?.field_value_number || 10000) + 1000;
  
  if (currentDynamic) {
    // Update existing
    const { error: priceError } = await supabase
      .from('core_dynamic_data')
      .update({ field_value_number: newPrice })
      .eq('id', currentDynamic.id);
    
    if (priceError) {
      console.error('❌ Failed to update price:', priceError);
    } else {
      console.log(`✅ Price updated to $${newPrice}`);
    }
  } else {
    // Create new
    const { error: priceError } = await supabase
      .from('core_dynamic_data')
      .insert({
        entity_id: product.id,
        organization_id: KERALA_FURNITURE_ORG_ID,
        field_name: 'price',
        field_value_number: newPrice,
        smart_code: 'HERA.FURNITURE.PRODUCT.DYN.PRICE.v1'
      });
    
    if (priceError) {
      console.error('❌ Failed to create price:', priceError);
    } else {
      console.log(`✅ Price created at $${newPrice}`);
    }
  }
  
  // Verify changes
  console.log('\n✅ Verifying changes...');
  const { data: updated } = await supabase
    .from('core_entities')
    .select('entity_name')
    .eq('id', product.id)
    .single();
  
  const { data: updatedPrice } = await supabase
    .from('core_dynamic_data')
    .select('field_value_number')
    .eq('entity_id', product.id)
    .eq('field_name', 'price')
    .single();
  
  console.log(`   Name: ${updated?.entity_name}`);
  console.log(`   Price: $${updatedPrice?.field_value_number}`);
  
  // Restore original name
  console.log('\n🔄 Restoring original name...');
  await supabase
    .from('core_entities')
    .update({ entity_name: product.entity_name })
    .eq('id', product.id);
  
  console.log('✅ Test complete!');
}

testAPIUpdate().catch(console.error);