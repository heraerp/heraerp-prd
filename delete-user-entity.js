// Script to delete user entity
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteUserEntity() {
  const userId = 'bf038aaf-2fc9-42e8-ab86-abf0a6ff51d3'

  console.log('Deleting user entity...')

  const { error } = await supabase
    .from('core_entities')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting user entity:', error)
    process.exit(1)
  }

  console.log('✅ User entity deleted successfully!')
  console.log('User ID:', userId)
}

deleteUserEntity()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
