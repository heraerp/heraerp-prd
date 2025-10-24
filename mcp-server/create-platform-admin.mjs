import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';

console.log('🚀 Creating Platform Admin Account...\n');

async function createPlatformAdmin() {
  try {
    // Step 1: Create auth user with Supabase Auth Admin API
    console.log('📧 Creating auth user: team@hanaset.com');

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'team@hanaset.com',
      password: 'HERA2025!',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Admin',
        display_name: 'Admin'
      }
    });

    let userId;

    if (authError) {
      // Check if user already exists
      if (authError.code === 'email_exists' || authError.message?.includes('already registered')) {
        console.log('⚠️  Auth user already exists, fetching existing user...');

        // List users to find existing one
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = users.users.find(u => u.email === 'team@hanaset.com');
        if (!existingUser) {
          throw new Error('User exists but cannot be found');
        }

        console.log('✅ Found existing auth user:', existingUser.id);
        userId = existingUser.id;
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Auth user created:', authUser.user.id);
      userId = authUser.user.id;
    }

    // Step 2: Check if USER entity already exists in platform org
    console.log('\n👤 Checking for USER entity in platform org...');

    const { data: existingEntity, error: checkError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('id', userId)
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'USER')
      .single();

    if (existingEntity) {
      console.log('✅ USER entity already exists:', existingEntity.id);
      console.log('   Name:', existingEntity.entity_name);
      console.log('   Code:', existingEntity.entity_code);
    } else {
      console.log('📝 Creating USER entity in platform org...');

      // Create USER entity using direct insert (since this is platform scope)
      const { data: userEntity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          id: userId, // Match auth.users.id
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'USER',
          entity_name: 'Admin',
          entity_code: 'ADMIN_PLATFORM',
          smart_code: 'HERA.PLATFORM.USER.ENTITY.ADMIN.SYSTEM.v1',
          status: 'active',
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (entityError) {
        console.error('❌ Failed to create USER entity:', entityError);
        throw entityError;
      }

      console.log('✅ USER entity created:', userEntity.id);
    }

    // Step 3: Create PLATFORM_ADMIN role entity if it doesn't exist
    console.log('\n🎭 Checking for PLATFORM_ADMIN role entity...');

    const { data: roleEntity, error: roleCheckError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'ROLE')
      .eq('entity_code', 'PLATFORM_ADMIN')
      .single();

    let roleId;

    if (roleEntity) {
      console.log('✅ PLATFORM_ADMIN role already exists:', roleEntity.id);
      roleId = roleEntity.id;
    } else {
      console.log('📝 Creating PLATFORM_ADMIN role entity...');

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

    // Step 4: Create HAS_ROLE relationship
    console.log('\n🔗 Creating HAS_ROLE relationship...');

    const { data: relationship, error: relError} = await supabase
      .from('core_relationships')
      .upsert({
        organization_id: PLATFORM_ORG_ID,
        from_entity_id: userId,
        to_entity_id: roleId,
        relationship_type: 'HAS_ROLE',
        smart_code: 'HERA.PLATFORM.REL.USER.HASROLE.ADMIN.v1',
        relationship_data: {
          role_code: 'PLATFORM_ADMIN',
          assigned_at: new Date().toISOString()
        },
        created_by: userId,
        updated_by: userId
      }, {
        onConflict: 'organization_id,from_entity_id,to_entity_id,relationship_type'
      })
      .select()
      .single();

    if (relError) {
      console.error('❌ Failed to create HAS_ROLE relationship:', relError);
      throw relError;
    }

    console.log('✅ HAS_ROLE relationship created');

    // Step 5: Verify the setup
    console.log('\n🔍 Verifying platform admin setup...');

    const { data: verification, error: verifyError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_code,
        smart_code,
        roles:core_relationships!core_relationships_from_entity_id_fkey(
          id,
          relationship_type,
          relationship_data,
          role:to_entity_id(
            entity_name,
            entity_code
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      throw verifyError;
    }

    console.log('\n✅ Platform Admin Created Successfully!');
    console.log('\n📋 Account Details:');
    console.log('   Email:    team@hanaset.com');
    console.log('   Password: HERA2025!');
    console.log('   User ID:  ', userId);
    console.log('   Name:     ', verification.entity_name);
    console.log('   Code:     ', verification.entity_code);
    console.log('\n🎭 Roles:');
    verification.roles?.forEach(rel => {
      if (rel.relationship_type === 'HAS_ROLE') {
        console.log('   -', rel.relationship_data?.role_code || 'Unknown');
      }
    });

    console.log('\n🔐 Login Instructions:');
    console.log('   1. Navigate to your app login page');
    console.log('   2. Use email: team@hanaset.com');
    console.log('   3. Use password: HERA2025!');
    console.log('   4. This account has platform-level admin privileges');

    return {
      success: true,
      userId,
      email: 'team@hanaset.com'
    };

  } catch (error) {
    console.error('\n❌ Platform Admin Creation Failed:', error);
    throw error;
  }
}

// Execute
createPlatformAdmin()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
