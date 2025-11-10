import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWMSUser() {
  console.log('🔍 Checking wms@heraerp.com configuration...\n');

  // 1. Find user by email in metadata
  const { data: wmsUsers, error: userError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, metadata')
    .eq('entity_type', 'USER')
    .contains('metadata', { email: 'wms@heraerp.com' });

  if (userError) {
    console.error('❌ Error finding WMS user:', userError);
    return;
  }

  if (!wmsUsers || wmsUsers.length === 0) {
    console.log('❌ No user found with email wms@heraerp.com');
    return;
  }

  const wmsUser = wmsUsers[0];
  console.log('✅ WMS User Found:');
  console.log('   ID:', wmsUser.id);
  console.log('   Name:', wmsUser.entity_name);
  console.log('   Email:', wmsUser.metadata?.email);
  console.log('   Supabase UID:', wmsUser.metadata?.supabase_user_id);

  // 2. Get user's organizations using introspection RPC
  const { data: authContext, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: wmsUser.id
  });

  if (introspectError) {
    console.error('❌ Introspection error:', introspectError);
    return;
  }

  console.log('\n📊 Organizations for wms@heraerp.com:');
  console.log('   Organization Count:', authContext.organization_count);
  console.log('   Default Org ID:', authContext.default_organization_id);

  if (authContext.organizations && authContext.organizations.length > 0) {
    authContext.organizations.forEach((org, idx) => {
      console.log(`\n   [Org ${idx + 1}] ${org.name} (${org.code})`);
      console.log('      Org ID:', org.id);
      console.log('      Role:', org.primary_role);
      console.log('      Apps Count:', (org.apps || []).length);

      if (org.apps && org.apps.length > 0) {
        console.log('      Apps:');
        org.apps.forEach((app, appIdx) => {
          console.log(`        [${appIdx + 1}] ${app.name} (code: ${app.code})`);
          console.log('            Config:', JSON.stringify(app.config || {}, null, 2));
        });
      } else {
        console.log('      Apps: [] ❌ NO APPS CONFIGURED!');
      }
    });
  } else {
    console.log('   ❌ No organizations found!');
  }

  console.log('\n🔍 DIAGNOSIS:');
  console.log('   If Apps array is empty, the organization has no apps installed.');
  console.log('   Login will default to first app, or use fallback routing.');
  console.log('   Check core_organizations.settings->apps for this organization.');
}

checkWMSUser().catch(console.error);
