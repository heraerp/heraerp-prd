const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', '0fd09e31-d257-4329-97eb-7d7f522ed6f0')
    .eq('transaction_type', 'appointment')
    .eq('transaction_code', 'appt-20250922-0930-amira');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Sample transaction structure:');
  if (data && data.length > 0) {
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No data found');
    console.log('Data:', data);
  }
})();