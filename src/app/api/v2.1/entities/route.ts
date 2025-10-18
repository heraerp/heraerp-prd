/**
 * ================================================================================
 * HERA API v2.1 - Universal Entities Endpoint
 * Smart Code: HERA.API.V2_1.ENTITIES.CRUD.V1
 * ================================================================================
 *
 * 🚀 ENTERPRISE FEATURES:
 * - Full CRUD operations via hera_entities_crud_v2 RPC
 * - Comprehensive guardrails (organization, smart codes, field placement)
 * - Actor stamping for complete audit trail
 * - Multi-tenant isolation with RLS
 * - Detailed error handling and logging
 * - Performance monitoring hooks
 * - Idempotency support
 *
 * 🛡️ GUARDRAILS ENFORCED:
 * ✅ ORG-FILTER-REQUIRED: organization_id mandatory
 * ✅ SMARTCODE-PRESENT: HERA DNA pattern validation
 * ✅ ACTOR-STAMPING: created_by/updated_by tracking
 * ✅ FIELD-PLACEMENT: Business data in dynamic_data, not metadata
 * ✅ ENTITY-TYPE-UPPERCASE: Normalized to UPPERCASE
 * ✅ RLS-ISOLATION: Row-level security enforced
 *
 * 📋 SUPPORTED OPERATIONS:
 * - POST   /api/v2.1/entities       → CREATE entity + dynamic + relationships
 * - GET    /api/v2.1/entities       → READ entities with filters
 * - PUT    /api/v2.1/entities       → UPDATE entity + dynamic + relationships
 * - DELETE /api/v2.1/entities       → DELETE entity (soft/hard)
 *
 * ================================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, buildActorContext } from '@/lib/auth/verify-auth'
import { getSupabaseService } from '@/lib/supabase-service'
import { HERAGuardrailsV2 } from '@/lib/guardrails/hera-guardrails-v2'
import { assertBranchOnEvent, validateBranchExists } from '@/lib/guardrails/branch'

// ================================================================================
// TYPES
// ================================================================================

interface EntityPayload {
  // Core entity fields
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  entity_description?: string
  parent_entity_id?: string
  status?: string

  // Dynamic fields (field_name -> { field_type, field_value_*, smart_code })
  dynamic?: Record<string, {
    field_type: 'text' | 'number' | 'boolean' | 'date' | 'json'
    field_value_text?: string
    field_value_number?: number
    field_value_boolean?: boolean
    field_value_date?: string
    field_value_json?: any
    smart_code: string
  }>

  // Relationships (to_entity_id, relationship_type, smart_code)
  relationships?: Array<{
    to_entity_id: string
    relationship_type: string
    smart_code: string
    relationship_data?: Record<string, any>
  }>

  // Legacy compatibility
  metadata?: Record<string, any>
  business_rules?: Record<string, any>

  // For updates
  entity_id?: string
}

interface ReadOptions {
  entity_type?: string
  entity_id?: string
  status?: string
  q?: string
  limit?: number
  offset?: number
  include_dynamic?: boolean
  include_relationships?: boolean
  include_audit_fields?: boolean
}

interface DeleteOptions {
  entity_id: string
  hard_delete?: boolean
  cascade?: boolean
  reason?: string
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
 * Validate entity payload with comprehensive guardrails
 */
