#!/usr/bin/env node

/**
 * Quick fix: Create MEMBER_OF relationship for michele user directly
 * This bypasses the auth/attach endpoint which is having issues
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const MICHELE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function quickFixMicheleMemberOf() {
  try {
    console.log('🔧 Quick Fix: Creating MEMBER_OF relationship for michele...')
    console.log('User ID:', MICHELE_USER_ID)
    console.log('Org ID:', CORRECT_ORG_ID)
    console.log('='.repeat(60))

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // First check if relationship already exists
    const { data: existing, error: checkError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('to_entity_id', CORRECT_ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing relationship:', checkError)
      return
    }

    if (existing) {
      console.log('✅ MEMBER_OF relationship already exists:')
      console.log(`  - From: ${existing.from_entity_id}`)
      console.log(`  - To: ${existing.to_entity_id}`)
      console.log(`  - Type: ${existing.relationship_type}`)
      console.log(`  - Active: ${existing.is_active}`)
      console.log(`  - Role: ${existing.relationship_data?.role}`)
      
      // Check if it needs updating
      if (!existing.is_active || existing.relationship_data?.role !== 'OWNER') {
        console.log('⚠️ Updating existing relationship...')
        
        const { error: updateError } = await supabase
          .from('core_relationships')
          .update({
            relationship_data: { role: 'OWNER', permissions: ['*'] },
            is_active: true,
            updated_by: MICHELE_USER_ID,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('❌ Failed to update relationship:', updateError)
          return
        }
        console.log('✅ Relationship updated successfully')
      } else {
        console.log('✅ Relationship is already correct - no changes needed')
      }
    } else {
      console.log('ℹ️ No existing relationship found. Creating new one...')
      
      // Remove any old relationships first
      await supabase
        .from('core_relationships')
        .delete()
        .eq('from_entity_id', MICHELE_USER_ID)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')

      // Create new MEMBER_OF relationship
      const { error: createError } = await supabase
        .from('core_relationships')
        .insert([{
          organization_id: CORRECT_ORG_ID,
          from_entity_id: MICHELE_USER_ID,
          to_entity_id: CORRECT_ORG_ID,
          relationship_type: 'MEMBER_OF',
          smart_code: 'HERA.CORE.USER.REL.MEMBER_OF.V1',
          relationship_data: { role: 'OWNER', permissions: ['*'] },
          is_active: true,
          created_by: MICHELE_USER_ID,
          updated_by: MICHELE_USER_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (createError) {
        console.error('❌ Failed to create relationship:', createError)
        return
      }
      console.log('✅ New MEMBER_OF relationship created successfully')
    }

    // Final verification
    console.log('\n🔍 Final verification...')
    const { data: verification, error: verifyError } = await supabase
      .from('core_relationships')
      .select('from_entity_id, to_entity_id, relationship_type, is_active, relationship_data')
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('to_entity_id', CORRECT_ORG_ID)
      .maybeSingle()

    if (verifyError || !verification) {
      console.error('❌ Verification failed:', verifyError)
      return
    }

    console.log('🎉 SUCCESS! MEMBER_OF relationship is now properly configured:')
    console.log(`  - User: ${verification.from_entity_id}`)
    console.log(`  - Organization: ${verification.to_entity_id}`)
    console.log(`  - Type: ${verification.relationship_type}`)
    console.log(`  - Active: ${verification.is_active}`)
    console.log(`  - Role: ${verification.relationship_data?.role}`)
    console.log(`  - Permissions: ${JSON.stringify(verification.relationship_data?.permissions)}`)

    console.log('\n📱 Next steps:')
    console.log('1. Hard refresh your browser (Cmd+Shift+R)')
    console.log('2. Try logging in again')
    console.log('3. The "No MEMBER_OF relationship" error should be resolved!')

  } catch (error) {
    console.error('❌ Quick fix failed:', error)
  }
}

quickFixMicheleMemberOf()