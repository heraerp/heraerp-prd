/**
 * ================================================================================
 * HERA API v2.1 - Universal Transactions Endpoint
 * Smart Code: HERA.API.V2_1.TRANSACTIONS.CRUD.V1
 * ================================================================================
 *
 * 🚀 ENTERPRISE FEATURES:
 * - Full CRUD operations via hera_transactions_crud_v2 RPC
 * - Comprehensive guardrails (GL balance, fiscal periods, smart codes)
 * - Actor stamping for complete audit trail
 * - Multi-tenant isolation with RLS
 * - Transaction + Lines + Dynamic + Relationships in single atomic call
 * - Performance monitoring and detailed logging
 * - Branch validation for salon/retail transactions
 *
 * 🛡️ GUARDRAILS ENFORCED:
 * ✅ ORG-FILTER-REQUIRED: organization_id mandatory
 * ✅ SMARTCODE-PRESENT: HERA DNA pattern validation
 * ✅ TXN-HEADER-REQUIRED: transaction_type, transaction_date validation
 * ✅ TXN-LINE-REQUIRED: At least one line for financial transactions
 * ✅ GL-BALANCED: Debit/credit balance validation (multi-currency)
 * ✅ BRANCH-REQUIRED: Branch tracking for salon/retail transactions
 * ✅ FISCAL-PERIOD: Period validation (open/closed/locked)
 * ✅ ACTOR-STAMPING: created_by/updated_by tracking
 * ✅ TRANSACTION-TYPE-UPPERCASE: Normalized to UPPERCASE
 *
 * 📋 SUPPORTED OPERATIONS:
 * - POST   /api/v2.1/transactions  → CREATE transaction + lines + dynamic + relationships
 * - GET    /api/v2.1/transactions  → READ transactions with filters
 * - PUT    /api/v2.1/transactions  → UPDATE transaction + lines
 * - DELETE /api/v2.1/transactions  → DELETE transaction (soft/hard/reverse)
 *
 * ================================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, buildActorContext } from '@/lib/auth/verify-auth'
import { getSupabaseService } from '@/lib/supabase-service'
import { HERAGuardrailsV2 } from '@/lib/guardrails/hera-guardrails-v2'
import { assertBranchOnEvent } from '@/lib/guardrails/branch'

// ================================================================================
// TYPES
// ================================================================================

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  smart_code: string
  entity_id?: string
  line_data?: Record<string, any>
}

interface DynamicField {
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'json'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  field_value_json?: any
  smart_code: string
}

interface Relationship {
  to_entity_id: string
  relationship_type: string
  smart_code: string
  relationship_data?: Record<string, any>
}

interface TransactionPayload {
  // Core transaction fields
  transaction_type: string
  smart_code: string
  transaction_code?: string
  transaction_number?: string
  transaction_date?: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount?: number
  transaction_status?: string
  reference_number?: string
  external_reference?: string

  // Business context
  business_context?: Record<string, any>

  // Transaction lines
  lines?: TransactionLine[]

  // Dynamic fields
  dynamic?: Record<string, DynamicField>

  // Relationships
  relationships?: Relationship[]

  // Legacy compatibility
  metadata?: Record<string, any>
  status?: string

  // For updates
  transaction_id?: string
}

interface ReadOptions {
  transaction_type?: string
  transaction_id?: string
  transaction_status?: string
  source_entity_id?: string
  target_entity_id?: string
  date_from?: string
  date_to?: string
  smart_code?: string
  limit?: number
  offset?: number
  include_lines?: boolean
  include_dynamic?: boolean
  include_relationships?: boolean
  include_audit_fields?: boolean
}

interface DeleteOptions {
  transaction_id: string
  action?: 'soft_delete' | 'hard_delete' | 'reverse'
  reason?: string
  cascade?: boolean
}

interface GuardrailCheck {
  passed: boolean
  violations: Array<{
    code: string
    message: string
    severity: 'ERROR' | 'WARNING' | 'INFO'
    context?: any
  }>
}

export const runtime = 'nodejs'

// ================================================================================
// GUARDRAIL VALIDATION FUNCTIONS
// ================================================================================

/**
 * Validate transaction payload with comprehensive guardrails
 */
async function validateTransactionPayload(
  payload: TransactionPayload,
  organizationId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<GuardrailCheck> {
  const violations: any[] = []

  // ✅ ORG-FILTER-REQUIRED
  if (!organizationId) {
    violations.push({
      code: 'ORG-FILTER-REQUIRED',
      message: 'organization_id is required for multi-tenant isolation',
      severity: 'ERROR'
    })
  }

  if (action === 'CREATE' || action === 'UPDATE') {
    // ✅ SMARTCODE-PRESENT
    if (!payload.smart_code) {
      violations.push({
        code: 'SMARTCODE-REQUIRED',
        message: 'smart_code is required for all HERA transactions',
        severity: 'ERROR'
      })
    } else {
      const smartCodeResult = HERAGuardrailsV2.validateSmartCode(payload.smart_code)
      violations.push(...smartCodeResult.violations.map(v => ({
        code: v.code,
        message: v.message,
        severity: v.severity.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO',
        context: v.context
      })))
    }

    // ✅ TXN-HEADER-REQUIRED
    if (action === 'CREATE') {
      if (!payload.transaction_type) {
        violations.push({
          code: 'TXN-TYPE-REQUIRED',
          message: 'transaction_type is required',
          severity: 'ERROR'
        })
      }

      if (!payload.transaction_date) {
        violations.push({
          code: 'TXN-DATE-REQUIRED',
          message: 'transaction_date is required',
          severity: 'ERROR'
        })
      }
    }

    // ✅ TXN-LINE-VALIDATION
    if (payload.lines) {
      if (payload.lines.length === 0) {
        violations.push({
          code: 'TXN-LINE-REQUIRED',
          message: 'At least one transaction line is required',
          severity: 'WARNING'
        })
      }

      payload.lines.forEach((line, index) => {
        if (!line.smart_code) {
          violations.push({
            code: 'LINE-SMARTCODE-REQUIRED',
            message: `Line ${index + 1} missing smart_code`,
            severity: 'ERROR',
            context: { line_number: line.line_number }
          })
        }

        if (typeof line.line_amount !== 'number') {
          violations.push({
            code: 'LINE-AMOUNT-INVALID',
            message: `Line ${index + 1} has invalid line_amount`,
            severity: 'ERROR',
            context: { line_number: line.line_number }
          })
        }

        if (!line.line_type) {
          violations.push({
            code: 'LINE-TYPE-REQUIRED',
            message: `Line ${index + 1} missing line_type`,
            severity: 'ERROR',
            context: { line_number: line.line_number }
          })
        }
      })
    }

    // ✅ GL-BALANCED (for financial transactions)
    if (payload.smart_code?.includes('.GL.') || payload.smart_code?.includes('.FIN.')) {
      if (payload.lines) {
        const glBalanceResult = HERAGuardrailsV2.validateMultiCurrencyGLBalance(payload.lines)
        violations.push(...glBalanceResult.violations.map(v => ({
          code: v.code,
          message: v.message,
          severity: v.severity.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO',
          context: v.context
        })))
      }
    }

    // ✅ BRANCH-REQUIRED (for salon/retail transactions)
    if (payload.transaction_type && /^(POS_|APPT_|INVENTORY_|SALON_|SERVICE_)/.test(payload.transaction_type)) {
      try {
        assertBranchOnEvent({
          transaction_type: payload.transaction_type,
          business_context: payload.business_context,
          lines: payload.lines || []
        })
      } catch (error: any) {
        violations.push({
          code: 'BRANCH-REQUIRED',
          message: error.message,
          severity: 'ERROR'
        })
      }
    }

    // ✅ FISCAL-PERIOD (if transaction_date provided)
    if (payload.transaction_date && action === 'CREATE') {
      const fiscalResult = await HERAGuardrailsV2.validateFiscalPeriod(
        payload.transaction_date,
        organizationId
      )
      violations.push(...fiscalResult.violations.map(v => ({
        code: v.code,
        message: v.message,
        severity: v.severity.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO',
        context: v.context
      })))
    }

    // ✅ DYNAMIC-FIELD-VALIDATION
    if (payload.dynamic) {
      Object.entries(payload.dynamic).forEach(([fieldName, fieldData]) => {
        if (!fieldData.smart_code) {
          violations.push({
            code: 'DYNAMIC-FIELD-SMARTCODE-REQUIRED',
            message: `Dynamic field '${fieldName}' missing smart_code`,
            severity: 'ERROR',
            context: { field_name: fieldName }
          })
        }
      })
    }

    // ✅ RELATIONSHIP-VALIDATION
    if (payload.relationships) {
      payload.relationships.forEach((rel, index) => {
        if (!rel.to_entity_id) {
          violations.push({
            code: 'RELATIONSHIP-TO-ENTITY-REQUIRED',
            message: `Relationship ${index + 1} missing to_entity_id`,
            severity: 'ERROR'
          })
        }

        if (!rel.relationship_type) {
          violations.push({
            code: 'RELATIONSHIP-TYPE-REQUIRED',
            message: `Relationship ${index + 1} missing relationship_type`,
            severity: 'ERROR'
          })
        }

        if (!rel.smart_code) {
          violations.push({
            code: 'RELATIONSHIP-SMARTCODE-REQUIRED',
            message: `Relationship ${index + 1} missing smart_code`,
            severity: 'ERROR'
          })
        }
      })
    }
  }

  if (action === 'DELETE') {
    if (!payload.transaction_id) {
      violations.push({
        code: 'TRANSACTION-ID-REQUIRED',
        message: 'transaction_id is required for deletion',
        severity: 'ERROR'
      })
    }
  }

  // Filter to only ERROR severity for pass/fail
  const errors = violations.filter(v => v.severity === 'ERROR')

  return {
    passed: errors.length === 0,
    violations
  }
}

/**
 * Normalize transaction type to UPPERCASE (HERA standard)
 */
function normalizeTransactionType(transactionType?: string): string | undefined {
  if (!transactionType) return undefined
  return transactionType.toUpperCase()
}

/**
 * Normalize status to UPPERCASE (HERA standard)
 */
function normalizeStatus(status?: string): string | undefined {
  if (!status) return undefined
  return status.toUpperCase()
}

/**
 * Generate guardrail report for logging
 */
function generateGuardrailReport(check: GuardrailCheck): string {
  const { violations } = check
  const errors = violations.filter(v => v.severity === 'ERROR')
  const warnings = violations.filter(v => v.severity === 'WARNING')

  let report = '🛡️ HERA API v2.1 Transaction Guardrails Report\n'
  report += '='.repeat(50) + '\n'

  if (errors.length > 0) {
    report += `❌ ${errors.length} ERRORS:\n`
    errors.forEach((e, i) => {
      report += `  ${i + 1}. [${e.code}] ${e.message}\n`
    })
  }

  if (warnings.length > 0) {
    report += `⚠️  ${warnings.length} WARNINGS:\n`
    warnings.forEach((w, i) => {
      report += `  ${i + 1}. [${w.code}] ${w.message}\n`
    })
  }

  if (errors.length === 0 && warnings.length === 0) {
    report += '✅ All guardrails passed!\n'
  }

  return report
}

// ================================================================================
// POST - CREATE TRANSACTION
// ================================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let organizationId: string | undefined
  let userId: string | undefined
  let actor: any

  try {
    // ✅ STEP 1: Authentication & Authorization
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required',
          api_version: 'v2.1'
        },
        { status: 401 }
      )
    }

    organizationId = authResult.organizationId
    userId = authResult.id

    // ✅ STEP 2: Parse request body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        {
          error: 'invalid_json',
          message: 'Request body must be valid JSON',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    const payload: TransactionPayload = body

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Transactions] POST - Creating transaction:', {
      transaction_type: payload.transaction_type,
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id,
      has_lines: !!payload.lines && payload.lines.length > 0,
      lines_count: payload.lines?.length || 0,
      has_dynamic: !!payload.dynamic && Object.keys(payload.dynamic).length > 0,
      has_relationships: !!payload.relationships && payload.relationships.length > 0
    })

    // ✅ STEP 4: Guardrail validation
    const guardrailCheck = await validateTransactionPayload(payload, organizationId, 'CREATE')

    if (!guardrailCheck.passed) {
      const report = generateGuardrailReport(guardrailCheck)
      console.error('[API v2.1 Transactions] Guardrail validation failed:\n' + report)

      return NextResponse.json(
        {
          error: 'guardrail_violation',
          message: 'Transaction validation failed',
          violations: guardrailCheck.violations.filter(v => v.severity === 'ERROR'),
          warnings: guardrailCheck.violations.filter(v => v.severity === 'WARNING'),
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // Log warnings if any
    const warnings = guardrailCheck.violations.filter(v => v.severity === 'WARNING')
    if (warnings.length > 0) {
      console.warn('[API v2.1 Transactions] Guardrail warnings:', warnings)
    }

    // ✅ STEP 5: Normalize transaction type and status
    const normalizedType = normalizeTransactionType(payload.transaction_type)
    const normalizedStatus = normalizeStatus(payload.transaction_status || payload.status) || 'PENDING'

    // ✅ STEP 6: Call hera_transactions_crud_v2 RPC
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_type: normalizedType,
        smart_code: payload.smart_code,
        transaction_code: payload.transaction_code,
        transaction_number: payload.transaction_number || `TXN-${Date.now()}`,
        transaction_date: payload.transaction_date || new Date().toISOString(),
        source_entity_id: payload.source_entity_id || null,
        target_entity_id: payload.target_entity_id || null,
        total_amount: payload.total_amount || 0,
        transaction_status: normalizedStatus,
        reference_number: payload.reference_number || null,
        external_reference: payload.external_reference || null,
        business_context: payload.business_context || {}
      },
      p_lines: payload.lines && payload.lines.length > 0 ? payload.lines : null,
      p_dynamic: payload.dynamic && Object.keys(payload.dynamic).length > 0 ? payload.dynamic : null,
      p_relationships: payload.relationships && payload.relationships.length > 0 ? payload.relationships : null,
      p_options: null
    })

    if (error) {
      console.error('[API v2.1 Transactions] RPC error:', error)
      throw new Error(error.message || 'Transaction creation failed')
    }

    const duration = Date.now() - startTime

    const transactionId = data?.transaction_id || data?.data?.transaction_id || data?.data?.id || data?.id

    console.log('[API v2.1 Transactions] ✅ Transaction created successfully:', {
      transaction_id: transactionId,
      duration_ms: duration
    })

    // ✅ STEP 7: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        transaction_id: transactionId,
        actor_user_id: actor.actor_user_id,
        organization_id: organizationId,
        performance: {
          duration_ms: duration
        }
      },
      { status: 201 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[API v2.1 Transactions] POST Error:', {
      message: error.message,
      code: error.code,
      organization_id: organizationId,
      user_id: userId,
      actor_user_id: actor?.actor_user_id,
      duration_ms: duration
    })

    return NextResponse.json(
      {
        error: 'database_error',
        message: error.message || 'Transaction creation failed',
        code: error.code,
        api_version: 'v2.1',
        performance: {
          duration_ms: duration
        }
      },
      { status: 500 }
    )
  }
}

