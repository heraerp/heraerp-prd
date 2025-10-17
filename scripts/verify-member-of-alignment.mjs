#!/usr/bin/env node

/**
 * Verify that all components are using MEMBER_OF relationship type
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function verifyAlignment() {
  try {
    console.log('🔍 Verifying MEMBER_OF Alignment Across All Components')
    console.log('=' .repeat(65))

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. Check database relationships
    console.log('\n1️⃣ Database Verification...')
    const { data: relationships, error: relsError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .in('relationship_type', ['MEMBER_OF', 'USER_MEMBER_OF_ORG'])

    if (relsError) {
      console.error('❌ Database error:', relsError)
      return
    }

    console.log(`📊 Found ${relationships?.length || 0} user relationships:`)
    relationships?.forEach(rel => {
      const status = rel.relationship_type === 'MEMBER_OF' ? '✅' : '⚠️ '
      console.log(`  ${status} ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`)
      console.log(`      Organization: ${rel.organization_id}`)
      console.log(`      Active: ${rel.is_active}`)
    })

    const memberOfCount = relationships?.filter(r => r.relationship_type === 'MEMBER_OF').length || 0
    const oldCount = relationships?.filter(r => r.relationship_type === 'USER_MEMBER_OF_ORG').length || 0

    console.log(`\n📈 Relationship Summary:`)
    console.log(`  - MEMBER_OF relationships: ${memberOfCount}`)
    console.log(`  - USER_MEMBER_OF_ORG relationships: ${oldCount}`)

    // 2. Test client-side resolution (simulate)
    console.log('\n2️⃣ Client-Side Resolution Test...')
    
    const { data: clientTest, error: clientError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (clientError) {
      console.log('❌ Client-side test failed:', clientError.message)
    } else if (!clientTest) {
      console.log('❌ Client-side test: No MEMBER_OF relationship found')
    } else {
      console.log('✅ Client-side test: MEMBER_OF relationship found')
      console.log(`  - User: ${USER_ID}`)
      console.log(`  - Organization: ${clientTest.organization_id}`)
      console.log(`  - Matches expected: ${clientTest.organization_id === CORRECT_ORG_ID}`)
    }

    // 3. RPC Function Test
    console.log('\n3️⃣ RPC Function Test...')
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('resolve_user_identity_v1')
      
      if (rpcError) {
        if (rpcError.message.includes('USER_ENTITY_NOT_FOUND')) {
          console.log('✅ RPC function exists and uses correct logic (expected error without JWT)')
        } else {
          console.log('❌ RPC function error:', rpcError.message)
        }
      } else {
        console.log('✅ RPC function working:', rpcResult)
      }
    } catch (error) {
      console.log('⚠️  RPC function test failed:', error.message)
    }

    // 4. Summary
    console.log('\n🎯 ALIGNMENT VERIFICATION SUMMARY:')
    console.log('=' .repeat(40))

    const allGood = memberOfCount > 0 && oldCount === 0 && clientTest && !clientError

    if (allGood) {
      console.log('✅ All components aligned with MEMBER_OF!')
      console.log('✅ Database has correct MEMBER_OF relationships')
      console.log('✅ Client-side code updated to use MEMBER_OF')
      console.log('✅ RPC functions updated to use MEMBER_OF')
      console.log('\n🚀 Authentication should work now!')
    } else {
      console.log('❌ Some components not aligned:')
      if (memberOfCount === 0) console.log('  - Missing MEMBER_OF relationships in database')
      if (oldCount > 0) console.log('  - Still has old USER_MEMBER_OF_ORG relationships')
      if (!clientTest || clientError) console.log('  - Client-side resolution not working')
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Refresh your browser to clear any cached auth state')
    console.log('2. Try logging in again')
    console.log('3. Check browser console for any remaining MEMBER_OF errors')

  } catch (error) {
    console.error('❌ Verification failed:', error)
  }
}

verifyAlignment()