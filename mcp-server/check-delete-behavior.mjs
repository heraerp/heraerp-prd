import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test data
const testData = {
  user_entity_id: "b508bc8c-85c8-4c93-b3af-cb2d76cbdab5",
  organization_id: "96b1b1b6-56df-42d5-80d5-3c73854682eb"
}

async function checkDeleteBehavior() {
  console.log('🔍 Checking delete behavior differences...\n')
  
  // Check recent staff deletions
  const { data: staffDeletes, error: staffError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status, updated_at')
    .eq('entity_type', 'STAFF')
    .eq('organization_id', testData.organization_id)
    .order('updated_at', { ascending: false })
    .limit(5)
  
  console.log('Recent STAFF entities:')
  console.table(staffDeletes || [])
  
  // Check recent service deletions
  const { data: serviceDeletes, error: serviceError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status, updated_at')
    .eq('entity_type', 'SERVICE')
    .eq('organization_id', testData.organization_id)
    .order('updated_at', { ascending: false })
    .limit(5)
  
  console.log('\nRecent SERVICE entities:')
  console.table(serviceDeletes || [])
  
  // Check what columns exist in core_entities
  const { data: sampleEntity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', testData.organization_id)
    .limit(1)
    .single()
  
  console.log('\n📊 Available columns in core_entities:')
  console.log(Object.keys(sampleEntity || {}).join(', '))
  
  console.log('\n🔍 Key Finding: Does deleted_at column exist?')
  console.log('Answer:', Object.keys(sampleEntity || {}).includes('deleted_at') ? 'YES' : 'NO')
}

checkDeleteBehavior().catch(console.error)
