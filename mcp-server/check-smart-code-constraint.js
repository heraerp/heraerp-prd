const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSmartCodeConstraint() {
  console.log('Checking smart code constraint...\n');
  
  try {
    // Query the constraint from pg_constraint
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint
        WHERE conrelid = 'core_entities'::regclass
        AND conname LIKE '%smart_code%'
      `
    });
    
    if (error) {
      // If execute_sql doesn't exist, try a different approach
      console.log('execute_sql not available, trying different approach...');
      
      // Try to create an entity with a test smart code to see the error
      const testOrgId = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';
      const { error: testError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: testOrgId,
          entity_type: 'test',
          entity_name: 'Test Smart Code',
          entity_code: 'TEST-SMART-CODE',
          smart_code: 'HERA.TEST.ENTITY.v1'  // Try a simple format
        });
      
      if (testError) {
        console.log('Error message:', testError.message);
        console.log('\nThis tells us what the constraint expects.');
      }
    } else {
      console.log('Constraint info:', data);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSmartCodeConstraint();