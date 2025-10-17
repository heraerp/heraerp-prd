#!/usr/bin/env node
/**
 * Find all entity types in the database
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

async function findEntityTypes() {
  console.log('🔍 Finding all entity types in database...\n')

  try {
    // Get all unique entity types with counts
    const { data, error } = await supabase
      .from('core_entities')
      .select('entity_type')
      .limit(10000) // Get a large sample

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No entities found\n')
      return
    }

    // Count occurrences of each type
    const typeCounts = {}
    data.forEach(row => {
      const type = row.entity_type || 'NULL'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    // Sort by count (descending)
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])

    console.log(`✅ Found ${data.length} total entities across ${sorted.length} types:\n`)
    console.log('Entity Type'.padEnd(30) + 'Count')
    console.log('='.repeat(50))

    sorted.forEach(([type, count]) => {
      console.log(`${type.padEnd(30)}${count}`)
    })

    console.log('\n' + '='.repeat(50))

    // Now show recent entities of each type (limit to top 5 types)
    console.log('\n📋 Sample entities from each type:\n')

    for (const [type, count] of sorted.slice(0, 5)) {
      console.log(`\n📌 ${type} (${count} total):`)
      console.log('-'.repeat(80))

      const { data: samples, error: sampleError } = await supabase
        .from('core_entities')
        .select('id, entity_name, created_at')
        .eq('entity_type', type)
        .order('created_at', { ascending: false })
        .limit(3)

      if (sampleError) {
        console.log(`   ❌ Error: ${sampleError.message}`)
      } else if (samples && samples.length > 0) {
        samples.forEach(entity => {
          console.log(`   • ${entity.entity_name}`)
          console.log(`     ID: ${entity.id}`)
          console.log(`     Created: ${new Date(entity.created_at).toLocaleString()}`)
        })
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

findEntityTypes()
