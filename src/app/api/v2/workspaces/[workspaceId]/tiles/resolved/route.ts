/**
 * HERA Universal Tile System - Resolved Tiles API
 * GET /api/v2/workspaces/:workspaceId/tiles/resolved
 * Returns merged template + workspace tile configurations for frontend
 * Smart Code: HERA.PLATFORM.API.WORKSPACE.TILES.RESOLVED.v1
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  ResolvedTileConfig, 
  resolveTileConfig,
  TileTemplateConfig,
  WorkspaceTileRow,
  DynamicFieldMap
} from '@/lib/tiles/resolved-tile-config'

// ================================================================================
// ROUTE HANDLER
// ================================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = params
    
    // Get organization_id from headers (set by API v2 gateway)
    const organizationId = request.headers.get('x-organization-id')
    const actorUserId = request.headers.get('x-actor-user-id')
    
    if (!organizationId) {
      return Response.json(
        { error: 'Missing organization context' },
        { status: 400 }
      )
    }

    if (!actorUserId) {
      return Response.json(
        { error: 'Missing actor context' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get resolved tile configurations
    const tiles = await getResolvedTileConfigs({
      workspaceId,
      organizationId,
      actorUserId,
      supabase
    })

    return Response.json(tiles, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Resolved-Tiles-Count': tiles.length.toString(),
        'Cache-Control': 'private, max-age=300' // 5 minute cache
      }
    })

  } catch (error) {
    console.error('Error resolving workspace tiles:', error)
    
    return Response.json(
      { 
        error: 'Failed to resolve workspace tiles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// ================================================================================
// CORE RESOLUTION LOGIC
// ================================================================================

interface ResolveParams {
  workspaceId: string
  organizationId: string
  actorUserId: string
  supabase: any
}

async function getResolvedTileConfigs({
  workspaceId,
  organizationId,
  actorUserId,
  supabase
}: ResolveParams): Promise<ResolvedTileConfig[]> {

  // Step 1: Get workspace tiles with their template relationships
  const workspaceTiles = await getWorkspaceTilesWithTemplates({
    workspaceId,
    organizationId,
    supabase
  })

  // Step 2: Get unique template IDs to batch load templates
  const templateIds = [...new Set(workspaceTiles.map(wt => wt.template_id).filter(Boolean))]
  
  if (templateIds.length === 0) {
    return []
  }

  // Step 3: Load template configurations
  const templates = await loadTileTemplates({ templateIds, supabase })
  const templateMap = new Map(templates.map(t => [t.id, t]))

  // Step 4: Load workspace tile dynamic data
  const workspaceTileIds = workspaceTiles.map(wt => wt.id)
  const dynamicDataMap = await loadWorkspaceTileDynamicData({
    workspaceTileIds,
    supabase
  })

  // Step 5: Merge and resolve each tile
  const resolvedTiles: ResolvedTileConfig[] = []

  for (const workspaceTile of workspaceTiles) {
    const template = templateMap.get(workspaceTile.template_id)
    if (!template) {
      console.warn(`Template not found for workspace tile ${workspaceTile.id}`)
      continue
    }

    const dynamicData = dynamicDataMap.get(workspaceTile.id) || {}

    try {
      const resolved = resolveTileConfig({
        workspaceTile: {
          id: workspaceTile.id,
          entity_code: workspaceTile.entity_code,
          entity_name: workspaceTile.entity_name,
          parent_entity_id: workspaceId,
          organization_id: organizationId
        },
        tileDynamic: dynamicData,
        template
      })

      resolvedTiles.push(resolved)
    } catch (error) {
      console.error(`Failed to resolve tile ${workspaceTile.id}:`, error)
      // Continue processing other tiles
    }
  }

  // Sort by position
  return resolvedTiles.sort((a, b) => a.layout.position - b.layout.position)
}

// ================================================================================
// DATABASE QUERIES
// ================================================================================

/**
 * Get workspace tiles with their template relationships
 */
