#!/usr/bin/env node

/**
 * Create MEMBER_OF relationship for the actual logged-in user michele
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const MICHELE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function createMicheleMembership() {
  try {
    console.log('🔧 Creating MEMBER_OF relationship for michele...')
    console.log('=' .repeat(55))

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Step 1: Create/update user entity
    console.log('1️⃣ Creating user entity...')
    const { error: userError } = await supabase
      .from('core_entities')
      .upsert([{
        id: MICHELE_USER_ID,
        organization_id: PLATFORM_ORG_ID,
        entity_type: 'USER',
        entity_name: 'michele',
        entity_code: `USER-${MICHELE_USER_ID.substring(0, 8)}`,
        smart_code: 'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
        metadata: { 
          email: 'michele@hairtalkz.com', 
          auth_user_id: MICHELE_USER_ID 
        },
        created_by: MICHELE_USER_ID,
        updated_by: MICHELE_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' })

    if (userError) {
      console.error('❌ Failed to create user entity:', userError)
      return
    }
    console.log('✅ User entity created/updated')

    // Step 2: Remove old relationships
    console.log('2️⃣ Cleaning old relationships...')
    const { error: deleteError } = await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')

    if (deleteError) {
      console.warn('⚠️ Warning cleaning old relationships:', deleteError)
    } else {
      console.log('✅ Old USER_MEMBER_OF_ORG relationships removed')
    }

    // Step 3: Create MEMBER_OF relationship (insert directly since we cleaned old ones)
    console.log('3️⃣ Creating MEMBER_OF relationship...')
    const { error: relError } = await supabase
      .from('core_relationships')
      .insert([{
        organization_id: CORRECT_ORG_ID,
        from_entity_id: MICHELE_USER_ID,
        to_entity_id: CORRECT_ORG_ID,
        relationship_type: 'MEMBER_OF',
        smart_code: 'HERA.CORE.USER.REL.MEMBER_OF.V1',
        relationship_data: { 
          role: 'OWNER', 
          permissions: ['*'] 
        },
        is_active: true,
        created_by: MICHELE_USER_ID,
        updated_by: MICHELE_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (relError) {
      console.error('❌ Failed to create MEMBER_OF relationship:', relError)
      return
    }
    console.log('✅ MEMBER_OF relationship created')

    // Step 4: Verify the setup
    console.log('4️⃣ Verifying setup...')
    const { data: verification, error: verError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('to_entity_id', CORRECT_ORG_ID)
      .maybeSingle()

    if (verError || !verification) {
      console.error('❌ Verification failed:', verError)
      return
    }

    console.log('✅ Verification successful!')
    console.log(`  - User: ${verification.from_entity_id}`)
    console.log(`  - Organization: ${verification.to_entity_id}`)
    console.log(`  - Relationship: ${verification.relationship_type}`)
    console.log(`  - Active: ${verification.is_active}`)

    console.log('\\n🎉 Michele user setup completed!')
    console.log('📋 Next: Try the /api/v2/auth/attach endpoint again')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

createMicheleMembership()