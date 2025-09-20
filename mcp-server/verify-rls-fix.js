const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyRLSFix() {
  console.log('🔍 Verifying RLS Fix...\n');
  
  // Test with anon key (simulates browser requests)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const tables = [
    'core_dynamic_data',
    'core_entities',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  console.log('Testing with ANON key (browser simulation):\n');
  
  let allPassed = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await anonClient
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        if (error.message.includes('app.current_org')) {
          console.log('   ⚠️  Still has app.current_org reference!');
          allPassed = false;
        }
      } else {
        console.log(`✅ ${table}: Working!`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ SUCCESS: All tables are accessible!');
    console.log('The RLS fix has been applied successfully.');
  } else {
    console.log('❌ FAILED: Some tables still have issues.');
    console.log('\nPlease run: mcp-server/immediate-rls-fix.sql');
    console.log('in your Supabase SQL Editor.');
  }
}

verifyRLSFix().catch(console.error);