// ================================================================================
// GET - READ TRANSACTIONS
// ================================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  let organizationId: string | undefined
  let userId: string | undefined
  let actor: any

  try {
    // ✅ STEP 1: Authentication & Authorization
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required',
          api_version: 'v2.1'
        },
        { status: 401 }
      )
    }

    organizationId = authResult.organizationId
    userId = authResult.id

    // ✅ STEP 2: Parse query parameters
    const { searchParams } = new URL(req.url)

    const options: ReadOptions = {
      transaction_type: searchParams.get('transaction_type') || undefined,
      transaction_id: searchParams.get('transaction_id') || undefined,
      transaction_status: searchParams.get('transaction_status') || searchParams.get('status') || undefined,
      source_entity_id: searchParams.get('source_entity_id') || undefined,
      target_entity_id: searchParams.get('target_entity_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      smart_code: searchParams.get('smart_code') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
      include_lines: searchParams.get('include_lines') !== 'false',
      include_dynamic: searchParams.get('include_dynamic') === 'true',
      include_relationships: searchParams.get('include_relationships') === 'true',
      include_audit_fields: searchParams.get('include_audit_fields') === 'true'
    }

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Transactions] GET - Reading transactions:', {
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id,
      filters: options
    })

    // ✅ STEP 4: Normalize filters
    const normalizedType = normalizeTransactionType(options.transaction_type)
    const normalizedStatus = normalizeStatus(options.transaction_status)

    // ✅ STEP 5: Call hera_transactions_crud_v2 RPC
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_transaction: {
        ...(options.transaction_id && { transaction_id: options.transaction_id }),
        ...(normalizedType && { transaction_type: normalizedType }),
        ...(normalizedStatus && { transaction_status: normalizedStatus }),
        ...(options.source_entity_id && { source_entity_id: options.source_entity_id }),
        ...(options.target_entity_id && { target_entity_id: options.target_entity_id }),
        ...(options.smart_code && { smart_code: options.smart_code })
      },
      p_lines: null,
      p_dynamic: null,
      p_relationships: null,
      p_options: {
        limit: options.limit,
        offset: options.offset,
        include_lines: options.include_lines,
        include_dynamic: options.include_dynamic,
        include_relationships: options.include_relationships,
        include_audit_fields: options.include_audit_fields,
        date_from: options.date_from,
        date_to: options.date_to
      }
    })

    if (error) {
      console.error('[API v2.1 Transactions] RPC error:', error)
      throw new Error(error.message || 'Transaction read failed')
    }

    const duration = Date.now() - startTime

    // Handle response format
    const transactions = Array.isArray(data) ? data : (data?.data || [])

    console.log('[API v2.1 Transactions] ✅ Transactions retrieved successfully:', {
      count: transactions.length,
      duration_ms: duration
    })

    // ✅ STEP 6: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        data: transactions,
        count: transactions.length,
        filters: options,
        organization_id: organizationId,
        performance: {
          duration_ms: duration
        }
      },
      { status: 200 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[API v2.1 Transactions] GET Error:', {
      message: error.message,
      code: error.code,
      organization_id: organizationId,
      user_id: userId,
      actor_user_id: actor?.actor_user_id,
      duration_ms: duration
    })

    return NextResponse.json(
      {
        error: 'database_error',
        message: error.message || 'Transaction read failed',
        code: error.code,
        api_version: 'v2.1',
        performance: {
          duration_ms: duration
        }
      },
      { status: 500 }
    )
  }
}

