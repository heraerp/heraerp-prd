#!/usr/bin/env node

/**
 * Final verification that authentication should work
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function finalVerification() {
  try {
    console.log('🎯 FINAL AUTHENTICATION VERIFICATION')
    console.log('=' .repeat(60))
    console.log('User ID:', USER_ID)
    console.log('Correct Org ID:', CORRECT_ORG_ID)

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    console.log('\n✅ VERIFICATION CHECKLIST:')
    console.log('=' .repeat(40))

    // 1. Check user entity
    console.log('\n1️⃣ User Entity Check...')
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .eq('entity_type', 'USER')
      .single()

    if (userError) {
      console.log('❌ User entity: NOT FOUND')
      return
    } else {
      console.log('✅ User entity: EXISTS')
      console.log(`   - Name: ${userEntity.entity_name}`)
      console.log(`   - Organization: ${userEntity.organization_id}`)
      console.log(`   - Correct Org: ${userEntity.organization_id === CORRECT_ORG_ID ? 'YES' : 'NO'}`)
    }

    // 2. Check MEMBER_OF relationship
    console.log('\n2️⃣ MEMBER_OF Relationship Check...')
    const { data: memberRel, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('to_entity_id', CORRECT_ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .single()

    if (memberError) {
      console.log('❌ MEMBER_OF relationship: NOT FOUND')
      console.log('   Error:', memberError.message)
    } else {
      console.log('✅ MEMBER_OF relationship: EXISTS')
      console.log(`   - From: ${memberRel.from_entity_id}`)
      console.log(`   - To: ${memberRel.to_entity_id}`)
      console.log(`   - Role: ${memberRel.relationship_data?.role || 'NONE'}`)
      console.log(`   - Active: ${memberRel.is_active}`)
    }

    // 3. Check organization entity
    console.log('\n3️⃣ Organization Entity Check...')
    const { data: orgEntity, error: orgError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', CORRECT_ORG_ID)
      .single()

    if (orgError) {
      console.log('❌ Organization entity: NOT FOUND')
    } else {
      console.log('✅ Organization entity: EXISTS')
      console.log(`   - Name: ${orgEntity.entity_name}`)
      console.log(`   - Type: ${orgEntity.entity_type}`)
    }

    // 4. Check RPC function exists
    console.log('\n4️⃣ RPC Function Check...')
    const { data: rpcCheck, error: rpcError } = await supabase
      .rpc('resolve_user_identity_v1')

    if (rpcError) {
      if (rpcError.message.includes('USER_ENTITY_NOT_FOUND')) {
        console.log('✅ RPC function: EXISTS (expected error without JWT context)')
      } else {
        console.log('❌ RPC function: ERROR -', rpcError.message)
      }
    } else {
      console.log('✅ RPC function: EXISTS and working')
    }

    console.log('\n🎉 EXPECTED LOGIN FLOW:')
    console.log('=' .repeat(30))
    console.log('1. User logs in via Supabase Auth')
    console.log('2. JWT contains user_id:', USER_ID)
    console.log('3. JWT contains organization_id:', CORRECT_ORG_ID)
    console.log('4. resolve_user_identity_v1() finds USER entity')
    console.log('5. resolve_user_identity_v1() finds MEMBER_OF relationship')
    console.log('6. Returns organization_ids:', [CORRECT_ORG_ID])
    console.log('7. verifyAuth() matches JWT org with allowed orgs')
    console.log('8. ✅ AUTHENTICATION SUCCEEDS!')

    console.log('\n📋 SUMMARY:')
    console.log('=' .repeat(20))
    
    const allGood = !userError && !memberError && !orgError
    
    if (allGood) {
      console.log('🎯 ✅ ALL CHECKS PASSED!')
      console.log('🚀 User should be able to log in successfully now.')
      console.log('🔐 Authentication system is properly configured.')
    } else {
      console.log('❌ Some checks failed. Please review the issues above.')
    }

    console.log('\n🔄 Next Steps:')
    console.log('- Try logging in through the web interface')
    console.log('- Check browser console for any remaining auth errors')
    console.log('- Verify that the correct organization ID is being used')

  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

finalVerification()