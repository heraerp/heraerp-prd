#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkServices() {
  console.log('\n🔍 COMPREHENSIVE SERVICE ENTITY CHECK\n')

  try {
    const orgId = process.env.DEFAULT_ORGANIZATION_ID

    // Check ALL entity types (case-insensitive)
    console.log('📊 Step 1: Checking all entities...')
    const { data: allEntities, error: allError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code')
      .eq('organization_id', orgId)
      .order('entity_type', { ascending: true })

    if (allError) {
      console.error('❌ Error:', allError)
      return
    }

    console.log(`\n✅ Total entities: ${allEntities.length}`)

    // Group by type
    const byType = allEntities.reduce((acc, e) => {
      const type = e.entity_type.toUpperCase()
      if (!acc[type]) acc[type] = []
      acc[type].push(e)
      return acc
    }, {})

    console.log('\n📋 Entities by type:')
    Object.entries(byType).forEach(([type, entities]) => {
      console.log(`\n  ${type} (${entities.length}):`)
      entities.slice(0, 10).forEach(e => {
        console.log(`    - ${e.entity_name}`)
        console.log(`      ID: ${e.id}`)
        console.log(`      Smart Code: ${e.smart_code}`)
      })
    })

    // Check dynamic data for service entities
    console.log('\n📊 Step 2: Checking dynamic data for services...')
    const serviceEntities = allEntities.filter(e =>
      e.entity_type.toLowerCase().includes('service') ||
      e.smart_code?.toLowerCase().includes('service')
    )

    if (serviceEntities.length > 0) {
      console.log(`\n✅ Found ${serviceEntities.length} service entities`)

      for (const service of serviceEntities) {
        const { data: dynamicData } = await supabase
          .from('core_dynamic_data')
          .select('field_name, field_value_text, field_value_number')
          .eq('entity_id', service.id)
          .eq('organization_id', orgId)

        console.log(`\n  📦 ${service.entity_name} dynamic data:`)
        dynamicData?.forEach(d => {
          console.log(`    ${d.field_name}: ${d.field_value_text || d.field_value_number}`)
        })
      }
    } else {
      console.log('\n❌ NO SERVICE ENTITIES FOUND!')
    }

    // Check if services hook/page exists
    console.log('\n📊 Step 3: Check what POS is using...')
    console.log('Need to check: /hooks/useSalonPOS.ts or /hooks/useHeraServices.ts')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkServices()
