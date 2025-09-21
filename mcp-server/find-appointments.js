const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('Searching for any appointments with our pattern...');
  
  // Check for transactions with our code pattern
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .like('transaction_code', 'appt-2025%')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} appointments with our pattern:`);
  data.forEach((apt, i) => {
    console.log(`${i+1}. Code: ${apt.transaction_code}`);
    console.log(`   Org: ${apt.organization_id}`);
    console.log(`   Status: ${apt.metadata?.status || 'no status'}`);
    console.log(`   Customer: ${apt.metadata?.customer_name || 'unknown'}`);
    console.log(`   Date: ${apt.transaction_date}`);
    console.log(`   Created: ${apt.created_at}\n`);
  });
  
  // Also check total count
  const { count } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_type', 'appointment');
    
  console.log(`Total appointments in database: ${count}`);
})();