#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUserMembership() {
  const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
  
  console.log('🔍 Fixing user organization membership...')
  console.log(`👤 User ID: ${USER_ID}`)
  
  // Use the simple assignment function
  const { data: result, error } = await supabase
    .rpc('assign_user_to_first_org', {
      p_auth_user_id: USER_ID
    })
  
  if (error) {
    console.error('❌ Error assigning user to organization:', error)
    return
  }
  
  console.log('✅ Assignment result:', result)
  
  // Test the resolve_user_identity_v1 function
  console.log('🧪 Testing resolve_user_identity_v1 function...')
  
  const { data: identityResult, error: identityError } = await supabase
    .rpc('resolve_user_identity_v1')
  
  if (identityError) {
    console.error('❌ Error testing identity resolution:', identityError)
  } else {
    console.log('✅ Identity resolution result:', identityResult)
  }
  
  // Test user roles in org
  if (result?.organization_id) {
    console.log('🧪 Testing resolve_user_roles_in_org function...')
    
    const { data: rolesResult, error: rolesError } = await supabase
      .rpc('resolve_user_roles_in_org', {
        p_org: result.organization_id
      })
    
    if (rolesError) {
      console.error('❌ Error testing roles resolution:', rolesError)
    } else {
      console.log('✅ Roles resolution result:', rolesResult)
    }
  }
  
  console.log('🎉 User membership fix completed!')
}

// Run the fix
fixUserMembership().catch(console.error)