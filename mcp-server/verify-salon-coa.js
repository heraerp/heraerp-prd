const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCOA() {
  // Check accounts by organization
  const { data: summary, error } = await supabase
    .from('core_entities')
    .select('organization_id, entity_type')
    .eq('entity_type', 'gl_account')
    .in('organization_id', [
      '849b6efe-2bf0-438f-9c70-01835ac2fe15',
      'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', 
      '0b1b37cd-4096-4718-8cd4-e370f234005b'
    ]);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  // Count by organization
  const counts = {};
  summary.forEach(row => {
    counts[row.organization_id] = (counts[row.organization_id] || 0) + 1;
  });

  console.log('\n📊 Chart of Accounts Summary:');
  console.log('================================');
  console.log('Salon Group:', counts['849b6efe-2bf0-438f-9c70-01835ac2fe15'] || 0, 'accounts');
  console.log('Park Regis Branch:', counts['e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'] || 0, 'accounts');  
  console.log('Mercure Gold Branch:', counts['0b1b37cd-4096-4718-8cd4-e370f234005b'] || 0, 'accounts');
  console.log('Total GL Accounts:', summary.length);

  // Sample some accounts to verify structure
  const { data: sampleAccounts } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name, smart_code')
    .eq('entity_type', 'gl_account')
    .eq('organization_id', '849b6efe-2bf0-438f-9c70-01835ac2fe15')
    .in('entity_code', ['1100000', '4110000', '5110000', '9000000'])
    .order('entity_code');

  console.log('\n📝 Sample Accounts from Head Office:');
  console.log('=====================================');
  sampleAccounts?.forEach(acc => {
    console.log(`${acc.entity_code} - ${acc.entity_name}`);
    console.log(`  Smart Code: ${acc.smart_code}`);
  });

  // Check IFRS metadata
  const { data: ifrsData } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text')
    .eq('organization_id', '849b6efe-2bf0-438f-9c70-01835ac2fe15')
    .in('field_name', ['ifrs_code', 'statement_type'])
    .limit(10);

  console.log('\n🏛️ IFRS Metadata Sample:');
  console.log('========================');
  const ifrsMap = {};
  ifrsData?.forEach(row => {
    if (!ifrsMap[row.field_name]) ifrsMap[row.field_name] = [];
    if (!ifrsMap[row.field_name].includes(row.field_value_text)) {
      ifrsMap[row.field_name].push(row.field_value_text);
    }
  });
  
  Object.entries(ifrsMap).forEach(([field, values]) => {
    console.log(`${field}: ${values.slice(0, 5).join(', ')}${values.length > 5 ? '...' : ''}`);
  });
}

verifyCOA().catch(console.error);