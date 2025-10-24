#!/usr/bin/env node
/**
 * Check where and how user roles are stored in the system
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const OWNER_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

async function checkRoleStorage() {
  console.log('🔍 Checking where user roles are stored...\n');

  // 1. Check Supabase Auth user_metadata
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Checking Supabase Auth user_metadata:\n');

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(OWNER_USER_ID);

  if (authError) {
    console.log('❌ Error fetching auth user:', authError.message);
  } else {
    console.log('✅ Auth User Data:');
    console.log('   Email:', authUser.user.email);
    console.log('   user_metadata:', JSON.stringify(authUser.user.user_metadata, null, 2));
    console.log('   app_metadata:', JSON.stringify(authUser.user.app_metadata, null, 2));
  }

  // 2. Check core_relationships.relationship_data
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('2. Checking core_relationships.relationship_data:\n');

  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', OWNER_USER_ID)
    .eq('to_entity_id', SALON_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF');

  if (relError) {
    console.log('❌ Error:', relError.message);
  } else if (relationships && relationships.length > 0) {
    console.log('✅ Found MEMBER_OF relationship:');
    const rel = relationships[0];
    console.log('   Relationship ID:', rel.id);
    console.log('   relationship_data:', JSON.stringify(rel.relationship_data, null, 2));
    console.log('   Metadata:', JSON.stringify(rel.metadata, null, 2));
  } else {
    console.log('⚠️  No MEMBER_OF relationships found');
  }

  // 3. Check core_dynamic_data for role
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('3. Checking core_dynamic_data for role field:\n');

  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', OWNER_USER_ID)
    .eq('organization_id', SALON_ORG_ID)
    .ilike('field_name', '%role%');

  if (dynamicError) {
    console.log('❌ Error:', dynamicError.message);
  } else if (dynamicData && dynamicData.length > 0) {
    console.log('✅ Found role in dynamic data:');
    dynamicData.forEach(field => {
      console.log(`   Field: ${field.field_name}`);
      console.log(`   Type: ${field.field_type}`);
      console.log(`   Value: ${field.field_value_text || field.field_value_number || field.field_value_boolean}`);
    });
  } else {
    console.log('⚠️  No role fields found in dynamic data');
  }

  // 4. Check core_entities for user entity metadata
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('4. Checking core_entities metadata:\n');

  const { data: userEntities, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'USER')
    .eq('id', OWNER_USER_ID);

  if (entityError) {
    console.log('❌ Error:', entityError.message);
  } else if (userEntities && userEntities.length > 0) {
    console.log('✅ Found USER entity:');
    const entity = userEntities[0];
    console.log('   Entity ID:', entity.id);
    console.log('   Entity Name:', entity.entity_name);
    console.log('   Organization ID:', entity.organization_id);
    console.log('   Metadata:', JSON.stringify(entity.metadata, null, 2));
  } else {
    console.log('⚠️  No USER entity found');
  }

  // 5. Summary and recommendations
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY - Where Roles Can Be Stored:\n');

  console.log('Option 1: Supabase Auth user_metadata');
  console.log('   ✅ Fast - cached in JWT');
  console.log('   ❌ Not organization-specific');
  console.log('   ❌ Single role per user across all orgs');
  console.log('   Current: ' + (authUser?.user?.user_metadata?.role ? '✅ HAS ROLE' : '❌ NO ROLE'));

  console.log('\nOption 2: core_relationships.relationship_data');
  console.log('   ✅ Organization-specific');
  console.log('   ✅ Multiple roles per user per org');
  console.log('   ✅ Follows HERA Sacred Six pattern');
  console.log('   Current: ' + (relationships?.[0]?.relationship_data?.role ? '✅ HAS ROLE' : '❌ NO ROLE'));

  console.log('\nOption 3: core_dynamic_data');
  console.log('   ✅ Organization-specific');
  console.log('   ✅ Flexible schema');
  console.log('   ✅ Follows HERA pattern');
  console.log('   Current: ' + (dynamicData && dynamicData.length > 0 ? '✅ HAS ROLE' : '❌ NO ROLE'));

  console.log('\nOption 4: core_entities.metadata');
  console.log('   ⚠️  Depends on organization_id of entity');
  console.log('   ⚠️  User entities in platform org (00000...) lack org context');
  console.log('   Current: ' + (userEntities?.[0]?.metadata?.role ? '✅ HAS ROLE' : '❌ NO ROLE'));

  console.log('\n💡 RECOMMENDED APPROACH:');
  console.log('   Store role in core_relationships.relationship_data');
  console.log('   This allows:');
  console.log('   - Different roles per organization');
  console.log('   - Owner in Org A, Staff in Org B');
  console.log('   - Query with single relationship lookup');
  console.log('   - Follows HERA Sacred Six architecture\n');

  console.log('═══════════════════════════════════════════════════════\n');
}

checkRoleStorage().catch(console.error);
