#!/usr/bin/env node
/**
 * Check existing entities and their smart codes in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORGANIZATION_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID

async function checkExistingEntities() {
  console.log('🔍 Checking existing entities...')
  
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .select('entity_type, entity_code, entity_name, smart_code')
      .eq('organization_id', ORGANIZATION_ID)
      .limit(10)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log('📋 Found', data.length, 'entities:')
    data.forEach(entity => {
      console.log(`  ${entity.entity_type}: ${entity.entity_name}`)
      console.log(`    Code: ${entity.entity_code}`)
      console.log(`    Smart: ${entity.smart_code}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkExistingEntities()