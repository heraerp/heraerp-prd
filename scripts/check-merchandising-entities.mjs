#!/usr/bin/env node
/**
 * Check what merchandising entities actually exist
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000'

async function checkMerchandisingEntities() {
  console.log('🔍 Checking merchandising entities...')
  
  try {
    // Check all navigation entities
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', PLATFORM_ORG)
      .in('entity_type', ['APP_DOMAIN', 'APP_SECTION', 'APP_WORKSPACE'])
      .order('entity_type')
      .order('entity_name')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    console.log(`📋 Found ${data.length} navigation entities:`)
    
    data.forEach(entity => {
      console.log(`\n${entity.entity_type}: ${entity.entity_name}`)
      console.log(`  Code: ${entity.entity_code}`)
      console.log(`  Smart: ${entity.smart_code}`)
      console.log(`  Metadata: ${entity.metadata ? JSON.stringify(entity.metadata) : 'NULL'}`)
    })
    
    // Specifically look for merchandising
    console.log('\n🔍 Looking specifically for merchandising...')
    
    const { data: merchData, error: merchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', PLATFORM_ORG)
      .or('entity_code.ilike.%MERCHANDISING%,entity_name.ilike.%Merchandis%,smart_code.ilike.%MERCHANDISING%')
    
    if (merchError) {
      console.error('❌ Merchandising error:', merchError)
      return
    }
    
    console.log(`📦 Found ${merchData.length} merchandising entities:`)
    merchData.forEach(entity => {
      console.log(`  ${entity.entity_type}: ${entity.entity_name} (${entity.entity_code})`)
      console.log(`    Metadata: ${entity.metadata ? JSON.stringify(entity.metadata) : 'NULL'}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkMerchandisingEntities()