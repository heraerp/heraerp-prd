import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const ADMIN_EMAIL = 'team@hanaset.com';
const ADMIN_PASSWORD = 'HERA2025!';
const ADMIN_NAME = 'Admin';

console.log('🚀 Creating HERA Organization with Platform Super-Admin...\n');

async function createHERAOrganizationAdmin() {
  try {
    // ============================================================================
    // STEP 1: Get or Create Auth User
    // ============================================================================
    console.log('📧 Step 1: Getting auth user...');

    let userId;
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingAuthUser = users.users.find(u => u.email === ADMIN_EMAIL);

    if (existingAuthUser) {
      console.log('✅ Found existing auth user:', existingAuthUser.id);
      userId = existingAuthUser.id;
    } else {
      console.log('📝 Creating new auth user...');
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: ADMIN_NAME,
          display_name: ADMIN_NAME
        }
      });

      if (authError) throw authError;
      userId = authUser.user.id;
      console.log('✅ Auth user created:', userId);
    }

    // ============================================================================
    // STEP 2: Create HERA Organization
    // ============================================================================
    console.log('\n🏢 Step 2: Creating HERA Organization...');

    // Check if HERA org already exists
    const { data: existingOrg, error: checkOrgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .eq('organization_code', 'HERA')
      .single();

    let heraOrgId;

    if (existingOrg) {
      console.log('✅ HERA organization already exists:', existingOrg.id);
      console.log('   Name:', existingOrg.organization_name);
      heraOrgId = existingOrg.id;
    } else {
      const { data: heraOrg, error: orgError } = await supabase
        .from('core_organizations')
        .insert({
          organization_code: 'HERA',
          organization_name: 'HERA Platform',
          organization_type: 'platform_management',
          industry_classification: 'technology',
          status: 'active',
          settings: {
            is_platform_org: true,
            manages_catalog: true,
            super_admin_org: true
          },
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (orgError) {
        console.error('❌ Failed to create HERA organization:', orgError);
        throw orgError;
      }

      heraOrgId = heraOrg.id;
      console.log('✅ HERA organization created:', heraOrgId);
    }

    // ============================================================================
    // STEP 3: Create ORG Entity Shadow
    // ============================================================================
    console.log('\n👤 Step 3: Creating ORG entity shadow...');

    const { data: existingOrgEntity, error: checkOrgEntityError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('id', heraOrgId)
      .eq('entity_type', 'ORGANIZATION')
      .single();

    if (existingOrgEntity) {
      console.log('✅ ORG entity shadow already exists:', existingOrgEntity.id);
    } else {
      const { data: orgEntity, error: orgEntityError } = await supabase
        .from('core_entities')
        .insert({
          id: heraOrgId,
          organization_id: heraOrgId,
          entity_type: 'ORGANIZATION',
          entity_name: 'HERA Platform',
          entity_code: 'HERA',
          smart_code: 'HERA.PLATFORM.ORGANIZATION.ENTITY.MANAGEMENT.SYSTEM.v1',
          status: 'active',
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (orgEntityError) {
        console.error('❌ Failed to create ORG entity:', orgEntityError);
        throw orgEntityError;
      }

      console.log('✅ ORG entity shadow created:', orgEntity.id);
    }

    // ============================================================================
    // STEP 4: Create or Verify USER Entity in Platform Org
    // ============================================================================
    console.log('\n👤 Step 4: Creating/verifying USER entity...');

    const { data: existingUserEntity, error: checkUserError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('id', userId)
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'USER')
      .single();

    if (existingUserEntity) {
      console.log('✅ USER entity already exists:', existingUserEntity.id);
      console.log('   Name:', existingUserEntity.entity_name);
    } else {
      const { data: userEntity, error: userEntityError } = await supabase
        .from('core_entities')
        .insert({
          id: userId,
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'USER',
          entity_name: ADMIN_NAME,
          entity_code: 'ADMIN_PLATFORM',
          smart_code: 'HERA.PLATFORM.USER.ENTITY.ADMIN.SYSTEM.v1',
          status: 'active',
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (userEntityError) {
        console.error('❌ Failed to create USER entity:', userEntityError);
        throw userEntityError;
      }

      console.log('✅ USER entity created:', userEntity.id);
    }

    // ============================================================================
    // STEP 5: Create or Verify PLATFORM_ADMIN Role Entity
    // ============================================================================
    console.log('\n🎭 Step 5: Creating/verifying PLATFORM_ADMIN role...');

    const { data: existingRole, error: checkRoleError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'ROLE')
      .eq('entity_code', 'PLATFORM_ADMIN')
      .single();

    let roleId;

    if (existingRole) {
      console.log('✅ PLATFORM_ADMIN role already exists:', existingRole.id);
      roleId = existingRole.id;
    } else {
      const { data: newRole, error: roleError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'ROLE',
          entity_name: 'Platform Administrator',
          entity_code: 'PLATFORM_ADMIN',
          smart_code: 'HERA.PLATFORM.ROLE.ENTITY.ADMIN.SYSTEM.v1',
          status: 'active',
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (roleError) {
        console.error('❌ Failed to create PLATFORM_ADMIN role:', roleError);
        throw roleError;
      }

      roleId = newRole.id;
      console.log('✅ PLATFORM_ADMIN role created:', roleId);
    }

    // ============================================================================
    // STEP 6: Create MEMBER_OF Relationship (USER → HERA ORG)
    // ============================================================================
    console.log('\n🔗 Step 6: Creating MEMBER_OF relationship...');

    const { data: existingMembership, error: checkMemberError } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('from_entity_id', userId)
      .eq('to_entity_id', heraOrgId)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    if (existingMembership) {
      console.log('✅ MEMBER_OF relationship already exists');
    } else {
      const { data: memberRel, error: memberError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: heraOrgId,
          from_entity_id: userId,
          to_entity_id: heraOrgId,
          relationship_type: 'MEMBER_OF',
          smart_code: 'HERA.PLATFORM.REL.MEMBER_OF.USER.v1',
          relationship_data: {
            role: 'platform_admin',
            assigned_at: new Date().toISOString()
          },
          is_active: true,
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (memberError) {
        console.error('❌ Failed to create MEMBER_OF relationship:', memberError);
        throw memberError;
      }

      console.log('✅ MEMBER_OF relationship created');
    }

    // ============================================================================
    // STEP 7: Create HAS_ROLE Relationship (USER → PLATFORM_ADMIN ROLE)
    // ============================================================================
    console.log('\n🔗 Step 7: Creating HAS_ROLE relationship...');

    const { data: existingRoleRel, error: checkRoleRelError } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('from_entity_id', userId)
      .eq('to_entity_id', roleId)
      .eq('relationship_type', 'HAS_ROLE')
      .single();

    if (existingRoleRel) {
      console.log('✅ HAS_ROLE relationship already exists');
    } else {
      const { data: roleRel, error: roleRelError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: heraOrgId,
          from_entity_id: userId,
          to_entity_id: roleId,
          relationship_type: 'HAS_ROLE',
          smart_code: 'HERA.PLATFORM.REL.USER.HASROLE.ADMIN.v1',
          relationship_data: {
            role_code: 'PLATFORM_ADMIN',
            assigned_at: new Date().toISOString()
          },
          is_active: true,
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (roleRelError) {
        console.error('❌ Failed to create HAS_ROLE relationship:', roleRelError);
        throw roleRelError;
      }

      console.log('✅ HAS_ROLE relationship created');
    }

    // ============================================================================
    // STEP 8: Verification
    // ============================================================================
    console.log('\n🔍 Step 8: Verifying setup...');

    const { data: verification, error: verifyError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_code,
        smart_code,
        memberships:core_relationships!core_relationships_from_entity_id_fkey(
          id,
          relationship_type,
          relationship_data,
          organization:to_entity_id(
            organization_name,
            organization_code
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.warn('⚠️  Verification query failed (this is OK):', verifyError.message);
    }

    // Verify MEMBER_OF relationship
    const { data: membershipCheck, error: membershipCheckError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, relationship_data')
      .eq('from_entity_id', userId)
      .eq('to_entity_id', heraOrgId)
      .eq('relationship_type', 'MEMBER_OF');

    // Verify HAS_ROLE relationship
    const { data: roleCheck, error: roleCheckError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, relationship_data')
      .eq('from_entity_id', userId)
      .eq('to_entity_id', roleId)
      .eq('relationship_type', 'HAS_ROLE');

    console.log('\n✅ Platform Super-Admin Created Successfully!');
    console.log('\n' + '='.repeat(70));
    console.log('📋 SETUP SUMMARY');
    console.log('='.repeat(70));
    console.log('\n🏢 Organization:');
    console.log('   ID:   ', heraOrgId);
    console.log('   Code: ', 'HERA');
    console.log('   Name: ', 'HERA Platform');
    console.log('   Type: ', 'platform_management');

    console.log('\n👤 Admin User:');
    console.log('   Email:    ', ADMIN_EMAIL);
    console.log('   Password: ', ADMIN_PASSWORD);
    console.log('   User ID:  ', userId);
    console.log('   Name:     ', ADMIN_NAME);

    console.log('\n🔗 Relationships:');
    console.log('   MEMBER_OF: ', membershipCheck?.length > 0 ? '✅ Created' : '❌ Missing');
    if (membershipCheck?.length > 0) {
      console.log('   - Role:', membershipCheck[0].relationship_data?.role);
    }
    console.log('   HAS_ROLE:  ', roleCheck?.length > 0 ? '✅ Created' : '❌ Missing');
    if (roleCheck?.length > 0) {
      console.log('   - Code:', roleCheck[0].relationship_data?.role_code);
    }

    console.log('\n🛡️  Super-Admin Access:');
    console.log('   RLS Policy: platform_admin_access (deployed in Supabase)');
    console.log('   Grants:     Access to ALL organizations');
    console.log('   Functions:  App catalog management, platform operations');

    console.log('\n🔐 Login Instructions:');
    console.log('   1. Navigate to your app login page');
    console.log('   2. Use email:    team@hanaset.com');
    console.log('   3. Use password: HERA2025!');
    console.log('   4. Select organization: HERA Platform');
    console.log('   5. Super-admin access is automatically granted via RLS');

    console.log('\n📚 Available Operations:');
    console.log('   - hera_app_catalog_register_v1 (register new apps)');
    console.log('   - hera_app_catalog_update_pages_v1 (update catalog pages)');
    console.log('   - hera_app_install_for_org_v1 (install apps for tenants)');
    console.log('   - hera_permissions_ensure_pages_v1 (manage page permissions)');
    console.log('   - hera_role_set_pages_v1 (set role permissions)');
    console.log('   - hera_org_custom_page_upsert_v1 (create custom pages)');

    console.log('\n' + '='.repeat(70));

    return {
      success: true,
      userId,
      heraOrgId,
      roleId,
      email: ADMIN_EMAIL
    };

  } catch (error) {
    console.error('\n❌ Platform Super-Admin Creation Failed:', error);
    throw error;
  }
}

// Execute
createHERAOrganizationAdmin()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
