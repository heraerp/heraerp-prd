const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testUniversalApiDirect() {
  console.log('🧪 Testing Universal API direct queries...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz
  
  // Test the exact query that getDynamicData makes
  console.log('1️⃣ Testing getDynamicData query for SALES_POLICY.v1:');
  
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('field_name', 'SALES_POLICY.v1')
    .maybeSingle();
    
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('Error details:', error);
  } else if (!data) {
    console.log('⚠️ No data found (null result)');
  } else {
    console.log('✅ Data found!');
    console.log('Field:', data.field_name);
    console.log('Has JSON data:', !!data.field_value_json);
    console.log('Entity ID:', data.entity_id);
    if (data.field_value_json) {
      console.log('Settings:', JSON.stringify(data.field_value_json, null, 2));
    }
  }
  
  // Test if we can query without maybeSingle
  console.log('\n2️⃣ Testing same query with .select() only:');
  const { data: multiData, error: multiError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('field_name', 'SALES_POLICY.v1');
    
  if (multiError) {
    console.log('❌ Error:', multiError.message);
  } else {
    console.log(`✅ Found ${multiData?.length || 0} records`);
    if (multiData?.length > 0) {
      console.log('First record:', {
        id: multiData[0].id,
        field_name: multiData[0].field_name,
        has_json: !!multiData[0].field_value_json
      });
    }
  }
  
  // Test other settings
  console.log('\n3️⃣ Testing other settings:');
  const settingNames = ['INVENTORY_POLICY.v1', 'SYSTEM_SETTINGS.v1', 'NOTIFICATION_POLICY.v1', 'ROLE_GRANTS.v1'];
  
  for (const fieldName of settingNames) {
    const { data: settingData, error: settingError } = await supabase
      .from('core_dynamic_data')
      .select('id, field_name, field_value_json')
      .eq('organization_id', organizationId)
      .eq('field_name', fieldName)
      .single();
      
    if (settingError) {
      console.log(`- ${fieldName}: ❌ ${settingError.code || 'Error'}`);
    } else if (settingData) {
      console.log(`- ${fieldName}: ✅ Found (has data: ${!!settingData.field_value_json})`);
    }
  }
}

testUniversalApiDirect().catch(console.error);