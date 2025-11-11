#!/usr/bin/env node

/**
 * Debug Database Contents
 * Check what entities exist in MatrixIT World organization
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Use development environment (lines 16-18 from .env)
const supabaseUrl = 'https://qqagokigwuujyeyrgdkq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
const MATRIXITWORLD_ORG_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugDatabase() {
  console.log('🔍 Debugging Database Contents')
  console.log('===============================')
  console.log(`🏢 Organization ID: ${MATRIXITWORLD_ORG_ID}`)
  
  // Check all entities in the organization, including recent ones
  const allEntities = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', MATRIXITWORLD_ORG_ID)
    .order('created_at', { ascending: false })
    
  // Also check all recent entities regardless of organization
  const recentEntities = await supabase
    .from('core_entities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
    
  console.log(`\n📊 Recent entities (all orgs): ${recentEntities.data?.length || 0}`)
  if (recentEntities.data && recentEntities.data.length > 0) {
    recentEntities.data.slice(0, 10).forEach(entity => {
      console.log(`  • ${entity.entity_type}: ${entity.entity_name} (Org: ${entity.organization_id}) - ${entity.created_at}`)
    })
  }
  
  console.log(`\n📊 Total entities found: ${allEntities.data?.length || 0}`)
  
  if (allEntities.data && allEntities.data.length > 0) {
    // Group by entity type
    const byType = allEntities.data.reduce((acc, entity) => {
      acc[entity.entity_type] = (acc[entity.entity_type] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📋 Entities by type:')
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
    
    // Show some sample entities
    console.log('\n📝 Sample entities:')
    allEntities.data.slice(0, 5).forEach(entity => {
      console.log(`  • ${entity.entity_type}: ${entity.entity_name} (${entity.entity_code || 'No Code'})`)
    })
    
    // Check specifically for vendors
    const vendors = allEntities.data.filter(e => e.entity_type === 'VENDOR')
    console.log(`\n🏭 Vendors found: ${vendors.length}`)
    vendors.forEach(vendor => {
      console.log(`  • ${vendor.entity_name} (${vendor.entity_code}) - Created: ${vendor.created_at}`)
    })
  } else {
    console.log('\n❌ No entities found in this organization')
    
    // Check if organization exists
    const orgCheck = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', MATRIXITWORLD_ORG_ID)
    
    console.log(`\n🏢 Organization check: ${orgCheck.data?.length || 0} found`)
    if (orgCheck.data && orgCheck.data.length > 0) {
      console.log(`  Name: ${orgCheck.data[0].name}`)
    }
    
    // Check all organizations ordered by creation date
    const allOrgs = await supabase
      .from('core_organizations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log(`\n🏢 All organizations in DB: ${allOrgs.data?.length || 0}`)
    if (allOrgs.data && allOrgs.data.length > 0) {
      allOrgs.data.forEach(org => {
        console.log(`  • ${org.organization_name || org.name || 'Unnamed'} (${org.id}) - Created: ${org.created_at}`)
      })
    }
  }
  
  // Check dynamic data
  const dynamicData = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', MATRIXITWORLD_ORG_ID)
    .limit(10)
  
  console.log(`\n📊 Dynamic data records: ${dynamicData.data?.length || 0}`)
  
  return {
    totalEntities: allEntities.data?.length || 0,
    vendors: allEntities.data?.filter(e => e.entity_type === 'VENDOR') || [],
    dynamicRecords: dynamicData.data?.length || 0
  }
}

// Execute
debugDatabase().then(result => {
  console.log('\n🎯 Debug Complete')
  console.log(`Total entities: ${result.totalEntities}`)
  console.log(`Vendors: ${result.vendors.length}`)
  console.log(`Dynamic data: ${result.dynamicRecords}`)
}).catch(console.error)