const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('Checking appointments...');
  
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('transaction_code, metadata->status, transaction_date, created_at')
    .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
    .eq('transaction_type', 'appointment')
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} appointments:`);
  data.forEach((apt, i) => {
    console.log(`${i+1}. ${apt.transaction_code} - Status: ${apt.status || 'no status'} - Date: ${apt.transaction_date}`);
  });
})();