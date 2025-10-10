#!/usr/bin/env node

/**
 * Simple Branch Creation Script
 * Creates the two missing salon branches using direct API calls
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mpwctcxhykmzozwxmqpy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wd2N0Y3hoeWttem96d3htcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUyODY0OTIsImV4cCI6MjA0MDg2MjQ5Mn0.gvs7HfGAPvF8-TtdHQZLN1hYRQ5gCE2Q7QvgTrGjOgI'

const organizationId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const branches = [
  {
    entity_name: 'Park Regis Kris Kin Hotel',
    entity_code: 'PARK-REGIS',
    location: 'Al Karama, Dubai, U.A.E'
  },
  {
    entity_name: 'Mercure Gold Hotel',
    entity_code: 'MERCURE-GOLD', 
    location: 'Al Mina Road, Jumeirah, Dubai, U.A.E'
  }
]

async function createBranches() {
  console.log('🏗️ Creating salon branches...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Check existing branches
  console.log('📋 Checking existing branches...')
  const { data: existing, error: checkError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'BRANCH')
  
  if (checkError) {
    console.error('❌ Error checking branches:', checkError)
    return
  }
  
  console.log(`Found ${existing?.length || 0} existing branches`)
  existing?.forEach(b => console.log(`  - ${b.entity_name} (${b.entity_code})`))
  
  // Create missing branches
  for (const branch of branches) {
    console.log(`\n🔧 Creating: ${branch.entity_name}`)
    
    // Check if already exists
    const exists = existing?.find(b => 
      b.entity_name === branch.entity_name || b.entity_code === branch.entity_code
    )
    
    if (exists) {
      console.log(`✅ Already exists: ${branch.entity_name}`)
      continue
    }
    
    // Create branch
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'BRANCH',
        entity_name: branch.entity_name,
        entity_code: branch.entity_code,
        smart_code: 'HERA.SALON.BRANCH.LOCATION.V1',
        metadata: {
          location: branch.location,
          status: 'active',
          business_type: 'salon'
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error(`❌ Failed to create ${branch.entity_name}:`, error)
    } else {
      console.log(`✅ Created: ${branch.entity_name} (ID: ${data.id})`)
    }
  }
  
  // Final verification
  console.log('\n🔍 Final check...')
  const { data: final } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'BRANCH')
  
  console.log(`\n✅ Total branches: ${final?.length || 0}`)
  final?.forEach(b => console.log(`  - ${b.entity_name} (${b.entity_code}) - ${b.id}`))
  
  console.log('\n🎉 Done! Branches should now appear in salon appointments and other pages.')
}

createBranches().catch(console.error)