/**
 * Check the actual schema of core_relationships table
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  console.log('🔍 Checking core_relationships table schema...')
  
  try {
    // Get a sample row to see the schema
    const { data, error } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Error querying relationships:', error)
      
      // Try with known CLAUDE.md field names
      console.log('Trying with CLAUDE.md documented field names...')
      const { data: claudeData, error: claudeError } = await supabase
        .from('core_relationships')
        .select('from_entity_id, to_entity_id, relationship_type')
        .limit(5)
      
      if (claudeError) {
        console.error('❌ CLAUDE.md field names also failed:', claudeError)
      } else {
        console.log('✅ CLAUDE.md field names work:', claudeData)
      }
      return
    }
    
    if (data && data.length > 0) {
      console.log('✅ Sample relationship records:')
      data.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, JSON.stringify(record, null, 2))
      })
      
      console.log('\n📋 Available columns:')
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}`)
      })
    } else {
      console.log('📋 No relationships found in table')
    }
    
  } catch (error) {
    console.error('💥 Error checking schema:', error)
  }
}

// Run the check
checkSchema()