async function getWorkspaceTilesWithTemplates({
  workspaceId,
  organizationId,
  supabase
}: {
  workspaceId: string
  organizationId: string
  supabase: any
}) {
  const query = `
    SELECT 
      wt.id,
      wt.entity_code,
      wt.entity_name,
      wt.entity_description,
      wt.smart_code as workspace_tile_smart_code,
      wt.created_at,
      wt.updated_at,
      tt.id as template_id,
      tt.entity_code as template_code,
      tt.smart_code as template_smart_code
    FROM core_entities wt
    JOIN core_relationships cr1 ON (
      cr1.to_entity_id = wt.id 
      AND cr1.relationship_type = 'WORKSPACE_HAS_TILE'
      AND cr1.from_entity_id = $1
      AND cr1.organization_id = $2
      AND cr1.effective_date <= NOW()
      AND (cr1.expiration_date IS NULL OR cr1.expiration_date > NOW())
    )
    JOIN core_relationships cr2 ON (
      cr2.from_entity_id = wt.id
      AND cr2.relationship_type = 'TILE_USES_TEMPLATE'
      AND cr2.effective_date <= NOW()
      AND (cr2.expiration_date IS NULL OR cr2.expiration_date > NOW())
    )
    JOIN core_entities tt ON (
      tt.id = cr2.to_entity_id
      AND tt.entity_type = 'APP_TILE_TEMPLATE'
    )
    WHERE wt.entity_type = 'APP_WORKSPACE_TILE'
      AND wt.organization_id = $2
    ORDER BY wt.entity_code
  `

  const { data, error } = await supabase.rpc('execute_sql', {
    sql: query,
    params: [workspaceId, organizationId]
  })

  if (error) {
    throw new Error(`Failed to load workspace tiles: ${error.message}`)
  }

  return data || []
}

/**
 * Load tile template configurations with dynamic data
 */
async function loadTileTemplates({
  templateIds,
  supabase
}: {
  templateIds: string[]
  supabase: any
}): Promise<Array<TileTemplateConfig & { id: string }>> {
  
  // Get template entities
  const { data: templates, error: templatesError } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name, smart_code')
    .eq('entity_type', 'APP_TILE_TEMPLATE')
    .in('id', templateIds)

  if (templatesError) {
    throw new Error(`Failed to load templates: ${templatesError.message}`)
  }

  // Get dynamic data for all templates
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_name, field_type, field_value_text, field_value_number, field_value_boolean, field_value_json')
    .in('entity_id', templateIds)

  if (dynamicError) {
    throw new Error(`Failed to load template dynamic data: ${dynamicError.message}`)
  }

  // Group dynamic data by entity_id
  const dynamicMap = new Map<string, Record<string, any>>()
  for (const field of dynamicData || []) {
    if (!dynamicMap.has(field.entity_id)) {
      dynamicMap.set(field.entity_id, {})
    }
    
    const value = field.field_value_json || 
                  field.field_value_text || 
                  field.field_value_number || 
                  field.field_value_boolean

    dynamicMap.get(field.entity_id)![field.field_name] = value
  }

  // Build template configurations
  return templates.map(template => {
    const dynamic = dynamicMap.get(template.id) || {}
    
    return {
      id: template.id,
      code: template.entity_code,
      smart_code: template.smart_code,
      tile_type: dynamic.tile_type || 'ENTITIES',
      operation_category: dynamic.operation_category || 'MASTER_DATA',
      ui_schema: dynamic.ui_schema || {
        default_icon: 'Database',
        default_color: '#6B7280',
        default_gradient: 'from-gray-500 to-gray-600'
      },
      action_templates: dynamic.action_templates || [],
      stat_templates: dynamic.stat_templates || [],
      default_layout_config: dynamic.default_layout_config || {
        default_size: 'medium',
        resizable: true
      }
    }
  })
}

/**
 * Load workspace tile dynamic data
 */
async function loadWorkspaceTileDynamicData({
  workspaceTileIds,
  supabase
}: {
  workspaceTileIds: string[]
  supabase: any
}): Promise<Map<string, DynamicFieldMap>> {
  
  const { data: dynamicData, error } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_name, field_type, field_value_text, field_value_number, field_value_boolean, field_value_json')
    .in('entity_id', workspaceTileIds)

  if (error) {
    throw new Error(`Failed to load workspace tile dynamic data: ${error.message}`)
  }

  const dynamicMap = new Map<string, DynamicFieldMap>()
  
  for (const field of dynamicData || []) {
    if (!dynamicMap.has(field.entity_id)) {
      dynamicMap.set(field.entity_id, {})
    }
    
    const value = field.field_value_json || 
                  field.field_value_text || 
                  field.field_value_number || 
                  field.field_value_boolean

    const fieldMap = dynamicMap.get(field.entity_id)!
    fieldMap[field.field_name as keyof DynamicFieldMap] = value
  }

  return dynamicMap
}

// ================================================================================
// EXPORT ROUTE HANDLERS
// ================================================================================

// Only export GET method
export { GET }