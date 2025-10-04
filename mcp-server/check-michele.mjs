import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMichele() {
  console.log('Checking for Michele user entity...\n');
  
  const { data: authData } = await supabase.auth.admin.listUsers();
  const micheleUsers = authData.users.filter(u => u.email && u.email.toLowerCase().includes('michele'));
  
  console.log('=== AUTH USERS WITH michele ===');
  micheleUsers.forEach(u => {
    console.log('Email:', u.email);
    console.log('Auth ID:', u.id);
  });
  
  const { data: allUsers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'user')
    .order('created_at', { ascending: false });

  console.log('\n=== ALL USER ENTITIES (' + (allUsers ? allUsers.length : 0) + ' total) ===');
  if (allUsers) {
    allUsers.forEach(u => {
      console.log('Name:', u.entity_name);
      console.log('Org:', u.organization_id);
      console.log('Metadata:', u.metadata);
      console.log('---');
    });
  }
  
  if (micheleUsers.length > 0) {
    const micheleAuthId = micheleUsers[0].id;
    console.log('\nSearching for user entity with auth_user_id:', micheleAuthId);
    
    const { data: matchedEntity, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .contains('metadata', { auth_user_id: micheleAuthId })
      .maybeSingle();
    
    console.log('\n=== MICHELE USER ENTITY ===');
    if (matchedEntity) {
      console.log('✅ FOUND!');
      console.log(JSON.stringify(matchedEntity, null, 2));
    } else {
      console.log('❌ NOT FOUND - No user entity linked to auth_user_id:', micheleAuthId);
      if (error) console.log('Error:', error);
    }
  }
}

checkMichele().catch(console.error);
