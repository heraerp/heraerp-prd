#!/usr/bin/env node
/**
 * Find entities that might be branches
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findBranchEntities() {
  console.log('🔍 Searching for branch entities...\n')

  try {
    // Search for "Park Regis" or "Hotel" in entity names
    console.log('1️⃣  Searching for entities with "Park Regis" or "Hotel"...\n')

    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, organization_id, created_at')
      .or('entity_name.ilike.%Park Regis%,entity_name.ilike.%Hotel%,entity_name.ilike.%Branch%')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!entities || entities.length === 0) {
      console.log('⚠️  No entities found matching search criteria\n')

      // Try to get all entity types
      console.log('2️⃣  Let\'s see what entity_types exist...\n')

      const { data: types, error: typesError } = await supabase
        .from('core_entities')
        .select('entity_type')
        .limit(1000)

      if (typesError) {
        console.error('❌ Error:', typesError)
        return
      }

      const uniqueTypes = [...new Set(types.map(t => t.entity_type))]
      console.log('📋 Available entity types:')
      uniqueTypes.forEach(type => console.log(`   • ${type}`))

      return
    }

    console.log(`✅ Found ${entities.length} entities:\n`)

    entities.forEach((entity, index) => {
      console.log(`${index + 1}. ${entity.entity_name}`)
      console.log(`   Type: ${entity.entity_type}`)
      console.log(`   ID: ${entity.id}`)
      console.log(`   Org ID: ${entity.organization_id}`)
      console.log(`   Created: ${new Date(entity.created_at).toLocaleString()}\n`)
    })

    // Now check dynamic data for these entities
    console.log('=' .repeat(80))
    console.log('\n3️⃣  Checking dynamic data for these entities...\n')

    for (const entity of entities.slice(0, 5)) { // Check first 5 only
      console.log(`\n🏢 ${entity.entity_name} (${entity.entity_type})`)
      console.log('-'.repeat(80))

      const { data: fields, error: fieldsError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text')
        .eq('entity_id', entity.id)
        .in('field_name', ['address', 'phone', 'location', 'street', 'city'])

      if (fieldsError) {
        console.error('   ❌ Error:', fieldsError.message)
        continue
      }

      if (!fields || fields.length === 0) {
        console.log('   ⚠️  No address/location data found')
        continue
      }

      fields.forEach(field => {
        console.log(`   • ${field.field_name}: "${field.field_value_text}"`)

        // Check for potential issues
        if (field.field_value_text && field.field_value_text.length > 150) {
          console.log(`     🚨 WARNING: Very long value (${field.field_value_text.length} chars)`)
        }

        if (field.field_name === 'address' && field.field_value_text) {
          const commaCount = (field.field_value_text.match(/,/g) || []).length
          const hotelCount = (field.field_value_text.match(/Hotel/gi) || []).length

          if (commaCount > 3) {
            console.log(`     ⚠️  Multiple commas detected (${commaCount})`)
          }
          if (hotelCount > 1) {
            console.log(`     🚨 MULTIPLE HOTELS in address - likely concatenated!`)
          }
        }
      })
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

findBranchEntities()
