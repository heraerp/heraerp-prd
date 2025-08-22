#!/usr/bin/env node

/**
 * Verify HERA-Supabase Integration
 * Checks if everything is set up correctly for the existing user
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const existingUserId = '1acd429b-dd0d-4ec4-a7f8-108e8dd41ebc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyIntegration() {
  console.log('🔍 Verifying HERA-Supabase Integration')
  console.log('=====================================')
  console.log(`User ID: ${existingUserId}`)
  console.log(`Email: santhoshlal@gmail.com`)
  console.log('')

  let allPassed = true

  try {
    // 1. Check auth user exists
    console.log('1. ✅ Checking Supabase auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(existingUserId)
    
    if (authError) {
      console.log('   ❌ Auth user not found')
      allPassed = false
    } else {
      console.log(`   ✅ Auth user found: ${authUser.user.email}`)
    }

    // 2. Check HERA entity exists
    console.log('\\n2. ✅ Checking HERA user entity...')
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', existingUserId)
      .eq('entity_type', 'user')
      .single()

    if (entityError) {
      console.log('   ❌ HERA user entity not found')
      console.log(`   Error: ${entityError.message}`)
      allPassed = false
    } else {
      console.log(`   ✅ HERA user entity found:`)
      console.log(`      - Name: ${userEntity.entity_name}`)
      console.log(`      - Code: ${userEntity.entity_code}`)
      console.log(`      - Smart Code: ${userEntity.smart_code}`)
      console.log(`      - Organization ID: ${userEntity.organization_id}`)
    }

    // 3. Check organization exists
    console.log('\\n3. ✅ Checking organization...')
    if (userEntity) {
      const { data: organization, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', userEntity.organization_id)
        .single()

      if (orgError) {
        console.log('   ❌ Organization not found')
        allPassed = false
      } else {
        console.log(`   ✅ Organization found:`)
        console.log(`      - Name: ${organization.organization_name}`)
        console.log(`      - Code: ${organization.organization_code}`)
        console.log(`      - Type: ${organization.organization_type}`)
      }
    }

    // 4. Check membership exists
    console.log('\\n4. ✅ Checking membership...')
    const { data: membership, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', existingUserId)
      .eq('relationship_type', 'member_of')
      .single()

    if (memberError) {
      console.log('   ❌ Membership not found')
      allPassed = false
    } else {
      console.log(`   ✅ Membership found:`)
      console.log(`      - Role: ${membership.metadata?.role}`)
      console.log(`      - Status: ${membership.status}`)
      console.log(`      - Permissions: ${JSON.stringify(membership.metadata?.permissions)}`)
    }

    // 5. Check dynamic data
    console.log('\\n5. ✅ Checking dynamic data...')
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', existingUserId)

    if (dynamicError) {
      console.log('   ❌ Dynamic data not found')
      allPassed = false
    } else {
      console.log(`   ✅ Dynamic data found (${dynamicData.length} fields):`)
      dynamicData.forEach(field => {
        console.log(`      - ${field.field_name}: ${field.field_value_text}`)
      })
    }

    // 6. Test RLS function
    console.log('\\n6. ✅ Testing user context function...')
    const { data: userContext, error: contextError } = await supabase
      .rpc('get_user_context')

    if (contextError) {
      console.log('   ⚠️  User context function not available (expected without active session)')
    } else {
      console.log('   ✅ User context function working')
    }

    // 7. Check table counts
    console.log('\\n7. ✅ Checking table structure...')
    const tables = ['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ❌ Table ${table}: ${error.message}`)
        allPassed = false
      } else {
        console.log(`   ✅ Table ${table}: ${count} records`)
      }
    }

    // Final summary
    console.log('\\n' + '='.repeat(50))
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!')
      console.log('✅ HERA-Supabase integration is working correctly')
      console.log('')
      console.log('Next steps:')
      console.log('1. Test login at: http://localhost:3001/login-supabase')
      console.log('2. Access dashboard: http://localhost:3001/dashboard') 
      console.log('3. Test API: http://localhost:3001/api/v1/supabase-test')
      console.log('')
      console.log('🚀 Ready for production use!')
    } else {
      console.log('❌ SOME CHECKS FAILED')
      console.log('Please run the amendment SQL script in Supabase dashboard:')
      console.log('Copy database/supabase-amendments.sql to Supabase SQL Editor')
    }

    return allPassed

  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

// Quick fix function
async function quickFix() {
  console.log('\\n🔧 Running quick fix for existing user...')
  
  try {
    // Check if organization exists
    let { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .limit(1)
      .single()

    if (orgError) {
      console.log('Creating organization...')
      const { data: newOrg, error: createOrgError } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: 'HERA Demo Organization',
          organization_code: `ORG-HERA-${Date.now()}`,
          organization_type: 'business_unit',
          industry_classification: 'technology',
          status: 'active',
          created_by: existingUserId
        })
        .select()
        .single()

      if (createOrgError) {
        console.log('❌ Could not create organization:', createOrgError.message)
        return false
      }
      org = newOrg
    }

    // Create user entity
    console.log('Creating user entity...')
    const { error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: existingUserId,
        organization_id: org.id,
        entity_type: 'user',
        entity_name: 'santhoshlal',
        entity_code: `USER-SANTHOS-${Date.now()}`,
        smart_code: 'HERA.USER.PROFILE.v1',
        status: 'active',
        created_by: existingUserId
      })

    if (entityError && !entityError.message.includes('duplicate')) {
      console.log('❌ Could not create user entity:', entityError.message)
      return false
    }

    // Create membership relationship
    console.log('Creating membership...')
    const { error: membershipError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: org.id,
        from_entity_id: existingUserId,
        to_entity_id: org.id,
        relationship_type: 'member_of',
        metadata: {
          role: 'admin',
          permissions: ['user_management', 'entity_management', 'transaction_management']
        },
        status: 'active',
        created_by: existingUserId
      })

    if (membershipError && !membershipError.message.includes('duplicate')) {
      console.log('❌ Could not create membership:', membershipError.message)
      return false
    }

    console.log('✅ Quick fix completed!')
    return true

  } catch (error) {
    console.log('❌ Quick fix failed:', error.message)
    return false
  }
}

async function main() {
  const isWorking = await verifyIntegration()
  
  if (!isWorking) {
    console.log('\\n🔧 Attempting quick fix...')
    await quickFix()
    console.log('\\n🔍 Re-running verification...')
    await verifyIntegration()
  }
}

if (require.main === module) {
  main()
}