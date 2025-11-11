/**
 * HERA Universal API v2 - Database-Driven Workspace Router  
 * Smart Code: HERA.API.V2.UNIVERSAL.WORKSPACE.DATABASE.v1
 * 
 * Production-ready database-driven workspace loader
 * Reads APP_WORKSPACE and APP_WORKSPACE_CARD entities from Sacred Six
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
  console.log(`🔍 Querying database for workspace: ${domain}/${section}/${workspace}`)
  
  // Step 1: Find APP_WORKSPACE entity matching the domain/section/workspace
  const workspaceSlug = `${domain}-${section}-${workspace}`
  
  const { data: workspaceEntities, error: workspaceError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_WORKSPACE')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
    .ilike('entity_code', `%${domain}%${section}%${workspace}%`)
  
  if (workspaceError) {
    console.error('Error querying workspace entities:', workspaceError)
    throw new Error(`Database error: ${workspaceError.message}`)
  }
  
  if (!workspaceEntities || workspaceEntities.length === 0) {
    console.log(`❌ No workspace found for ${workspaceSlug} - generating dynamic workspace`)
    return await generateDynamicWorkspace(domain, section, workspace)
  }
  
  const workspaceEntity = workspaceEntities[0]
  console.log(`✅ Found workspace entity:`, { id: workspaceEntity.id, name: workspaceEntity.entity_name })
  
  // Step 2: Get workspace dynamic data for configuration
  const { data: workspaceDynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('entity_id', workspaceEntity.id)
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
  
  if (dynamicError) {
    console.error('Error loading workspace dynamic data:', dynamicError)
  }
  
  // Step 3: Find APP_WORKSPACE_CARD entities that belong to this workspace
  const { data: cardEntities, error: cardsError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_WORKSPACE_CARD')
    .eq('parent_entity_id', workspaceEntity.id)
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .order('entity_code', { ascending: true })
  
  if (cardsError) {
    console.error('Error querying workspace cards:', cardsError)
  }
  
  console.log(`✅ Found ${cardEntities?.length || 0} workspace cards`)
  
  // Step 4: Get dynamic data for all cards
  const cardIds = cardEntities?.map(card => card.id) || []
  let cardsDynamicData: any[] = []
  
  if (cardIds.length > 0) {
    const { data: cardsData, error: cardsDynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', cardIds)
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    
    if (cardsDynamicError) {
      console.error('Error loading cards dynamic data:', cardsDynamicError)
    } else {
      cardsDynamicData = cardsData || []
    }
  }
  
  // Step 5: Process dynamic data into workspace configuration
  const workspaceConfig = processDynamicDataToWorkspaceConfig(
    workspaceEntity, 
    workspaceDynamicData || [], 
    cardEntities || [], 
    cardsDynamicData
  )
  
  return workspaceConfig
}

async function generateDynamicWorkspace(domain: string, section: string, workspace: string) {
  console.log(`🔧 Generating dynamic workspace for: ${domain}/${section}/${workspace}`)
  
  // Generate workspace for sections that don't have database configuration yet
  const dynamicWorkspace = {
    id: `${domain}-${section}-${workspace}-dynamic`,
    entity_name: `${section.charAt(0).toUpperCase() + section.slice(1)} Workspace`,
    entity_code: `${domain.toUpperCase()}-${section.toUpperCase()}-${workspace.toUpperCase()}`,
    slug: `${domain}-${section}-${workspace}`,
    subtitle: `Manage ${section} operations`,
    icon: getSectionIcon(section),
    color: getSectionColor(section),
    persona_label: getSectionPersona(section),
    visible_roles: ['manager', 'admin'],
    route: `/retail/domains/${domain}/sections/${section}`
  }
  
  const layout_config = {
    default_nav_code: 'master-data',
    nav_items: [
      { code: 'master-data', label: 'Master Data' },
      { code: 'workflow', label: 'Workflow' },
      { code: 'transactions', label: 'Transactions' },
      { code: 'relationships', label: 'Relationships' },
      { code: 'analytics', label: 'Analytics' }
    ],
    sections: generateDynamicSections(domain, section, workspace)
  }
  
  return {
    workspace: dynamicWorkspace,
    layout_config
  }
}

function processDynamicDataToWorkspaceConfig(
  workspaceEntity: any,
  workspaceDynamicData: any[],
  cardEntities: any[],
  cardsDynamicData: any[]
) {
  console.log(`🔧 Processing workspace configuration for: ${workspaceEntity.entity_name}`)
  
  // Process workspace metadata from dynamic data
  const workspaceMetadata = processDynamicDataToObject(workspaceDynamicData)
  
  // Process each card with its dynamic data
  const processedCards = cardEntities.map(cardEntity => {
    const cardDynamicData = cardsDynamicData.filter(d => d.entity_id === cardEntity.id)
    const cardMetadata = processDynamicDataToObject(cardDynamicData)
    
    // Build card configuration from entity + dynamic data
    return {
      label: cardEntity.entity_name,
      subtitle: cardEntity.entity_description || cardMetadata.subtitle || 'No description',
      icon: cardMetadata.icon || 'Box',
      view_slug: cardMetadata.view_slug || cardEntity.entity_code?.toLowerCase() || 'unknown',
      target_type: cardMetadata.target_type || 'view',
      template_code: cardMetadata.template_code || cardEntity.entity_code,
      entity_type: cardMetadata.entity_type,
      default_mode: cardMetadata.default_mode,
      
      // Enhanced properties from dynamic data
      metrics: cardMetadata.metrics_value ? {
        value: cardMetadata.metrics_value,
        unit: cardMetadata.metrics_unit,
        trend: cardMetadata.metrics_trend || 'neutral',
        change: cardMetadata.metrics_change,
        label: cardMetadata.metrics_label
      } : undefined,
      
      status: cardMetadata.status || 'active',
      priority: cardMetadata.priority || 'medium',
      lastUpdated: cardEntity.updated_at,
      
      quickActions: cardMetadata.quick_actions ? JSON.parse(cardMetadata.quick_actions) : undefined
    }
  })
  
  // Group cards by navigation section
  const cardsByNavCode = processedCards.reduce((acc, card) => {
    const navCode = getCardNavCode(card)
    if (!acc[navCode]) {
      acc[navCode] = []
    }
    acc[navCode].push(card)
    return acc
  }, {} as Record<string, any[]>)
  
  // Build workspace configuration
  const workspace = {
    id: workspaceEntity.id,
    entity_name: workspaceEntity.entity_name,
    entity_code: workspaceEntity.entity_code,
    slug: workspaceMetadata.slug || workspaceEntity.entity_code?.toLowerCase() || 'workspace',
    subtitle: workspaceEntity.entity_description || workspaceMetadata.subtitle || 'Enterprise workspace',
    icon: workspaceMetadata.icon || 'Package',
    color: workspaceMetadata.color || 'blue',
    persona_label: workspaceMetadata.persona_label || 'Manager',
    visible_roles: workspaceMetadata.visible_roles ? workspaceMetadata.visible_roles.split(',') : ['manager', 'admin'],
    route: workspaceMetadata.route || `/retail/domains/${workspaceMetadata.domain || 'unknown'}/sections/${workspaceMetadata.section || 'unknown'}`
  }
  
  const layout_config = {
    default_nav_code: workspaceMetadata.default_nav_code || 'master-data',
    nav_items: [
      { code: 'master-data', label: 'Master Data' },
      { code: 'workflow', label: 'Workflow' },
      { code: 'transactions', label: 'Transactions' },
      { code: 'relationships', label: 'Relationships' },
      { code: 'analytics', label: 'Analytics' }
    ],
    sections: Object.keys(cardsByNavCode).map(navCode => ({
      nav_code: navCode,
      title: getNavCodeTitle(navCode),
      cards: cardsByNavCode[navCode]
    }))
  }
  
  console.log(`✅ Processed workspace with ${processedCards.length} cards across ${Object.keys(cardsByNavCode).length} sections`)
  
  return {
    workspace,
    layout_config
  }
}

function generateDynamicSections(domain: string, section: string, workspace: string) {
  const sections = []
  
  // Master Data section with section-specific cards
  const masterDataCards = []
  
  // Add section-specific master data cards
  if (section.toLowerCase().includes('inventory') || section.toLowerCase().includes('stock')) {
    masterDataCards.push(
      {
        label: 'Inventory Items',
        subtitle: 'Manage inventory and stock levels',
        icon: 'Package',
        view_slug: 'inventory',
        target_type: 'entities',
        entity_type: 'INVENTORY',
        status: 'active',
        priority: 'high',
        metrics: { value: 247, unit: 'items', label: 'Total Items', trend: 'up' }
      },
      {
        label: 'Products',
        subtitle: 'Product catalog and details',
        icon: 'Box',
        view_slug: 'products',
        target_type: 'entities',
        entity_type: 'PRODUCT',
        status: 'active',
        priority: 'high'
      },
      {
        label: 'Suppliers',
        subtitle: 'Supplier information and contacts',
        icon: 'Building2',
        view_slug: 'suppliers',
        target_type: 'entities',
        entity_type: 'SUPPLIER',
        status: 'active',
        priority: 'medium'
      }
    )
  } else {
    masterDataCards.push({
      label: `${section.charAt(0).toUpperCase() + section.slice(1)} Items`,
      subtitle: `Manage ${section} data`,
      icon: 'Database',
      view_slug: section,
      target_type: 'entities',
      status: 'active',
      priority: 'high'
    })
  }
  
  sections.push({
    nav_code: 'master-data',
    title: `${section.charAt(0).toUpperCase() + section.slice(1)} Master Data`,
    cards: masterDataCards
  })
  
  // Other sections with placeholder cards
  sections.push({
    nav_code: 'workflow',
    title: 'Workflows',
    cards: [{
      label: 'Process Workflows',
      subtitle: `Manage ${section} workflows`,
      icon: 'GitBranch',
      view_slug: 'workflows',
      target_type: 'workflow',
      status: 'active',
      priority: 'medium'
    }]
  })
  
  sections.push({
    nav_code: 'transactions',
    title: 'Transactions',
    cards: [{
      label: 'Transaction History',
      subtitle: `View ${section} transactions`,
      icon: 'Activity',
      view_slug: 'transactions',
      target_type: 'transactions',
      status: 'active',
      priority: 'medium'
    }]
  })
  
  sections.push({
    nav_code: 'analytics',
    title: 'Analytics',
    cards: [{
      label: 'Reports & Analytics',
      subtitle: `${section.charAt(0).toUpperCase() + section.slice(1)} insights`,
      icon: 'BarChart3',
      view_slug: 'analytics',
      target_type: 'analytics',
      status: 'active',
      priority: 'low'
    }]
  })
  
  return sections
}

function processDynamicDataToObject(dynamicData: any[]): Record<string, any> {
  return dynamicData.reduce((acc, field) => {
    let value = field.field_value_text || field.field_value_number || field.field_value_boolean || field.field_value_json
    
    // Parse JSON strings if needed
    if (field.field_type === 'json' && typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch (e) {
        console.warn(`Failed to parse JSON field ${field.field_name}:`, value)
      }
    }
    
    acc[field.field_name] = value
    return acc
  }, {} as Record<string, any>)
}

function getCardNavCode(card: any): string {
  if (card.target_type === 'analytics' || card.target_type === 'report') {
    return 'analytics'
  }
  if (card.target_type === 'workflow' || card.view_slug.includes('workflow')) {
    return 'workflow'
  }
  if (card.target_type === 'transaction' || card.target_type === 'transactions' || card.view_slug.includes('transaction')) {
    return 'transactions'
  }
  if (card.target_type === 'relationship' || card.view_slug.includes('relationship')) {
    return 'relationships'
  }
  
  return 'master-data'
}

function getNavCodeTitle(navCode: string): string {
  const titles = {
    'master-data': 'Master Data',
    'workflow': 'Workflows',
    'transactions': 'Transactions',
    'relationships': 'Relationships',
    'analytics': 'Analytics'
  }
  
  return titles[navCode] || navCode.charAt(0).toUpperCase() + navCode.slice(1)
}

function getSectionIcon(section: string): string {
  const icons = {
    'inventory': 'Package',
    'stock': 'Warehouse',
    'merchandising': 'Tag',
    'planning': 'Calendar',
    'pos': 'ShoppingCart',
    'sales': 'TrendingUp',
    'finance': 'Calculator',
    'hr': 'Users',
    'customer': 'UserCircle'
  }
  
  return icons[section.toLowerCase()] || 'Box'
}

function getSectionColor(section: string): string {
  const colors = {
    'inventory': 'blue',
    'stock': 'blue',
    'merchandising': 'purple',
    'planning': 'green',
    'pos': 'green',
    'sales': 'emerald',
    'finance': 'yellow',
    'hr': 'pink',
    'customer': 'indigo'
  }
  
  return colors[section.toLowerCase()] || 'gray'
}

function getSectionPersona(section: string): string {
  const personas = {
    'inventory': 'Inventory Manager',
    'stock': 'Stock Controller',
    'merchandising': 'Merchandising Manager',
    'planning': 'Planning Analyst',
    'pos': 'Store Cashier',
    'sales': 'Sales Manager',
    'finance': 'Finance Manager',
    'hr': 'HR Manager',
    'customer': 'Customer Success Manager'
  }
  
  return personas[section.toLowerCase()] || 'Manager'
}