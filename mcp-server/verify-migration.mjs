import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('='.repeat(80));
console.log('HERA RBAC MIGRATION - VERIFICATION & SUMMARY');
console.log('='.repeat(80));

const verifyMigration = async () => {
  // Get all MEMBER_OF relationships
  const { data: memberOfRels } = await supabase
    .from('core_relationships')
    .select('from_entity_id, organization_id, relationship_data')
    .eq('relationship_type', 'MEMBER_OF')
    .eq('is_active', true);

  // Get all HAS_ROLE relationships
  const { data: hasRoleRels } = await supabase
    .from('core_relationships')
    .select('from_entity_id, organization_id, relationship_data')
    .eq('relationship_type', 'HAS_ROLE')
    .eq('is_active', true);

  console.log(`\n📊 RELATIONSHIP COUNTS:`);
  console.log('-'.repeat(80));
  console.log(`MEMBER_OF relationships: ${memberOfRels?.length || 0}`);
  console.log(`HAS_ROLE relationships: ${hasRoleRels?.length || 0}`);

  // Check migration status
  let legacyOnly = 0;
  let migrated = 0;
  let noRole = 0;

  memberOfRels?.forEach(memberRel => {
    const hasRole = hasRoleRels?.find(
      hr => hr.from_entity_id === memberRel.from_entity_id &&
            hr.organization_id === memberRel.organization_id
    );

    if (memberRel.relationship_data?.role) {
      if (hasRole) {
        migrated++;
      } else {
        legacyOnly++;
      }
    } else {
      noRole++;
    }
  });

  console.log(`\n🔍 MIGRATION STATUS:`);
  console.log('-'.repeat(80));
  console.log(`✅ Migrated (has HAS_ROLE): ${migrated}`);
  console.log(`⚠️  Legacy Only (needs HAS_ROLE): ${legacyOnly}`);
  console.log(`⚠️  No Role in MEMBER_OF: ${noRole}`);

  // Verify primary roles
  const primaryRoles = hasRoleRels?.filter(
    rel => rel.relationship_data?.is_primary === true
  );

  console.log(`\n🎯 PRIMARY ROLES:`);
  console.log('-'.repeat(80));
  console.log(`Total HAS_ROLE relationships: ${hasRoleRels?.length || 0}`);
  console.log(`Primary roles set: ${primaryRoles?.length || 0}`);

  // Sample migrated users
  console.log(`\n📋 SAMPLE MIGRATED USERS:`);
  console.log('-'.repeat(80));

  const sampleMigrated = hasRoleRels?.slice(0, 5);
  sampleMigrated?.forEach((rel, idx) => {
    console.log(`${idx + 1}. User: ${rel.from_entity_id.substring(0, 8)}`);
    console.log(`   Org:  ${rel.organization_id.substring(0, 8)}`);
    console.log(`   Role: ${rel.relationship_data?.role_code || 'N/A'}`);
    console.log(`   Primary: ${rel.relationship_data?.is_primary || false}`);
    console.log('');
  });

  // Test role resolution
  console.log(`\n🧪 TESTING ROLE RESOLUTION:`);
  console.log('-'.repeat(80));

  const testUser = hasRoleRels?.[0];
  if (testUser) {
    const { data: resolvedRole, error } = await supabase.rpc('_hera_resolve_org_role', {
      p_actor_user_id: testUser.from_entity_id,
      p_organization_id: testUser.organization_id
    });

    if (error) {
      console.log(`❌ Role resolution failed: ${error.message}`);
    } else {
      console.log(`✅ Role resolution working:`);
      console.log(`   User: ${testUser.from_entity_id.substring(0, 8)}`);
      console.log(`   Org: ${testUser.organization_id.substring(0, 8)}`);
      console.log(`   Resolved Role: ${resolvedRole}`);
    }
  }

  console.log(`\n` + '='.repeat(80));
  console.log('✅ MIGRATION VERIFICATION COMPLETE');
  console.log('='.repeat(80));

  if (legacyOnly > 0) {
    console.log(`\n⚠️  WARNING: ${legacyOnly} users still need migration`);
    console.log('   These users have a role in MEMBER_OF but no HAS_ROLE relationship');
  }

  if (noRole > 0) {
    console.log(`\n⚠️  INFO: ${noRole} users have no role assigned`);
    console.log('   These users need to be assigned a role through hera_onboard_user_v1');
  }
};

verifyMigration().catch(console.error);
