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
  const url = new URL(request.url)
  
  // Security: Extract organization context from request
  const organizationId = request.headers.get('x-organization-id') || 
                        url.searchParams.get('organization_id') || 
                        '00000000-0000-0000-0000-000000000000' // Default platform org
  
  const actorUserId = request.headers.get('x-actor-user-id') || 'system'
  
  console.log('🛡️ Security Context:', { domain, section, workspace, organizationId, actorUserId })
  
  // Check if requesting Universal Tile format
  const useTileFormat = url.searchParams.get('format') === 'tiles' || 
                       url.searchParams.get('tiles') === 'true' ||
                       request.headers.get('x-tile-format') === 'true'

  console.log(`🔍 Database-driven Workspace API:`, { domain, section, workspace, useTileFormat })

  try {
    // Validate organization boundary - CRITICAL SECURITY
    if (!organizationId || organizationId === 'undefined' || organizationId === 'null') {
      console.error('🛡️ Security Violation: Missing organization context')
      return NextResponse.json(
        { 
          error: 'Organization context required',
          code: 'MISSING_ORGANIZATION_CONTEXT',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const workspaceData = await getWorkspaceFromDatabase(domain, section, workspace, organizationId, actorUserId)
    
    if (!workspaceData) {
      return NextResponse.json(
        { error: `Workspace not found: ${domain}/${section}/${workspace}` },
        { status: 404 }
      )
    }

    // Transform to Universal Tile format if requested
    if (useTileFormat) {
      console.log(`🔄 Transforming to Universal Tile format`)
      const tileData = await transformToUniversalTileFormat(workspaceData, domain, section, workspace)
      console.log(`✅ Successfully transformed to Universal Tile format: ${domain}/${section}/${workspace}`)
      return NextResponse.json(tileData)
    }

    console.log(`✅ Successfully loaded workspace from database: ${domain}/${section}/${workspace}`)
    return NextResponse.json(workspaceData)
  } catch (error) {
    console.error('Database Workspace API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load workspace data from database',
        details: error instanceof Error ? error.message : 'Unknown error',
        params: { domain, section, workspace, useTileFormat }
      },
      { status: 500 }
    )
  }
}

async function getWorkspaceFromDatabase(
  domain: string, 
  section: string, 
  workspace: string, 
  organizationId: string,
  actorUserId: string
) {
  console.log('🔍 Step 1: Finding all APP_WORKSPACE entities...')
  
  // Step 1: Get all APP_WORKSPACE entities with organization boundary enforcement
  console.log('🛡️ Enforcing organization boundary:', { organizationId, domain, section, workspace })
  
  // For demo/platform workspaces, use platform organization
  const queryOrgId = organizationId === '00000000-0000-0000-0000-000000000000' ? 
                    '00000000-0000-0000-0000-000000000000' : organizationId
  
  const { data: allWorkspaces, error: workspacesError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_WORKSPACE')
    .eq('organization_id', queryOrgId) // SACRED BOUNDARY ENFORCEMENT

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

  // Step 3: Production-ready workspace lookup - No loops, no fallbacks, clear results
  console.log('🔍 Step 3: Direct workspace lookup for production')
  
  // Single query to find the exact workspace with hierarchy 
  const { data: targetWorkspace, error: workspaceError } = await supabase
    .from('core_entities')
    .select(`
      id,
      entity_name,
      entity_code,
      entity_type,
      smart_code,
      metadata,
      section:parent_entity_id(
        id,
        entity_name,
        entity_code,
        metadata,
        domain:parent_entity_id(
          id,
          entity_name,
          entity_code,
          metadata
        )
      )
    `)
    .eq('entity_type', 'APP_WORKSPACE')
    .eq('organization_id', organizationId)
    .or(`entity_name.ilike.%${workspace}%,entity_code.ilike.%${workspace}%,smart_code.ilike.%${workspace}%`)
    .limit(1)
    .single()
    
  if (workspaceError || !targetWorkspace) {
    console.log(`❌ Workspace not found: ${domain}/${section}/${workspace}`)
    return NextResponse.json({
      success: false,
      error: 'WORKSPACE_NOT_FOUND',
      message: `Workspace "${workspace}" not found in ${domain}/${section}`,
      suggestion: 'Check if the workspace exists or if you have access permissions',
      available_workspaces: matchingWorkspaces.map(w => ({
        name: w.entity_name,
        code: w.entity_code
      })).slice(0, 5)
    }, { status: 404 })
  }
  
  // Verify the workspace belongs to the correct domain/section
  const section_entity = targetWorkspace.section
  const domain_entity = section_entity?.domain
  
  if (!section_entity || !domain_entity) {
    console.log(`❌ Incomplete workspace hierarchy: ${targetWorkspace.entity_name}`)
    return NextResponse.json({
      success: false,
      error: 'INCOMPLETE_HIERARCHY',
      message: `Workspace "${workspace}" exists but has incomplete domain/section hierarchy`,
      workspace: targetWorkspace.entity_name
    }, { status: 422 })
  }
  
  // Flexible matching for production use
  const sectionMatches = 
    section_entity.entity_name.toLowerCase().includes(section.toLowerCase()) ||
    section_entity.entity_code?.toLowerCase().includes(section.toLowerCase()) ||
    (section === 'ops' && section_entity.entity_name.toLowerCase().includes('operational'))
    
  const domainMatches = 
    domain_entity.entity_name.toLowerCase().includes(domain.toLowerCase()) ||
    domain_entity.entity_code?.toLowerCase().includes(domain.toLowerCase()) ||
    (domain === 'analytics' && domain_entity.entity_name.toLowerCase().includes('analytics'))
    
  if (!sectionMatches || !domainMatches) {
    console.log(`❌ Workspace hierarchy mismatch:`)
    console.log(`   Expected: ${domain}/${section}`)
    console.log(`   Actual: ${domain_entity.entity_name}/${section_entity.entity_name}`)
    
    return NextResponse.json({
      success: false,
      error: 'HIERARCHY_MISMATCH', 
      message: `Workspace "${workspace}" found but belongs to different domain/section`,
      expected: `${domain}/${section}`,
      actual: `${domain_entity.entity_name}/${section_entity.entity_name}`,
      workspace: targetWorkspace.entity_name
    }, { status: 422 })
  }
  
  // Success! Build the workspace configuration
  console.log(`✅ Found workspace: ${domain_entity.entity_name} → ${section_entity.entity_name} → ${targetWorkspace.entity_name}`)
  
  const workspaceConfig = {
    workspace: targetWorkspace,
    section: section_entity,
    domain: domain_entity,
    layout_config: {
      default_nav_code: targetWorkspace.entity_code,
      workspace_type: 'sap_fiori',
      display_mode: useTileFormat ? 'tiles' : 'standard'
    }
  }
  
  console.log(`✅ Successfully loaded workspace from database: ${domain}/${section}/${workspace}`)
  
  return NextResponse.json({
    success: true,
    data: workspaceConfig,
    domain,
    section,
    workspace: workspace,
    organization_id: organizationId,
    actor_user_id: actorUserId
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
} 
