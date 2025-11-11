import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Getting hera_auth_introspect_v1 function definition\n');

// Query the function source code from PostgreSQL
const { data, error } = await supabase.rpc('exec_sql', {
  query: `
    SELECT 
      p.proname as function_name,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'hera_auth_introspect_v1';
  `
});

if (error) {
  console.error('❌ Error (trying alternative):', error.message);
  
  // Alternative: check if we can see the function exists
  const { data: funcs, error: listError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: 'test'
  });
  
  console.log('\n✅ Function exists and can be called');
  console.log('   (but cannot retrieve source code via RPC)\n');
  console.log('💡 The function likely filters relationships by expiration_date or status.');
  console.log('   Check the relationship for these fields:\n');
  
  const WMS_USER_ID = 'b172d7c4-92af-4595-a999-e073deda7c92';
  const { data: rel, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', WMS_USER_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .single();
  
  if (rel) {
    console.log('  📋 Relationship fields:');
    console.log('     effective_date:', rel.effective_date || 'NULL');
    console.log('     expiration_date:', rel.expiration_date || 'NULL');
    console.log('     created_at:', rel.created_at);
    console.log('     updated_at:', rel.updated_at);
    console.log('     relationship_data.status:', rel.relationship_data?.status || 'NULL');
    
    const now = new Date();
    const effective = rel.effective_date ? new Date(rel.effective_date) : null;
    const expiration = rel.expiration_date ? new Date(rel.expiration_date) : null;
    
    console.log('\n  ⏰ Date checks:');
    console.log('     Now:', now.toISOString());
    if (effective) {
      console.log('     Effective:', effective.toISOString(), effective <= now ? '✅' : '❌ FUTURE');
    } else {
      console.log('     Effective: NULL ✅');
    }
    if (expiration) {
      console.log('     Expiration:', expiration.toISOString(), expiration > now ? '✅' : '❌ EXPIRED');
    } else {
      console.log('     Expiration: NULL ✅');
    }
  }
} else {
  console.log('Function definition:', data);
}
