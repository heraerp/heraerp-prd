const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking core_entities table schema...\n');
  
  // Query the table schema
  const { data, error } = await supabase
    .from('core_entities')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📊 Columns in core_entities:');
    console.log(Object.keys(data[0]).sort().join('\n'));
  } else {
    console.log('⚠️ No data in table, trying different approach...');
    
    // Try inserting and then rolling back to see columns
    const testData = {
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      entity_type: 'test',
      entity_name: 'Schema Check',
      smart_code: 'HERA.TEST.SCHEMA.CHECK.V1'
    };
    
    const { error: insertError } = await supabase
      .from('core_entities')
      .insert(testData)
      .select();
      
    if (insertError) {
      console.log('Error details:', insertError);
      console.log('\n💡 Missing columns based on error:', insertError.message);
    }
  }
}

checkSchema().catch(console.error);
