const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIceCreamData() {
  const ICE_CREAM_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';
  
  console.log('Testing ice cream data for org:', ICE_CREAM_ORG_ID);

  // Check what data exists
  const { data: entities, error: entError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ICE_CREAM_ORG_ID);

  console.log('\nEntities:', entities?.length || 0);
  if (entities?.length > 0) {
    entities.forEach(e => {
      console.log(`  - ${e.entity_type}: ${e.entity_name} (${e.entity_code})`);
    });
  }

  const { data: transactions, error: txnError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ICE_CREAM_ORG_ID);

  console.log('\nTransactions:', transactions?.length || 0);
  if (transactions?.length > 0) {
    transactions.forEach(t => {
      console.log(`  - ${t.transaction_type}: ${t.transaction_code} - Amount: ${t.total_amount}`);
    });
  }
}

testIceCreamData();