#!/usr/bin/env node
/**
 * Ensure USER Entity Exists
 * Creates a USER entity in core_entities for the current Supabase auth user
 * This is required for HERA v2.2 audit trail
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// The Supabase user ID that needs a USER entity
const SUPABASE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const USER_EMAIL = 'michele@hairtalkz.com'
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

// Platform organization (where USER entities live)
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function ensureUserEntity() {
  console.log('\n' + '='.repeat(80))
  console.log('ENSURE USER ENTITY EXISTS')
  console.log('='.repeat(80))

  console.log('\n📋 Configuration:')
  console.log('  Supabase User ID:', SUPABASE_USER_ID)
  console.log('  Email:', USER_EMAIL)
  console.log('  Organization ID:', ORGANIZATION_ID)
  console.log('  Platform Org ID:', PLATFORM_ORG_ID)

  // Step 1: Check if USER entity already exists
  console.log('\n🔍 Step 1: Checking if USER entity exists...')

  const { data: existingUser, error: checkError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', SUPABASE_USER_ID)
    .eq('entity_type', 'USER')
    .maybeSingle()

  if (checkError) {
    console.error('❌ Error checking for USER entity:', checkError)
    return
  }

  if (existingUser) {
    console.log('✅ USER entity already exists:', {
      id: existingUser.id,
      entity_name: existingUser.entity_name,
      entity_type: existingUser.entity_type,
      organization_id: existingUser.organization_id,
      smart_code: existingUser.smart_code
    })
    console.log('\n✅ No action needed - USER entity exists')
    return
  }

  console.log('⚠️ USER entity does NOT exist - will create it')

  // Step 2: Create USER entity using RPC
  console.log('\n🔧 Step 2: Creating USER entity via RPC...')

  const { data: createResult, error: createError } = await supabase.rpc('hera_entity_upsert_v1', {
    p_organization_id: PLATFORM_ORG_ID, // USER entities live in platform org
    p_entity_type: 'USER',
    p_entity_name: USER_EMAIL,
    p_smart_code: 'HERA.CORE.USER.ENTITY.ACCOUNT.V1',
    p_entity_id: SUPABASE_USER_ID, // Use Supabase user ID as entity ID
    p_entity_code: `USER-${SUPABASE_USER_ID.substring(0, 8)}`,
    p_entity_description: `User account for ${USER_EMAIL}`,
    p_parent_entity_id: null,
    p_status: 'active',
    p_tags: ['user', 'account'],
    p_smart_code_status: null,
    p_business_rules: null,
    p_metadata: {
      email: USER_EMAIL,
      auth_provider: 'supabase',
      created_by_script: true
    },
    p_ai_confidence: null,
    p_ai_classification: null,
    p_ai_insights: null,
    p_actor_user_id: SUPABASE_USER_ID // Self-reference for initial creation
  })

  if (createError) {
    console.error('❌ Error creating USER entity:', createError)
    return
  }

  console.log('✅ USER entity created successfully:', createResult)

  // Step 3: Create membership relationship (USER -> Organization)
  console.log('\n🔗 Step 3: Creating membership relationship...')

  const { data: relationshipResult, error: relationshipError } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: SUPABASE_USER_ID,
      to_entity_id: ORGANIZATION_ID,
      relationship_type: 'MEMBER_OF',
      smart_code: 'HERA.CORE.USER.REL.MEMBER_OF.V1',
      organization_id: ORGANIZATION_ID, // Stored in tenant org
      is_active: true,
      relationship_data: {
        role: 'OWNER',
        joined_at: new Date().toISOString()
      },
      created_by: SUPABASE_USER_ID,
      updated_by: SUPABASE_USER_ID
    })
    .select()
    .single()

  if (relationshipError) {
    console.error('❌ Error creating membership relationship:', relationshipError)
    return
  }

  console.log('✅ Membership relationship created:', {
    id: relationshipResult.id,
    from_entity_id: relationshipResult.from_entity_id,
    to_entity_id: relationshipResult.to_entity_id,
    relationship_type: relationshipResult.relationship_type
  })

  // Step 4: Verify resolve_user_identity_v1 now works
  console.log('\n🔍 Step 4: Verifying resolve_user_identity_v1...')

  // Create a client with the user's token to test
  const { data: verifyResult, error: verifyError } = await supabase.rpc('resolve_user_identity_v1')

  if (verifyError) {
    console.error('❌ Error verifying identity:', verifyError)
    return
  }

  console.log('✅ Identity resolution result:', verifyResult)

  console.log('\n' + '='.repeat(80))
  console.log('✅ SETUP COMPLETE!')
  console.log('='.repeat(80))
  console.log('\n👉 Next steps:')
  console.log('1. Try updating a staff member again')
  console.log('2. The audit trail should now work correctly')
  console.log('3. All operations will be tracked with actor_user_id:', SUPABASE_USER_ID)
}

// Run the script
ensureUserEntity().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
