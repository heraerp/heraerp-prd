#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAllEntityTypes() {
  console.log('\n🔍 CHECKING ALL ENTITY TYPES (CASE-INSENSITIVE)\n')

  try {
    const orgId = process.env.DEFAULT_ORGANIZATION_ID

    // Get ALL entities - no filter
    const { data: allEntities, error } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code')
      .eq('organization_id', orgId)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`✅ Total entities: ${allEntities.length}\n`)

    // Check every possible variation
    const variations = [
      'service',
      'Service',
      'SERVICE',
      'SALON_SERVICE',
      'salon_service'
    ]

    console.log('📊 Checking entity_type variations:')
    variations.forEach(variant => {
      const found = allEntities.filter(e =>
        e.entity_type === variant ||
        e.entity_type.toLowerCase() === variant.toLowerCase()
      )
      console.log(`  ${variant}: ${found.length} entities`)
      if (found.length > 0) {
        found.forEach(e => console.log(`    - ${e.entity_name} (${e.entity_type})`))
      }
    })

    // List ALL unique entity types
    const uniqueTypes = [...new Set(allEntities.map(e => e.entity_type))]
    console.log(`\n📋 All unique entity_type values in database:`)
    uniqueTypes.forEach(type => {
      const count = allEntities.filter(e => e.entity_type === type).length
      console.log(`  - ${type} (${count} entities)`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAllEntityTypes()
