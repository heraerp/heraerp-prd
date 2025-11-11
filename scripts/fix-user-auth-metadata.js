/**
 * Fix user auth metadata to point to correct organization
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

async function fixUserAuthMetadata() {
  console.log('🔧 Fixing user auth metadata...')
  
  try {
    // Step 1: Check current user auth record
    console.log('\n📋 Step 1: Checking current user auth record...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(CASHEW_USER_ID)
    
    if (authError) {
      console.error('❌ Error getting auth user:', authError)
      return
    }
    
    console.log('Current auth user metadata:')
    console.log('  - Email:', authUser.user.email)
    console.log('  - Current metadata:', JSON.stringify(authUser.user.user_metadata, null, 2))
    console.log('  - Current app metadata:', JSON.stringify(authUser.user.app_metadata, null, 2))
    
    // Step 2: Update user metadata to point to cashew organization
    console.log('\n📋 Step 2: Updating user metadata...')
    
    const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
      CASHEW_USER_ID,
      {
        user_metadata: {
          ...authUser.user.user_metadata,
          organization_id: CASHEW_ORG_ID,
          organization_name: 'Kerala Cashew Processors',
          industry: 'cashew_manufacturing',
          role: 'admin'
        },
        app_metadata: {
          ...authUser.user.app_metadata,
          organization_id: CASHEW_ORG_ID,
          organization_name: 'Kerala Cashew Processors',
          industry: 'cashew_manufacturing',
          default_organization: CASHEW_ORG_ID
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating user metadata:', updateError)
      return
    }
    
    console.log('✅ User metadata updated successfully')
    
    // Step 3: Verify the update
    console.log('\n📋 Step 3: Verifying updated user metadata...')
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(CASHEW_USER_ID)
    
    if (verifyError) {
      console.error('❌ Error verifying user update:', verifyError)
      return
    }
    
    console.log('Updated auth user metadata:')
    console.log('  - Email:', verifyUser.user.email)
    console.log('  - User metadata:', JSON.stringify(verifyUser.user.user_metadata, null, 2))
    console.log('  - App metadata:', JSON.stringify(verifyUser.user.app_metadata, null, 2))
    
    const hasCorrectOrgId = verifyUser.user.user_metadata?.organization_id === CASHEW_ORG_ID ||
                           verifyUser.user.app_metadata?.organization_id === CASHEW_ORG_ID
    
    if (hasCorrectOrgId) {
      console.log('\n🎉 SUCCESS: User auth metadata now points to Kerala Cashew Processors!')
      console.log('📧 Email: admin@keralacashew.com')
      console.log('🔑 Password: CashewAdmin2024!')  
      console.log('🏢 Organization: Kerala Cashew Processors')
      console.log('🆔 Org ID:', CASHEW_ORG_ID)
      console.log('\n✅ User should now authenticate correctly to cashew dashboard')
    } else {
      console.log('\n⚠️ Warning: Organization ID may not have been set correctly')
    }
    
  } catch (error) {
    console.error('💥 Error fixing user auth metadata:', error)
  }
}

// Run the fix
fixUserAuthMetadata()