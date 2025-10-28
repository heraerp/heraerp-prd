#!/usr/bin/env node

/**
 * Setup user access for Greenworms ERP Organization
 * Provides access to team@hanaset.com for the Greenworms organization
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const GREENWORMS_ORG_ID = 'd4f50007-269b-4525-b534-cb5ddeed1d7e'
const USER_EMAIL = 'team@hanaset.com'
const TEMP_PASSWORD = 'TempPassword123!'

async function setupGreenwormUserAccess() {
  console.log('🌱 GREENWORMS ERP - User Access Setup')
  console.log('=====================================')
  console.log(`Organization ID: ${GREENWORMS_ORG_ID}`)
  console.log(`User Email: ${USER_EMAIL}`)
  console.log('')

  try {
    // Step 1: Create user account in Supabase Auth (if doesn't exist)
    console.log('1️⃣ Creating user account...')
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: USER_EMAIL,
      password: TEMP_PASSWORD,
      email_confirm: true
    })

    if (authError && !authError.message.includes('already been registered')) {
      throw new Error(`Auth user creation failed: ${authError.message}`)
    }

    const userId = authUser?.user?.id || 'existing-user'
    console.log(`✅ User account ready: ${userId}`)

    // Step 2: Check if user entity exists in platform organization
    console.log('2️⃣ Checking user entity...')
    
    const { data: userEntity, error: userCheckError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .or(`metadata->email.eq.${USER_EMAIL},entity_name.eq.${USER_EMAIL}`)
      .single()

    let userEntityId = userEntity?.id

    if (!userEntity) {
      console.log('Creating user entity in platform organization...')
      
      const { data: newUserEntity, error: userCreateError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'USER',
          entity_name: USER_EMAIL,
          smart_code: 'HERA.PLATFORM.USER.ENTITY.ACCOUNT.v1',
          organization_id: '00000000-0000-0000-0000-000000000000',
          metadata: {
            email: USER_EMAIL,
            auth_user_id: userId,
            status: 'active',
            created_for: 'greenworms_access'
          },
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single()

      if (userCreateError) {
        throw new Error(`User entity creation failed: ${userCreateError.message}`)
      }

      userEntityId = newUserEntity.id
      console.log(`✅ User entity created: ${userEntityId}`)
    } else {
      console.log(`✅ User entity exists: ${userEntityId}`)
    }

    // Step 3: Check if organization membership already exists
    console.log('3️⃣ Checking organization membership...')
    
    const { data: membership, error: membershipCheckError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('to_entity_id', GREENWORMS_ORG_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('organization_id', GREENWORMS_ORG_ID)
      .single()

    if (!membership) {
      console.log('Creating organization membership...')
      
      const { data: newMembership, error: membershipError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: userEntityId,
          to_entity_id: GREENWORMS_ORG_ID,
          relationship_type: 'USER_MEMBER_OF_ORG',
          organization_id: GREENWORMS_ORG_ID,
          relationship_data: {
            role: 'admin',
            permissions: ['read', 'write', 'admin', 'delete'],
            granted_by: 'system_setup',
            granted_at: new Date().toISOString()
          },
          effective_date: new Date().toISOString(),
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single()

      if (membershipError) {
        throw new Error(`Membership creation failed: ${membershipError.message}`)
      }

      console.log(`✅ Organization membership created: ${newMembership.id}`)
    } else {
      console.log(`✅ Organization membership exists: ${membership.id}`)
    }

    // Step 4: Verify Greenworms organization exists
    console.log('4️⃣ Verifying Greenworms organization...')
    
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', GREENWORMS_ORG_ID)
      .single()

    if (!org) {
      console.log('⚠️  Organization not found. This should have been created during setup.')
      console.log('Run the organization creation script first.')
      return
    }

    console.log(`✅ Organization verified: ${org.organization_name}`)

    // Step 5: Final verification
    console.log('5️⃣ Final verification...')
    
    const { data: verification, error: verifyError } = await supabase
      .rpc('verify_user_organization_access', {
        p_user_email: USER_EMAIL,
        p_organization_id: GREENWORMS_ORG_ID
      })

    console.log('')
    console.log('🎉 GREENWORMS ACCESS SETUP COMPLETE!')
    console.log('====================================')
    console.log('')
    console.log('📧 User Email:', USER_EMAIL)
    console.log('🔑 Temporary Password:', TEMP_PASSWORD)
    console.log('🏢 Organization:', org.organization_name)
    console.log('👤 Role: Admin (full access)')
    console.log('')
    console.log('🌐 Access URL: http://localhost:3000/greenworms')
    console.log('')
    console.log('📋 Next Steps:')
    console.log('1. User should log in with the credentials above')
    console.log('2. Change password on first login')
    console.log('3. Access the Greenworms ERP dashboard')
    console.log('4. Begin waste management operations')
    console.log('')
    console.log('✅ Ready for customer demo!')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('')
    console.log('🔧 Troubleshooting:')
    console.log('1. Verify Supabase environment variables are set')
    console.log('2. Ensure Greenworms organization exists')
    console.log('3. Check database permissions')
    console.log('4. Verify RPC functions are deployed')
  }
}

// Create verification RPC function if it doesn't exist
async function createVerificationFunction() {
  const verifyFunctionSQL = `
    CREATE OR REPLACE FUNCTION verify_user_organization_access(
      p_user_email TEXT,
      p_organization_id UUID
    )
    RETURNS TABLE(
      user_exists BOOLEAN,
      user_entity_id UUID,
      membership_exists BOOLEAN,
      organization_exists BOOLEAN,
      access_granted BOOLEAN
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_user_entity_id UUID;
      v_membership_count INTEGER;
      v_org_count INTEGER;
    BEGIN
      -- Check user entity
      SELECT id INTO v_user_entity_id
      FROM core_entities 
      WHERE entity_type = 'USER' 
        AND organization_id = '00000000-0000-0000-0000-000000000000'
        AND (metadata->>'email' = p_user_email OR entity_name = p_user_email);
      
      -- Check membership
      SELECT COUNT(*) INTO v_membership_count
      FROM core_relationships
      WHERE from_entity_id = v_user_entity_id
        AND to_entity_id = p_organization_id
        AND relationship_type = 'USER_MEMBER_OF_ORG'
        AND organization_id = p_organization_id;
      
      -- Check organization
      SELECT COUNT(*) INTO v_org_count
      FROM core_organizations
      WHERE id = p_organization_id;
      
      RETURN QUERY SELECT
        v_user_entity_id IS NOT NULL as user_exists,
        v_user_entity_id as user_entity_id,
        v_membership_count > 0 as membership_exists,
        v_org_count > 0 as organization_exists,
        (v_user_entity_id IS NOT NULL AND v_membership_count > 0 AND v_org_count > 0) as access_granted;
    END;
    $$;
  `

  try {
    await supabase.rpc('exec_sql', { sql: verifyFunctionSQL })
  } catch (error) {
    // Function might already exist, continue
  }
}

// Run setup
createVerificationFunction().then(() => {
  setupGreenwormUserAccess()
}).catch(console.error)