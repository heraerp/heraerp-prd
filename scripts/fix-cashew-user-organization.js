#!/usr/bin/env node
/**
 * Fix Cashew User Organization Membership
 * 
 * This script fixes the user admin@keralacashew.com to be a member of the 
 * correct Kerala Cashew Processors organization instead of Hairtalkz
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Known IDs from the logs and documentation
const CASHEW_USER_ID = '75c61264-f5a0-4780-9f65-4bee0db4b4a2'
const CASHEW_ORG_ID = '7288d538-f111-42d4-a07a-b4c535c5adc3' // Kerala Cashew Processors
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Wrong org (salon)

async function fixCashewUserOrganization() {
  console.log('🔧 Fixing cashew user organization membership...')
  
  try {
    // Step 1: Check current user context
    console.log('\n📋 Step 1: Checking current user context...')
    const currentContext = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: CASHEW_USER_ID
    })
    
    if (currentContext.error) {
      console.error('❌ Failed to get current context:', currentContext.error)
      return
    }
    
    console.log('Current organizations for user:')
    currentContext.data?.organizations?.forEach(org => {
      console.log(`  - ${org.name} (${org.id}) - ${org.id === HAIRTALKZ_ORG_ID ? 'WRONG ❌' : org.id === CASHEW_ORG_ID ? 'CORRECT ✅' : 'UNKNOWN'}`)
    })
    
    // Step 2: Create relationship to correct organization if not exists
    console.log('\n📋 Step 2: Ensuring user is member of Kerala Cashew Processors...')
    
    const membershipResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: CASHEW_USER_ID,
      p_organization_id: CASHEW_ORG_ID,
      p_entity: {
        entity_type: 'membership',
        entity_name: 'Cashew Admin Membership',
        smart_code: 'HERA.CASHEW.MEMBERSHIP.ADMIN.v1'
      },
      p_dynamic: {
        role: {
          field_type: 'text',
          field_value_text: 'admin',
          smart_code: 'HERA.CASHEW.MEMBERSHIP.FIELD.ROLE.v1'
        }
      },
      p_relationships: [
        {
          relationship_type: 'USER_MEMBER_OF_ORG',
          source_entity_id: CASHEW_USER_ID,
          target_entity_id: CASHEW_ORG_ID,
          smart_code: 'HERA.CASHEW.RELATIONSHIP.USER_MEMBER_OF_ORG.v1'
        }
      ],
      p_options: {}
    })
    
    if (membershipResult.error) {
      console.log('ℹ️ Membership might already exist:', membershipResult.error.message)
    } else {
      console.log('✅ User membership to Kerala Cashew Processors created/updated')
    }
    
    // Step 3: Verify fix
    console.log('\n📋 Step 3: Verifying fix...')
    const verifyContext = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: CASHEW_USER_ID
    })
    
    if (verifyContext.error) {
      console.error('❌ Failed to verify fix:', verifyContext.error)
      return
    }
    
    console.log('✅ Updated organizations for user:')
    verifyContext.data?.organizations?.forEach(org => {
      console.log(`  - ${org.name} (${org.id}) - ${org.id === CASHEW_ORG_ID ? 'CORRECT ✅' : 'OTHER'}`)
    })
    
    const hasCorrectOrg = verifyContext.data?.organizations?.some(org => org.id === CASHEW_ORG_ID)
    if (hasCorrectOrg) {
      console.log('\n🎉 SUCCESS: User is now properly associated with Kerala Cashew Processors!')
      console.log('📧 Email: admin@keralacashew.com')
      console.log('🔑 Password: CashewAdmin2024!')
      console.log('🏢 Organization: Kerala Cashew Processors')
      console.log('🆔 Org ID:', CASHEW_ORG_ID)
    } else {
      console.log('\n⚠️ Warning: User still not associated with correct organization')
    }
    
  } catch (error) {
    console.error('💥 Error fixing user organization:', error)
  }
}

// Run the fix
fixCashewUserOrganization()