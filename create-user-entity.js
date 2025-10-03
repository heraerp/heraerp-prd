// Quick script to create user entity for current logged-in user
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUserEntity() {
  const userId = 'bf038aaf-2fc9-42e8-ab86-abf0a6ff51d3'
  const organizationId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz

  console.log('Creating user entity...')

  // Check if user already exists
  const { data: existing } = await supabase
    .from('core_entities')
    .select('id')
    .eq('id', userId)
    .single()

  if (existing) {
    console.log('User entity already exists!')
    return
  }

  // Get user email from auth
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  const email = authUser?.user?.email || 'user@hairtalkz.com'

  console.log('User email:', email)

  // Create user entity
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      id: userId,
      organization_id: organizationId,
      entity_type: 'user',
      entity_name: email,
      entity_code: `USER-${userId.substring(0, 8)}`,
      smart_code: 'HERA.CORE.USER.ENT.STANDARD.V1',
      metadata: { email, created_for: 'audit_trail_support' }
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user entity:', error)
    process.exit(1)
  }

  console.log('✅ User entity created successfully!')
  console.log('User ID:', userId)
  console.log('Entity:', data)
}

createUserEntity()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
