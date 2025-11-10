#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const orgId = 'de5f248d-7747-44f3-9d11-a279f3158fa5';

console.log('🔍 Testing Organization Loading Logic...');
console.log('Org ID:', orgId);
console.log('');

// Simulate the fallback path
console.log('📋 Testing FALLBACK path (direct query)...');
const { data: orgFromTable, error: tableError } = await supabase
  .from('core_organizations')
  .select('*')
  .eq('id', orgId)
  .single();

if (tableError || !orgFromTable) {
  console.log('❌ Failed to load organization from table:', tableError);
} else {
  console.log('✅ Organization loaded from core_organizations:');
  console.log('   ID:', orgFromTable.id);
  console.log('   Name:', orgFromTable.organization_name);
  console.log('   Code:', orgFromTable.organization_code);
  console.log('   Type:', orgFromTable.organization_type);
  console.log('');

  // Query dynamic data
  const { data: dynamicFields } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', orgId);

  const settingsFromDynamic = {};
  if (dynamicFields && Array.isArray(dynamicFields)) {
    dynamicFields.forEach(field => {
      const value = field.field_value_text || field.field_value_number || field.field_value_boolean || field.field_value_date || field.field_value_json;
      settingsFromDynamic[field.field_name] = value;
    });
  }

  console.log('📊 Dynamic fields:', Object.keys(settingsFromDynamic).length);
  console.log('   Fields:', Object.keys(settingsFromDynamic));
  console.log('');

  // Test the name extraction logic
  const currency = settingsFromDynamic.currency || orgFromTable.metadata?.currency || 'AED';
  const organization_name = settingsFromDynamic.organization_name || orgFromTable.organization_name || 'HairTalkz';

  console.log('🎯 Name extraction result:');
  console.log('   settingsFromDynamic.organization_name:', settingsFromDynamic.organization_name || '(undefined)');
  console.log('   orgFromTable.organization_name:', orgFromTable.organization_name);
  console.log('   Final organization_name:', organization_name);
  console.log('');

  if (organization_name === 'HairTalkz') {
    console.log('❌ Using fallback "HairTalkz" - something is wrong!');
  } else {
    console.log('✅ Correct name extracted:', organization_name);
  }
}
