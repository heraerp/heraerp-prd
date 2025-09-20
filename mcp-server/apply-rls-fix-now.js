const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyRLSFix() {
  console.log('🚀 EMERGENCY RLS FIX - Removing app.current_org references...\n');
  
  // First, let's disable RLS temporarily on affected tables to stop the errors
  const tables = [
    'core_dynamic_data',
    'core_entities', 
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  console.log('📋 Tables to fix:', tables);
  
  // Test if we can query without errors
  console.log('\n🔍 Testing current state...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        if (error.message.includes('app.current_org')) {
          console.log('   ⚠️  Found app.current_org reference!');
        }
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n⚡ IMMEDIATE FIX: The RLS policies need to be updated in Supabase Dashboard!');
  console.log('\n📝 INSTRUCTIONS:');
  console.log('1. Open Supabase Dashboard -> SQL Editor');
  console.log('2. Run the following SQL file: mcp-server/fix-hera-dna-auth-rls.sql');
  console.log('3. This will replace app.current_org with JWT-based functions');
  
  console.log('\n🔧 ALTERNATIVE QUICK FIX:');
  console.log('1. Go to Authentication -> Policies in Supabase Dashboard');
  console.log('2. For each table listed above:');
  console.log('   - Find policies with "app.current_org" in their definition');
  console.log('   - Either disable them temporarily OR');
  console.log('   - Edit them to use: auth.jwt() ->> \'organization_id\' instead');
  
  console.log('\n💡 The SQL file contains the complete fix with proper JWT-based functions.');
}

applyRLSFix().catch(console.error);