import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
)

const relationshipId = 'd785a5b1-3474-4737-9906-21dd595beaa6'

console.log('🔧 Activating the remaining ORG_HAS_APP relationship...\n')

try {
  // Update is_active to true
  const { data, error } = await supabase
    .from('core_relationships')
    .update({ is_active: true })
    .eq('id', relationshipId)
    .select()

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log('✅ Relationship activated!')
  console.log(`   ID: ${data[0].id}`)
  console.log(`   Active: ${data[0].is_active}`)
  console.log(`   Organization: ${data[0].organization_id}`)
  console.log(`   App Entity: ${data[0].to_entity_id}`)

  console.log('\n💡 The SALON app should now be available to the user.')
  console.log('   Refresh your browser to see the change.')

} catch (err) {
  console.error('❌ Error:', err.message)
  console.error(err.stack)
  process.exit(1)
}
