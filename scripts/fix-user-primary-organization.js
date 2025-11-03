#!/usr/bin/env node
/**
 * Fix user primary organization by updating the USER entity in platform org
 * This addresses the root cause where the USER entity still points to Hairtalkz
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
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function fixUserPrimaryOrganization() {
  console.log('🔧 Fixing user primary organization in USER entity...')
  
  try {
    // Step 1: Find the USER entity in platform organization
    console.log('\n📋 Step 1: Finding USER entity in platform organization...')
    const { data: userEntities, error: findError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', PLATFORM_ORG_ID)
      .eq('entity_type', 'USER')
      .eq('id', CASHEW_USER_ID)
    
    if (findError) {
      console.error('❌ Error finding user entity:', findError)
      return
    }
    
    if (!userEntities || userEntities.length === 0) {
      console.log('❌ USER entity not found in platform organization')
      return
    }
    
    const userEntity = userEntities[0]
    console.log('✅ Found USER entity:', userEntity.entity_name)
    console.log('Current metadata:', JSON.stringify(userEntity.metadata, null, 2))
    
    // Step 2: Update the USER entity metadata to point to cashew organization
    console.log('\n📋 Step 2: Updating USER entity metadata...')
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        metadata: {
          ...userEntity.metadata,
          metadata_category: 'user_profile',
          organization_id: CASHEW_ORG_ID,
          organization_name: 'Kerala Cashew Processors',
          industry: 'cashew_manufacturing',
          primary_organization: CASHEW_ORG_ID,
          default_organization: CASHEW_ORG_ID,
          primary_role: 'admin'
        },
        updated_by: CASHEW_USER_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', CASHEW_USER_ID)
      .eq('organization_id', PLATFORM_ORG_ID)
    
    if (updateError) {
      console.error('❌ Error updating user entity:', updateError)
      return
    }
    
    console.log('✅ USER entity metadata updated successfully')
    
    // Step 3: Update dynamic data for default organization
    console.log('\n📋 Step 3: Updating user dynamic data for default organization...')
    
    // Check if default_organization dynamic field exists
    const { data: existingDynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', CASHEW_USER_ID)
      .eq('field_name', 'default_organization')
    
    if (dynamicError) {
      console.log('ℹ️ Error checking existing dynamic data:', dynamicError.message)
    }
    
    if (existingDynamicData && existingDynamicData.length > 0) {
      // Update existing
      const { error: updateDynamicError } = await supabase
        .from('core_dynamic_data')
        .update({
          field_value_text: CASHEW_ORG_ID,
          updated_by: CASHEW_USER_ID,
          updated_at: new Date().toISOString()
        })
        .eq('entity_id', CASHEW_USER_ID)
        .eq('field_name', 'default_organization')
      
      if (updateDynamicError) {
        console.error('❌ Error updating dynamic data:', updateDynamicError)
      } else {
        console.log('✅ Updated existing default_organization dynamic field')
      }
    } else {
      // Create new
      const { error: insertDynamicError } = await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: CASHEW_USER_ID,
          organization_id: PLATFORM_ORG_ID,
          field_name: 'default_organization',
          field_type: 'text',
          field_value_text: CASHEW_ORG_ID,
          smart_code: 'HERA.USER.FIELD.DEFAULT_ORGANIZATION.v1',
          created_by: CASHEW_USER_ID,
          updated_by: CASHEW_USER_ID
        })
      
      if (insertDynamicError) {
        console.error('❌ Error inserting dynamic data:', insertDynamicError)
      } else {
        console.log('✅ Created new default_organization dynamic field')
      }
    }
    
    // Step 4: Verify the changes
    console.log('\n📋 Step 4: Verifying changes...')
    const { data: verifyEntity, error: verifyError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', CASHEW_USER_ID)
      .eq('organization_id', PLATFORM_ORG_ID)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError)
      return
    }
    
    console.log('✅ Updated USER entity metadata:')
    console.log('  - Primary organization:', verifyEntity.metadata?.primary_organization)
    console.log('  - Default organization:', verifyEntity.metadata?.default_organization)
    console.log('  - Organization name:', verifyEntity.metadata?.organization_name)
    console.log('  - Industry:', verifyEntity.metadata?.industry)
    
    // Test authentication context
    console.log('\n📋 Step 5: Testing authentication context...')
    try {
      const { data: authTest, error: authError } = await supabase.rpc('hera_auth_introspect_v1', {
        p_actor_user_id: CASHEW_USER_ID
      })
      
      if (authError) {
        console.log('⚠️ Auth test error:', authError.message)
      } else {
        console.log('🔍 Auth test result:')
        authTest?.organizations?.forEach(org => {
          console.log(`  - ${org.name} (${org.id}) - ${org.id === CASHEW_ORG_ID ? 'CASHEW ✅' : 'OTHER'}`)
        })
        console.log('  - Default org:', authTest?.default_organization_id)
      }
    } catch (authTestError) {
      console.log('⚠️ Auth test failed:', authTestError.message)
    }
    
    console.log('\n🎉 SUCCESS: User primary organization updated!')
    console.log('📧 Email: admin@keralacashew.com')
    console.log('🔑 Password: CashewAdmin2024!')
    console.log('🏢 Primary Organization: Kerala Cashew Processors')
    console.log('🆔 Org ID:', CASHEW_ORG_ID)
    
  } catch (error) {
    console.error('💥 Error fixing user primary organization:', error)
  }
}

// Run the fix
fixUserPrimaryOrganization()