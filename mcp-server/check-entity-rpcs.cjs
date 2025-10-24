const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEntityRPCs() {
  console.log('🔍 Checking available HERA entity RPC functions...\n');

  // Query pg_proc for all hera functions
  const { data, error } = await supabase
    .rpc('execute_sql', {
      sql_query: `
        SELECT
          p.proname as function_name,
          pg_get_function_arguments(p.oid) as arguments,
          pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname LIKE 'hera_entity%'
        ORDER BY p.proname;
      `
    });

  if (error) {
    console.error('❌ Error:', error.message);

    // Fallback: try direct query
    console.log('\n🔄 Trying alternative method...\n');

    const testFunctions = [
      'hera_entity_read_v1',
      'hera_entity_upsert_v1',
      'hera_entity_create_v1',
      'hera_entity_update_v1',
      'hera_entity_delete_v1',
      'hera_entities_crud_v2'
    ];

    for (const funcName of testFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName, {});

        if (error && error.code === 'PGRST202') {
          console.log(`❌ ${funcName} - NOT FOUND`);
        } else if (error) {
          console.log(`✅ ${funcName} - EXISTS (params error: ${error.message.substring(0, 80)}...)`);
        } else {
          console.log(`✅ ${funcName} - EXISTS`);
        }
      } catch (e) {
        console.log(`❌ ${funcName} - ERROR: ${e.message}`);
      }
    }
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No hera_entity functions found');
    return;
  }

  console.log(`✅ Found ${data.length} hera_entity RPC functions:\n`);
  data.forEach(func => {
    console.log(`📌 ${func.function_name}`);
    console.log(`   Parameters: ${func.arguments}`);
    console.log(`   Returns: ${func.return_type}\n`);
  });
}

checkEntityRPCs().catch(console.error);
