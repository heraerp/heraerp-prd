/**
 * Production API Handler Generator
 * Smart Code: HERA.LIB.MVP_GENERATOR.API_HANDLER.v1
 * 
 * Generates production-ready API command handlers with:
 * - JWT validation
 * - Actor resolution
 * - Organization context validation
 * - Guardrails enforcement
 * - RPC routing to hera_entities_crud_v1 and hera_txn_crud_v1
 */

export function generateProductionAPIHandler(): string {
  return `import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { resolveUserIdentity } from '@/lib/hera/identity'
import { resolveOrgContext } from '@/lib/hera/org-resolver'
import { applyGuardrails } from '@/lib/hera/guardrails'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CommandRequest {
  command: string
  payload: any
}

interface APIResponse {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
  }
  actor_user_id?: string
  organization_id?: string
  request_id?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const requestId = generateRequestId()
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'method_not_allowed',
          message: 'Only POST requests are allowed'
        },
        request_id: requestId
      })
    }

    // 1. Validate JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'unauthorized',
          message: 'Missing authorization token'
        },
        request_id: requestId
      })
    }

    // 2. Resolve actor identity (JWT → USER entity)
    const actor = await resolveUserIdentity(token)
    if (!actor) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'invalid_token',
          message: 'Invalid or expired token'
        },
        request_id: requestId
      })
    }

    // 3. Resolve organization context (header > JWT claim > memberships[0])
    const orgId = await resolveOrgContext(req, actor)
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'no_organization_context',
          message: 'Organization context is required'
        },
        request_id: requestId
      })
    }

    // 4. Validate actor membership in organization
    const isMember = actor.memberships?.some(m => m.organization_id === orgId)
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'actor_not_member',
          message: 'Actor is not a member of the specified organization'
        },
        request_id: requestId
      })
    }

    // 5. Parse and validate request payload
    const { command, payload }: CommandRequest = req.body
    if (!command || !payload) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'invalid_payload',
          message: 'Command and payload are required'
        },
        request_id: requestId
      })
    }

    // 6. Apply HERA guardrails (Smart Code validation, GL balance, etc.)
    await applyGuardrails(command, payload, orgId, actor)

    // 7. Route command to appropriate RPC function
    const result = await routeCommand(command, payload, actor.id, orgId, requestId)

    // 8. Success response
    res.status(200).json({
      success: true,
      data: result,
      actor_user_id: actor.id,
      organization_id: orgId,
      request_id: requestId
    })

  } catch (error: any) {
    console.error(\`[API Error] Request \${requestId}:\`, error)
    
    // Map known error types to appropriate HTTP status codes
    const statusCode = getErrorStatusCode(error)
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'internal_error',
        message: error.message || 'An unexpected error occurred'
      },
      request_id: requestId
    })
  }
}

/**
 * Route commands to appropriate RPC functions
 */
async function routeCommand(
  command: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string
): Promise<any> {
  switch (command) {
    // Entity operations → hera_entities_crud_v1
    case 'entity.create':
    case 'entity.read':
    case 'entity.update':
    case 'entity.delete':
      return await handleEntityCommand(command, payload, actorId, orgId, requestId)

    // Transaction operations → hera_txn_crud_v1
    case 'transaction.create':
    case 'transaction.read':
    case 'transaction.update':
    case 'transaction.delete':
    case 'transaction.post':
      return await handleTransactionCommand(command, payload, actorId, orgId, requestId)

    // Dynamic data operations
    case 'dynamic.set':
    case 'dynamic.get':
    case 'dynamic.delete':
      return await handleDynamicDataCommand(command, payload, actorId, orgId, requestId)

    // Relationship operations
    case 'relationship.create':
    case 'relationship.delete':
      return await handleRelationshipCommand(command, payload, actorId, orgId, requestId)

    default:
      throw {
        code: 'unknown_command',
        message: \`Unknown command: \${command}\`,
        statusCode: 400
      }
  }
}

/**
 * Handle entity commands via hera_entities_crud_v1
 */
async function handleEntityCommand(
  command: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string
): Promise<any> {
  const action = command.split('.')[1].toUpperCase() // create → CREATE

  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: action,
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_entity: payload.entity || payload,
    p_dynamic: payload.dynamic_fields || [],
    p_relationships: payload.relationships || [],
    p_options: payload.options || {}
  })

  if (error) {
    throw {
      code: 'entity_operation_failed',
      message: \`Entity \${action} failed: \${error.message}\`,
      statusCode: 400,
      details: error
    }
  }

  return data
}

/**
 * Handle transaction commands via hera_txn_crud_v1
 */
async function handleTransactionCommand(
  command: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string
): Promise<any> {
  const action = command.split('.')[1].toUpperCase() // create → CREATE

  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: action,
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_transaction: payload.transaction || payload,
    p_lines: payload.lines || [],
    p_options: payload.options || {}
  })

  if (error) {
    throw {
      code: 'transaction_operation_failed',
      message: \`Transaction \${action} failed: \${error.message}\`,
      statusCode: 400,
      details: error
    }
  }

  return data
}

/**
 * Handle dynamic data commands
 */
async function handleDynamicDataCommand(
  command: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string
): Promise<any> {
  // Use hera_entities_crud_v1 with dynamic data focus
  const action = command === 'dynamic.set' ? 'UPDATE' : 
                command === 'dynamic.get' ? 'READ' : 'DELETE'

  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: action,
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_entity: { id: payload.entity_id },
    p_dynamic: payload.fields || [],
    p_relationships: [],
    p_options: { focus: 'dynamic_data' }
  })

  if (error) {
    throw {
      code: 'dynamic_data_operation_failed',
      message: \`Dynamic data operation failed: \${error.message}\`,
      statusCode: 400,
      details: error
    }
  }

  return data
}

/**
 * Handle relationship commands
 */
async function handleRelationshipCommand(
  command: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string
): Promise<any> {
  // Use hera_entities_crud_v1 with relationship focus
  const action = command === 'relationship.create' ? 'CREATE' : 'DELETE'

  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: action,
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_entity: { id: payload.source_entity_id },
    p_dynamic: [],
    p_relationships: [payload.relationship],
    p_options: { focus: 'relationships' }
  })

  if (error) {
    throw {
      code: 'relationship_operation_failed',
      message: \`Relationship operation failed: \${error.message}\`,
      statusCode: 400,
      details: error
    }
  }

  return data
}

/**
 * Map error types to HTTP status codes
 */
function getErrorStatusCode(error: any): number {
  if (error.statusCode) return error.statusCode
  
  switch (error.code) {
    case 'unauthorized':
    case 'invalid_token':
      return 401
    case 'actor_not_member':
    case 'forbidden':
      return 403
    case 'no_organization_context':
    case 'invalid_payload':
    case 'unknown_command':
    case 'guardrail_violation':
      return 400
    case 'duplicate_request':
      return 409
    case 'rate_limit_exceeded':
      return 429
    default:
      return 500
  }
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
}

/**
 * Example usage patterns for generated API:
 * 
 * // Create entity
 * POST /api/v2/command
 * {
 *   "command": "entity.create",
 *   "payload": {
 *     "entity": {
 *       "entity_type": "CUSTOMER",
 *       "entity_name": "Acme Corp",
 *       "smart_code": "HERA.ENTERPRISE.CUSTOMER.v1"
 *     },
 *     "dynamic_fields": [
 *       {
 *         "field_name": "email",
 *         "field_value_text": "contact@acme.com",
 *         "field_type": "text",
 *         "smart_code": "HERA.ENTERPRISE.CUSTOMER.FIELD.EMAIL.v1"
 *       }
 *     ]
 *   }
 * }
 * 
 * // Create transaction
 * POST /api/v2/command
 * {
 *   "command": "transaction.create",
 *   "payload": {
 *     "transaction": {
 *       "transaction_type": "sale",
 *       "smart_code": "HERA.FINANCE.TXN.SALE.v1",
 *       "source_entity_id": "customer-uuid",
 *       "total_amount": 1000.00
 *     },
 *     "lines": [
 *       {
 *         "line_number": 1,
 *         "line_type": "PRODUCT",
 *         "entity_id": "product-uuid",
 *         "quantity": 2,
 *         "unit_amount": 500.00,
 *         "line_amount": 1000.00
 *       }
 *     ]
 *   }
 * }
 */`
}