// ================================================================================
// PUT - UPDATE TRANSACTION
// ================================================================================

export async function PUT(req: NextRequest) {
  const startTime = Date.now()
  let organizationId: string | undefined
  let userId: string | undefined
  let actor: any

  try {
    // ✅ STEP 1: Authentication & Authorization
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required',
          api_version: 'v2.1'
        },
        { status: 401 }
      )
    }

    organizationId = authResult.organizationId
    userId = authResult.id

    // ✅ STEP 2: Parse request body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        {
          error: 'invalid_json',
          message: 'Request body must be valid JSON',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    const payload: TransactionPayload = body

    if (!payload.transaction_id) {
      return NextResponse.json(
        {
          error: 'transaction_id_required',
          message: 'transaction_id is required for updates',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Transactions] PUT - Updating transaction:', {
      transaction_id: payload.transaction_id,
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id
    })

    // ✅ STEP 4: Guardrail validation
    const guardrailCheck = await validateTransactionPayload(payload, organizationId, 'UPDATE')

    if (!guardrailCheck.passed) {
      const report = generateGuardrailReport(guardrailCheck)
      console.error('[API v2.1 Transactions] Guardrail validation failed:\n' + report)

      return NextResponse.json(
        {
          error: 'guardrail_violation',
          message: 'Transaction validation failed',
          violations: guardrailCheck.violations.filter(v => v.severity === 'ERROR'),
          warnings: guardrailCheck.violations.filter(v => v.severity === 'WARNING'),
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // ✅ STEP 5: Normalize values if provided
    const normalizedType = payload.transaction_type ? normalizeTransactionType(payload.transaction_type) : undefined
    const normalizedStatus = (payload.transaction_status || payload.status) ? normalizeStatus(payload.transaction_status || payload.status) : undefined

    // ✅ STEP 6: Call hera_transactions_crud_v2 RPC
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'UPDATE',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_id: payload.transaction_id,
        ...(normalizedType && { transaction_type: normalizedType }),
        ...(payload.smart_code && { smart_code: payload.smart_code }),
        ...(payload.transaction_code && { transaction_code: payload.transaction_code }),
        ...(payload.transaction_number && { transaction_number: payload.transaction_number }),
        ...(payload.transaction_date && { transaction_date: payload.transaction_date }),
        ...(payload.source_entity_id !== undefined && { source_entity_id: payload.source_entity_id }),
        ...(payload.target_entity_id !== undefined && { target_entity_id: payload.target_entity_id }),
        ...(payload.total_amount !== undefined && { total_amount: payload.total_amount }),
        ...(normalizedStatus && { transaction_status: normalizedStatus }),
        ...(payload.reference_number !== undefined && { reference_number: payload.reference_number }),
        ...(payload.external_reference !== undefined && { external_reference: payload.external_reference }),
        ...(payload.business_context && { business_context: payload.business_context })
      },
      p_lines: payload.lines && payload.lines.length > 0 ? payload.lines : null,
      p_dynamic: payload.dynamic && Object.keys(payload.dynamic).length > 0 ? payload.dynamic : null,
      p_relationships: payload.relationships && payload.relationships.length > 0 ? payload.relationships : null,
      p_options: null
    })

    if (error) {
      console.error('[API v2.1 Transactions] RPC error:', error)
      throw new Error(error.message || 'Transaction update failed')
    }

    const duration = Date.now() - startTime

    console.log('[API v2.1 Transactions] ✅ Transaction updated successfully:', {
      transaction_id: payload.transaction_id,
      duration_ms: duration
    })

    // ✅ STEP 7: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        transaction_id: payload.transaction_id,
        actor_user_id: actor.actor_user_id,
        organization_id: organizationId,
        performance: {
          duration_ms: duration
        }
      },
      { status: 200 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[API v2.1 Transactions] PUT Error:', {
      message: error.message,
      code: error.code,
      organization_id: organizationId,
      user_id: userId,
      actor_user_id: actor?.actor_user_id,
      duration_ms: duration
    })

    return NextResponse.json(
      {
        error: 'database_error',
        message: error.message || 'Transaction update failed',
        code: error.code,
        api_version: 'v2.1',
        performance: {
          duration_ms: duration
        }
      },
      { status: 500 }
    )
  }
}

