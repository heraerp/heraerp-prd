/**
 * Final verification of user setup
 * Check all components are in place for authentication
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '2300a665-6650-4f4c-8e85-c1a7e8f2973d'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function finalUserVerification() {
  console.log('🔍 Final user authentication setup verification')
  console.log('User ID:', userId)
  console.log('Email: live@hairtalkz.com')
  console.log('Organization ID:', orgId)
  
  try {
    // 1. Check auth system
    console.log('\n1️⃣ AUTH SYSTEM CHECK')
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
    
    if (authUser) {
      console.log('✅ User exists in auth system')
      console.log('   Email:', authUser.email)
      console.log('   Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No')
      console.log('   Last Sign In:', authUser.last_sign_in_at || 'Never')
    } else {
      console.log('❌ User NOT found in auth system')
      return false
    }
    
    // 2. Check platform user entity
    console.log('\n2️⃣ PLATFORM USER ENTITY CHECK')
    const { data: platformUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    if (platformUser) {
      console.log('✅ Platform USER entity exists')
      console.log('   Name:', platformUser.entity_name)
      console.log('   Smart Code:', platformUser.smart_code)
    } else {
      console.log('❌ Platform USER entity missing')
    }
    
    // 3. Check tenant user entity
    console.log('\n3️⃣ TENANT USER ENTITY CHECK')
    const { data: tenantUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'USER')
      .maybeSingle()
    
    if (tenantUser) {
      console.log('✅ Tenant USER entity exists')
      console.log('   Name:', tenantUser.entity_name)
      console.log('   Smart Code:', tenantUser.smart_code)
      console.log('   Created:', tenantUser.created_at)
    } else {
      console.log('❌ Tenant USER entity missing - THIS IS THE ISSUE!')
      
      // Try to create it
      console.log('\n🔧 Attempting to create tenant USER entity...')
      const userName = authUser.email?.split('@')[0] || 'User'
      
      const { data: newTenantUser, error: createError } = await supabase
        .from('core_entities')
        .insert({
          id: userId,
          organization_id: orgId,
          entity_type: 'USER',
          entity_name: userName,
          smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1',
          created_by: userId,
          updated_by: userId,
          metadata: {
            email: authUser.email,
            source: 'final_verification_fix'
          }
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Failed to create tenant USER entity:', createError.message)
        if (createError.code === '23505') {
          console.log('   Entity already exists - checking again...')
          
          const { data: existingTenantUser } = await supabase
            .from('core_entities')
            .select('*')
            .eq('id', userId)
            .eq('organization_id', orgId)
            .eq('entity_type', 'USER')
            .maybeSingle()
          
          if (existingTenantUser) {
            console.log('✅ Found existing tenant USER entity')
            console.log('   Name:', existingTenantUser.entity_name)
          }
        }
      } else {
        console.log('✅ Created tenant USER entity')
        console.log('   Name:', newTenantUser.entity_name)
      }
    }
    
    // 4. Check membership relationship
    console.log('\n4️⃣ MEMBERSHIP RELATIONSHIP CHECK')
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userId)
      .eq('organization_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    if (membership) {
      console.log('✅ Membership relationship exists')
      console.log('   Target Entity:', membership.to_entity_id)
      console.log('   Organization:', membership.organization_id)
      console.log('   Active:', membership.is_active)
    } else {
      console.log('❌ Membership relationship missing')
    }
    
    // 5. Check dynamic data
    console.log('\n5️⃣ DYNAMIC DATA CHECK')
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userId)
      .eq('organization_id', orgId)
    
    console.log(`Found ${dynamicData?.length || 0} dynamic data fields`)
    dynamicData?.forEach(field => {
      console.log(`   ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_boolean}`)
    })
    
    // 6. Simulate resolve-membership
    console.log('\n6️⃣ RESOLVE-MEMBERSHIP SIMULATION')
    
    // This is exactly what the resolve-membership API does
    const { data: resolveTest } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()
    
    if (resolveTest) {
      console.log('✅ Step 1: Found membership relationship')
      
      const { data: userEntityLookup } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', userId)
        .eq('organization_id', resolveTest.organization_id)
        .eq('entity_type', 'USER')
        .maybeSingle()
      
      if (userEntityLookup) {
        console.log('✅ Step 2: Found USER entity in tenant org')
        console.log('✅ resolve-membership should work!')
      } else {
        console.log('❌ Step 2: USER entity NOT found in tenant org')
        console.log('❌ resolve-membership will return 404')
      }
    } else {
      console.log('❌ Step 1: Membership relationship not found')
    }
    
    // 7. Final summary
    console.log('\n🎯 AUTHENTICATION SETUP SUMMARY')
    console.log('=' .repeat(50))
    
    const hasAuth = !!authUser
    const hasPlatformUser = !!platformUser
    const hasTenantUser = !!tenantUser
    const hasMembership = !!membership
    
    console.log(`Auth System: ${hasAuth ? '✅' : '❌'}`)
    console.log(`Platform USER Entity: ${hasPlatformUser ? '✅' : '❌'}`)
    console.log(`Tenant USER Entity: ${hasTenantUser ? '✅' : '❌'}`)
    console.log(`Membership Relationship: ${hasMembership ? '✅' : '❌'}`)
    
    const isReady = hasAuth && hasTenantUser && hasMembership
    
    console.log(`\nAuthentication Ready: ${isReady ? '✅ YES' : '❌ NO'}`)
    
    if (isReady) {
      console.log('\n🎉 User is ready to authenticate!')
      console.log('They can log in at: http://localhost:3001/salon/auth')
      console.log('And access: http://localhost:3001/salon/dashboard')
    } else {
      console.log('\n⚠️ Authentication setup incomplete')
      if (!hasTenantUser) {
        console.log('- Need to create USER entity in tenant organization')
      }
      if (!hasMembership) {
        console.log('- Need to create membership relationship')
      }
    }
    
    return isReady
    
  } catch (error) {
    console.error('💥 Verification failed:', error)
    return false
  }
}

// Run the verification
finalUserVerification()
  .then(success => {
    console.log(`\n🎯 User authentication setup ${success ? 'COMPLETE' : 'INCOMPLETE'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })