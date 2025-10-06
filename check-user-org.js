const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  // Get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('\n=== Supabase Users ===\n');
  users.forEach(user => {
    console.log(`User: ${user.email}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Organization ID in metadata: ${user.user_metadata?.organization_id || 'NOT SET'}`);
    console.log(`  Role: ${user.user_metadata?.role || 'not set'}`);
    console.log('');
  });

  // Check core_entities for USER entities
  console.log('\n=== USER Entities in core_entities ===\n');
  const { data: userEntities, error: entError } = await supabase
    .from('core_entities')
    .select('id, organization_id, entity_name, entity_type')
    .or('entity_type.eq.USER,entity_type.eq.user');

  if (entError) {
    console.error('Error fetching user entities:', entError);
  } else {
    userEntities.forEach(entity => {
      console.log(`Entity: ${entity.entity_name}`);
      console.log(`  ID: ${entity.id}`);
      console.log(`  Type: ${entity.entity_type}`);
      console.log(`  Organization: ${entity.organization_id}`);
      console.log('');
    });
  }
}

checkUsers().then(() => process.exit(0));
