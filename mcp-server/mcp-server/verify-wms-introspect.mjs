import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WMS_USER_ID = 'b172d7c4-92af-4595-a999-e073deda7c92';

console.log('🔐 Testing hera_auth_introspect_v1 for WMS user\n');

const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: WMS_USER_ID
});

if (introspectError) {
  console.error('❌ Introspection error:', introspectError);
  process.exit(1);
}

console.log('✅ Introspection Result:\n');
console.log('   Organization Count:', authContext.organization_count);
console.log('   Default Org ID:', authContext.default_organization_id || 'N/A');

if (authContext.organizations && authContext.organizations.length > 0) {
  console.log('\n✅ Organizations:\n');
  authContext.organizations.forEach((org, idx) => {
    console.log(`   [${idx + 1}] ${org.name} (${org.code})`);
    console.log('       Org ID:', org.id);
    console.log('       Role:', org.primary_role);
    console.log('       Apps:', JSON.stringify(org.apps, null, 2));
  });

  if (authContext.organizations[0].apps && authContext.organizations[0].apps.length > 0) {
    const firstApp = authContext.organizations[0].apps[0];
    console.log(`\n✅ LOGIN WILL ROUTE TO: /${firstApp.code.toLowerCase()}/dashboard`);
  } else {
    console.log('\n❌ Still no apps - check hera_auth_introspect_v1 RPC function');
  }
} else {
  console.log('\n❌ Still returning 0 organizations!');
  console.log('\nThis means hera_auth_introspect_v1 is not finding the relationship.');
  console.log('Relationship type should be USER_MEMBER_OF_ORG (which it is).');
}
