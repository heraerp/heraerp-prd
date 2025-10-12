/**
 * HERA Profitability v2: REST API Endpoints
 * 
 * Complete REST API for profitability operations including allocation,
 * assessment, settlement, reconciliation, and analytics with sub-second
 * performance and IFRS 8 CODM compliance.
 * 
 * Smart Code: HERA.PROFITABILITY.API.V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { assertV2, v2Body } from '@/lib/client/fetchV2'
import { callRPC } from '@/lib/db/rpc-client'
import { 
  type ProfitabilityRunRequest,
  type ProfitabilityQuery,
  validateAllocationPolicy,
  validateSettlementPolicy,
  validatePeriod,
  PROFITABILITY_ERROR_CODES,
  PROFITABILITY_SMART_CODES
} from '@/lib/profitability/profitability-v2-standard'
import { applyProfitabilityGuardrails } from '@/lib/profitability/profitability-v2-guardrails'

// ============================================================================
// POST /api/v2/profitability - Run Profitability Operations
// ============================================================================

export async function POST(request: NextRequest) {
  const headers = assertV2(request)
  
  try {
    const body = await v2Body(request)
    const { operation, ...runRequest } = body as ProfitabilityRunRequest & { operation: string }
    
    // Validate required fields
    if (!operation || !runRequest.organization_id || !runRequest.period || !runRequest.policy_ref) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: 'Missing required fields: operation, organization_id, period, policy_ref',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Validate period format
    const periodValidation = validatePeriod(runRequest.period)
    if (!periodValidation.valid) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_PERIOD_INVALID,
        message: `Invalid period format: ${periodValidation.errors.join(', ')}`,
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    let result: any
    
    switch (operation.toLowerCase()) {
      case 'allocation':
        result = await callRPC('hera_profitability_alloc_v2', {
          p_organization_id: runRequest.organization_id,
          p_actor_entity_id: runRequest.actor_entity_id || null,
          p_period: runRequest.period,
          p_policy_ref: runRequest.policy_ref,
          p_dry_run: runRequest.dry_run || false
        }, { mode: 'service' })
        break
        
      case 'assessment':
        result = await callRPC('hera_profitability_assess_v2', {
          p_organization_id: runRequest.organization_id,
          p_actor_entity_id: runRequest.actor_entity_id || null,
          p_period: runRequest.period,
          p_policy_ref: runRequest.policy_ref,
          p_dry_run: runRequest.dry_run || false
        }, { mode: 'service' })
        break
        
      case 'settlement':
        result = await callRPC('hera_profitability_settle_v2', {
          p_organization_id: runRequest.organization_id,
          p_actor_entity_id: runRequest.actor_entity_id || null,
          p_period: runRequest.period,
          p_policy_ref: runRequest.policy_ref,
          p_dry_run: runRequest.dry_run || false
        }, { mode: 'service' })
        break
        
      case 'reconciliation':
        result = await callRPC('hera_profitability_reconcile_v2', {
          p_organization_id: runRequest.organization_id,
          p_actor_entity_id: runRequest.actor_entity_id || null,
          p_period: runRequest.period,
          p_tolerance: 0.01
        }, { mode: 'service' })
        break
        
      default:
        return NextResponse.json({
          error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
          message: `Unknown operation: ${operation}. Supported operations: allocation, assessment, settlement, reconciliation`,
          apiVersion: 'v2'
        }, { status: 400 })
    }
    
    if (!result.success) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_RUN_FAILED,
        message: result.error || 'Profitability operation failed',
        details: result.details,
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      operation,
      smart_code: PROFITABILITY_SMART_CODES.ALLOC_DISTRIBUTE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('Profitability operation error:', error)
    return NextResponse.json({
      error: PROFITABILITY_ERROR_CODES.ERR_RUN_FAILED,
      message: error.message || 'Internal server error during profitability operation',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}

// ============================================================================
// GET /api/v2/profitability - Query Profitability Data
// ============================================================================

export async function GET(request: NextRequest) {
  const headers = assertV2(request)
  const { searchParams } = new URL(request.url)
  
  try {
    const query: ProfitabilityQuery = {
      organization_id: searchParams.get('organization_id') || '',
      period: searchParams.get('period') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      slice: searchParams.get('slice')?.split(',') || undefined,
      filters: searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : undefined,
      metrics: searchParams.get('metrics')?.split(',') || undefined,
      group_by: searchParams.get('group_by')?.split(',') || undefined,
      currency: searchParams.get('currency') || undefined,
      include_codm_only: searchParams.get('include_codm_only') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '100')
    }
    
    // Validate required fields
    if (!query.organization_id) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: 'organization_id is required',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Build dynamic query based on parameters
    let sqlQuery = `
      SELECT 
        org_id,
        period,
        txn_date,
        currency,
        ${query.group_by?.includes('profit_center') ? 'profit_center_code, profit_center_name,' : ''}
        ${query.group_by?.includes('cost_center') ? 'cost_center_code, cost_center_name,' : ''}
        ${query.group_by?.includes('product') ? 'product_code, product_name,' : ''}
        ${query.group_by?.includes('customer') ? 'customer_code, customer_name,' : ''}
        ${query.group_by?.includes('account') ? 'account_number, account_name, account_group,' : ''}
        ${query.group_by?.includes('codm_segment') ? 'codm_segment,' : ''}
        ${query.metrics?.includes('revenue') ? 'SUM(CASE WHEN account_group = \'REVENUE\' THEN amount_net ELSE 0 END) as revenue,' : ''}
        ${query.metrics?.includes('cogs') ? 'SUM(CASE WHEN account_group = \'COGS\' THEN amount_net ELSE 0 END) as cogs,' : ''}
        ${query.metrics?.includes('opex') ? 'SUM(CASE WHEN account_group = \'OPEX\' THEN amount_net ELSE 0 END) as opex,' : ''}
        ${query.metrics?.includes('net_profit') ? 'SUM(amount_net) as net_profit,' : ''}
        ${query.metrics?.includes('transaction_count') ? 'COUNT(*) as transaction_count,' : ''}
        SUM(amount_net) as total_amount
      FROM fact_profitability_v2
      WHERE org_id = $1
    `
    
    const queryParams: any[] = [query.organization_id]
    let paramCount = 1
    
    // Add period filter
    if (query.period) {
      paramCount++
      sqlQuery += ` AND period = $${paramCount}`
      queryParams.push(query.period)
    }
    
    // Add date range filter
    if (query.date_from && query.date_to) {
      paramCount++
      sqlQuery += ` AND txn_date BETWEEN $${paramCount}::date AND $${paramCount + 1}::date`
      queryParams.push(query.date_from, query.date_to)
      paramCount++
    }
    
    // Add currency filter
    if (query.currency) {
      paramCount++
      sqlQuery += ` AND currency = $${paramCount}`
      queryParams.push(query.currency)
    }
    
    // Add CODM filter
    if (query.include_codm_only) {
      sqlQuery += ` AND pc_codm_included = true`
    }
    
    // Add custom filters
    if (query.filters) {
      for (const [key, value] of Object.entries(query.filters)) {
        if (key === 'account_group') {
          paramCount++
          sqlQuery += ` AND account_group = $${paramCount}`
          queryParams.push(value)
        } else if (key === 'profit_center_segment') {
          paramCount++
          sqlQuery += ` AND profit_center_segment = $${paramCount}`
          queryParams.push(value)
        }
        // Add more filter conditions as needed
      }
    }
    
    // Add GROUP BY clause
    if (query.group_by && query.group_by.length > 0) {
      const groupFields = []
      if (query.group_by.includes('profit_center')) {
        groupFields.push('profit_center_code', 'profit_center_name')
      }
      if (query.group_by.includes('cost_center')) {
        groupFields.push('cost_center_code', 'cost_center_name')
      }
      if (query.group_by.includes('product')) {
        groupFields.push('product_code', 'product_name')
      }
      if (query.group_by.includes('customer')) {
        groupFields.push('customer_code', 'customer_name')
      }
      if (query.group_by.includes('account')) {
        groupFields.push('account_number', 'account_name', 'account_group')
      }
      if (query.group_by.includes('codm_segment')) {
        groupFields.push('codm_segment')
      }
      if (query.group_by.includes('period')) {
        groupFields.push('period')
      }
      
      if (groupFields.length > 0) {
        sqlQuery += ` GROUP BY org_id, currency, ${groupFields.join(', ')}`
      }
    }
    
    // Add ORDER BY
    sqlQuery += ` ORDER BY total_amount DESC`
    
    // Add pagination
    const offset = (query.page! - 1) * query.limit!
    paramCount++
    sqlQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    queryParams.push(query.limit, offset)
    
    // Execute query
    const result = await callRPC('hera_universal_query_v2', {
      p_sql: sqlQuery,
      p_params: queryParams
    }, { mode: 'service' })
    
    if (!result.success) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: result.error || 'Failed to query profitability data',
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    // Get total count for pagination
    const countQuery = sqlQuery.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*$/, '')
    const countResult = await callRPC('hera_universal_query_v2', {
      p_sql: countQuery,
      p_params: queryParams.slice(0, -2) // Remove LIMIT/OFFSET params
    }, { mode: 'service' })
    
    const totalRows = countResult.success ? countResult.data[0]?.total || 0 : 0
    
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        total_rows: totalRows,
        page: query.page!,
        limit: query.limit!,
        has_more: offset + query.limit! < totalRows,
        query_params: {
          organization_id: query.organization_id,
          period: query.period,
          group_by: query.group_by,
          metrics: query.metrics,
          include_codm_only: query.include_codm_only
        }
      },
      smart_code: PROFITABILITY_SMART_CODES.DIM_VALIDATE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('Profitability query error:', error)
    return NextResponse.json({
      error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
      message: error.message || 'Internal server error during profitability query',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/v2/profitability - Update Profitability Policies
// ============================================================================

export async function PUT(request: NextRequest) {
  const headers = assertV2(request)
  
  try {
    const body = await v2Body(request)
    const { policy_type, policy_ref, policy_data, organization_id } = body
    
    // Validate required fields
    if (!policy_type || !policy_ref || !policy_data || !organization_id) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: 'Missing required fields: policy_type, policy_ref, policy_data, organization_id',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Validate policy structure based on type
    let validation
    switch (policy_type) {
      case 'ALLOC_ASSESS_V2':
        validation = validateAllocationPolicy(policy_data)
        break
      case 'SETTLEMENT_V2':
        validation = validateSettlementPolicy(policy_data)
        break
      default:
        return NextResponse.json({
          error: PROFITABILITY_ERROR_CODES.ERR_POLICY_INVALID,
          message: `Unknown policy type: ${policy_type}`,
          apiVersion: 'v2'
        }, { status: 400 })
    }
    
    if (!validation.valid) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_POLICY_INVALID,
        message: `Policy validation failed: ${validation.errors.join(', ')}`,
        warnings: validation.warnings,
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Create or update policy entity
    const result = await callRPC('hera_entity_upsert_v1', {
      p_organization_id: organization_id,
      p_entity_type: policy_type === 'ALLOC_ASSESS_V2' ? 'ALLOCATION_POLICY' : 'SETTLEMENT_POLICY',
      p_entity_name: `${policy_ref} Policy`,
      p_entity_code: policy_ref,
      p_smart_code: PROFITABILITY_SMART_CODES.POLICY_UPDATE,
      p_entity_id: null,
      p_metadata: null
    }, { mode: 'service' })
    
    if (!result.success) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_POLICY_INVALID,
        message: result.error || 'Failed to create/update policy entity',
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    // Store policy definition in dynamic data
    const policyResult = await callRPC('hera_dynamic_data_batch_v1', {
      p_organization_id: organization_id,
      p_entity_id: result.data,
      p_smart_code: PROFITABILITY_SMART_CODES.POLICY_UPDATE,
      p_fields: [
        {
          field_name: 'policy_definition',
          field_type: 'json',
          field_value_json: policy_data
        },
        {
          field_name: 'policy_version',
          field_type: 'text',
          field_value_text: policy_data.version || '1.0'
        },
        {
          field_name: 'effective_from',
          field_type: 'text',
          field_value_text: policy_data.effective_from
        }
      ]
    }, { mode: 'service' })
    
    if (!policyResult.success) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_POLICY_INVALID,
        message: policyResult.error || 'Failed to store policy definition',
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        policy_entity_id: result.data,
        policy_ref,
        policy_type,
        validation_warnings: validation.warnings
      },
      smart_code: PROFITABILITY_SMART_CODES.POLICY_UPDATE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('Profitability policy update error:', error)
    return NextResponse.json({
      error: PROFITABILITY_ERROR_CODES.ERR_POLICY_INVALID,
      message: error.message || 'Internal server error during policy update',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/v2/profitability - Archive Profitability Policies
// ============================================================================

export async function DELETE(request: NextRequest) {
  const headers = assertV2(request)
  const { searchParams } = new URL(request.url)
  
  try {
    const organization_id = searchParams.get('organization_id')
    const policy_ref = searchParams.get('policy_ref')
    
    if (!organization_id || !policy_ref) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: 'Missing required parameters: organization_id, policy_ref',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Archive the policy by setting status to ARCHIVED
    const result = await callRPC('hera_entity_upsert_v1', {
      p_organization_id: organization_id,
      p_entity_type: 'ALLOCATION_POLICY',
      p_entity_name: `${policy_ref} Policy (Archived)`,
      p_entity_code: policy_ref,
      p_smart_code: PROFITABILITY_SMART_CODES.POLICY_ARCHIVE,
      p_entity_id: null,
      p_metadata: { archived_at: new Date().toISOString(), archived_reason: 'API_REQUEST' }
    }, { mode: 'service' })
    
    if (!result.success) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_POLICY_NOT_FOUND,
        message: result.error || 'Failed to archive policy',
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        policy_ref,
        archived: true,
        archived_at: new Date().toISOString()
      },
      smart_code: PROFITABILITY_SMART_CODES.POLICY_ARCHIVE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('Profitability policy archive error:', error)
    return NextResponse.json({
      error: PROFITABILITY_ERROR_CODES.ERR_POLICY_NOT_FOUND,
      message: error.message || 'Internal server error during policy archive',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}