import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function fixAllStaffSmartCodes() {
  console.log('Finding all STAFF entities with lowercase .v1 smart codes...\n');

  // Find all staff with lowercase .v1
  const { data: staffList, error: queryError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, smart_code')
    .eq('entity_type', 'STAFF')
    .eq('organization_id', ORG_ID)
    .like('smart_code', '%.v1');

  if (queryError) {
    console.error('❌ Query error:', queryError);
    return;
  }

  const count = staffList ? staffList.length : 0;
  console.log(`Found ${count} staff entities with lowercase .v1:\n`);

  if (!staffList || staffList.length === 0) {
    console.log('✅ No staff entities need fixing!');
    return;
  }

  // Fix each one using RPC
  for (const staff of staffList) {
    const fixedSmartCode = staff.smart_code.replace(/\.v1$/, '.V1');

    console.log(`Fixing: ${staff.entity_name}`);
    console.log(`  Old: ${staff.smart_code}`);
    console.log(`  New: ${fixedSmartCode}`);

    const { data: result, error } = await supabase.rpc('hera_entity_upsert_v1', {
      p_organization_id: ORG_ID,
      p_entity_type: 'STAFF',
      p_entity_name: staff.entity_name,
      p_smart_code: fixedSmartCode,
      p_entity_id: staff.id,
      p_entity_code: null,
      p_entity_description: null,
      p_parent_entity_id: null,
      p_status: null,
      p_tags: null,
      p_smart_code_status: null,
      p_business_rules: null,
      p_metadata: null,
      p_ai_confidence: null,
      p_ai_classification: null,
      p_ai_insights: null,
      p_actor_user_id: ACTOR_USER_ID
    });

    if (error) {
      console.error(`  ❌ Error:`, error.message);
    } else {
      console.log(`  ✅ Fixed!`);
    }
    console.log('');
  }

  console.log('\n✅ All staff smart codes fixed!');
}

fixAllStaffSmartCodes().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
