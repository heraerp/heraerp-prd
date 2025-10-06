const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMichele() {
  // Get michele's user record
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  const michele = users.find(u => u.email === 'michele@hairtalkz.com');
  
  if (!michele) {
    console.log('michele@hairtalkz.com not found');
    return;
  }

  console.log('\n=== michele@hairtalkz.com ===\n');
  console.log('User ID:', michele.id);
  console.log('Email:', michele.email);
  console.log('Organization ID (metadata):', michele.user_metadata?.organization_id || 'NOT SET');
  console.log('Role:', michele.user_metadata?.role || 'not set');
  
  // Check if there's a USER entity for michele
  const { data: userEntity, error: entError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', michele.id)
    .or('entity_type.eq.USER,entity_type.eq.user')
    .maybeSingle();

  if (entError) {
    console.error('\nError fetching user entity:', entError);
  } else if (userEntity) {
    console.log('\n=== USER Entity ===');
    console.log('Entity ID:', userEntity.id);
    console.log('Entity Type:', userEntity.entity_type);
    console.log('Entity Name:', userEntity.entity_name);
    console.log('Organization ID:', userEntity.organization_id);
  } else {
    console.log('\nNo USER entity found for michele');
  }

  // Check which organization this is
  if (michele.user_metadata?.organization_id) {
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', michele.user_metadata.organization_id)
      .single();

    if (org) {
      console.log('\n=== Organization Details ===');
      console.log('Org ID:', org.id);
      console.log('Org Name:', org.organization_name);
      console.log('Org Code:', org.organization_code);
    }
  }
}

checkMichele().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