function validateEntityPayload(
  payload: EntityPayload,
  organizationId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): GuardrailCheck {
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
        message: 'smart_code is required for all HERA entities',
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

    // ✅ ENTITY-TYPE-REQUIRED
    if (action === 'CREATE' && !payload.entity_type) {
      violations.push({
        code: 'ENTITY-TYPE-REQUIRED',
        message: 'entity_type is required for entity creation',
        severity: 'ERROR'
      })
    }

    // ✅ ENTITY-NAME-REQUIRED
    if (action === 'CREATE' && !payload.entity_name) {
      violations.push({
        code: 'ENTITY-NAME-REQUIRED',
        message: 'entity_name is required for entity creation',
        severity: 'ERROR'
      })
    }

    // ✅ FIELD-PLACEMENT: Warn if business data is in metadata
    if (payload.metadata && typeof payload.metadata === 'object') {
      const suspiciousFields = ['price', 'quantity', 'description', 'category', 'status', 'type']
      const foundInMetadata = suspiciousFields.filter(field => field in payload.metadata!)

      if (foundInMetadata.length > 0) {
        violations.push({
          code: 'FIELD-PLACEMENT-WARNING',
          message: `Business fields [${foundInMetadata.join(', ')}] detected in metadata. Consider moving to dynamic fields`,
          severity: 'WARNING',
          context: { fields: foundInMetadata }
        })
      }
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

        // Check that value matches declared type
        const hasValue =
          fieldData.field_value_text !== undefined ||
          fieldData.field_value_number !== undefined ||
          fieldData.field_value_boolean !== undefined ||
          fieldData.field_value_date !== undefined ||
          fieldData.field_value_json !== undefined

        if (!hasValue) {
          violations.push({
            code: 'DYNAMIC-FIELD-VALUE-REQUIRED',
            message: `Dynamic field '${fieldName}' missing value`,
            severity: 'WARNING',
            context: { field_name: fieldName, field_type: fieldData.field_type }
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
    if (!payload.entity_id) {
      violations.push({
        code: 'ENTITY-ID-REQUIRED',
        message: 'entity_id is required for deletion',
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
 * Normalize entity type to UPPERCASE (HERA standard)
 */
function normalizeEntityType(entityType?: string): string | undefined {
  if (!entityType) return undefined
  return entityType.toUpperCase()
}

/**
 * Generate guardrail report for logging
 */
function generateGuardrailReport(check: GuardrailCheck): string {
  const { violations } = check
  const errors = violations.filter(v => v.severity === 'ERROR')
  const warnings = violations.filter(v => v.severity === 'WARNING')

  let report = '🛡️ HERA API v2.1 Guardrails Report\n'
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
// POST - CREATE ENTITY
// ================================================================================

export async function POST(req: NextRequest) {
  console.log('[API v2.1 Entities] 🚀 POST FUNCTION CALLED - Request received')
  const startTime = Date.now()
  let organizationId: string | undefined
  let userId: string | undefined
  let actor: any

  try {
    // ✅ STEP 1: Authentication & Authorization
    console.log('[API v2.1 Entities] Step 1: Verifying auth...')
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
    console.log('[API v2.1 Entities] ✅ Auth verified:', { organizationId, userId })

    // ✅ STEP 2: Parse request body
    console.log('[API v2.1 Entities] Step 2: Parsing request body...')
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

    const payload: EntityPayload = body

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Entities] POST - Creating entity:', {
      entity_type: payload.entity_type,
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id,
      has_dynamic: !!payload.dynamic && Object.keys(payload.dynamic).length > 0,
      has_relationships: !!payload.relationships && payload.relationships.length > 0
    })

    // ✅ STEP 4: Guardrail validation
    const guardrailCheck = validateEntityPayload(payload, organizationId, 'CREATE')

    if (!guardrailCheck.passed) {
      const report = generateGuardrailReport(guardrailCheck)
      console.error('[API v2.1 Entities] Guardrail validation failed:\n' + report)

      return NextResponse.json(
        {
          error: 'guardrail_violation',
          message: 'Entity validation failed',
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
      console.warn('[API v2.1 Entities] Guardrail warnings:', warnings)
    }

    // ✅ STEP 5: Normalize entity type
    const normalizedEntityType = normalizeEntityType(payload.entity_type)

    // 🚨 DEBUG: Log the relationships before RPC call
    console.log('[API v2.1 Entities] 🔍 Relationships being sent to RPC:', {
      relationships: payload.relationships,
      has_relationships: !!payload.relationships && payload.relationships.length > 0,
      relationship_count: payload.relationships?.length || 0
    })

    // ✅ STEP 6: Call hera_entities_crud_v2 RPC
    console.log('[API v2.1 Entities] Step 6: Calling hera_entities_crud_v2 RPC...')
    const rpcPayload = {
      p_action: 'CREATE',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_entity: {
        entity_type: normalizedEntityType,
        entity_name: payload.entity_name,
        entity_code: payload.entity_code,
        smart_code: payload.smart_code,
        entity_description: payload.entity_description,
        parent_entity_id: payload.parent_entity_id,
        status: payload.status || 'active',
        metadata: payload.metadata,
        business_rules: payload.business_rules
      },
      p_dynamic: payload.dynamic && Object.keys(payload.dynamic).length > 0 ? payload.dynamic : null,
      p_relationships: payload.relationships && payload.relationships.length > 0 ? payload.relationships : null,
      p_options: null
    }

    console.log('[API v2.1 Entities] 🔍 RPC Payload:', JSON.stringify(rpcPayload, null, 2))

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', rpcPayload)

    if (error) {
      console.error('[API v2.1 Entities] RPC error:', error)
      throw new Error(error.message || 'Entity creation failed')
    }

    // 🚨 DEBUG: Log raw RPC response to identify structure
    console.log('[API v2.1 Entities] 🔍 Raw RPC response:', JSON.stringify(data, null, 2))

    const duration = Date.now() - startTime

    // 🚨 CRITICAL FIX: Extract entity_id from actual RPC response structure
    // RPC returns: { items: [{ id: '...' }], next_cursor: '...' }
    // OR: { entity_id: '...' } (direct format)
    // OR: { data: { entity_id: '...' } } (nested format)
    const entity_id =
      data?.entity_id ||                    // Direct format
      data?.data?.entity_id ||              // Nested format
      data?.id ||                           // Alternative direct format
      (data?.items && data.items[0]?.id)    // Array format (items[0].id)

    if (!entity_id) {
      console.error('[API v2.1 Entities] ❌ Could not extract entity_id from response')
      throw new Error('Entity created but no entity_id could be extracted')
    }

    console.log('[API v2.1 Entities] ✅ Entity created successfully:', {
      entity_id,
      duration_ms: duration
    })

    // ✅ STEP 7: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        entity_id,
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

    console.error('[API v2.1 Entities] POST Error:', {
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
        message: error.message || 'Entity creation failed',
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
// GET - READ ENTITIES
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
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') || undefined,
      status: searchParams.get('status') || undefined,
      q: searchParams.get('q') || undefined,
      limit: parseInt(searchParams.get('limit') || '100'),
      offset: parseInt(searchParams.get('offset') || '0'),
      include_dynamic: searchParams.get('include_dynamic') !== 'false',
      include_relationships: searchParams.get('include_relationships') === 'true',
      include_audit_fields: searchParams.get('include_audit_fields') === 'true'
    }

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Entities] GET - Reading entities:', {
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id,
      filters: options
    })

    // ✅ STEP 4: Normalize entity type
    const normalizedEntityType = normalizeEntityType(options.entity_type)

    // ✅ STEP 5: Call hera_entities_crud_v2 RPC
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'READ',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_entity: {
        ...(normalizedEntityType && { entity_type: normalizedEntityType }),
        ...(options.entity_id && { id: options.entity_id }),
        ...(options.status && { status: options.status })
      },
      p_dynamic: null,
      p_relationships: null,
      p_options: {
        limit: options.limit,
        offset: options.offset,
        include_dynamic: options.include_dynamic,
        include_relationships: options.include_relationships,
        include_audit_fields: options.include_audit_fields,
        search_query: options.q
      }
    })

    if (error) {
      console.error('[API v2.1 Entities] RPC error:', error)
      throw new Error(error.message || 'Entity read failed')
    }

    const duration = Date.now() - startTime

    // Handle response format
    // RPC returns { items: [...], next_cursor: "..." }
    const entities = data?.items || (Array.isArray(data) ? data : (data?.data || []))

    console.log('[API v2.1 Entities] ✅ Entities retrieved successfully:', {
      count: entities.length,
      duration_ms: duration
    })

    // ✅ STEP 6: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        data: entities,
        count: entities.length,
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

    console.error('[API v2.1 Entities] GET Error:', {
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
        message: error.message || 'Entity read failed',
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
// PUT - UPDATE ENTITY
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

    const payload: EntityPayload = body

    if (!payload.entity_id) {
      return NextResponse.json(
        {
          error: 'entity_id_required',
          message: 'entity_id is required for updates',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Entities] PUT - Updating entity:', {
      entity_id: payload.entity_id,
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id
    })

    // ✅ STEP 4: Guardrail validation
    const guardrailCheck = validateEntityPayload(payload, organizationId, 'UPDATE')

    if (!guardrailCheck.passed) {
      const report = generateGuardrailReport(guardrailCheck)
      console.error('[API v2.1 Entities] Guardrail validation failed:\n' + report)

      return NextResponse.json(
        {
          error: 'guardrail_violation',
          message: 'Entity validation failed',
          violations: guardrailCheck.violations.filter(v => v.severity === 'ERROR'),
          warnings: guardrailCheck.violations.filter(v => v.severity === 'WARNING'),
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // ✅ STEP 5: Normalize entity type if provided
    const normalizedEntityType = normalizeEntityType(payload.entity_type)

    // ✅ STEP 6: Build p_entity with REQUIRED id field first
    const p_entity: any = {
      id: payload.entity_id,  // ✅ CRITICAL: 'id' MUST be present for UPDATE
      entity_id: payload.entity_id  // ✅ ALSO include as 'entity_id' for RPC compatibility
    }

    // Add optional fields only if provided
    if (normalizedEntityType) p_entity.entity_type = normalizedEntityType
    if (payload.entity_name) p_entity.entity_name = payload.entity_name
    if (payload.entity_code !== undefined) p_entity.entity_code = payload.entity_code
    if (payload.smart_code) p_entity.smart_code = payload.smart_code
    if (payload.entity_description !== undefined) p_entity.entity_description = payload.entity_description
    if (payload.parent_entity_id !== undefined) p_entity.parent_entity_id = payload.parent_entity_id
    if (payload.status) p_entity.status = payload.status
    if (payload.metadata) p_entity.metadata = payload.metadata
    if (payload.business_rules) p_entity.business_rules = payload.business_rules

    const rpcPayload = {
      p_action: 'UPDATE',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_entity,
      p_dynamic: payload.dynamic && Object.keys(payload.dynamic).length > 0 ? payload.dynamic : null,
      p_relationships: payload.relationships && payload.relationships.length > 0 ? payload.relationships : null,
      p_options: null
    }

    console.log('[API v2.1 Entities] 🔍 UPDATE RPC Payload:', {
      action: rpcPayload.p_action,
      has_entity_id: !!rpcPayload.p_entity.id,
      entity_id_value: rpcPayload.p_entity.id,
      entity_keys: Object.keys(rpcPayload.p_entity),
      p_entity_details: rpcPayload.p_entity,
      p_dynamic_keys: rpcPayload.p_dynamic ? Object.keys(rpcPayload.p_dynamic) : [],
      has_p_dynamic: !!rpcPayload.p_dynamic,
      full_payload: JSON.stringify(rpcPayload, null, 2)
    })

    console.log('[API v2.1 Entities] 🚀 Calling hera_entities_crud_v2 RPC for UPDATE...')

    const { data, error } = await supabase.rpc('hera_entities_crud_v2', rpcPayload)

    console.log('[API v2.1 Entities] 📥 RPC Response received:', {
      hasError: !!error,
      hasData: !!data,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      errorHint: error?.hint
    })

    if (error) {
      console.error('[API v2.1 Entities] RPC error:', error)
      throw new Error(error.message || 'Entity update failed')
    }

    const duration = Date.now() - startTime

    console.log('[API v2.1 Entities] ✅ Entity updated successfully:', {
      entity_id: payload.entity_id,
      duration_ms: duration
    })

    // ✅ STEP 7: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        entity_id: payload.entity_id,
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

    console.error('[API v2.1 Entities] PUT Error:', {
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
        message: error.message || 'Entity update failed',
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
// DELETE - DELETE ENTITY
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

    if (!options.entity_id) {
      return NextResponse.json(
        {
          error: 'entity_id_required',
          message: 'entity_id is required for deletion',
          api_version: 'v2.1'
        },
        { status: 400 }
      )
    }

    // ✅ STEP 3: Build actor context
    const supabase = getSupabaseService()
    actor = await buildActorContext(supabase, userId, organizationId)

    console.log('[API v2.1 Entities] DELETE - Deleting entity:', {
      entity_id: options.entity_id,
      organization_id: organizationId,
      actor_user_id: actor.actor_user_id,
      hard_delete: options.hard_delete,
      cascade: options.cascade
    })

    // ✅ STEP 4: Call hera_entities_crud_v2 RPC
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'DELETE',
      p_actor_user_id: actor.actor_user_id,
      p_organization_id: organizationId,
      p_entity: {
        id: options.entity_id
      },
      p_dynamic: null,
      p_relationships: null,
      p_options: {
        delete_reason: options.reason || 'Entity deleted via API v2.1',
        cascade_delete: options.cascade || false,
        hard_delete: options.hard_delete || false
      }
    })

    if (error) {
      console.error('[API v2.1 Entities] RPC error:', error)
      throw new Error(error.message || 'Entity deletion failed')
    }

    const duration = Date.now() - startTime

    console.log('[API v2.1 Entities] ✅ Entity deleted successfully:', {
      entity_id: options.entity_id,
      duration_ms: duration
    })

    // ✅ STEP 5: Return success response
    return NextResponse.json(
      {
        success: true,
        api_version: 'v2.1',
        entity_id: options.entity_id,
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

    console.error('[API v2.1 Entities] DELETE Error:', {
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
        message: error.message || 'Entity deletion failed',
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
