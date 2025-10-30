import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findUsers() {
  console.log('🔍 Finding Hairtalkz users...\n')

  // Check auth.users table
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.log('❌ Auth error:', authError.message)
    return
  }

  console.log(`📋 Found ${authUsers.users.length} auth users`)
  
  const hairtalkzUsers = authUsers.users.filter(u => 
    u.email && u.email.includes('hairtalkz')
  )

  console.log(`\n👥 Hairtalkz users in auth.users:`)
  for (const user of hairtalkzUsers) {
    console.log(`   - ${user.email}`)
    console.log(`     Auth ID: ${user.id}`)
    console.log(`     Created: ${user.created_at}`)
  }

  // Check if USER entities exist with these auth IDs
  console.log(`\n🔍 Checking USER entities...`)
  for (const user of hairtalkzUsers) {
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, smart_code')
      .eq('id', user.id)
      .eq('entity_type', 'USER')
      .single()

    if (entityError) {
      console.log(`\n❌ ${user.email}:`)
      console.log(`   No USER entity found with ID ${user.id}`)
      console.log(`   Error: ${entityError.message}`)
    } else {
      console.log(`\n✅ ${user.email}:`)
      console.log(`   Entity ID: ${userEntity.id}`)
      console.log(`   Entity Name: ${userEntity.entity_name}`)
      console.log(`   Smart Code: ${userEntity.smart_code}`)
    }
  }
}

findUsers()
