const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkTransactionColumns() {
  console.log('🔍 Checking universal_transactions columns...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get one transaction to see its structure
  const { data, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Column names found:');
    Object.keys(data[0]).forEach(col => {
      console.log(`- ${col}`);
    });
  } else {
    console.log('No transactions found, checking schema via RPC...');
    
    // Try to get column info via SQL
    const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
      table_name: 'universal_transactions'
    }).catch(() => ({ data: null, error: 'RPC not available' }));
    
    if (columns) {
      console.log('Columns from RPC:', columns);
    } else {
      console.log('Cannot retrieve schema. Please check database documentation.');
    }
  }
  
  console.log('\n💡 Based on CLAUDE.md, the correct columns should be:');
  console.log('- source_entity_id (not from_entity_id)');
  console.log('- reference_entity_id (not to_entity_id)');
  console.log('- transaction_code (not transaction_number)');
}

checkTransactionColumns().catch(console.error);