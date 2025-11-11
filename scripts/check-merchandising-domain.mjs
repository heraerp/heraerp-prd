#!/usr/bin/env node
/**
 * Check where the merchandising domain was created
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkMerchandisingDomain() {
  console.log('🔍 Checking merchandising domain...')
  
  try {
    // Check for merchandising domain in any organization
    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'domain')
      .eq('entity_code', 'MERCHANDISING')
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (data.length === 0) {
      console.log('❌ No merchandising domain found')
      return
    }
    
    console.log('✅ Found merchandising domain(s):')
    data.forEach(domain => {
      console.log(`  ID: ${domain.id}`)
      console.log(`  Name: ${domain.entity_name}`)
      console.log(`  Org ID: ${domain.organization_id}`)
      console.log(`  Smart Code: ${domain.smart_code}`)
      console.log(`  Metadata: ${JSON.stringify(domain.metadata, null, 2)}`)
      console.log('')
    })
    
    // Also check for sections
    console.log('🔍 Checking related sections...')
    const { data: sections, error: sectionsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'section')
      .ilike('smart_code', '%RETAIL.SECTION%')
    
    if (sectionsError) {
      console.error('❌ Sections error:', sectionsError)
      return
    }
    
    console.log(`✅ Found ${sections.length} retail sections:`)
    sections.forEach(section => {
      console.log(`  ${section.entity_name} (${section.entity_code})`)
      console.log(`    Org ID: ${section.organization_id}`)
      console.log(`    Metadata domain: ${section.metadata?.domain}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkMerchandisingDomain()