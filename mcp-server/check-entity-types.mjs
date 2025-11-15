#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkEntityTypes() {
  console.log('\n🔍 CHECKING ENTITY TYPES IN DATABASE\n')

  try {
    // Get unique entity types
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, id')
      .eq('organization_id', process.env.DEFAULT_ORGANIZATION_ID)
      .order('entity_type', { ascending: true })
      .limit(100)

    if (error) {
      console.error('❌ Error fetching entities:', error)
      return
    }

    console.log(`\n✅ Found ${entities.length} entities total`)

    // Group by entity_type
    const typeGroups = entities.reduce((acc, entity) => {
      if (!acc[entity.entity_type]) {
        acc[entity.entity_type] = []
      }
      acc[entity.entity_type].push(entity)
      return acc
    }, {})

    console.log('\n📊 Entities grouped by type:')
    Object.entries(typeGroups).forEach(([type, entities]) => {
      console.log(`\n  ${type.toUpperCase()} (${entities.length} entities):`)
      entities.slice(0, 5).forEach(entity => {
        console.log(`    - ${entity.entity_name} (ID: ${entity.id})`)
      })
      if (entities.length > 5) {
        console.log(`    ... and ${entities.length - 5} more`)
      }
    })

    // Check specifically for service-related entities
    console.log('\n🔍 Looking for service-related entities...')
    const serviceRelated = entities.filter(e =>
      e.entity_type.toLowerCase().includes('service') ||
      e.entity_name.toLowerCase().includes('service')
    )

    console.log(`\n✅ Found ${serviceRelated.length} service-related entities:`)
    serviceRelated.forEach(entity => {
      console.log(`  - Type: ${entity.entity_type}, Name: ${entity.entity_name}, ID: ${entity.id}`)
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkEntityTypes()
