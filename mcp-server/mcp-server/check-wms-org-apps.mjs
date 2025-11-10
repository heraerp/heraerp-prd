import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WMS_ORG_ID = '1fbab8d2-583c-44d2-8671-6d187c1ee755';

console.log('🔍 WMS Organization Apps Check\n');

const { data: org, error: orgError } = await supabase
  .from('core_organizations')
  .select('*')
  .eq('id', WMS_ORG_ID)
  .single();

if (orgError) {
  console.error('❌ Error:', orgError);
  process.exit(1);
}

console.log('📦 Organization:', org.organization_name, `(${org.organization_code})`);
console.log('\n📱 Current Apps:', JSON.stringify(org.settings?.apps || [], null, 2));

const apps = org.settings?.apps || [];

if (apps.length === 0) {
  console.log('\n❌ NO APPS - Fixing now...\n');

  const { data: updated, error: updateError } = await supabase
    .from('core_organizations')
    .update({
      settings: {
        ...org.settings,
        apps: [
          {
            code: 'WMS',
            name: 'Warehouse Management System',
            config: {}
          }
        ],
        default_app_code: 'WMS'
      }
    })
    .eq('id', WMS_ORG_ID)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Update error:', updateError);
  } else {
    console.log('✅ Fixed! New apps:', JSON.stringify(updated.settings.apps, null, 2));
  }
} else {
  console.log('\n✅ Apps already configured');
}
