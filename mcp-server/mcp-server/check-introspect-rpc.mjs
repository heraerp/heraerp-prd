import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Checking hera_auth_introspect_v1 RPC function definition\n');

// Get function definition from pg_proc
const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: 'b172d7c4-92af-4595-a999-e073deda7c92'
});

console.log('Result:', JSON.stringify(data, null, 2));

// Now let's manually query what the RPC should be finding
console.log('\n\n📋 Manual query - what SHOULD the RPC find?\n');

const WMS_USER_ID = 'b172d7c4-92af-4595-a999-e073deda7c92';

// Check what relationships exist for this user
const { data: rels, error: relError } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', WMS_USER_ID)
  .eq('relationship_type', 'USER_MEMBER_OF_ORG');

console.log('Relationships found:', rels?.length || 0);

if (rels && rels.length > 0) {
  for (const rel of rels) {
    console.log('\n  Relationship:');
    console.log('    From:', rel.from_entity_id);
    console.log('    To:', rel.to_entity_id);
    console.log('    Type:', rel.relationship_type);
    console.log('    Org ID:', rel.organization_id);
    console.log('    Data:', JSON.stringify(rel.relationship_data, null, 2));

    // Get the organization
    const { data: org, error: orgErr } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', rel.to_entity_id)
      .single();

    if (org) {
      console.log('\n  Organization:');
      console.log('    Name:', org.organization_name);
      console.log('    Code:', org.organization_code);
      console.log('    Apps:', JSON.stringify(org.settings?.apps || [], null, 2));
    }
  }
}

console.log('\n\n💡 If relationships exist but RPC returns 0:');
console.log('   The RPC function may be filtering by:');
console.log('   1. Wrong relationship_type');
console.log('   2. expiration_date check (active relationships only)');
console.log('   3. Status field in relationship_data');
console.log('   4. Organization status (must be "active")');
