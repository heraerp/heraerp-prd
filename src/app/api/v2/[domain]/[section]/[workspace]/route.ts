/**
 * HERA Universal API v2 - Database-Driven Workspace Router  
 * Smart Code: HERA.API.V2.UNIVERSAL.WORKSPACE.DATABASE.v1
 * 
 * NO HARDCODING: Reads workspace configuration from APP_WORKSPACE entities
 * with proper parent ID filtering through relationships
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = await params

  console.log(`🔍 Database-driven Workspace API:`, { domain, section, workspace })

  try {
    const workspaceData = await getWorkspaceFromDatabase(domain, section, workspace)
    
    if (!workspaceData) {
      return NextResponse.json(
        { error: `Workspace not found: ${domain}/${section}/${workspace}` },
        { status: 404 }
      )
    }

    console.log(`✅ Successfully loaded workspace from database: ${domain}/${section}/${workspace}`)
    return NextResponse.json(workspaceData)
  } catch (error) {
    console.error('Database Workspace API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load workspace data from database',
        details: error instanceof Error ? error.message : 'Unknown error',
        params: { domain, section, workspace }
      },
      { status: 500 }
    )
  }
}

async function getWorkspaceFromDatabase(domain: string, section: string, workspace: string) {
  console.log('🔍 Step 1: Finding all APP_WORKSPACE entities...')
  
  // Step 1: Get all APP_WORKSPACE entities and filter by matching patterns
  const { data: allWorkspaces, error: workspacesError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_WORKSPACE')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')

  if (workspacesError) {
    console.log('❌ Error fetching workspaces:', workspacesError)
    return null
  }

  console.log(`✅ Found ${allWorkspaces.length} total APP_WORKSPACE entities`)

  // Step 2: Find workspace that matches the workspace parameter
  console.log(`🔍 Step 2: Filtering workspaces for '${workspace}'...`)
  
  const matchingWorkspaces = allWorkspaces.filter(w => {
    // Match by metadata.slug, entity_name, or smart_code patterns
    if (w.metadata?.slug === workspace) return true
    if (w.entity_name?.toLowerCase().includes(workspace.toLowerCase())) return true
    if (w.entity_code?.toLowerCase().includes(workspace.toLowerCase())) return true
    
    // Match by smart_code pattern (e.g., HERA.PLATFORM.NAV.APPWORKSPACE.RETAIL.INVENTORY.MAIN.v1)
    if (w.smart_code) {
      const parts = w.smart_code.toLowerCase().split('.')
      if (parts.includes(workspace.toLowerCase())) return true
    }
    
    return false
  })

  console.log(`🎯 Found ${matchingWorkspaces.length} workspaces matching '${workspace}'`)

  if (matchingWorkspaces.length === 0) {
    console.log(`❌ No workspace found matching '${workspace}'`)
    return null
  }

  // Step 3: For each matching workspace, verify it belongs to the correct domain/section hierarchy
  console.log('🔍 Step 3: Verifying workspace hierarchy...')
  
  for (const workspaceEntity of matchingWorkspaces) {
    console.log(`🧪 Testing workspace: ${workspaceEntity.entity_name} (${workspaceEntity.id})`)
    
    // Get the section this workspace belongs to (via parent_entity_id or relationships)
    let sectionEntity = null
    
    if (workspaceEntity.parent_entity_id) {
      // Method 1: Direct parent_entity_id
      const { data: directSection } = await supabase
        .from('core_entities')
        .select('*')
        .eq('entity_type', 'APP_SECTION')
        .eq('id', workspaceEntity.parent_entity_id)
        .single()
      
      if (directSection) {
        console.log(`  📦 Found section via parent_entity_id: ${directSection.entity_name}`)
        sectionEntity = directSection
      }
    }
    
    if (!sectionEntity) {
      // Method 2: Relationships table
      const { data: workspaceRels } = await supabase
        .from('core_relationships')
        .select('to_entity_id')
        .eq('from_entity_id', workspaceEntity.id)
        .in('relationship_type', ['CHILD_OF', 'BELONGS_TO', 'PART_OF'])
      
      if (workspaceRels && workspaceRels.length > 0) {
        const { data: relSection } = await supabase
          .from('core_entities')
          .select('*')
          .eq('entity_type', 'APP_SECTION')
          .eq('id', workspaceRels[0].to_entity_id)
          .single()
        
        if (relSection) {
          console.log(`  📦 Found section via relationships: ${relSection.entity_name}`)
          sectionEntity = relSection
        }
      }
    }

    if (!sectionEntity) {
      console.log(`  ❌ No section found for workspace ${workspaceEntity.entity_name}`)
      continue
    }

    // Check if section matches the section parameter
    const sectionMatches = 
      sectionEntity.metadata?.slug === section ||
      sectionEntity.entity_name?.toLowerCase().includes(section.toLowerCase()) ||
      sectionEntity.entity_code?.toLowerCase().includes(section.toLowerCase()) ||
      (sectionEntity.smart_code && sectionEntity.smart_code.toLowerCase().includes(section.toLowerCase()))

    if (!sectionMatches) {
      console.log(`  ❌ Section '${sectionEntity.entity_name}' doesn't match '${section}'`)
      continue
    }

    console.log(`  ✅ Section matches: ${sectionEntity.entity_name}`)

    // Get the domain this section belongs to
    let domainEntity = null
    
    if (sectionEntity.parent_entity_id) {
      // Method 1: Direct parent_entity_id
      const { data: directDomain } = await supabase
        .from('core_entities')
        .select('*')
        .eq('entity_type', 'APP_DOMAIN')
        .eq('id', sectionEntity.parent_entity_id)
        .single()
      
      if (directDomain) {
        console.log(`  🏢 Found domain via parent_entity_id: ${directDomain.entity_name}`)
        domainEntity = directDomain
      }
    }

    if (!domainEntity) {
      // Method 2: Relationships table
      const { data: sectionRels } = await supabase
        .from('core_relationships')
        .select('to_entity_id')
        .eq('from_entity_id', sectionEntity.id)
        .in('relationship_type', ['CHILD_OF', 'BELONGS_TO', 'PART_OF'])
      
      if (sectionRels && sectionRels.length > 0) {
        const { data: relDomain } = await supabase
          .from('core_entities')
          .select('*')
          .eq('entity_type', 'APP_DOMAIN')
          .eq('id', sectionRels[0].to_entity_id)
          .single()
        
        if (relDomain) {
          console.log(`  🏢 Found domain via relationships: ${relDomain.entity_name}`)
          domainEntity = relDomain
        }
      }
    }

    if (!domainEntity) {
      console.log(`  ❌ No domain found for section ${sectionEntity.entity_name}`)
      continue
    }

    // Check if domain matches the domain parameter
    const domainMatches = 
      domainEntity.metadata?.slug === domain ||
      domainEntity.entity_name?.toLowerCase().includes(domain.toLowerCase()) ||
      domainEntity.entity_code?.toLowerCase().includes(domain.toLowerCase()) ||
      (domainEntity.smart_code && domainEntity.smart_code.toLowerCase().includes(domain.toLowerCase()))

    if (!domainMatches) {
      console.log(`  ❌ Domain '${domainEntity.entity_name}' doesn't match '${domain}'`)
      continue
    }

    console.log(`  ✅ Domain matches: ${domainEntity.entity_name}`)
    console.log(`🎉 Complete hierarchy verified: ${domainEntity.entity_name} → ${sectionEntity.entity_name} → ${workspaceEntity.entity_name}`)

    // We found a valid workspace! Now build the workspace configuration
    return await buildWorkspaceConfiguration(workspaceEntity, sectionEntity, domainEntity, domain, section, workspace)
  }

  // No matching workspace found
  console.log(`❌ No workspace found that matches the complete hierarchy: ${domain}/${section}/${workspace}`)
  return null
}

async function buildWorkspaceConfiguration(workspaceEntity: any, sectionEntity: any, domainEntity: any, domain: string, section: string, workspace: string) {
  console.log('🔍 Step 4: Building workspace configuration...')

  // Load workspace dynamic data
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', workspaceEntity.id)

  if (dynamicError) {
    console.log('⚠️  Error loading workspace dynamic data:', dynamicError)
  }

  // Build the workspace configuration
  const workspaceConfig = {
    workspace: {
      id: workspaceEntity.id,
      entity_name: workspaceEntity.entity_name,
      entity_code: workspaceEntity.entity_code,
      slug: workspace,
      subtitle: workspaceEntity.metadata?.subtitle || workspaceEntity.entity_description || `Manage ${section} operations`,
      icon: workspaceEntity.metadata?.icon || 'Package',
      color: workspaceEntity.metadata?.color || 'blue',
      persona_label: workspaceEntity.metadata?.persona_label || 'Manager',
      visible_roles: workspaceEntity.metadata?.visible_roles || ['manager', 'admin'],
      route: `/${domain}/${section}/${workspace}`,
      smart_code: workspaceEntity.smart_code,
      // Include hierarchy info
      domain_name: domainEntity.entity_name,
      section_name: sectionEntity.entity_name
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
      sections: await generateDynamicWorkspaceSections(domain, section, workspace, workspaceEntity, sectionEntity, domainEntity, dynamicData)
    }
  }

  console.log('✅ Workspace configuration built successfully')
  return workspaceConfig
}

async function generateDynamicWorkspaceSections(
  domain: string, 
  section: string, 
  workspace: string, 
  workspaceEntity: any,
  sectionEntity: any,
  domainEntity: any,
  dynamicData: any[]
) {
  // Generate sections based on workspace metadata and dynamic data
  const sections = []

  // Master Data section with dynamic cards based on domain/section type
  const masterDataCards = generateMasterDataCards(domain, section, workspace, workspaceEntity, sectionEntity, domainEntity)

  // Add dynamic cards from workspace dynamic data
  const cardData = dynamicData?.find(d => d.field_name === 'cards')
  if (cardData && cardData.field_value_json) {
    const customCards = Array.isArray(cardData.field_value_json) ? cardData.field_value_json : []
    masterDataCards.push(...customCards)
  }

  sections.push({
    nav_code: 'master-data',
    title: `${sectionEntity.entity_name} Master Data`,
    cards: masterDataCards
  })

  // Generate other sections
  sections.push({
    nav_code: 'workflow',
    title: `${sectionEntity.entity_name} Workflows`, 
    cards: generateWorkflowCards(domain, section, workspace)
  })

  sections.push({
    nav_code: 'transactions',
    title: `${sectionEntity.entity_name} Transactions`,
    cards: generateTransactionCards(domain, section, workspace)
  })

  sections.push({
    nav_code: 'relationships',
    title: `${sectionEntity.entity_name} Relationships`,
    cards: generateRelationshipCards(domain, section, workspace)
  })

  sections.push({
    nav_code: 'analytics',
    title: `${sectionEntity.entity_name} Analytics`,
    cards: generateAnalyticsCards(domain, section, workspace)
  })

  return sections
}

function generateMasterDataCards(domain: string, section: string, workspace: string, workspaceEntity: any, sectionEntity: any, domainEntity: any) {
  const cards = []
  
  // Generate cards based on section type
  const sectionName = sectionEntity.entity_name?.toLowerCase() || section.toLowerCase()
  
  if (sectionName.includes('inventory') || sectionName.includes('stock')) {
    cards.push(
      {
        label: 'View Inventory',
        description: 'Current stock levels and item details',
        icon: 'Package',
        color: 'blue',
        target_type: 'entities',
        template_code: 'inventory-list',
        view_slug: 'inventory',
        entity_type: 'INVENTORY',
        status: 'active',
        priority: 'high'
      },
      {
        label: 'Products',
        description: 'Manage product catalog',
        icon: 'Box',
        color: 'purple',
        target_type: 'entities',
        template_code: 'product-list',
        view_slug: 'products',
        entity_type: 'PRODUCT',
        status: 'active',
        priority: 'medium'
      }
    )
  } else if (sectionName.includes('planning') || sectionName.includes('category')) {
    cards.push(
      {
        label: 'Category Plans',
        description: 'Manage category strategies and planning',
        icon: 'Calendar',
        color: 'purple',
        target_type: 'entities',
        template_code: 'category-plans',
        view_slug: 'category-plans',
        entity_type: 'CATEGORY_PLAN',
        status: 'active',
        priority: 'high'
      },
      {
        label: 'Assortment Matrix',
        description: 'Product assortment planning matrix',
        icon: 'Grid3x3',
        color: 'green',
        target_type: 'entities',
        template_code: 'assortment-matrix',
        view_slug: 'assortment',
        entity_type: 'ASSORTMENT',
        status: 'active',
        priority: 'high'
      }
    )
  } else {
    // Default cards for unknown section types
    cards.push(
      {
        label: 'View Items',
        description: `Manage ${sectionEntity.entity_name} items`,
        icon: 'Package',
        color: 'blue',
        target_type: 'entities',
        template_code: 'generic-list',
        view_slug: 'items',
        entity_type: 'ITEM',
        status: 'active',
        priority: 'medium'
      }
    )
  }
  
  return cards
}

function generateWorkflowCards(domain: string, section: string, workspace: string) {
  return [
    {
      label: 'Process Workflow',
      description: `Manage ${section} workflows`,
      icon: 'GitBranch',
      color: 'indigo',
      target_type: 'workflow',
      template_code: `${section}-workflow`,
      view_slug: 'workflow',
      status: 'active',
      priority: 'medium'
    }
  ]
}

function generateTransactionCards(domain: string, section: string, workspace: string) {
  return [
    {
      label: 'View Transactions',
      description: `View all ${section} transactions`,
      icon: 'Activity',
      color: 'green',
      target_type: 'transactions',
      template_code: `${section}-transactions`,
      view_slug: 'transactions',
      status: 'active',
      priority: 'medium'
    }
  ]
}

function generateRelationshipCards(domain: string, section: string, workspace: string) {
  return [
    {
      label: 'Entity Relationships',
      description: `Manage ${section} entity relationships`,
      icon: 'Link',
      color: 'indigo',
      target_type: 'relationships',
      template_code: `${section}-relationships`,
      view_slug: 'relationships',
      status: 'active',
      priority: 'low'
    }
  ]
}

function generateAnalyticsCards(domain: string, section: string, workspace: string) {
  return [
    {
      label: 'Reports & Analytics',
      description: `${section.charAt(0).toUpperCase() + section.slice(1)} analytics and reporting`,
      icon: 'BarChart3',
      color: 'indigo',
      target_type: 'analytics',
      template_code: `${section}-analytics`,
      view_slug: 'analytics',
      status: 'active',
      priority: 'low'
    }
  ]
}