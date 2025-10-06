const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrg() {
  const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  
  const { data: org, error } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', targetOrgId)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Target Organization ===');
  console.log('Org ID:', org.id);
  console.log('Org Name:', org.organization_name);
  console.log('Org Code:', org.organization_code);
  
  // Find users in this org
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const orgUsers = users.filter(u => u.user_metadata?.organization_id === targetOrgId);
  
  console.log('\n=== Users in this organization ===');
  orgUsers.forEach(u => {
    console.log(`- ${u.email} (${u.user_metadata?.role || 'no role'})`);
  });
}

checkOrg().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
