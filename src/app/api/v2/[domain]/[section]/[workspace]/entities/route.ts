/**
 * HERA Universal API v2 - Entity CRUD Router
 * Smart Code: HERA.API.V2.UNIVERSAL.ENTITIES.v1
 * 
 * Universal entity management for all domain/section/workspace combinations
 * Maps to hera_entities_crud_v1 with automatic Smart Code generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiV2 } from '@/lib/client/fetchV2'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = await params
  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entityType')
  
  console.log(`🔍 Universal Entity GET: ${domain}/${section}/${workspace}/entities/${entityType || 'all'}`)

  try {
    // Get entities via Universal POS Service pattern
    const { data, error } = await apiV2.post('entities/search', {
      entity_type: entityType?.toUpperCase() || null,
      organization_id: searchParams.get('organizationId'),
      filters: {
        workspace_context: { domain, section, workspace }
      },
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      include_dynamic: true
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data?.entities || [],
      metadata: {
        count: data?.count || 0,
        domain,
        section,
        workspace,
        entityType: entityType || 'all'
      }
    })
  } catch (error) {
    console.error('Universal Entity GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  
  try {
    const body = await request.json()
    const { operation, entityType, entityData, dynamicFields, organizationId } = body
    
    console.log(`🔍 Universal Entity POST: ${domain}/${section}/${workspace}/entities/${entityType}`)

    // Generate contextual Smart Code
    const smartCode = generateEntitySmartCode(domain, section, workspace, entityType)
    
    // Route to appropriate entity CRUD operation
    const { data, error } = await apiV2.post('entities', {
      operation: operation || 'create',
      entity_type: entityType.toUpperCase(),
      entity_name: entityData.entity_name,
      smart_code: smartCode,
      organization_id: organizationId,
      entity_data: {
        ...entityData,
        workspace_context: { domain, section, workspace }
      },
      dynamic_fields: dynamicFields || []
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data?.entity,
      metadata: {
        domain,
        section,
        workspace,
        entityType,
        smartCode
      }
    })
  } catch (error) {
    console.error('Universal Entity POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update entity' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  
  try {
    const body = await request.json()
    const { entityId, updates, organizationId } = body
    
    console.log(`🔍 Universal Entity PUT: ${domain}/${section}/${workspace}/entities/${entityId}`)

    const { data, error } = await apiV2.post('entities', {
      operation: 'update',
      entity_id: entityId,
      organization_id: organizationId,
      entity_data: updates.entity_data || {},
      dynamic_fields: updates.dynamic_fields || []
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data?.entity,
      metadata: { domain, section, workspace }
    })
  } catch (error) {
    console.error('Universal Entity PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update entity' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  const { searchParams } = new URL(request.url)
  const entityId = searchParams.get('entityId')
  const organizationId = searchParams.get('organizationId')
  
  console.log(`🔍 Universal Entity DELETE: ${domain}/${section}/${workspace}/entities/${entityId}`)

  try {
    const { data, error } = await apiV2.post('entities', {
      operation: 'delete',
      entity_id: entityId,
      organization_id: organizationId
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: true,
      metadata: { domain, section, workspace }
    })
  } catch (error) {
    console.error('Universal Entity DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    )
  }
}

/**
 * Generate Smart Code based on route context
 */
function generateEntitySmartCode(domain: string, section: string, workspace: string, entityType: string): string {
  // HERA.{DOMAIN}.{SECTION}.{WORKSPACE}.ENTITY.{TYPE}.v1
  return `HERA.${domain.toUpperCase()}.${section.toUpperCase()}.${workspace.toUpperCase()}.ENTITY.${entityType.toUpperCase()}.v1`
}