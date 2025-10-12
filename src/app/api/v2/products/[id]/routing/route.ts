/**
 * HERA Product Costing v2: Routing Management API Endpoint
 * 
 * Specialized endpoint for routing management with activity validation,
 * work center assignment, and complete audit trail.
 * 
 * Smart Code: HERA.COST.PRODUCT.ROUTING.API.V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { 
  validateRoutingPosting
} from '@/lib/productcosting/productcosting-v2-guardrails'
import {
  type RoutingUpsertRequest,
  type RoutingActivity,
  PRODUCT_COSTING_SMART_CODES,
  validateRoutingActivity
} from '@/lib/productcosting/productcosting-v2-standard'

// ============================================================================
// Helper Functions
// ============================================================================

async function getAPIContext(request: NextRequest) {
  const headersList = headers()
  const apiVersion = headersList.get('x-hera-api-version')
  const organizationId = headersList.get('x-hera-organization-id')
  
  if (apiVersion !== 'v2') {
    throw new Error(`API version mismatch. Expected v2, got ${apiVersion}`)
  }
  
  if (!organizationId) {
    throw new Error('x-hera-organization-id header is required')
  }
  
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Authentication required')
  }
  
  return {
    organizationId,
    userId: user.id,
    userEntityId: user.user_metadata?.entity_id
  }
}

async function callRoutingRPC(
  supabase: any,
  functionName: string,
  params: Record<string, any>
): Promise<any> {
  const { data, error } = await supabase.rpc(functionName, params)
  
  if (error) {
    console.error(`RPC ${functionName} error:`, error)
    throw new Error(`Database operation failed: ${error.message}`)
  }
  
  return data
}

// ============================================================================
// POST: Update Routing
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAPIContext(request)
    const productId = params.id
    const body: { activities: RoutingActivity[] } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_REQUEST',
          message: 'Product ID is required',
          code: 'ERR_PROD_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    if (!body.activities || !Array.isArray(body.activities)) {
      return NextResponse.json(
        {
          error: 'ERR_ROUTING_INVALID_REQUEST',
          message: 'Activities array is required',
          code: 'ERR_ROUTING_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    // Validate each activity
    for (let i = 0; i < body.activities.length; i++) {
      const activity = body.activities[i]
      const activityValidation = validateRoutingActivity({
        activity_id: activity.activity_id,
        std_hours: activity.std_hours
      })
      
      if (!activityValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_ROUTING_ACTIVITY_INVALID',
            message: `Activity ${i + 1}: ${activityValidation.errors.join(', ')}`,
            code: 'ERR_ROUTING_ACTIVITY_INVALID'
          },
          { status: 400 }
        )
      }
    }
    
    const supabase = createServerSupabaseClient()
    
    // Validate product exists
    const { data: products, error: productError } = await supabase
      .from('vw_product_master_v2')
      .select('product_id, product_code, entity_name')
      .eq('product_id', productId)
      .eq('organization_id', context.organizationId)
      .eq('status', 'ACTIVE')
    
    if (productError) {
      throw productError
    }
    
    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_NOT_FOUND',
          message: 'Product not found',
          code: 'ERR_PROD_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    const product = products[0]
    
    // Apply routing guardrails validation
    const routingValidation = validateRoutingPosting(productId, body.activities)
    if (!routingValidation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_ROUTING_GUARDRAILS_FAILED',
          message: 'Routing guardrails validation failed',
          validation_errors: routingValidation.errors,
          code: 'ERR_ROUTING_GUARDRAILS_FAILED'
        },
        { status: 422 }
      )
    }
    
    // Prepare activities for RPC call
    const activitiesForRPC = body.activities.map(activity => ({
      activity_id: activity.activity_id,
      std_hours: activity.std_hours,
      work_center_id: activity.work_center_id,
      sequence: activity.sequence || 1,
      effective_from: activity.effective_from || new Date().toISOString().split('T')[0],
      effective_to: activity.effective_to
    }))
    
    // Call atomic routing RPC function
    const result = await callRoutingRPC(supabase, 'hera_routing_upsert_v2', {
      p_organization_id: context.organizationId,
      p_product_id: productId,
      p_activities: JSON.stringify(activitiesForRPC),
      p_smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      p_actor_entity_id: context.userEntityId
    })
    
    // Get updated routing data
    const { data: routingData } = await supabase
      .from('vw_routing_summary_v2')
      .select(`
        activity_id,
        activity_code,
        activity_name,
        std_hours,
        rate_per_hour,
        cost_component,
        extended_cost,
        work_center_id,
        work_center_code,
        work_center_name,
        sequence
      `)
      .eq('product_id', productId)
      .order('sequence')
    
    return NextResponse.json({
      success: true,
      data: {
        product_id: productId,
        product_code: product.product_code,
        product_name: product.entity_name,
        activity_count: result[0]?.activity_count || 0,
        routing_activities: routingData || [],
        total_routing_hours: (routingData || []).reduce((sum: number, act: any) => sum + (act.std_hours || 0), 0),
        total_routing_cost: (routingData || []).reduce((sum: number, act: any) => sum + (act.extended_cost || 0), 0)
      },
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      timestamp: new Date().toISOString()
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Routing update error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_ROUTING_UPDATE_FAILED',
        message: error.message || 'Failed to update routing',
        code: 'ERR_ROUTING_UPDATE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET: Read Routing
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAPIContext(request)
    const productId = params.id
    const { searchParams } = new URL(request.url)
    
    const includeWorkCenters = searchParams.get('include_work_centers') === 'true'
    const includeCapacity = searchParams.get('include_capacity') === 'true'
    
    if (!productId) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_REQUEST',
          message: 'Product ID is required',
          code: 'ERR_PROD_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // Validate product exists
    const { data: products, error: productError } = await supabase
      .from('vw_product_master_v2')
      .select('product_id, product_code, entity_name, product_type, total_std_cost')
      .eq('product_id', productId)
      .eq('organization_id', context.organizationId)
    
    if (productError) {
      throw productError
    }
    
    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_NOT_FOUND',
          message: 'Product not found',
          code: 'ERR_PROD_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    const product = products[0]
    
    // Get routing data
    const { data: routingData, error: routingError } = await supabase
      .from('vw_routing_summary_v2')
      .select(`
        activity_id,
        activity_code,
        activity_name,
        std_hours,
        rate_per_hour,
        cost_component,
        extended_cost,
        work_center_id,
        work_center_code,
        work_center_name,
        work_center_capacity_hours,
        work_center_overhead_rate,
        sequence,
        routing_metadata
      `)
      .eq('product_id', productId)
      .eq('organization_id', context.organizationId)
      .order('sequence')
    
    if (routingError) {
      throw routingError
    }
    
    // Calculate totals and summary
    const totalRoutingHours = (routingData || []).reduce((sum: number, act: any) => sum + (act.std_hours || 0), 0)
    const totalRoutingCost = (routingData || []).reduce((sum: number, act: any) => sum + (act.extended_cost || 0), 0)
    
    // Group by cost component
    const costByComponent = (routingData || []).reduce((acc: any, act: any) => {
      const component = act.cost_component || 'unknown'
      acc[component] = (acc[component] || 0) + (act.extended_cost || 0)
      return acc
    }, {})
    
    // Work center summary (if requested)
    let workCenterSummary = null
    if (includeWorkCenters && routingData && routingData.length > 0) {
      const workCenters = routingData
        .filter((act: any) => act.work_center_id)
        .reduce((acc: any, act: any) => {
          const wcId = act.work_center_id
          if (!acc[wcId]) {
            acc[wcId] = {
              work_center_id: wcId,
              work_center_code: act.work_center_code,
              work_center_name: act.work_center_name,
              capacity_hours: act.work_center_capacity_hours,
              overhead_rate: act.work_center_overhead_rate,
              total_hours: 0,
              total_cost: 0,
              activity_count: 0
            }
          }
          acc[wcId].total_hours += act.std_hours || 0
          acc[wcId].total_cost += act.extended_cost || 0
          acc[wcId].activity_count += 1
          return acc
        }, {})
      
      workCenterSummary = Object.values(workCenters)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.product_id,
          code: product.product_code,
          name: product.entity_name,
          type: product.product_type,
          std_cost: product.total_std_cost
        },
        routing_summary: {
          total_activities: routingData?.length || 0,
          total_hours: totalRoutingHours,
          total_cost: totalRoutingCost,
          cost_by_component: costByComponent,
          work_center_count: workCenterSummary?.length || 0
        },
        routing_activities: routingData || [],
        work_center_summary: workCenterSummary
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Routing read error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_ROUTING_READ_FAILED',
        message: error.message || 'Failed to read routing',
        code: 'ERR_ROUTING_READ_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE: Clear Routing
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAPIContext(request)
    const productId = params.id
    
    if (!productId) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_REQUEST',
          message: 'Product ID is required',
          code: 'ERR_PROD_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // Validate product exists
    const { data: products, error: productError } = await supabase
      .from('vw_product_master_v2')
      .select('product_id, product_code, entity_name')
      .eq('product_id', productId)
      .eq('organization_id', context.organizationId)
      .eq('status', 'ACTIVE')
    
    if (productError) {
      throw productError
    }
    
    if (!products || products.length === 0) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_NOT_FOUND',
          message: 'Product not found',
          code: 'ERR_PROD_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    // Clear routing by calling RPC with empty activities array
    const result = await callRoutingRPC(supabase, 'hera_routing_upsert_v2', {
      p_organization_id: context.organizationId,
      p_product_id: productId,
      p_activities: JSON.stringify([]),
      p_smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      p_actor_entity_id: context.userEntityId
    })
    
    return NextResponse.json({
      success: true,
      message: 'Routing cleared successfully',
      data: {
        product_id: productId,
        activity_count: 0
      },
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Routing clear error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_ROUTING_CLEAR_FAILED',
        message: error.message || 'Failed to clear routing',
        code: 'ERR_ROUTING_CLEAR_FAILED'
      },
      { status: 500 }
    )
  }
}