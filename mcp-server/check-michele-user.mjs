import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkMichele() {
  // Check for USER entities
  const { data: userEntities, error: userError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'user')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log('\n=== ALL USER ENTITIES (last 20) ===');
  if (userEntities) {
    userEntities.forEach(u => {
      console.log(`- ${u.entity_name} | Org: ${u.organization_id} | Created: ${u.created_at}`);
      console.log(`  Metadata:`, u.metadata);
    });
  }
  
  // Check auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  
  console.log('\n=== AUTH USERS WITH "michele" ===');
  const micheleUsers = authData.users.filter(u => u.email?.toLowerCase().includes('michele'));
  micheleUsers.forEach(u => {
    console.log(`Email: ${u.email}, Auth ID: ${u.id}`);
  });
  
  // Check for entities with michele auth_user_id in metadata
  if (micheleUsers.length > 0) {
    const micheleAuthId = micheleUsers[0].id;
    console.log(`\n=== USER ENTITY WITH auth_user_id: ${micheleAuthId} ===`);
    
    const { data: matchedEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .contains('metadata', { auth_user_id: micheleAuthId });
    
    if (matchedEntities && matchedEntities.length > 0) {
      console.log('FOUND:', JSON.stringify(matchedEntities[0], null, 2));
    } else {
      console.log('NOT FOUND - No user entity with this auth_user_id');
    }
  }
}

checkMichele().catch(console.error);
