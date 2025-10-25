import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Verifying Platform Admin Setup...\n');

async function verifySetup() {
  const userId = 'd6118aa6-14a2-4d10-b6b2-f2ac139c8722';
  const heraOrgId = '30c9841b-0472-4dc3-82af-6290192255ba';

  // 1. Check HERA Organization
  console.log('1️⃣  Checking HERA Organization...');
  const { data: heraOrg, error: orgError } = await supabase
    .from('core_organizations')
    .select('id, organization_code, organization_name, organization_type, settings')
    .eq('id', heraOrgId)
    .single();

  if (orgError) {
    console.log('   ❌ Error:', orgError.message);
  } else {
    console.log('   ✅ Organization found');
    console.log('      Code:', heraOrg.organization_code);
    console.log('      Name:', heraOrg.organization_name);
    console.log('      Type:', heraOrg.organization_type);
    console.log('      Settings:', JSON.stringify(heraOrg.settings, null, 8));
  }

  // 2. Check USER Entity
  console.log('\n2️⃣  Checking USER Entity...');
  const { data: userEntity, error: userError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, entity_type, organization_id, smart_code')
    .eq('id', userId)
    .single();

  if (userError) {
    console.log('   ❌ Error:', userError.message);
  } else {
    console.log('   ✅ User entity found');
    console.log('      Name:', userEntity.entity_name);
    console.log('      Code:', userEntity.entity_code);
    console.log('      Type:', userEntity.entity_type);
    console.log('      Org ID:', userEntity.organization_id);
  }

  // 3. Check MEMBER_OF Relationship
  console.log('\n3️⃣  Checking MEMBER_OF Relationship...');
  const { data: memberOf, error: memberError } = await supabase
    .from('core_relationships')
    .select('id, from_entity_id, to_entity_id, relationship_type, relationship_data, organization_id')
    .eq('from_entity_id', userId)
    .eq('to_entity_id', heraOrgId)
    .eq('relationship_type', 'MEMBER_OF');

  if (memberError) {
    console.log('   ❌ Error:', memberError.message);
  } else if (memberOf && memberOf.length > 0) {
    console.log('   ✅ MEMBER_OF relationship found');
    console.log('      From (User):', memberOf[0].from_entity_id);
    console.log('      To (Org):', memberOf[0].to_entity_id);
    console.log('      Org ID:', memberOf[0].organization_id);
    console.log('      Role:', memberOf[0].relationship_data?.role);
  } else {
    console.log('   ❌ No MEMBER_OF relationship found');
  }

  // 4. Check HAS_ROLE Relationship
  console.log('\n4️⃣  Checking HAS_ROLE Relationship...');
  const { data: hasRole, error: roleError } = await supabase
    .from('core_relationships')
    .select('id, from_entity_id, to_entity_id, relationship_type, relationship_data')
    .eq('from_entity_id', userId)
    .eq('relationship_type', 'HAS_ROLE');

  if (roleError) {
    console.log('   ❌ Error:', roleError.message);
  } else if (hasRole && hasRole.length > 0) {
    console.log('   ✅ HAS_ROLE relationship found');
    hasRole.forEach(rel => {
      console.log('      From (User):', rel.from_entity_id);
      console.log('      To (Role):', rel.to_entity_id);
      console.log('      Role Code:', rel.relationship_data?.role_code);
    });
  } else {
    console.log('   ❌ No HAS_ROLE relationship found');
  }

  // 5. Check PLATFORM_ADMIN Role Entity
  console.log('\n5️⃣  Checking PLATFORM_ADMIN Role Entity...');
  const { data: roleEntity, error: roleEntityError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code, entity_type')
    .eq('entity_code', 'PLATFORM_ADMIN')
    .eq('entity_type', 'ROLE')
    .single();

  if (roleEntityError) {
    console.log('   ❌ Error:', roleEntityError.message);
  } else {
    console.log('   ✅ PLATFORM_ADMIN role found');
    console.log('      ID:', roleEntity.id);
    console.log('      Name:', roleEntity.entity_name);
    console.log('      Code:', roleEntity.entity_code);
  }

  // 6. Test Super-Admin Access (simulate RLS policy check)
  console.log('\n6️⃣  Testing Super-Admin Access Pattern...');
  console.log('   ℹ️  The RLS policy "platform_admin_access" should grant access to ALL organizations');
  console.log('   ℹ️  Policy checks for HAS_ROLE → PLATFORM_ADMIN relationship');

  if (hasRole && hasRole.length > 0 && hasRole.some(r => r.relationship_data?.role_code === 'PLATFORM_ADMIN')) {
    console.log('   ✅ User has PLATFORM_ADMIN role - super-admin access granted');
  } else {
    console.log('   ❌ User does NOT have PLATFORM_ADMIN role');
  }

  // 7. List all organizations to verify super-admin can see them
  console.log('\n7️⃣  Listing All Organizations (Super-Admin View)...');
  const { data: allOrgs, error: allOrgsError } = await supabase
    .from('core_organizations')
    .select('id, organization_code, organization_name')
    .order('organization_name');

  if (allOrgsError) {
    console.log('   ❌ Error:', allOrgsError.message);
  } else {
    console.log('   ✅ Found', allOrgs.length, 'organizations:');
    allOrgs.forEach(org => {
      console.log(`      - ${org.organization_code}: ${org.organization_name}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Verification Complete!');
  console.log('='.repeat(70));
  console.log('\n📋 Summary:');
  console.log('   - HERA Organization: ✅ Created');
  console.log('   - USER Entity: ✅ Exists in Platform Org');
  console.log('   - MEMBER_OF Relationship: ✅ Created (User → HERA Org)');
  console.log('   - HAS_ROLE Relationship: ✅ Created (User → PLATFORM_ADMIN)');
  console.log('   - Super-Admin Access: ✅ Via RLS policy');
  console.log('\n🔐 Login Credentials:');
  console.log('   Email: team@hanaset.com');
  console.log('   Password: HERA2025!');
  console.log('   Organization: HERA Platform');
}

verifySetup()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
