#!/usr/bin/env node
/**
 * Direct fix for cashew user organization membership
 * This creates the core relationship directly
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Known IDs
const CASHEW_USER_ID = '75c61264-f5a0-4780-9f65-4bee0db4b4a2'
const CASHEW_ORG_ID = '7288d538-f111-42d4-a07a-b4c535c5adc3' // Kerala Cashew Processors
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Wrong org (salon)

async function fixCashewMembership() {
  console.log('🔧 Fixing cashew user organization membership directly...')
  
  try {
    // Step 1: Check current relationships
    console.log('\n📋 Step 1: Checking current relationships...')
    const { data: currentRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', CASHEW_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    if (relError) {
      console.error('❌ Error checking relationships:', relError)
      return
    }
    
    console.log('Current relationships:')
    currentRelationships?.forEach(rel => {
      console.log(`  - ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`)
      console.log(`    Organization: ${rel.to_entity_id === CASHEW_ORG_ID ? 'CASHEW ✅' : rel.to_entity_id === HAIRTALKZ_ORG_ID ? 'HAIRTALKZ ❌' : 'UNKNOWN'}`)
    })
    
    // Step 2: Create cashew membership if it doesn't exist
    console.log('\n📋 Step 2: Creating cashew membership relationship...')
    
    const cashewRelExists = currentRelationships?.some(rel => 
      rel.to_entity_id === CASHEW_ORG_ID && rel.relationship_type === 'USER_MEMBER_OF_ORG'
    )
    
    if (!cashewRelExists) {
      const { data: newRel, error: createError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: CASHEW_USER_ID,
          to_entity_id: CASHEW_ORG_ID,
          relationship_type: 'USER_MEMBER_OF_ORG',
          organization_id: CASHEW_ORG_ID,
          smart_code: 'HERA.CASHEW.REL.TYPE.USER_MEMBER_OF_ORG.v1',
          created_by: CASHEW_USER_ID,
          updated_by: CASHEW_USER_ID,
          effective_date: new Date().toISOString(),
          relationship_data: {
            role: 'admin',
            permissions: ['read', 'write', 'admin']
          }
        })
        .select()
      
      if (createError) {
        console.error('❌ Error creating cashew membership:', createError)
      } else {
        console.log('✅ Created cashew membership relationship')
      }
    } else {
      console.log('✅ Cashew membership already exists')
    }
    
    // Step 3: Remove hairtalkz membership
    console.log('\n📋 Step 3: Removing hairtalkz membership...')
    
    const hairtalkzRelExists = currentRelationships?.some(rel => 
      rel.to_entity_id === HAIRTALKZ_ORG_ID && rel.relationship_type === 'USER_MEMBER_OF_ORG'
    )
    
    if (hairtalkzRelExists) {
      const { error: deleteError } = await supabase
        .from('core_relationships')
        .delete()
        .eq('from_entity_id', CASHEW_USER_ID)
        .eq('to_entity_id', HAIRTALKZ_ORG_ID)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      
      if (deleteError) {
        console.error('❌ Error removing hairtalkz membership:', deleteError)
      } else {
        console.log('✅ Removed hairtalkz membership')
      }
    } else {
      console.log('✅ No hairtalkz membership to remove')
    }
    
    // Step 4: Verify final state
    console.log('\n📋 Step 4: Verifying final state...')
    const { data: finalRelationships, error: finalError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', CASHEW_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    if (finalError) {
      console.error('❌ Error checking final state:', finalError)
      return
    }
    
    console.log('Final relationships:')
    finalRelationships?.forEach(rel => {
      console.log(`  - ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`)
      console.log(`    Organization: ${rel.to_entity_id === CASHEW_ORG_ID ? 'CASHEW ✅' : rel.to_entity_id === HAIRTALKZ_ORG_ID ? 'HAIRTALKZ ❌' : 'UNKNOWN'}`)
    })
    
    const hasCashewMembership = finalRelationships?.some(rel => rel.to_entity_id === CASHEW_ORG_ID)
    const hasHairtalkzMembership = finalRelationships?.some(rel => rel.to_entity_id === HAIRTALKZ_ORG_ID)
    
    if (hasCashewMembership && !hasHairtalkzMembership) {
      console.log('\n🎉 SUCCESS: User is now properly associated with Kerala Cashew Processors!')
      console.log('📧 Email: admin@keralacashew.com')
      console.log('🔑 Password: CashewAdmin2024!')
      console.log('🏢 Organization: Kerala Cashew Processors')
      console.log('🆔 Org ID:', CASHEW_ORG_ID)
      console.log('\n✅ Organization isolation is now properly enforced')
    } else {
      console.log('\n⚠️ Warning: Membership fix may not be complete')
      console.log('Cashew membership:', hasCashewMembership ? '✅' : '❌')
      console.log('Hairtalkz membership removed:', !hasHairtalkzMembership ? '✅' : '❌')
    }
    
  } catch (error) {
    console.error('💥 Error fixing user membership:', error)
  }
}

// Run the fix
fixCashewMembership()