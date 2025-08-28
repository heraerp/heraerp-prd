require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Try to get one row to see structure
    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
    } else if (data && data.length > 0) {
      console.log('universal_transaction_lines columns:', Object.keys(data[0]));
    } else {
      // Try inserting a minimal row to see what columns are required
      const { error: insertError } = await supabase
        .from('universal_transaction_lines')
        .insert({
          transaction_id: '00000000-0000-0000-0000-000000000000',
          line_number: 1,
          quantity: 1,
          unit_price: 0,
          line_amount: 0
        });
      
      console.log('Insert error details:', insertError);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSchema();