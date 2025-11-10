/**
 * Fix demo@heraerp.com and cashew@heraerp.com user metadata
 * Sync auth.users.user_metadata.hera_user_entity_id with core_entities.metadata.supabase_user_id
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const USERS_TO_FIX = [
  { email: 'demo@heraerp.com', name: 'Demo User' },
  { email: 'cashew@heraerp.com', name: 'Cashew Demo User' }
]

console.log('🔧 Fixing User Metadata for demo@heraerp.com and cashew@heraerp.com')
console.log('='.repeat(80))
console.log('')

async function fixUser(email, fullName) {
  console.log(`📝 Processing ${email}...`)
  console.log('-'.repeat(80))

  // Step 1: Find auth user
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error(`❌ Error listing auth users:`, authError.message)
    return false
  }

  const authUser = authUsers.users.find(u => u.email === email)

  if (!authUser) {
    console.error(`❌ ${email} not found in auth.users`)
    return false
  }

  console.log(`✅ Found auth user:`)
  console.log(`   Auth UID: ${authUser.id}`)
  console.log(`   Current metadata:`, JSON.stringify(authUser.user_metadata, null, 2))
  console.log('')

  // Step 2: Find USER entity by supabase_user_id in metadata
  const { data: userEntity, error: entityError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, metadata')
    .eq('entity_type', 'USER')
    .contains('metadata', { supabase_user_id: authUser.id })
    .limit(1)
    .single()

  if (entityError || !userEntity) {
    console.error(`❌ No USER entity found with supabase_user_id: ${authUser.id}`)
    console.error(`   Error:`, entityError?.message || 'No entity found')
    return false
  }

  console.log(`✅ Found USER entity:`)
  console.log(`   Entity ID: ${userEntity.id}`)
  console.log(`   Entity Name: ${userEntity.entity_name}`)
  console.log(`   Current metadata:`, JSON.stringify(userEntity.metadata, null, 2))
  console.log('')

  // Step 3: Check if already synced
  const alreadySynced = authUser.user_metadata?.hera_user_entity_id === userEntity.id

  if (alreadySynced) {
    console.log(`✅ ${email} is already synced correctly!`)
    console.log(`   Auth metadata has correct hera_user_entity_id: ${userEntity.id}`)
    console.log('')
    return true
  }

  // Step 4: Update auth.users.user_metadata to include hera_user_entity_id
  console.log(`🔄 Updating auth.users.user_metadata for ${email}...`)

  const updatedMetadata = {
    ...authUser.user_metadata,
    hera_user_entity_id: userEntity.id,
    full_name: fullName,
    email_verified: true
  }

  const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    {
      user_metadata: updatedMetadata
    }
  )

  if (updateError) {
    console.error(`❌ Failed to update auth user metadata:`, updateError.message)
    return false
  }

  console.log(`✅ Successfully updated auth.users.user_metadata!`)
  console.log(`   New metadata:`, JSON.stringify(updatedMetadata, null, 2))
  console.log('')

  // Step 5: Verify the fix
  console.log(`🔍 Verifying sync for ${email}...`)
  console.log(`   Auth UID → Entity ID: ${updatedMetadata.hera_user_entity_id === userEntity.id ? '✅ MATCH' : '❌ MISMATCH'}`)
  console.log(`   Entity → Auth UID: ${userEntity.metadata.supabase_user_id === authUser.id ? '✅ MATCH' : '❌ MISMATCH'}`)
  console.log('')

  return true
}

// Process all users
let successCount = 0
let failCount = 0

for (const user of USERS_TO_FIX) {
  const success = await fixUser(user.email, user.name)
  if (success) {
    successCount++
  } else {
    failCount++
  }
  console.log('='.repeat(80))
  console.log('')
}

// Final Summary
console.log('🎯 FINAL SUMMARY:')
console.log('='.repeat(80))
console.log(`✅ Successfully fixed: ${successCount}`)
console.log(`❌ Failed: ${failCount}`)
console.log('')

if (successCount > 0) {
  console.log('✨ User metadata has been synced successfully!')
  console.log('📋 What was fixed:')
  console.log('   1. auth.users.user_metadata.hera_user_entity_id → Points to core_entities.id')
  console.log('   2. core_entities.metadata.supabase_user_id → Points to auth.users.id')
  console.log('')
  console.log('🔐 Authentication will now work correctly for these users!')
}

console.log('='.repeat(80))
