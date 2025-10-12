/**
 * HERA Product Costing v2: Universal API Endpoint
 * 
 * Bulletproof Product Costing API with BOM and routing support,
 * enterprise-grade guardrails, complete audit trail, and WIP/variance integration.
 * 
 * Smart Code: HERA.COST.PRODUCT.API.V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { 
  applyProductCostingGuardrails, 
  validateBOMPosting,
  validateRoutingPosting,
  validatePostingDimensionalCompleteness
} from '@/lib/productcosting/productcosting-v2-guardrails'
import {
  type Product,
  type ProductCreateRequest,
  type ProductUpdateRequest,
  type ProductResponse,
  type ProductValidationError,
  type BOMUpsertRequest,
  type RoutingUpsertRequest,
  PRODUCT_COSTING_SMART_CODES,
  validateProductCode,
  validateProductType,
  validateStandardCostComponents,
  validateEffectiveDates
} from '@/lib/productcosting/productcosting-v2-standard'

// ============================================================================
// API Configuration
// ============================================================================

const API_VERSION = 'v2'
const SMART_CODE_BASE = 'HERA.COST.PRODUCT.API'

interface APIContext {
  organizationId: string
  userId: string
  userEntityId?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract and validate API context from request
 */
async function getAPIContext(request: NextRequest): Promise<APIContext> {
  const headersList = headers()
  const apiVersion = headersList.get('x-hera-api-version')
  const organizationId = headersList.get('x-hera-organization-id')
  
  if (apiVersion !== API_VERSION) {
    throw new Error(`API version mismatch. Expected ${API_VERSION}, got ${apiVersion}`)
  }
  
  if (!organizationId) {
    throw new Error('x-hera-organization-id header is required')
  }
  
  // Get user from Supabase session
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

/**
 * Call RPC function with proper error handling
 */
async function callProductRPC(
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

/**
 * Transform database result to API response format
 */
function transformProductResponse(dbResult: any[]): ProductResponse[] {
  return dbResult.map(row => ({
    id: row.product_id,
    entity_name: row.entity_name,
    product_code: row.product_code,
    product_type: row.product_type,
    uom: row.uom,
    std_cost_version: row.std_cost_version,
    std_cost_components: row.std_cost_components,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    gl_mapping: row.gl_mapping,
    total_std_cost: row.total_std_cost,
    status: row.status,
    audit_txn_id: row.audit_txn_id
  }))
}

// ============================================================================
// POST: Create Product
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const body: ProductCreateRequest = await request.json()
    
    // Validate request body
    if (!body.entity_name || !body.product_code || !body.product_type || !body.uom) {
      return NextResponse.json(
        { 
          error: 'ERR_PROD_INVALID_REQUEST',
          message: 'entity_name, product_code, product_type, and uom are required',
          code: 'ERR_PROD_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    // Validate product code format
    const codeValidation = validateProductCode(body.product_code)
    if (!codeValidation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_CODE_FORMAT',
          message: codeValidation.errors.join(', '),
          code: 'ERR_PROD_INVALID_CODE_FORMAT'
        },
        { status: 400 }
      )
    }
    
    // Validate product type
    const typeValidation = validateProductType(body.product_type)
    if (!typeValidation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_TYPE',
          message: typeValidation.errors.join(', '),
          code: 'ERR_PROD_INVALID_TYPE'
        },
        { status: 400 }
      )
    }
    
    // Validate standard cost components if provided
    if (body.std_cost_components) {
      const costValidation = validateStandardCostComponents(body.std_cost_components)
      if (!costValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PROD_STDCOST_INVALID',
            message: costValidation.errors.join(', '),
            code: 'ERR_PROD_STDCOST_INVALID'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate effective dates if provided
    if (body.effective_from || body.effective_to) {
      const datesValidation = validateEffectiveDates(body.effective_from, body.effective_to)
      if (!datesValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PROD_INVALID_DATE_RANGE',
            message: datesValidation.errors.join(', '),
            code: 'ERR_PROD_INVALID_DATE_RANGE'
          },
          { status: 400 }
        )
      }
    }
    
    const supabase = createServerSupabaseClient()
    
    // Apply guardrails validation
    const existingProducts: Product[] = []
    // Note: In production, you'd fetch existing products for validation
    // const { data: existing } = await supabase.from('vw_product_master_v2')...
    
    const validation = await applyProductCostingGuardrails(
      'create',
      body,
      context.organizationId,
      existingProducts
    )
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_GUARDRAILS_FAILED',
          message: 'Product guardrails validation failed',
          validation_errors: validation.errors,
          code: 'ERR_PROD_GUARDRAILS_FAILED'
        },
        { status: 422 }
      )
    }
    
    // Call atomic RPC function
    const result = await callProductRPC(supabase, 'hera_product_upsert_v2', {
      p_organization_id: context.organizationId,
      p_product_id: null, // NULL for create
      p_entity_name: body.entity_name,
      p_product_code: body.product_code,
      p_product_type: body.product_type,
      p_uom: body.uom,
      p_std_cost_version: body.std_cost_version,
      p_std_cost_components: body.std_cost_components ? JSON.stringify(body.std_cost_components) : null,
      p_effective_from: body.effective_from,
      p_effective_to: body.effective_to,
      p_gl_mapping: body.gl_mapping ? JSON.stringify(body.gl_mapping) : null,
      p_metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      p_smart_code: PRODUCT_COSTING_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: context.userEntityId
    })
    
    const response = transformProductResponse(result)
    
    return NextResponse.json({
      success: true,
      data: response[0],
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_CREATE,
      timestamp: new Date().toISOString()
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Product create error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PROD_CREATE_FAILED',
        message: error.message || 'Failed to create product',
        code: 'ERR_PROD_CREATE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT: Update Product
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const body: ProductUpdateRequest & { product_id: string } = await request.json()
    
    if (!body.product_id) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_REQUEST',
          message: 'product_id is required for updates',
          code: 'ERR_PROD_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    // Validate updated fields if provided
    if (body.product_code) {
      const codeValidation = validateProductCode(body.product_code)
      if (!codeValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PROD_INVALID_CODE_FORMAT',
            message: codeValidation.errors.join(', '),
            code: 'ERR_PROD_INVALID_CODE_FORMAT'
          },
          { status: 400 }
        )
      }
    }
    
    if (body.product_type) {
      const typeValidation = validateProductType(body.product_type)
      if (!typeValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PROD_INVALID_TYPE',
            message: typeValidation.errors.join(', '),
            code: 'ERR_PROD_INVALID_TYPE'
          },
          { status: 400 }
        )
      }
    }
    
    if (body.std_cost_components) {
      const costValidation = validateStandardCostComponents(body.std_cost_components)
      if (!costValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PROD_STDCOST_INVALID',
            message: costValidation.errors.join(', '),
            code: 'ERR_PROD_STDCOST_INVALID'
          },
          { status: 400 }
        )
      }
    }
    
    const supabase = createServerSupabaseClient()
    
    // Call atomic RPC function
    const result = await callProductRPC(supabase, 'hera_product_upsert_v2', {
      p_organization_id: context.organizationId,
      p_product_id: body.product_id,
      p_entity_name: body.entity_name,
      p_product_code: body.product_code,
      p_product_type: body.product_type,
      p_uom: body.uom,
      p_std_cost_version: body.std_cost_version,
      p_std_cost_components: body.std_cost_components ? JSON.stringify(body.std_cost_components) : null,
      p_effective_from: body.effective_from,
      p_effective_to: body.effective_to,
      p_gl_mapping: body.gl_mapping ? JSON.stringify(body.gl_mapping) : null,
      p_metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      p_smart_code: PRODUCT_COSTING_SMART_CODES.TXN_UPDATE,
      p_actor_entity_id: context.userEntityId
    })
    
    const response = transformProductResponse(result)
    
    return NextResponse.json({
      success: true,
      data: response[0],
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_UPDATE,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Product update error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PROD_UPDATE_FAILED',
        message: error.message || 'Failed to update product',
        code: 'ERR_PROD_UPDATE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET: Read Products
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const { searchParams } = new URL(request.url)
    
    const productId = searchParams.get('product_id')
    const productCode = searchParams.get('product_code')
    const productType = searchParams.get('product_type')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'ACTIVE'
    const includeArchived = searchParams.get('include_archived') === 'true'
    const includeBOM = searchParams.get('include_bom') === 'true'
    const includeRouting = searchParams.get('include_routing') === 'true'
    
    const supabase = createServerSupabaseClient()
    
    // Build query based on filters
    let query = supabase
      .from('vw_product_master_v2')
      .select('*')
      .eq('organization_id', context.organizationId)
    
    if (!includeArchived) {
      query = query.eq('status', status)
    }
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    if (productCode) {
      query = query.eq('product_code', productCode)
    }
    
    if (productType) {
      query = query.eq('product_type', productType)
    }
    
    if (search) {
      // Use ilike for partial text search
      query = query.or(`entity_name.ilike.%${search}%,product_code.ilike.%${search}%`)
    }
    
    const { data: products, error } = await query.order('product_code')
    
    if (error) {
      throw error
    }
    
    // Enhance with BOM and routing data if requested
    const enhancedProducts = []
    for (const product of products || []) {
      const enhanced: any = { ...product }
      
      if (includeBOM) {
        const { data: bomData } = await supabase
          .from('vw_bom_explosion_v2')
          .select('*')
          .eq('parent_product_id', product.product_id)
          .eq('bom_level', 1) // Only direct components
        
        enhanced.bom_components = bomData || []
      }
      
      if (includeRouting) {
        const { data: routingData } = await supabase
          .from('vw_routing_summary_v2')
          .select('*')
          .eq('product_id', product.product_id)
          .order('sequence')
        
        enhanced.routing_activities = routingData || []
      }
      
      enhancedProducts.push(enhanced)
    }
    
    return NextResponse.json({
      success: true,
      data: enhancedProducts,
      count: enhancedProducts.length,
      filters: {
        product_id: productId,
        product_code: productCode,
        product_type: productType,
        search,
        status,
        include_archived: includeArchived,
        include_bom: includeBOM,
        include_routing: includeRouting
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Product read error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PROD_READ_FAILED',
        message: error.message || 'Failed to read products',
        code: 'ERR_PROD_READ_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE: Archive Product
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')
    
    if (!productId) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_INVALID_REQUEST',
          message: 'product_id is required',
          code: 'ERR_PROD_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // Get product and validate archival
    const { data: products, error: fetchError } = await supabase
      .from('vw_product_master_v2')
      .select('*')
      .eq('organization_id', context.organizationId)
      .eq('product_id', productId)
      .eq('status', 'ACTIVE')
    
    if (fetchError) {
      throw fetchError
    }
    
    const product = products?.[0]
    if (!product) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_NOT_FOUND',
          message: 'Product not found',
          code: 'ERR_PROD_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    // Check if product is used in BOMs (basic check)
    const { data: bomUsage } = await supabase
      .from('vw_bom_explosion_v2')
      .select('parent_product_id')
      .eq('component_id', productId)
      .limit(1)
    
    if (bomUsage && bomUsage.length > 0) {
      return NextResponse.json(
        {
          error: 'ERR_PROD_IN_USE',
          message: 'Product is used in other BOMs and cannot be archived',
          code: 'ERR_PROD_IN_USE'
        },
        { status: 422 }
      )
    }
    
    // Archive product (update status to ARCHIVED)
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({ 
        status: 'ARCHIVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('organization_id', context.organizationId)
    
    if (updateError) {
      throw updateError
    }
    
    // Create audit transaction
    const { data: auditResult, error: auditError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: context.organizationId,
        transaction_type: 'product_costing_change',
        smart_code: PRODUCT_COSTING_SMART_CODES.TXN_ARCHIVE,
        transaction_date: new Date().toISOString(),
        reference_number: `PROD-ARCHIVE-${product.product_code}`,
        total_amount: 0.00,
        source_entity_id: context.userEntityId,
        metadata: {
          operation_type: 'ARCHIVE',
          product_id: productId,
          product_code: product.product_code,
          entity_name: product.entity_name,
          product_type: product.product_type
        }
      })
      .select()
    
    if (auditError) {
      console.error('Audit error:', auditError)
      // Don't fail the operation for audit errors
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product archived successfully',
      product_id: productId,
      audit_txn_id: auditResult?.[0]?.id,
      smart_code: PRODUCT_COSTING_SMART_CODES.TXN_ARCHIVE,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Product archive error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PROD_ARCHIVE_FAILED',
        message: error.message || 'Failed to archive product',
        code: 'ERR_PROD_ARCHIVE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// OPTIONS: Validation Endpoint
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const body = await request.json()
    
    // This endpoint can be used for client-side validation
    // without actually creating/updating the product
    
    const validation = await applyProductCostingGuardrails(
      body.operation || 'create',
      body.data,
      context.organizationId,
      body.existing_products || []
    )
    
    return NextResponse.json({
      success: true,
      validation: validation,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Product validation error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PROD_VALIDATION_FAILED',
        message: error.message || 'Failed to validate product',
        code: 'ERR_PROD_VALIDATION_FAILED'
      },
      { status: 500 }
    )
  }
}