#!/usr/bin/env node

/**
 * Check Navigation Entities Script
 * Verifies if navigation entities exist in the database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 Checking Navigation Entities')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

async function checkNavigationEntities() {
  try {
    // Check if navigation entities exist
    const { data, error } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, entity_code')
      .like('entity_type', 'navigation_%')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .order('entity_type, entity_code')

    if (error) {
      console.error('❌ Error querying entities:', error)
      return
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} navigation entities:`)
      console.log()
      
      // Group by entity type
      const grouped = data.reduce((acc, entity) => {
        if (!acc[entity.entity_type]) {
          acc[entity.entity_type] = []
        }
        acc[entity.entity_type].push(entity)
        return acc
      }, {})

      Object.entries(grouped).forEach(([type, entities]) => {
        console.log(`📁 ${type}: ${entities.length} entities`)
        entities.slice(0, 5).forEach(entity => {
          console.log(`   • ${entity.entity_code}: ${entity.entity_name}`)
        })
        if (entities.length > 5) {
          console.log(`   ... and ${entities.length - 5} more`)
        }
        console.log()
      })

      console.log('🎉 Navigation entities already exist in this database!')
      console.log('📊 Run this verification query in Supabase SQL Editor:')
      console.log(`
SELECT entity_type, COUNT(*) as count
FROM core_entities 
WHERE entity_type LIKE 'navigation_%'
  AND organization_id = '00000000-0000-0000-0000-000000000000'
GROUP BY entity_type
ORDER BY entity_type;
      `)

    } else {
      console.log('❌ No navigation entities found.')
      console.log('💡 You can run the migration to create them.')
    }

  } catch (error) {
    console.error('❌ Failed to check entities:', error)
  }
}

checkNavigationEntities()