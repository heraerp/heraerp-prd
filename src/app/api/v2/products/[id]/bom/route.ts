/**
 * HERA Product Costing v2: BOM Management API Endpoint
 * 
 * Specialized endpoint for BOM (Bill of Materials) management with cycle detection,
 * component validation, and complete audit trail.
 * 
 * Smart Code: HERA.COST.PRODUCT.BOM.API.V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { 
  validateBOMPosting
} from '@/lib/productcosting/productcosting-v2-guardrails'
import {
  type BOMUpsertRequest,
  type BOMComponent,
  PRODUCT_COSTING_SMART_CODES,
  validateBOMComponent
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

async function callBOMRPC(
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
// POST: Update BOM
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAPIContext(request)
    const productId = params.id
    const body: { components: BOMComponent[] } = await request.json()
    
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
    
    if (!body.components || !Array.isArray(body.components)) {
      return NextResponse.json(
        {
          error: 'ERR_BOM_INVALID_REQUEST',
          message: 'Components array is required',
          code: 'ERR_BOM_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    // Validate each component
    for (let i = 0; i < body.components.length; i++) {
      const component = body.components[i]
      const componentValidation = validateBOMComponent({
        component_id: component.component_id,
        qty_per: component.qty_per,
        scrap_pct: component.scrap_pct
      })
      
      if (!componentValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_BOM_COMPONENT_INVALID',
            message: `Component ${i + 1}: ${componentValidation.errors.join(', ')}`,
            code: 'ERR_BOM_COMPONENT_INVALID'
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
    
    // Apply BOM guardrails validation
    const bomValidation = validateBOMPosting(productId, body.components)
    if (!bomValidation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_BOM_GUARDRAILS_FAILED',
          message: 'BOM guardrails validation failed',
          validation_errors: bomValidation.errors,
          code: 'ERR_BOM_GUARDRAILS_FAILED'
        },
        { status: 422 }
      )
    }
    
    // Prepare components for RPC call
    const componentsForRPC = body.components.map(comp => ({
      component_id: comp.component_id,
      qty_per: comp.qty_per,
      scrap_pct: comp.scrap_pct || 0,
      sequence: comp.sequence || 1,
      effective_from: comp.effective_from || new Date().toISOString().split('T')[0],
      effective_to: comp.effective_to
    }))
    
    // Call atomic BOM RPC function
    const result = await callBOMRPC(supabase, 'hera_bom_upsert_v2', {
      p_organization_id: context.organizationId,
      p_product_id: productId,
      p_components: JSON.stringify(componentsForRPC),
      p_smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      p_actor_entity_id: context.userEntityId
    })
    
    // Get updated BOM data
    const { data: bomData } = await supabase
      .from('vw_bom_explosion_v2')
      .select(`
        component_id,
        component_code,
        component_name,
        component_type,
        component_uom,
        component_unit_cost,
        qty_per,
        scrap_pct,
        extended_qty_per,
        extended_cost,
        sequence
      `)
      .eq('parent_product_id', productId)
      .eq('bom_level', 1)
      .order('sequence')
    
    return NextResponse.json({
      success: true,
      data: {
        product_id: productId,
        product_code: product.product_code,
        product_name: product.entity_name,
        component_count: result[0]?.component_count || 0,
        bom_components: bomData || [],
        total_bom_cost: (bomData || []).reduce((sum: number, comp: any) => sum + (comp.extended_cost || 0), 0)
      },
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      timestamp: new Date().toISOString()
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('BOM update error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_BOM_UPDATE_FAILED',
        message: error.message || 'Failed to update BOM',
        code: 'ERR_BOM_UPDATE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET: Read BOM
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await getAPIContext(request)
    const productId = params.id
    const { searchParams } = new URL(request.url)
    
    const includeMultiLevel = searchParams.get('multi_level') === 'true'
    const maxLevels = parseInt(searchParams.get('max_levels') || '10')
    
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
    
    // Build BOM query
    let bomQuery = supabase
      .from('vw_bom_explosion_v2')
      .select(`
        component_id,
        component_code,
        component_name,
        component_type,
        component_uom,
        component_unit_cost,
        qty_per,
        scrap_pct,
        direct_qty_per,
        extended_qty_per,
        extended_cost,
        bom_level,
        sequence
      `)
      .eq('parent_product_id', productId)
      .eq('organization_id', context.organizationId)
    
    if (!includeMultiLevel) {
      bomQuery = bomQuery.eq('bom_level', 1)
    } else {
      bomQuery = bomQuery.lte('bom_level', maxLevels)
    }
    
    const { data: bomData, error: bomError } = await bomQuery.order(['bom_level', 'sequence'])
    
    if (bomError) {
      throw bomError
    }
    
    // Calculate totals
    const totalBOMCost = (bomData || [])
      .filter((comp: any) => comp.bom_level === 1)
      .reduce((sum: number, comp: any) => sum + (comp.extended_cost || 0), 0)
    
    const componentCounts = (bomData || []).reduce((acc: any, comp: any) => {
      acc[`level_${comp.bom_level}`] = (acc[`level_${comp.bom_level}`] || 0) + 1
      return acc
    }, {})
    
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
        bom_summary: {
          total_components: bomData?.length || 0,
          total_bom_cost: totalBOMCost,
          component_counts: componentCounts,
          max_level: Math.max(0, ...(bomData || []).map((comp: any) => comp.bom_level)),
          multi_level_included: includeMultiLevel
        },
        bom_components: bomData || []
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('BOM read error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_BOM_READ_FAILED',
        message: error.message || 'Failed to read BOM',
        code: 'ERR_BOM_READ_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE: Clear BOM
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
    
    // Clear BOM by calling RPC with empty components array
    const result = await callBOMRPC(supabase, 'hera_bom_upsert_v2', {
      p_organization_id: context.organizationId,
      p_product_id: productId,
      p_components: JSON.stringify([]),
      p_smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      p_actor_entity_id: context.userEntityId
    })
    
    return NextResponse.json({
      success: true,
      message: 'BOM cleared successfully',
      data: {
        product_id: productId,
        component_count: 0
      },
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_REL_UPSERT,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('BOM clear error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_BOM_CLEAR_FAILED',
        message: error.message || 'Failed to clear BOM',
        code: 'ERR_BOM_CLEAR_FAILED'
      },
      { status: 500 }
    )
  }
}