import { NextRequest, NextResponse } from 'next/server'
import { ViewMetaService } from '@/lib/universal-ui/view-meta-service'
import { universalApi } from '@/lib/universal-api'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  const smartCode = searchParams.get('smart_code')
  const viewType = searchParams.get('view_type')
  const organizationId = searchParams.get('organization_id')
  
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'get_metadata':
        if (!smartCode) {
          return NextResponse.json({ error: 'Smart code is required' }, { status: 400 })
        }
        
        const metaService = new ViewMetaService(organizationId)
        const metadata = await metaService.getViewMeta(smartCode, viewType || 'detail')
        
        if (!metadata) {
          return NextResponse.json({ error: 'No metadata found' }, { status: 404 })
        }
        
        return NextResponse.json({ metadata })
        
      case 'list_views':
        // List all available views for an organization
        const { data: views, error } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'view_metadata')
        
        if (error) throw error
        
        return NextResponse.json({ views })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Universal UI API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, organizationId } = body
  
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  universalApi.setOrganizationId(organizationId)

  try {
    switch (action) {
      case 'save_metadata':
        const { metadata } = body
        const metaService = new ViewMetaService(organizationId)
        const success = await metaService.saveViewMeta(metadata)
        
        if (!success) {
          return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true })
        
      case 'execute_action':
        const { actionConfig, entityId, data } = body
        
        // Handle different action types
        switch (actionConfig.type) {
          case 'create':
            const createResult = await universalApi.createEntity({
              ...data,
              organization_id: organizationId,
              smart_code: actionConfig.smart_code
            })
            return NextResponse.json({ success: true, data: createResult })
            
          case 'edit':
            const { data: updateData, error: updateError } = await supabase
              .from('core_entities')
              .update(data)
              .eq('id', entityId)
              .eq('organization_id', organizationId)
              .select()
              .single()
              
            if (updateError) throw updateError
            return NextResponse.json({ success: true, data: updateData })
            
          case 'delete':
            const { error: deleteError } = await supabase
              .from('core_entities')
              .delete()
              .eq('id', entityId)
              .eq('organization_id', organizationId)
              
            if (deleteError) throw deleteError
            return NextResponse.json({ success: true })
            
          case 'workflow':
            // Handle workflow actions (e.g., status changes)
            return await handleWorkflowAction(actionConfig, entityId, organizationId)
            
          default:
            return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
        }
        
      case 'calculate_bom_cost':
        const { bomId } = body
        const cost = await calculateBOMTotalCost(bomId, organizationId)
        return NextResponse.json({ success: true, total_cost: cost })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Universal UI API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

async function handleWorkflowAction(actionConfig: any, entityId: string, organizationId: string) {
  // Example: Release BOM workflow
  if (actionConfig.smart_code === 'HERA.FURN.BOM.ACTION.RELEASE.v1') {
    // 1. Update status via relationship
    const { data: statusEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-RELEASED')
      .single()
    
    if (statusEntity) {
      // Remove existing status relationship
      await supabase
        .from('core_relationships')
        .delete()
        .eq('from_entity_id', entityId)
        .eq('relationship_type', 'has_status')
        .eq('organization_id', organizationId)
      
      // Create new status relationship
      await universalApi.createRelationship({
        from_entity_id: entityId,
        to_entity_id: statusEntity.id,
        relationship_type: 'has_status',
        smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
        metadata: {
          assigned_at: new Date().toISOString(),
          assigned_by: 'system' // In real app, get from auth
        }
      })
    }
    
    // 2. Create revision transaction
    await universalApi.createTransaction({
      transaction_type: 'bom_revision',
      reference_entity_id: entityId,
      smart_code: 'HERA.FURN.BOM.TXN.RELEASE.v1',
      description: 'BOM released for production',
      metadata: {
        action: 'release',
        revision: 'B'
      }
    })
    
    return NextResponse.json({ success: true, message: 'BOM released successfully' })
  }
  
  return NextResponse.json({ error: 'Unknown workflow action' }, { status: 400 })
}

async function calculateBOMTotalCost(bomId: string, organizationId: string): Promise<number> {
  // Get all components via relationships
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('*, to_entity:core_entities!to_entity_id(*)')
    .eq('from_entity_id', bomId)
    .eq('relationship_type', 'has_component')
    .eq('organization_id', organizationId)
  
  if (!relationships) return 0
  
  let totalCost = 0
  
  for (const rel of relationships) {
    const quantity = rel.metadata?.quantity || 1
    const unitCost = rel.to_entity?.metadata?.unit_cost || 0
    totalCost += quantity * unitCost
  }
  
  return totalCost
}