#!/usr/bin/env node

/**
 * Direct API Test - Universal Workspace
 * Smart Code: HERA.TEST.API.DIRECT.v1
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testWorkspaceFromDatabase(domain, section, workspace) {
  console.log(`🔍 Testing Database-driven Workspace: ${domain}/${section}/${workspace}`)
  console.log('=' .repeat(60))
  
  try {
    console.log('🔍 Step 1: Finding domain entity...')
    
    // Step 1: Find the domain entity by slug or name
    const { data: domainEntity, error: domainError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_DOMAIN')
      .or(`metadata->>slug.eq.${domain},entity_name.ilike.%${domain}%,entity_code.ilike.%${domain.toUpperCase()}%`)
      .single()

    if (domainError || !domainEntity) {
      console.log(`❌ Domain '${domain}' not found:`, domainError)
      return null
    }

    console.log(`✅ Found domain: ${domainEntity.entity_name} (${domainEntity.id})`)

    console.log('🔍 Step 2: Finding section entity...')
    
    // Step 2: Find the section entity that belongs to this domain
    const { data: sectionRelationships, error: sectionRelError } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        to_entity_id,
        relationship_type
      `)
      .eq('to_entity_id', domainEntity.id)
      .in('relationship_type', ['CHILD_OF', 'BELONGS_TO', 'PART_OF'])

    if (sectionRelError) {
      console.log('❌ Error finding section relationships:', sectionRelError)
      return null
    }

    const sectionIds = sectionRelationships?.map(rel => rel.from_entity_id) || []

    if (sectionIds.length === 0) {
      console.log('❌ No sections found for domain')
      return null
    }

    const { data: sectionEntity, error: sectionError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .in('id', sectionIds)
      .or(`metadata->>slug.eq.${section},entity_name.ilike.%${section}%,entity_code.ilike.%${section.toUpperCase()}%`)
      .single()

    if (sectionError || !sectionEntity) {
      console.log(`❌ Section '${section}' not found under domain '${domain}':`, sectionError)
      return null
    }

    console.log(`✅ Found section: ${sectionEntity.entity_name} (${sectionEntity.id})`)

    console.log('🔍 Step 3: Finding workspace entity...')
    
    // Step 3: Find the workspace entity that belongs to this section
    const { data: workspaceRelationships, error: workspaceRelError } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        to_entity_id,
        relationship_type
      `)
      .eq('to_entity_id', sectionEntity.id)
      .in('relationship_type', ['CHILD_OF', 'BELONGS_TO', 'PART_OF'])

    if (workspaceRelError) {
      console.log('❌ Error finding workspace relationships:', workspaceRelError)
      return null
    }

    const workspaceIds = workspaceRelationships?.map(rel => rel.from_entity_id) || []

    if (workspaceIds.length === 0) {
      console.log('❌ No workspaces found for section')
      return null
    }

    const { data: workspaceEntity, error: workspaceError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_WORKSPACE')
      .in('id', workspaceIds)
      .or(`metadata->>slug.eq.${workspace},entity_name.ilike.%${workspace}%,entity_code.ilike.%${workspace.toUpperCase()}%`)
      .single()

    if (workspaceError || !workspaceEntity) {
      console.log(`❌ Workspace '${workspace}' not found under section '${section}':`, workspaceError)
      return null
    }

    console.log(`✅ Found workspace: ${workspaceEntity.entity_name} (${workspaceEntity.id})`)

    console.log('🔍 Step 4: Loading workspace configuration...')

    // Step 4: Load workspace dynamic data
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', workspaceEntity.id)

    if (dynamicError) {
      console.log('❌ Error loading workspace dynamic data:', dynamicError)
    }

    console.log(`✅ Found ${dynamicData?.length || 0} dynamic data fields`)

    // Step 5: Build the workspace configuration
    const workspaceConfig = {
      workspace: {
        id: workspaceEntity.id,
        entity_name: workspaceEntity.entity_name,
        entity_code: workspaceEntity.entity_code,
        slug: `${domain}-${section}-${workspace}`,
        subtitle: workspaceEntity.metadata?.subtitle || `Manage ${section} operations`,
        icon: workspaceEntity.metadata?.icon || 'Package',
        color: workspaceEntity.metadata?.color || 'blue',
        persona_label: workspaceEntity.metadata?.persona_label || 'Manager',
        visible_roles: workspaceEntity.metadata?.visible_roles || ['manager', 'admin'],
        route: `/${domain}/${section}/${workspace}`,
        smart_code: workspaceEntity.smart_code
      },
      layout_config: {
        default_nav_code: workspaceEntity.metadata?.default_nav || 'master-data',
        nav_items: [
          { code: 'master-data', label: 'Master Data' },
          { code: 'workflow', label: 'Workflow' },
          { code: 'transactions', label: 'Transactions' },
          { code: 'relationships', label: 'Relationships' },
          { code: 'analytics', label: 'Analytics' }
        ],
        sections: generateDynamicSections(domain, section, workspace, workspaceEntity, dynamicData)
      }
    }

    console.log('✅ Workspace configuration built successfully')
    
    // Show summary
    const totalCards = workspaceConfig.layout_config.sections.reduce((total, section) => {
      return total + (section.cards?.length || 0)
    }, 0)
    
    console.log('\n📊 Workspace Summary:')
    console.log(`🏢 Name: ${workspaceConfig.workspace.entity_name}`)
    console.log(`🎨 Icon: ${workspaceConfig.workspace.icon}`)
    console.log(`🎯 Color: ${workspaceConfig.workspace.color}`)
    console.log(`📁 Sections: ${workspaceConfig.layout_config.sections.length}`)
    console.log(`🃏 Total Cards: ${totalCards}`)
    
    console.log('\n📋 Section Details:')
    workspaceConfig.layout_config.sections.forEach(section => {
      console.log(`  - ${section.title}: ${section.cards?.length || 0} cards`)
    })
    
    return workspaceConfig

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return null
  }
}

function generateDynamicSections(domain, section, workspace, workspaceEntity, dynamicData) {
  const sections = []

  // Master Data section with dynamic cards
  const masterDataCards = []

  // If this is an inventory workspace, add inventory-specific cards
  if (section.toLowerCase().includes('inventory') || 
      section.toLowerCase().includes('stock') ||
      workspaceEntity.entity_name?.toLowerCase().includes('inventory') ||
      workspaceEntity.entity_name?.toLowerCase().includes('stock')) {
    
    masterDataCards.push(
      {
        label: 'View Inventory',
        subtitle: 'Current stock levels and item details',
        icon: 'Package',
        view_slug: 'inventory',
        target_type: 'entities',
        entity_type: 'INVENTORY',
        status: 'active',
        priority: 'high',
        metrics: { value: 247, unit: 'items', label: 'Total Items', trend: 'up' }
      },
      {
        label: 'Add Inventory Item',
        subtitle: 'Create new inventory entries',
        icon: 'PlusCircle',
        view_slug: 'inventory-create',
        target_type: 'entities',
        entity_type: 'INVENTORY',
        status: 'active',
        priority: 'medium'
      },
      {
        label: 'Products',
        subtitle: 'Manage product catalog',
        icon: 'Box',
        view_slug: 'products',
        target_type: 'entities',
        entity_type: 'PRODUCT',
        status: 'active',
        priority: 'medium'
      },
      {
        label: 'Stock Levels',
        subtitle: 'Monitor stock quantities',
        icon: 'BarChart3',
        view_slug: 'stock-levels',
        target_type: 'entities',
        entity_type: 'STOCK_LEVEL',
        status: 'active',
        priority: 'high'
      }
    )
  }

  // Add dynamic cards from workspace dynamic data
  const cardData = dynamicData?.find(d => d.field_name === 'cards')
  if (cardData && cardData.field_value_json) {
    const customCards = Array.isArray(cardData.field_value_json) ? cardData.field_value_json : []
    masterDataCards.push(...customCards)
  }

  sections.push({
    nav_code: 'master-data',
    title: `${section.charAt(0).toUpperCase() + section.slice(1)} Master Data`,
    cards: masterDataCards
  })

  // Workflow section
  sections.push({
    nav_code: 'workflow',
    title: `${section.charAt(0).toUpperCase() + section.slice(1)} Workflows`,
    cards: [
      {
        label: 'Process Workflow',
        subtitle: `Manage ${section} workflows`,
        icon: 'GitBranch',
        view_slug: 'workflow',
        target_type: 'workflow',
        status: 'active',
        priority: 'medium'
      }
    ]
  })

  // Transactions section
  sections.push({
    nav_code: 'transactions',
    title: `${section.charAt(0).toUpperCase() + section.slice(1)} Transactions`,
    cards: [
      {
        label: 'View Transactions',
        subtitle: `View all ${section} transactions`,
        icon: 'Activity',
        view_slug: 'transactions',
        target_type: 'transactions',
        status: 'active',
        priority: 'medium'
      }
    ]
  })

  // Analytics section
  sections.push({
    nav_code: 'analytics',
    title: `${section.charAt(0).toUpperCase() + section.slice(1)} Analytics`,
    cards: [
      {
        label: 'Reports & Analytics',
        subtitle: `${section.charAt(0).toUpperCase() + section.slice(1)} insights`,
        icon: 'BarChart3',
        view_slug: 'analytics',
        target_type: 'analytics',
        status: 'active',
        priority: 'low'
      }
    ]
  })

  return sections
}

async function runTest() {
  console.log('🚀 Direct Database API Test')
  console.log('===========================\n')
  
  // Test cases based on existing data
  const testCases = [
    { domain: 'inventory', section: 'stock', workspace: 'main' },
    { domain: 'retail', section: 'inventory', workspace: 'main' },
    { domain: 'retail', section: 'pos', workspace: 'main' }
  ]
  
  for (const testCase of testCases) {
    const result = await testWorkspaceFromDatabase(testCase.domain, testCase.section, testCase.workspace)
    
    if (result) {
      console.log('✅ SUCCESS: Database-driven workspace loaded successfully\n')
    } else {
      console.log('❌ FAILED: Could not load workspace from database\n')
    }
    
    console.log('-'.repeat(60) + '\n')
  }
}

runTest().catch(console.error)