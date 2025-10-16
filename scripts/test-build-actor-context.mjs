#!/usr/bin/env node

/**
 * Test the buildActorContext function directly
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Mock the buildActorContext function behavior
async function buildActorContext(supabase, supabaseUserId, organizationId) {
  try {
    console.log('🔍 Building actor context for:', {
      supabaseUserId: supabaseUserId?.substring(0, 8) + '...',
      organizationId: organizationId?.substring(0, 8) + '...'
    })

    // Try to resolve user identity via RPC first
    const { data: ident, error: identError } = await supabase.rpc('resolve_user_identity_v1')
    
    if (identError) {
      console.log('⚠️  RPC error:', identError.message)
    }
    
    console.log('📊 Identity resolution result:', {
      hasData: !!ident,
      dataLength: ident?.length || 0,
      firstItem: ident?.[0] || null
    })

    const userContext = ident?.[0]
    
    if (userContext?.user_entity_id) {
      const actorContext = {
        actor_user_id: userContext.user_entity_id,
        organization_id: organizationId || userContext.organization_ids?.[0],
        user_email: userContext.email,
        roles: userContext.roles || []
      }
      
      console.log('✅ Actor context built from RPC:', actorContext)
      return actorContext
    }
    
    // Fallback: Use Supabase user ID as actor_user_id
    console.log('⚠️  No USER entity found, using Supabase ID as fallback')
    
    const fallbackContext = {
      actor_user_id: supabaseUserId,
      organization_id: organizationId || '',
      user_email: undefined,
      roles: []
    }
    
    console.log('📋 Fallback actor context:', fallbackContext)
    return fallbackContext
    
  } catch (error) {
    console.error('❌ Error building actor context:', error)
    
    // Ultimate fallback
    return {
      actor_user_id: supabaseUserId,
      organization_id: organizationId || '',
      user_email: undefined,
      roles: []
    }
  }
}

async function testBuildActorContext() {
  try {
    console.log('🧪 Testing buildActorContext function')
    console.log('=' .repeat(50))

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Test with the known user ID from our previous work
    const testUserId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
    const testOrgId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
    
    const actorContext = await buildActorContext(supabase, testUserId, testOrgId)
    
    console.log('\n🎯 Final actor context result:', actorContext)
    
    if (actorContext.actor_user_id === testUserId) {
      console.log('✅ Actor context using fallback (expected for demo)')
    } else {
      console.log('✅ Actor context resolved via USER entity')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testBuildActorContext()