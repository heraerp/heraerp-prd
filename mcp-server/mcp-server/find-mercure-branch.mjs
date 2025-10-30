import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read .env from parent directory
const envPath = resolve('../.env')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function findMercureBranch() {
  console.log('🔍 Searching for "Mercure Gold Hotel" branch\n')
  console.log('=' .repeat(70))

  // Search in core_entities for any entity with "Mercure" in the name
  const { data: entities, error } = await supabase
    .from('core_entities')
    .select('*')
    .ilike('entity_name', '%Mercure%')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`\nFound ${entities.length} entities with "Mercure" in name:\n`)

  for (const entity of entities) {
    console.log(`📍 ${entity.entity_name}`)
    console.log(`   ID: ${entity.id}`)
    console.log(`   Type: ${entity.entity_type}`)
    console.log(`   Code: ${entity.entity_code}`)
    console.log(`   Org ID: ${entity.organization_id}`)
    console.log(`   Status: ${entity.status}`)
    console.log(`   Created: ${entity.created_at}`)

    // Fetch dynamic fields
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', entity.id)

    if (dynamicFields && dynamicFields.length > 0) {
      console.log(`\n   Dynamic Fields (${dynamicFields.length}):`)
      dynamicFields.forEach(field => {
        const value = field.field_value_text || 
                     field.field_value_number || 
                     field.field_value_boolean || 
                     field.field_value_date || 
                     JSON.stringify(field.field_value_json)
        console.log(`     - ${field.field_name}: ${value}`)
      })
    } else {
      console.log(`\n   ⚠️  No dynamic fields found`)
    }
    console.log('')
  }

  console.log('=' .repeat(70))
}

findMercureBranch().catch(console.error)
