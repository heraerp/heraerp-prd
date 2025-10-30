import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkEntities() {
  console.log('🔍 Checking entities table structure...\n')
  
  // Get any entity to see columns
  const { data: anyEntity, error } = await supabase
    .from('core_entities')
    .select('*')
    .limit(1)
    .maybeSingle()
  
  if (anyEntity) {
    console.log('📊 Columns in core_entities:')
    console.log(Object.keys(anyEntity).join(', '))
    console.log('\n✅ Has deleted_at?', 'deleted_at' in anyEntity)
    console.log('✅ Has status?', 'status' in anyEntity)
  } else {
    console.log('No entities found or error:', error)
  }
  
  // Now let me trace through what happens during delete
  // by reading the actual RPC function
  console.log('\n📖 Reading hera_entities_crud_v1 DELETE action...')
}

checkEntities().catch(console.error)
