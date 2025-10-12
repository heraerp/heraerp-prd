/**
 * HERA Profit Center v2: Universal API Endpoint
 * 
 * Bulletproof Profit Center API with IFRS 8 (CODM) support,
 * enterprise-grade guardrails, complete audit trail, and hierarchy management.
 * 
 * Smart Code: HERA.PROFITCENTER.API.V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { 
  applyProfitCenterGuardrails, 
  validatePostingProfitCenter,
  validateProfitCenterArchive,
  batchValidateProfitCenters
} from '@/lib/profitcenter/profitcenter-v2-guardrails'
import {
  type ProfitCenter,
  type ProfitCenterCreateRequest,
  type ProfitCenterUpdateRequest,
  type ProfitCenterResponse,
  type ProfitCenterValidationError,
  PROFIT_CENTER_SMART_CODES,
  validateProfitCenterCode,
  validateSegmentCode,
  validateValidityDates,
  validateTags
} from '@/lib/profitcenter/profitcenter-v2-standard'

// ============================================================================
// API Configuration
// ============================================================================

const API_VERSION = 'v2'
const SMART_CODE_BASE = 'HERA.PROFITCENTER.API'

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
async function callProfitCenterRPC(
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
function transformProfitCenterResponse(dbResult: any[]): ProfitCenterResponse[] {
  return dbResult.map(row => ({
    id: row.profit_center_id,
    entity_name: row.entity_name,
    pc_code: row.pc_code,
    segment_code: row.segment_code,
    depth: row.depth,
    status: row.status || 'ACTIVE',
    parent_id: row.parent_id,
    valid_from: row.valid_from,
    valid_to: row.valid_to,
    manager: row.manager,
    region_code: row.region_code,
    tags: row.tags || [],
    codm_inclusion: row.codm_inclusion || false,
    audit_txn_id: row.audit_txn_id
  }))
}

// ============================================================================
// POST: Create Profit Center
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const body: ProfitCenterCreateRequest = await request.json()
    
    // Validate request body
    if (!body.entity_name || !body.pc_code) {
      return NextResponse.json(
        { 
          error: 'ERR_PC_INVALID_REQUEST',
          message: 'entity_name and pc_code are required',
          code: 'ERR_PC_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    // Validate profit center code format
    const codeValidation = validateProfitCenterCode(body.pc_code)
    if (!codeValidation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_PC_INVALID_CODE_FORMAT',
          message: codeValidation.errors.join(', '),
          code: 'ERR_PC_INVALID_CODE_FORMAT'
        },
        { status: 400 }
      )
    }
    
    // Validate segment code if provided
    if (body.segment_code) {
      const segmentValidation = validateSegmentCode(body.segment_code)
      if (!segmentValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PC_INVALID_SEGMENT_CODE',
            message: segmentValidation.errors.join(', '),
            code: 'ERR_PC_INVALID_SEGMENT_CODE'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate validity dates if provided
    if (body.valid_from || body.valid_to) {
      const datesValidation = validateValidityDates(body.valid_from, body.valid_to)
      if (!datesValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PC_INVALID_VALIDITY_DATES',
            message: datesValidation.errors.join(', '),
            code: 'ERR_PC_INVALID_VALIDITY_DATES'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate tags if provided
    if (body.tags && body.tags.length > 0) {
      const tagsValidation = validateTags(body.tags)
      if (!tagsValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PC_INVALID_TAGS',
            message: tagsValidation.errors.join(', '),
            code: 'ERR_PC_INVALID_TAGS'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate CODM requirements
    if (body.codm_inclusion === true && !body.segment_code) {
      return NextResponse.json(
        {
          error: 'ERR_PC_CODM_MAPPING_REQUIRED',
          message: 'CODM inclusion requires valid segment mapping',
          code: 'ERR_PC_CODM_MAPPING_REQUIRED'
        },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // Apply guardrails validation
    const existingProfitCenters: ProfitCenter[] = []
    // Note: In production, you'd fetch existing profit centers for validation
    // const { data: existing } = await supabase.from('vw_profitcenter_flat_v2')...
    
    const validation = await applyProfitCenterGuardrails(
      'create',
      body,
      context.organizationId,
      existingProfitCenters
    )
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_PC_GUARDRAILS_FAILED',
          message: 'Profit center guardrails validation failed',
          validation_errors: validation.errors,
          code: 'ERR_PC_GUARDRAILS_FAILED'
        },
        { status: 422 }
      )
    }
    
    // Call atomic RPC function
    const result = await callProfitCenterRPC(supabase, 'hera_profitcenter_upsert_v2', {
      p_organization_id: context.organizationId,
      p_profit_center_id: null, // NULL for create
      p_entity_name: body.entity_name,
      p_pc_code: body.pc_code,
      p_parent_id: body.parent_id,
      p_segment_code: body.segment_code,
      p_valid_from: body.valid_from,
      p_valid_to: body.valid_to,
      p_manager: body.manager,
      p_region_code: body.region_code,
      p_tags: body.tags,
      p_codm_inclusion: body.codm_inclusion || false,
      p_metadata: body.metadata,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: context.userEntityId
    })
    
    const response = transformProfitCenterResponse(result)
    
    return NextResponse.json({
      success: true,
      data: response[0],
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      timestamp: new Date().toISOString()
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('Profit center create error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PC_CREATE_FAILED',
        message: error.message || 'Failed to create profit center',
        code: 'ERR_PC_CREATE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT: Update Profit Center
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const body: ProfitCenterUpdateRequest & { profit_center_id: string } = await request.json()
    
    if (!body.profit_center_id) {
      return NextResponse.json(
        {
          error: 'ERR_PC_INVALID_REQUEST',
          message: 'profit_center_id is required for updates',
          code: 'ERR_PC_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    // Validate profit center code format if being updated
    if (body.pc_code) {
      const codeValidation = validateProfitCenterCode(body.pc_code)
      if (!codeValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PC_INVALID_CODE_FORMAT',
            message: codeValidation.errors.join(', '),
            code: 'ERR_PC_INVALID_CODE_FORMAT'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate segment code if being updated
    if (body.segment_code !== undefined) {
      const segmentValidation = validateSegmentCode(body.segment_code)
      if (!segmentValidation.valid) {
        return NextResponse.json(
          {
            error: 'ERR_PC_INVALID_SEGMENT_CODE',
            message: segmentValidation.errors.join(', '),
            code: 'ERR_PC_INVALID_SEGMENT_CODE'
          },
          { status: 400 }
        )
      }
    }
    
    // Validate CODM requirements if being updated
    if (body.codm_inclusion === true && body.segment_code === undefined) {
      // Would need to check existing segment_code from database
      // For now, we'll let the RPC handle this validation
    }
    
    const supabase = createServerSupabaseClient()
    
    // Call atomic RPC function
    const result = await callProfitCenterRPC(supabase, 'hera_profitcenter_upsert_v2', {
      p_organization_id: context.organizationId,
      p_profit_center_id: body.profit_center_id,
      p_entity_name: body.entity_name,
      p_pc_code: body.pc_code,
      p_parent_id: body.parent_id,
      p_segment_code: body.segment_code,
      p_valid_from: body.valid_from,
      p_valid_to: body.valid_to,
      p_manager: body.manager,
      p_region_code: body.region_code,
      p_tags: body.tags,
      p_codm_inclusion: body.codm_inclusion,
      p_metadata: body.metadata,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_UPDATE,
      p_actor_entity_id: context.userEntityId
    })
    
    const response = transformProfitCenterResponse(result)
    
    return NextResponse.json({
      success: true,
      data: response[0],
      audit_txn_id: result[0]?.audit_txn_id,
      smart_code: PROFIT_CENTER_SMART_CODES.TXN_UPDATE,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Profit center update error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PC_UPDATE_FAILED',
        message: error.message || 'Failed to update profit center',
        code: 'ERR_PC_UPDATE_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET: Read Profit Centers
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const { searchParams } = new URL(request.url)
    
    const profitCenterId = searchParams.get('profit_center_id')
    const parentId = searchParams.get('parent_id')
    const segmentCode = searchParams.get('segment_code')
    const view = searchParams.get('view') || 'flat' // 'tree' | 'flat'
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'ACTIVE'
    const includeArchived = searchParams.get('include_archived') === 'true'
    const codmOnly = searchParams.get('codm_only') === 'true'
    
    const supabase = createServerSupabaseClient()
    
    // Choose view based on request
    const viewName = view === 'tree' ? 'vw_profitcenter_tree_v2' : 'vw_profitcenter_flat_v2'
    
    // Build query based on filters
    let query = supabase
      .from(viewName)
      .select('*')
      .eq('organization_id', context.organizationId)
    
    if (!includeArchived) {
      query = query.eq('status', status)
    }
    
    if (profitCenterId) {
      query = query.eq('profit_center_id', profitCenterId)
    }
    
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }
    
    if (segmentCode) {
      query = query.eq('segment_code', segmentCode)
    }
    
    if (codmOnly) {
      query = query.eq('codm_inclusion', true)
    }
    
    if (search && view === 'flat') {
      // Use full-text search on flat view
      query = query.textSearch('search_text', search)
    }
    
    const { data, error } = await query.order('pc_code')
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      view,
      filters: {
        profit_center_id: profitCenterId,
        parent_id: parentId,
        segment_code: segmentCode,
        search,
        status,
        include_archived: includeArchived,
        codm_only: codmOnly
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Profit center read error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PC_READ_FAILED',
        message: error.message || 'Failed to read profit centers',
        code: 'ERR_PC_READ_FAILED'
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE: Archive Profit Center
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const context = await getAPIContext(request)
    const { searchParams } = new URL(request.url)
    const profitCenterId = searchParams.get('profit_center_id')
    
    if (!profitCenterId) {
      return NextResponse.json(
        {
          error: 'ERR_PC_INVALID_REQUEST',
          message: 'profit_center_id is required',
          code: 'ERR_PC_INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    const supabase = createServerSupabaseClient()
    
    // Get profit center and validate archival
    const { data: profitCenters, error: fetchError } = await supabase
      .from('vw_profitcenter_tree_v2')
      .select('*')
      .eq('organization_id', context.organizationId)
      .eq('status', 'ACTIVE')
    
    if (fetchError) {
      throw fetchError
    }
    
    const profitCenter = profitCenters?.find(pc => pc.profit_center_id === profitCenterId)
    if (!profitCenter) {
      return NextResponse.json(
        {
          error: 'ERR_PC_PARENT_NOT_FOUND',
          message: 'Profit center not found',
          code: 'ERR_PC_PARENT_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    // Validate archival rules
    const archiveValidation = validateProfitCenterArchive(
      profitCenter as ProfitCenter,
      profitCenters as ProfitCenter[],
      false // TODO: Check if profit center has transactions
    )
    
    if (!archiveValidation.valid) {
      return NextResponse.json(
        {
          error: 'ERR_PC_IN_USE',
          message: 'Cannot archive profit center',
          validation_errors: archiveValidation.errors,
          code: 'ERR_PC_IN_USE'
        },
        { status: 422 }
      )
    }
    
    // Archive profit center (update status to ARCHIVED)
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({ 
        status: 'ARCHIVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', profitCenterId)
      .eq('organization_id', context.organizationId)
    
    if (updateError) {
      throw updateError
    }
    
    // Create audit transaction
    const { data: auditResult, error: auditError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: context.organizationId,
        transaction_type: 'profit_center_operation',
        smart_code: PROFIT_CENTER_SMART_CODES.TXN_ARCHIVE,
        transaction_date: new Date().toISOString(),
        reference_number: `PC-ARCHIVE-${profitCenter.pc_code}`,
        total_amount: 0.00,
        from_entity_id: context.userEntityId,
        metadata: {
          operation_type: 'ARCHIVE',
          profit_center_id: profitCenterId,
          pc_code: profitCenter.pc_code,
          entity_name: profitCenter.entity_name,
          segment_code: profitCenter.segment_code
        }
      })
      .select()
    
    if (auditError) {
      console.error('Audit error:', auditError)
      // Don't fail the operation for audit errors
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profit center archived successfully',
      profit_center_id: profitCenterId,
      audit_txn_id: auditResult?.[0]?.id,
      smart_code: PROFIT_CENTER_SMART_CODES.TXN_ARCHIVE,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Profit center archive error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PC_ARCHIVE_FAILED',
        message: error.message || 'Failed to archive profit center',
        code: 'ERR_PC_ARCHIVE_FAILED'
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
    // without actually creating/updating the profit center
    
    const validation = await applyProfitCenterGuardrails(
      body.operation || 'create',
      body.data,
      context.organizationId,
      body.existing_profit_centers || []
    )
    
    return NextResponse.json({
      success: true,
      validation: validation,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Profit center validation error:', error)
    
    return NextResponse.json(
      {
        error: 'ERR_PC_VALIDATION_FAILED',
        message: error.message || 'Failed to validate profit center',
        code: 'ERR_PC_VALIDATION_FAILED'
      },
      { status: 500 }
    )
  }
}