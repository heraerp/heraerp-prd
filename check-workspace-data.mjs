#!/usr/bin/env node

/**
 * Check Workspace Data in Database
 * Smart Code: HERA.TEST.WORKSPACE.DATABASE.v1
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkWorkspaceData() {
  console.log('🔍 Checking Workspace Data in Database')
  console.log('=====================================')

  // Check for APP_DOMAIN entities
  console.log('\n📁 APP_DOMAIN Entities:')
  const { data: domains, error: domainError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_DOMAIN')
    .limit(10)

  if (domainError) {
    console.log('❌ Error:', domainError.message)
  } else {
    console.log(`✅ Found ${domains?.length || 0} domain(s)`)
    domains?.forEach(domain => {
      console.log(`  - ${domain.entity_name} (${domain.entity_code})`)
    })
  }

  // Check for APP_SECTION entities
  console.log('\n📂 APP_SECTION Entities:')
  const { data: sections, error: sectionError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_SECTION')
    .limit(10)

  if (sectionError) {
    console.log('❌ Error:', sectionError.message)
  } else {
    console.log(`✅ Found ${sections?.length || 0} section(s)`)
    sections?.forEach(section => {
      console.log(`  - ${section.entity_name} (${section.entity_code})`)
    })
  }

  // Check for APP_WORKSPACE entities
  console.log('\n🏢 APP_WORKSPACE Entities:')
  const { data: workspaces, error: workspaceError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_WORKSPACE')
    .limit(10)

  if (workspaceError) {
    console.log('❌ Error:', workspaceError.message)
  } else {
    console.log(`✅ Found ${workspaces?.length || 0} workspace(s)`)
    workspaces?.forEach(workspace => {
      console.log(`  - ${workspace.entity_name} (${workspace.entity_code})`)
    })
  }

  // Check relationships between these entities
  console.log('\n🔗 Entity Relationships:')
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .in('relationship_type', ['CHILD_OF', 'BELONGS_TO', 'PART_OF'])
    .limit(20)

  if (relError) {
    console.log('❌ Error:', relError.message)
  } else {
    console.log(`✅ Found ${relationships?.length || 0} relationship(s)`)
    relationships?.forEach(rel => {
      console.log(`  - ${rel.from_entity_id} ${rel.relationship_type} ${rel.to_entity_id}`)
    })
  }

  // Check if we have any inventory-related entities
  console.log('\n📦 Inventory-related Entities:')
  const { data: inventoryEntities, error: invError } = await supabase
    .from('core_entities')
    .select('*')
    .or('entity_name.ilike.%inventory%,entity_code.ilike.%inventory%,entity_name.ilike.%stock%')
    .limit(10)

  if (invError) {
    console.log('❌ Error:', invError.message)
  } else {
    console.log(`✅ Found ${inventoryEntities?.length || 0} inventory-related entitie(s)`)
    inventoryEntities?.forEach(entity => {
      console.log(`  - ${entity.entity_type}: ${entity.entity_name} (${entity.entity_code})`)
    })
  }

  console.log('\n✅ Database check complete')
}

checkWorkspaceData().catch(console.error)