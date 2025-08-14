#!/usr/bin/env node

/**
 * Test HERA Trigger Functionality
 * Tests if the trigger creates entities for new users
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTriggerFunctionality() {
  console.log('🧪 Testing HERA User Creation Trigger')
  console.log('====================================')

  try {
    // 1. Check if trigger exists
    console.log('\\n1. Checking trigger configuration...')
    
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          trigger_schema,
          event_object_table
        FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created';
      `
    })

    if (triggerError) {
      console.log('⚠️  Could not check trigger (expected):', triggerError.message)
    } else {
      console.log('✅ Trigger configuration found')
    }

    // 2. Test with existing user who has tokens
    console.log('\\n2. Testing with user from auth tokens...')
    
    const testUserId = '39f9fe72-3deb-4321-8cb1-abe5ab1b7c8f' // From your auth token
    
    // Check if this user has HERA entities
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        organization_id,
        metadata
      `)
      .eq('id', testUserId)
      .eq('entity_type', 'user')
      .single()

    if (entityError) {
      console.log('❌ User entity not found for token user')
      console.log('   User ID:', testUserId)
      console.log('   Error:', entityError.message)
      
      // Try to manually trigger entity creation
      console.log('\\n🔧 Attempting manual entity creation...')
      
      // Get user info from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUserId)
      
      if (authError) {
        console.log('❌ Could not find auth user:', authError.message)
        return false
      }
      
      console.log('✅ Auth user found:', {
        email: authUser.user.email,
        name: authUser.user.user_metadata?.name,
        organization: authUser.user.user_metadata?.organization_name
      })
      
      // Manually create the entities that should have been created by trigger
      await createManualEntities(testUserId, authUser.user)
      
    } else {
      console.log('✅ User entity found:', {
        id: userEntity.id,
        name: userEntity.entity_name,
        code: userEntity.entity_code,
        smart_code: userEntity.smart_code,
        organization_id: userEntity.organization_id
      })
      
      // Check organization
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', userEntity.organization_id)
        .single()
        
      if (!orgError) {
        console.log('✅ Organization found:', {
          name: org.organization_name,
          code: org.organization_code,
          type: org.organization_type
        })
      }
      
      // Check membership
      const { data: membership, error: memberError } = await supabase
        .from('core_memberships')
        .select('*')
        .eq('user_id', testUserId)
        .single()
        
      if (!memberError) {
        console.log('✅ Membership found:', {
          role: membership.role,
          permissions: membership.permissions,
          status: membership.status
        })
      }
      
      // Check dynamic data
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', testUserId)
        
      if (!dynamicError) {
        console.log(`✅ Dynamic data found (${dynamicData.length} fields):`)
        dynamicData.forEach(field => {
          console.log(`   - ${field.field_name}: ${field.field_value}`)
        })
      }
    }

    // 3. Test creating a new user to see if trigger fires
    console.log('\\n3. Testing trigger with new user creation...')
    
    const testEmail = `test-trigger-${Date.now()}@hera-test.com`
    const testPassword = 'HERATest123!'
    
    console.log(`Creating test user: ${testEmail}`)
    
    const { data: newAuthData, error: newAuthError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        name: 'Test Trigger User',
        organization_name: 'Test Trigger Organization',
        role: 'admin',
        industry: 'testing'
      }
    })

    if (newAuthError) {
      console.log('❌ Could not create test user:', newAuthError.message)
      return false
    }

    const newUserId = newAuthData.user.id
    console.log(`✅ Test user created with ID: ${newUserId}`)

    // Wait for trigger to execute
    console.log('⏳ Waiting for trigger to execute...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check if HERA entities were created
    const { data: newUserEntity, error: newEntityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', newUserId)
      .eq('entity_type', 'user')
      .single()

    if (newEntityError) {
      console.log('❌ Trigger did not create user entity')
      console.log('   Error:', newEntityError.message)
      
      // Try manual creation for the new user
      await createManualEntities(newUserId, newAuthData.user)
      
    } else {
      console.log('✅ Trigger successfully created user entity!')
      console.log('   Entity:', {
        id: newUserEntity.id,
        name: newUserEntity.entity_name,
        code: newUserEntity.entity_code,
        organization_id: newUserEntity.organization_id
      })
    }

    // Cleanup test user
    console.log('\\n4. Cleaning up test user...')
    await supabase.auth.admin.deleteUser(newUserId)
    console.log('✅ Test user cleaned up')

    return true

  } catch (error) {
    console.error('❌ Trigger test failed:', error)
    return false
  }
}

async function createManualEntities(userId, authUser) {
  console.log('🔧 Creating HERA entities manually...')
  
  try {
    const orgName = authUser.user_metadata?.organization_name || 'Default Organization'
    const userName = authUser.user_metadata?.name || authUser.email.split('@')[0]
    
    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: orgName,
        organization_code: `ORG-${Date.now()}-${userId.substring(0, 8)}`,
        organization_type: 'business_unit',
        industry_classification: authUser.user_metadata?.industry || 'general',
        status: 'active',
        created_by: userId
      })
      .select()
      .single()

    if (orgError) {
      console.log('❌ Could not create organization:', orgError.message)
      return false
    }

    console.log('✅ Organization created:', org.organization_name)

    // Create user entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: userId,
        organization_id: org.id,
        entity_type: 'user',
        entity_name: userName,
        entity_code: `USER-${Date.now()}-${userId.substring(0, 8)}`,
        smart_code: 'HERA.USER.PROFILE.v1',
        status: 'active',
        created_by: userId
      })
      .select()
      .single()

    if (entityError) {
      console.log('❌ Could not create user entity:', entityError.message)
      return false
    }

    console.log('✅ User entity created:', entity.entity_name)

    // Create membership
    const { error: membershipError } = await supabase
      .from('core_memberships')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: authUser.user_metadata?.role || 'admin',
        permissions: ['entities:*', 'transactions:*', 'reports:*', 'settings:*'],
        status: 'active',
        created_by: userId
      })

    if (membershipError) {
      console.log('❌ Could not create membership:', membershipError.message)
      return false
    }

    console.log('✅ Membership created')

    // Create dynamic data
    const dynamicFields = [
      { field_name: 'email', field_value: authUser.email, field_type: 'text' },
      { field_name: 'auth_provider', field_value: 'supabase', field_type: 'text' },
      { field_name: 'full_name', field_value: userName, field_type: 'text' },
      { field_name: 'setup_date', field_value: new Date().toISOString(), field_type: 'datetime' }
    ]

    for (const field of dynamicFields) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: userId,
          field_name: field.field_name,
          field_value: field.field_value,
          field_type: field.field_type,
          created_by: userId
        })
    }

    console.log('✅ Dynamic data created')
    console.log('✅ Manual entity creation completed!')

    return true

  } catch (error) {
    console.log('❌ Manual entity creation failed:', error.message)
    return false
  }
}

if (require.main === module) {
  testTriggerFunctionality()
}