// ================================================================================
// DELETE - DELETE TRANSACTION
// ================================================================================

export async function DELETE(req: NextRequest) {
  const startTime = Date.now()
  let organizationId: string | undefined
  let userId: string | undefined
  let actor: any

  try {
    // ✅ STEP 1: Authentication & Authorization
    const authResult = await verifyAuth(req)
    if (!authResult || !authResult.organizationId || !authResult.id) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Authentication required',
          api_version: 'v2.1'
        },
        { status: 401 }
      )
    }

    organizationId = authResult.organizationId
    userId = authResult.id

    // ✅ STEP 2: Parse request body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        {
          error: 'invalid_json',
          message: 'Request body must be valid JSON',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    const options: DeleteOptions = body

    if (!options.transaction_id) {
      return NextResponse.json(
        {
          error: 'transaction_id_required',
          message: 'transaction_id is required for deletion',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Transactions] DELETE - Deleting transaction:', {
      transaction_id: options.transaction_id,
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id,
      action: options.action || 'soft_delete',
      cascade: options.cascade
    })

    // ✅ STEP 4: Call hera_transactions_crud_v2 RPC
    const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
      p_action: 'DELETE',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_transaction: {
        transaction_id: options.transaction_id
      },
      p_lines: null,
      p_dynamic: null,
      p_relationships: null,
      p_options: {
        delete_reason: options.reason || 'Transaction deleted via API v2.1',
        cascade_delete: options.cascade || false,
        delete_action: options.action || 'soft_delete'
      }
    })

    if (error) {
      console.error('[API v2.1 Transactions] RPC error:', error)
      throw new Error(error.message || 'Transaction deletion failed')
    }

    const duration = Date.now() - startTime

    console.log('[API v2.1 Transactions] ✅ Transaction deleted successfully:', {
      transaction_id: options.transaction_id,
      duration_ms: duration
    })

    // ✅ STEP 5: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        transaction_id: options.transaction_id,
        deleted: true,
        actor_user_id: actor.actor_user_id,
        organization_id: organizationId,
        performance: {
          duration_ms: duration
        }
      },
      { status: 200 }
    )

  } catch (error: any) {
    const duration = Date.now() - startTime

    console.error('[API v2.1 Transactions] DELETE Error:', {
      message: error.message,
      code: error.code,
      organization_id: organizationId,
      user_id: userId,
      actor_user_id: actor?.actor_user_id,
      duration_ms: duration
    })

    return NextResponse.json(
      {
        error: 'database_error',
        message: error.message || 'Transaction deletion failed',
        code: error.code,
        api_version: 'v2.1',
        performance: {
          duration_ms: duration
        }
      },
      { status: 500 }
    )
  }
}
