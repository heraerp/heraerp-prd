const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSmartCodeOptional() {
  console.log('Testing if smart_code is optional...\n');
  
  const testOrgId = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';
  
  // Test 1: Try without smart_code
  console.log('1. Testing without smart_code...');
  const { data: withoutCode, error: errorWithout } = await supabase
    .from('core_entities')
    .insert({
      organization_id: testOrgId,
      entity_type: 'test_entity',
      entity_name: 'Test Without Smart Code',
      entity_code: `TEST-NO-CODE-${Date.now()}`
    })
    .select();
  
  if (errorWithout) {
    console.log('❌ Failed:', errorWithout.message);
  } else {
    console.log('✅ Success! Smart code is optional');
    // Clean up
    if (withoutCode && withoutCode[0]) {
      await supabase.from('core_entities').delete().eq('id', withoutCode[0].id);
    }
  }
  
  // Test 2: Try with null smart_code
  console.log('\n2. Testing with null smart_code...');
  const { data: withNull, error: errorNull } = await supabase
    .from('core_entities')
    .insert({
      organization_id: testOrgId,
      entity_type: 'test_entity',
      entity_name: 'Test With Null Smart Code',
      entity_code: `TEST-NULL-CODE-${Date.now()}`,
      smart_code: null
    })
    .select();
  
  if (errorNull) {
    console.log('❌ Failed:', errorNull.message);
  } else {
    console.log('✅ Success! Null smart code works');
    // Clean up
    if (withNull && withNull[0]) {
      await supabase.from('core_entities').delete().eq('id', withNull[0].id);
    }
  }
  
  // Test 3: Try with proper format
  console.log('\n3. Testing with proper HERA format...');
  const validPatterns = [
    'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
    'HERA.SALON.INVENTORY.PRODUCT.ITEM.v1',
    'HERA.FURNITURE.PRODUCT.DINING.TABLE.v1',
    'HERA.RESTAURANT.MENU.ITEM.FOOD.v1',
    'HERA.UNIVERSAL.ENTITY.GENERAL.MASTER.v1'
  ];
  
  for (const pattern of validPatterns) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: testOrgId,
        entity_type: 'test_entity',
        entity_name: `Test ${pattern}`,
        entity_code: `TEST-${Date.now()}`,
        smart_code: pattern
      })
      .select();
    
    if (error) {
      console.log(`❌ "${pattern}" - Failed: ${error.message.split('\\n')[0]}`);
    } else {
      console.log(`✅ "${pattern}" - Success!`);
      // Clean up
      if (data && data[0]) {
        await supabase.from('core_entities').delete().eq('id', data[0].id);
      }
    }
  }
}

testSmartCodeOptional();