export function generateIdentityResolver(): string {
  return `/**
 * User Identity Resolution
 * Smart Code: HERA.LIB.IDENTITY.RESOLVER.v1
 * 
 * Resolves JWT tokens to USER entities with organization memberships
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ResolvedActor {
  id: string // USER entity ID
  auth_uid: string // Supabase auth UID
  email: string
  memberships: OrganizationMembership[]
  cache_hit?: boolean
}

export interface OrganizationMembership {
  organization_id: string
  organization_name: string
  role: string
  status: 'active' | 'inactive'
  joined_date: string
}

// Simple in-memory cache (5-minute TTL)
const identityCache = new Map<string, { actor: ResolvedActor; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Resolve JWT token to actor identity with caching
 */
export async function resolveUserIdentity(token: string): Promise<ResolvedActor | null> {
  try {
    // 1. Verify JWT and get Supabase user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.warn('JWT verification failed:', authError?.message)
      return null
    }

    // 2. Check cache first
    const cached = identityCache.get(user.id)
    if (cached && cached.expires > Date.now()) {
      return { ...cached.actor, cache_hit: true }
    }

    // 3. Query USER entity by auth_uid
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
      .eq('metadata->auth_uid', user.id)
      .single()

    if (userError || !userEntity) {
      console.warn('USER entity not found for auth UID:', user.id)
      return null
    }

    // 4. Query organization memberships via relationships
    const { data: memberships, error: membershipError } = await supabase
      .from('core_relationships')
      .select(\`
        target_entity_id,
        relationship_data,
        target_entity:core_entities!target_entity_id(entity_name)
      \`)
      .eq('source_entity_id', userEntity.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('status', 'active')

    if (membershipError) {
      console.warn('Failed to query memberships:', membershipError.message)
      return null
    }

    // 5. Build resolved actor
    const resolvedActor: ResolvedActor = {
      id: userEntity.id,
      auth_uid: user.id,
      email: user.email!,
      memberships: (memberships || []).map(m => ({
        organization_id: m.target_entity_id,
        organization_name: m.target_entity?.entity_name || 'Unknown',
        role: m.relationship_data?.role || 'member',
        status: 'active' as const,
        joined_date: m.relationship_data?.joined_date || new Date().toISOString()
      }))
    }

    // 6. Cache for 5 minutes
    identityCache.set(user.id, {
      actor: resolvedActor,
      expires: Date.now() + CACHE_TTL
    })

    return resolvedActor

  } catch (error) {
    console.error('Identity resolution failed:', error)
    return null
  }
}

/**
 * Clear identity cache for user (useful for logout/role changes)
 */
export function clearIdentityCache(authUid: string): void {
  identityCache.delete(authUid)
}

/**
 * Get cache stats for monitoring
 */
export function getIdentityCacheStats(): { size: number; entries: string[] } {
  return {
    size: identityCache.size,
    entries: Array.from(identityCache.keys())
  }
}`
}

