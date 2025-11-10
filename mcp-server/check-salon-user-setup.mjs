/**
 * Check salon@heraerp.com setup to understand the correct pattern
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking salon@heraerp.com Setup Pattern')
console.log('='.repeat(80))

// Step 1: Find salon auth user
const { data: salonAuthUser, error: authError } = await supabase.auth.admin.listUsers()

if (authError) {
  console.error('❌ Error listing auth users:', authError.message)
  process.exit(1)
}

const salonUser = salonAuthUser.users.find(u => u.email === 'salon@heraerp.com')

if (!salonUser) {
  console.log('❌ salon@heraerp.com not found in auth.users')
  process.exit(1)
}

console.log('✅ Salon Auth User:')
console.log('   Auth UID:', salonUser.id)
console.log('   Email:', salonUser.email)
console.log('   Metadata:', JSON.stringify(salonUser.user_metadata, null, 2))
console.log('')

// Step 2: Find salon USER entity
const { data: salonEntity, error: entityError } = await supabase
  .from('core_entities')
  .select('*')
  .eq('entity_type', 'USER')
  .or(`metadata->>supabase_user_id.eq.${salonUser.id},id.eq.${salonUser.user_metadata?.hera_user_entity_id || 'none'}`)
  .limit(1)
  .single()

if (entityError) {
  console.error('❌ Error finding salon USER entity:', entityError.message)
} else {
  console.log('✅ Salon USER Entity:')
  console.log('   Entity ID:', salonEntity.id)
  console.log('   Entity Name:', salonEntity.entity_name)
  console.log('   Entity Type:', salonEntity.entity_type)
  console.log('   Metadata:', JSON.stringify(salonEntity.metadata, null, 2))
}

console.log('')
console.log('='.repeat(80))
console.log('📋 CORRECT PATTERN FOR SALON USER:')
console.log('='.repeat(80))
console.log('✅ auth.users.user_metadata.hera_user_entity_id =', salonUser.user_metadata?.hera_user_entity_id || '❌ NOT SET')
console.log('✅ core_entities.metadata.supabase_user_id =', salonEntity?.metadata?.supabase_user_id || '❌ NOT SET')
console.log('')
console.log('Both should reference each other:')
console.log('  Auth UID → Entity ID:', salonUser.user_metadata?.hera_user_entity_id === salonEntity?.id ? '✅ MATCH' : '❌ MISMATCH')
console.log('  Entity → Auth UID:', salonEntity?.metadata?.supabase_user_id === salonUser.id ? '✅ MATCH' : '❌ MISMATCH')
console.log('='.repeat(80))
