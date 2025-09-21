const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🔍 Searching for appointment ID: 897ecebd-09fd-4fb4-b5b7-65ff77373908\n');
  
  // Search for the specific appointment ID
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', '897ecebd-09fd-4fb4-b5b7-65ff77373908');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('✅ Found the appointment:');
    const apt = data[0];
    console.log('   ID:', apt.id);
    console.log('   Type:', apt.transaction_type);
    console.log('   Code:', apt.transaction_code);
    console.log('   Org:', apt.organization_id);
    console.log('   Date:', apt.transaction_date);
    console.log('   Status:', apt.transaction_status);
    console.log('   Created:', apt.created_at);
    console.log('   Metadata:', JSON.stringify(apt.metadata, null, 2));
  } else {
    console.log('❌ Appointment not found with ID: 897ecebd-09fd-4fb4-b5b7-65ff77373908');
  }
  
  // Also check if this ID exists in any other table
  console.log('\n🔍 Checking core_entities table...');
  const { data: entityData, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', '897ecebd-09fd-4fb4-b5b7-65ff77373908');
    
  if (entityData && entityData.length > 0) {
    console.log('✅ Found in core_entities:');
    console.log('   Type:', entityData[0].entity_type);
    console.log('   Name:', entityData[0].entity_name);
  } else {
    console.log('❌ Not found in core_entities');
  }
})();