export function generateOrgResolver(): string {
  return `/**
 * Organization Context Resolution
 * Smart Code: HERA.LIB.ORG.RESOLVER.v1
 * 
 * Resolves organization context from request headers, JWT claims, or memberships
 */

import { NextApiRequest } from 'next'
import { ResolvedActor } from './identity'

/**
 * Resolve organization context with priority order:
 * 1. X-Organization-Id header (explicit request)
 * 2. JWT organization_id claim (token metadata)
 * 3. memberships[0] (first resolved membership)
 */
export async function resolveOrgContext(
  req: NextApiRequest,
  actor: ResolvedActor
): Promise<string | null> {
  // Priority 1: Explicit header
  const headerOrgId = req.headers['x-organization-id'] as string
  if (headerOrgId && isValidUUID(headerOrgId)) {
    // Verify actor has access to this organization
    const hasMembership = actor.memberships.some(m => m.organization_id === headerOrgId)
    if (hasMembership) {
      return headerOrgId
    }
    console.warn(\`Actor \${actor.id} requested org \${headerOrgId} but has no membership\`)
  }

  // Priority 2: JWT claim (would need to decode JWT for this)
  // For now, skip this as it requires additional JWT parsing

  // Priority 3: First active membership
  const activeMembership = actor.memberships.find(m => m.status === 'active')
  if (activeMembership) {
    return activeMembership.organization_id
  }

  // No organization context available
  return null
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Get organization context from subdomain (for middleware)
 */
export async function resolveOrgFromSubdomain(subdomain: string): Promise<string | null> {
  // This would query core_organizations to map subdomain to org_id
  // For MVP, return null to force header-based resolution
  return null
}`
}

