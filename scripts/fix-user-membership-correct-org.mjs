#!/usr/bin/env node

/**
 * Fix user membership for the CORRECT organization ID
 * Organization: 378f24fb-d496-4ff7-8afa-ea34895a0eb8 (correct one)
 * User: 3ced4979-4c09-4e1e-8667-6707cfe6ec77
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// CORRECT IDs
const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function fixUserMembership() {
  try {
    console.log('🔧 Fixing user membership for CORRECT organization')
    console.log('=' .repeat(60))
    console.log('User ID:', USER_ID)
    console.log('CORRECT Org ID:', CORRECT_ORG_ID)

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Step 1: Check if user entity exists
    console.log('\n1️⃣ Checking user entity...')
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .single()

    if (userError || !userEntity) {
      console.log('❌ User entity not found, creating it...')
      
      const { data: newUser, error: createUserError } = await supabase
        .from('core_entities')
        .insert({
          id: USER_ID,
          organization_id: CORRECT_ORG_ID,
          entity_type: 'USER',
          entity_name: 'Demo User',
          entity_code: `USER-${USER_ID.substring(0, 8)}`,
          smart_code: 'HERA.CORE.USER.ENT.STANDARD.V1',
          metadata: { 
            email: 'demo@example.com',
            auth_user_id: USER_ID 
          },
          created_by: USER_ID,
          updated_by: USER_ID
        })
        .select()
        .single()

      if (createUserError) {
        console.error('❌ Failed to create user entity:', createUserError)
        return
      }
      
      console.log('✅ User entity created')
    } else {
      console.log('✅ User entity exists:', userEntity.entity_name)
    }

    // Step 2: Check current relationships
    console.log('\n2️⃣ Checking existing relationships...')
    const { data: existingRels, error: relsError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .in('relationship_type', ['USER_MEMBER_OF_ORG', 'MEMBER_OF'])

    if (relsError) {
      console.error('❌ Error checking relationships:', relsError)
      return
    }

    console.log('📊 Existing relationships:', existingRels?.length || 0)
    existingRels?.forEach(rel => {
      console.log(`  - ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`)
    })

    // Step 3: Remove any relationships to wrong organizations
    const wrongOrgRels = existingRels?.filter(rel => rel.to_entity_id !== CORRECT_ORG_ID) || []
    if (wrongOrgRels.length > 0) {
      console.log('\n3️⃣ Removing relationships to wrong organizations...')
      
      for (const rel of wrongOrgRels) {
        const { error: deleteError } = await supabase
          .from('core_relationships')
          .delete()
          .eq('id', rel.id)
        
        if (deleteError) {
          console.error(`❌ Failed to delete relationship ${rel.id}:`, deleteError)
        } else {
          console.log(`✅ Deleted relationship to wrong org: ${rel.to_entity_id}`)
        }
      }
    }

    // Step 4: Create correct MEMBER_OF relationship
    console.log('\n4️⃣ Creating MEMBER_OF relationship to correct organization...')
    
    // Check if correct relationship already exists
    const correctRel = existingRels?.find(rel => 
      rel.to_entity_id === CORRECT_ORG_ID && 
      (rel.relationship_type === 'MEMBER_OF' || rel.relationship_type === 'USER_MEMBER_OF_ORG')
    )

    if (correctRel) {
      // Update to use MEMBER_OF if it's using old type
      if (correctRel.relationship_type === 'USER_MEMBER_OF_ORG') {
        console.log('🔄 Updating relationship type to MEMBER_OF...')
        const { error: updateError } = await supabase
          .from('core_relationships')
          .update({ 
            relationship_type: 'MEMBER_OF',
            updated_by: USER_ID,
            updated_at: new Date().toISOString()
          })
          .eq('id', correctRel.id)

        if (updateError) {
          console.error('❌ Failed to update relationship type:', updateError)
        } else {
          console.log('✅ Updated relationship type to MEMBER_OF')
        }
      } else {
        console.log('✅ Correct MEMBER_OF relationship already exists')
      }
    } else {
      // Create new MEMBER_OF relationship
      const { data: newRel, error: createRelError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: CORRECT_ORG_ID,
          from_entity_id: USER_ID,
          to_entity_id: CORRECT_ORG_ID,
          relationship_type: 'MEMBER_OF',
          smart_code: 'HERA.CORE.USER.REL.MEMBER_OF.V1',
          relationship_data: { 
            role: 'OWNER',
            permissions: ['*']
          },
          is_active: true,
          created_by: USER_ID,
          updated_by: USER_ID
        })
        .select()

      if (createRelError) {
        console.error('❌ Failed to create MEMBER_OF relationship:', createRelError)
        return
      }

      console.log('✅ Created MEMBER_OF relationship:', newRel?.[0]?.id)
    }

    // Step 5: Verify the fix
    console.log('\n5️⃣ Verifying the fix...')
    const { data: verifyRels, error: verifyError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('to_entity_id', CORRECT_ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
      return
    }

    if (verifyRels && verifyRels.length > 0) {
      console.log('✅ MEMBER_OF relationship verified:')
      console.log('  - User:', USER_ID)
      console.log('  - Organization:', CORRECT_ORG_ID)
      console.log('  - Type: MEMBER_OF')
      console.log('  - Role:', verifyRels[0].relationship_data?.role || 'OWNER')
      console.log('  - Active:', verifyRels[0].is_active)
    } else {
      console.error('❌ MEMBER_OF relationship not found after creation')
    }

    console.log('\n🎉 User membership fix completed!')
    console.log('The user should now be able to access the correct organization.')

  } catch (error) {
    console.error('❌ Failed to fix user membership:', error)
  }
}

fixUserMembership()