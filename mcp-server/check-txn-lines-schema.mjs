import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Available columns in universal_transaction_lines:');
    console.log(Object.keys(data[0]).sort());
  } else {
    console.log('No data found, checking via RPC...');
    
    // Try to get schema info
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'universal_transaction_lines'
        ORDER BY column_name
      `
    });
    
    if (!schemaError && schemaData) {
      console.log('Schema:', schemaData);
    }
  }
}

checkSchema();