export function generateGuardrails(): string {
  return `/**
 * HERA Guardrails System
 * Smart Code: HERA.LIB.GUARDRAILS.VALIDATOR.v1
 * 
 * Enforces HERA DNA compliance:
 * - Smart Code validation
 * - GL balance enforcement
 * - Organization filtering
 * - Actor stamping
 */

import { ResolvedActor } from './identity'

export interface GuardrailViolation {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning'
}

/**
 * Apply all HERA guardrails to command payload
 */
export async function applyGuardrails(
  command: string,
  payload: any,
  orgId: string,
  actor: ResolvedActor
): Promise<void> {
  const violations: GuardrailViolation[] = []

  // 1. Validate Smart Codes
  violations.push(...validateSmartCodes(payload))

  // 2. Enforce organization filtering
  violations.push(...enforceOrganizationFiltering(payload, orgId))

  // 3. Validate GL balance (for GL transactions)
  if (command.includes('transaction') && hasGLLines(payload)) {
    violations.push(...validateGLBalance(payload))
  }

  // 4. Validate actor permissions
  violations.push(...validateActorPermissions(command, payload, actor))

  // Throw if any errors found
  const errors = violations.filter(v => v.severity === 'error')
  if (errors.length > 0) {
    throw {
      code: 'guardrail_violation',
      message: \`Guardrail violations: \${errors.map(e => e.message).join(', ')}\`,
      violations: errors,
      statusCode: 400
    }
  }

  // Log warnings
  const warnings = violations.filter(v => v.severity === 'warning')
  if (warnings.length > 0) {
    console.warn('Guardrail warnings:', warnings)
  }
}

/**
 * Validate Smart Code patterns
 */
function validateSmartCodes(payload: any): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []
  const smartCodeRegex = /^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$/

  // Check entity smart codes
  if (payload.entity?.smart_code) {
    if (!smartCodeRegex.test(payload.entity.smart_code)) {
      violations.push({
        code: 'invalid_entity_smart_code',
        message: \`Invalid entity smart code: \${payload.entity.smart_code}\`,
        field: 'entity.smart_code',
        severity: 'error'
      })
    }
  }

  // Check transaction smart codes
  if (payload.transaction?.smart_code) {
    if (!smartCodeRegex.test(payload.transaction.smart_code)) {
      violations.push({
        code: 'invalid_transaction_smart_code',
        message: \`Invalid transaction smart code: \${payload.transaction.smart_code}\`,
        field: 'transaction.smart_code',
        severity: 'error'
      })
    }
  }

  // Check dynamic field smart codes
  if (payload.dynamic_fields) {
    payload.dynamic_fields.forEach((field: any, index: number) => {
      if (field.smart_code && !smartCodeRegex.test(field.smart_code)) {
        violations.push({
          code: 'invalid_field_smart_code',
          message: \`Invalid field smart code: \${field.smart_code}\`,
          field: \`dynamic_fields[\${index}].smart_code\`,
          severity: 'error'
        })
      }
    })
  }

  return violations
}

/**
 * Enforce organization filtering
 */
function enforceOrganizationFiltering(payload: any, orgId: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []

  // All payloads must include matching organization_id
  if (payload.entity && !payload.entity.organization_id) {
    violations.push({
      code: 'missing_organization_id',
      message: 'Entity must include organization_id',
      field: 'entity.organization_id',
      severity: 'error'
    })
  } else if (payload.entity?.organization_id && payload.entity.organization_id !== orgId) {
    violations.push({
      code: 'organization_mismatch',
      message: \`Entity organization_id (\${payload.entity.organization_id}) does not match context (\${orgId})\`,
      field: 'entity.organization_id',
      severity: 'error'
    })
  }

  if (payload.transaction && !payload.transaction.organization_id) {
    violations.push({
      code: 'missing_organization_id',
      message: 'Transaction must include organization_id',
      field: 'transaction.organization_id',
      severity: 'error'
    })
  } else if (payload.transaction?.organization_id && payload.transaction.organization_id !== orgId) {
    violations.push({
      code: 'organization_mismatch',
      message: \`Transaction organization_id (\${payload.transaction.organization_id}) does not match context (\${orgId})\`,
      field: 'transaction.organization_id',
      severity: 'error'
    })
  }

  return violations
}

/**
 * Check if transaction has GL lines
 */
function hasGLLines(payload: any): boolean {
  return payload.lines?.some((line: any) => 
    line.line_type === 'GL' || 
    line.smart_code?.includes('.GL.')
  ) || false
}

/**
 * Validate GL balance (DR = CR per currency)
 */
function validateGLBalance(payload: any): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []

  if (!payload.lines || !Array.isArray(payload.lines)) {
    return violations
  }

  const glLines = payload.lines.filter((line: any) => 
    line.line_type === 'GL' || line.smart_code?.includes('.GL.')
  )

  if (glLines.length === 0) {
    return violations
  }

  // Group by currency and calculate DR/CR totals
  const currencyTotals = new Map<string, { dr: number; cr: number }>()

  glLines.forEach((line: any, index: number) => {
    const currency = line.currency || payload.transaction?.currency || 'USD'
    const amount = parseFloat(line.line_amount || line.amount || 0)
    const side = line.side?.toUpperCase()

    if (!side || !['DR', 'CR'].includes(side)) {
      violations.push({
        code: 'missing_gl_side',
        message: \`GL line must specify side as DR or CR\`,
        field: \`lines[\${index}].side\`,
        severity: 'error'
      })
      return
    }

    if (!currencyTotals.has(currency)) {
      currencyTotals.set(currency, { dr: 0, cr: 0 })
    }

    const totals = currencyTotals.get(currency)!
    if (side === 'DR') {
      totals.dr += amount
    } else {
      totals.cr += amount
    }
  })

  // Validate balance for each currency
  currencyTotals.forEach((totals, currency) => {
    const difference = Math.abs(totals.dr - totals.cr)
    if (difference > 0.01) { // Allow for rounding differences
      violations.push({
        code: 'gl_imbalance',
        message: \`GL transaction not balanced for \${currency}: DR \${totals.dr.toFixed(2)} ≠ CR \${totals.cr.toFixed(2)}\`,
        severity: 'error'
      })
    }
  })

  return violations
}

/**
 * Validate actor permissions (basic implementation)
 */
function validateActorPermissions(
  command: string,
  payload: any,
  actor: ResolvedActor
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = []

  // For MVP, just ensure actor has membership
  if (!actor.memberships || actor.memberships.length === 0) {
    violations.push({
      code: 'no_organization_membership',
      message: 'Actor has no organization memberships',
      severity: 'error'
    })
  }

  // Future: Add role-based permissions here
  // if (command === 'entity.delete' && !hasRole(actor, 'admin')) { ... }

  return violations
}
}`

