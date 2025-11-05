import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const RETAIL_USER_ENTITY_ID = 'f7f778da-e629-40f2-a255-38825ed1db37'
const RETAIL_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c'

console.log('Testing Introspection for Retail User')
console.log('User Entity ID:', RETAIL_USER_ENTITY_ID)
console.log('Expected Org ID:', RETAIL_ORG_ID)
console.log('')

// Call hera_auth_introspect_v1 with user entity ID
const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
  p_actor_user_id: RETAIL_USER_ENTITY_ID
})

if (error) {
  console.error('Introspection Error:', error)
  process.exit(1)
}

console.log('Introspection Result:')
console.log(JSON.stringify(data, null, 2))
console.log('')

console.log('Organization Count:', data?.organization_count || 0)
console.log('Organizations:', data?.organizations?.length || 0)
console.log('')

if (data?.organizations && data.organizations.length > 0) {
  console.log('FOUND ORGANIZATIONS:')
  data.organizations.forEach((org, i) => {
    console.log(`  [${i + 1}] ${org.name} (${org.code})`)
    console.log(`      Org ID: ${org.id}`)
    console.log(`      Role: ${org.primary_role}`)
  })
} else {
  console.log('NO ORGANIZATIONS FOUND')
  console.log('')
  console.log('Checking memberships directly...')
  
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', RETAIL_USER_ENTITY_ID)
    .eq('relationship_type', 'MEMBER_OF')
  
  console.log('Memberships from core_relationships:')
  console.log(JSON.stringify(memberships, null, 2))
}
