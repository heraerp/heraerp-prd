const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function checkCOA() {
  // Query GL accounts for Hairtalkz
  const { data: glAccounts, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', HAIRTALKZ_ORG_ID)
    .eq('entity_type', 'gl_account')
    .order('entity_code');

  if (error) {
    console.error('Error querying GL accounts:', error);
    return;
  }

  console.log(`✅ Found ${glAccounts.length} GL accounts for Hairtalkz\n`);
  
  if (glAccounts.length > 0) {
    console.log('Sample accounts:');
    glAccounts.slice(0, 10).forEach(account => {
      console.log(`  ${account.entity_code} - ${account.entity_name}`);
    });
    
    // Check dynamic data for one account
    const sampleAccount = glAccounts[0];
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', sampleAccount.id);
    
    console.log(`\nDynamic data for ${sampleAccount.entity_code}:`);
    dynamicData?.forEach(field => {
      const value = field.field_value_text || field.field_value_number || field.field_value_boolean;
      console.log(`  ${field.field_name}: ${value}`);
    });
  }
}

checkCOA();
