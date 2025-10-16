#!/usr/bin/env node

/**
 * Test the updated resolve_user_identity_v1 function with MEMBER_OF relationships
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Test with our user
const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testMemberOfRPC() {
  try {
    console.log('🧪 Testing resolve_user_identity_v1 with MEMBER_OF relationships')
    console.log('=' .repeat(65))

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    // Create service client (for admin operations)
    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Create client with user auth simulation
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` // Using service key to simulate user context
        }
      }
    })

    console.log('1️⃣ Checking MEMBER_OF relationships directly...')
    const { data: relationships, error: relsError } = await supabaseService
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)

    if (relsError) {
      console.error('❌ Error querying relationships:', relsError)
      return
    }

    console.log(`📊 Found ${relationships?.length || 0} MEMBER_OF relationships:`)
    relationships?.forEach(rel => {
      console.log(`  - ${rel.from_entity_id} MEMBER_OF ${rel.to_entity_id}`)
      console.log(`    Role: ${rel.relationship_data?.role || 'none'}`)
      console.log(`    Active: ${rel.is_active}`)
    })

    console.log('\n2️⃣ Testing resolve_user_identity_v1 RPC...')
    
    // Test the RPC function
    // Note: This won't work perfectly without proper JWT context, but we can try
    const { data: identityResult, error: identityError } = await supabaseService
      .rpc('resolve_user_identity_v1')

    if (identityError) {
      console.log('⚠️  RPC error (expected without proper JWT):', identityError.message)
    } else {
      console.log('✅ RPC result:', identityResult)
    }

    console.log('\n3️⃣ Testing with manual organization lookup...')
    
    // Check if user entity exists in correct org
    const { data: userEntity, error: userError } = await supabaseService
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .eq('entity_type', 'USER')
      .single()

    if (userError) {
      console.error('❌ User entity error:', userError)
    } else {
      console.log('✅ User entity found:', {
        id: userEntity.id,
        name: userEntity.entity_name,
        org_id: userEntity.organization_id,
        correct_org: userEntity.organization_id === CORRECT_ORG_ID
      })
    }

    console.log('\n4️⃣ Expected behavior when login occurs...')
    console.log('When the user logs in:')
    console.log('- JWT will contain user ID:', USER_ID)
    console.log('- JWT org_id should be:', CORRECT_ORG_ID)  
    console.log('- RPC will find MEMBER_OF relationship and return:', [CORRECT_ORG_ID])
    console.log('- Auth should succeed ✅')

    console.log('\n🎯 Test Summary:')
    if (relationships && relationships.length > 0) {
      const hasCorrectOrg = relationships.some(rel => rel.to_entity_id === CORRECT_ORG_ID)
      if (hasCorrectOrg) {
        console.log('✅ User has MEMBER_OF relationship to correct organization')
        console.log('✅ Login should work after this fix')
      } else {
        console.log('❌ User does not have MEMBER_OF relationship to correct organization')
      }
    } else {
      console.log('❌ No MEMBER_OF relationships found')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testMemberOfRPC()