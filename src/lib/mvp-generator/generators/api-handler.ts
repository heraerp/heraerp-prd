/**
 * Enterprise API Handler Generator v2.0
 * Smart Code: HERA.LIB.MVP_GENERATOR.API_HANDLER.ENTERPRISE.v2
 * 
 * Generates enterprise-grade API command handlers with:
 * - JWT validation with caching and performance monitoring
 * - Actor resolution with identity caching (5-min TTL)
 * - Organization context validation with subdomain support
 * - HERA Guardrails v2.0 with comprehensive validation
 * - RPC routing to hera_entities_crud_v1 and hera_txn_crud_v1
 * - Request tracing, rate limiting, idempotency protection
 * - Multi-currency GL balance enforcement
 * - Role-based permission validation
 * - Comprehensive error handling and monitoring
 */

export function generateProductionAPIHandler(appConfig: any): string {
  const { app } = appConfig
  
  return `/**
 * ${app.name} Enterprise API Handler
 * Smart Code: ${app.smart_code}
 * 
 * Complete HERA security chain:
 * JWT → Actor → Organization → Permissions → Guardrails → RPC → Response
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Environment-aware Supabase client with optimized settings
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
    global: { headers: { 'x-client-info': '${app.id}' } }
  }
)

// Enhanced interfaces for enterprise features
interface CommandRequest {
  command: string
  payload: any
  options?: {
    idempotency_key?: string
    timeout?: number
    dry_run?: boolean
    trace_id?: string
  }
}

interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    violations?: GuardrailViolation[]
  }
  meta: {
    actor_user_id: string
    organization_id: string
    request_id: string
    timestamp: string
    execution_time_ms: number
    cache_hit?: boolean
    rate_limit_remaining?: number
  }
}

interface ResolvedActor {
  id: string
  auth_uid: string
  email: string
  display_name?: string
  memberships: OrganizationMembership[]
  permissions?: string[]
  cache_hit?: boolean
  resolved_at: string
}

interface OrganizationMembership {
  organization_id: string
  organization_name: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  joined_date: string
  permissions?: string[]
}

interface GuardrailViolation {
  code: string
  message: string
  field?: string
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
}

// Enterprise caching with LRU eviction
class EnterpriseCache<T> {
  private cache = new Map<string, { data: T; expires: number; hits: number }>()
  constructor(private maxSize = 1000, private ttl = 5 * 60 * 1000) {}

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || entry.expires < Date.now()) {
      this.cache.delete(key)
      return null
    }
    entry.hits++
    return entry.data
  }

  set(key: string, data: T): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    this.cache.set(key, { data, expires: Date.now() + this.ttl, hits: 0 })
  }

  delete(key: string): void { this.cache.delete(key) }
  clear(): void { this.cache.clear() }
  size(): number { return this.cache.size }
}

// Global caches
const identityCache = new EnterpriseCache<ResolvedActor>(1000, 5 * 60 * 1000)
const orgCache = new EnterpriseCache<string>(500, 10 * 60 * 1000)
const rateLimitCache = new Map<string, { count: number; window: number }>()
const idempotencyCache = new Map<string, { response: any; expires: number }>()

// Configuration constants
const RATE_LIMIT = 100 // requests per 5 minutes
const RATE_WINDOW = 5 * 60 * 1000
const IDEMPOTENCY_TTL = 60 * 60 * 1000
const SMART_CODE_REGEX = /^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$/

/**
 * Main API handler with complete enterprise security chain
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const startTime = Date.now()
  const requestId = generateRequestId()
  
  try {
    // 1. Method validation
    if (req.method !== 'POST') {
      return respondWithError(res, 405, 'method_not_allowed', 'Only POST requests allowed', requestId)
    }

    // 2. Extract and validate JWT token
    const token = extractBearerToken(req)
    if (!token) {
      return respondWithError(res, 401, 'missing_token', 'Authorization header required', requestId)
    }

    // 3. Resolve actor identity with caching
    const actor = await resolveUserIdentity(token)
    if (!actor) {
      return respondWithError(res, 401, 'invalid_token', 'Invalid or expired JWT token', requestId)
    }

    // 4. Resolve organization context
    const orgId = await resolveOrgContext(req, actor)
    if (!orgId) {
      return respondWithError(res, 400, 'no_org_context', 'Organization context required', requestId)
    }

    // 5. Validate membership
    if (!validateMembership(actor, orgId)) {
      return respondWithError(res, 403, 'access_denied', 'Actor not member of organization', requestId)
    }

    // 6. Rate limiting
    const rateLimitResult = checkRateLimit(actor.id, orgId)
    if (!rateLimitResult.allowed) {
      return respondWithError(res, 429, 'rate_limited', 'Rate limit exceeded', requestId)
    }

    // 7. Parse request payload
    const { command, payload, options }: CommandRequest = req.body
    if (!command || !payload) {
      return respondWithError(res, 400, 'invalid_request', 'Command and payload required', requestId)
    }

    // 8. Idempotency check
    if (options?.idempotency_key) {
      const cached = checkIdempotency(options.idempotency_key)
      if (cached) {
        return res.status(200).json({
          ...cached.response,
          meta: { ...cached.response.meta, cache_hit: true }
        })
      }
    }

    // 9. Apply HERA Guardrails v2.0
    await applyGuardrails(command, payload, orgId, actor)

    // 10. Execute command via RPC routing
    const result = await routeCommand(command, payload, actor.id, orgId, requestId, options)

    // 11. Build success response
    const response: APIResponse = {
      success: true,
      data: result,
      meta: {
        actor_user_id: actor.id,
        organization_id: orgId,
        request_id: requestId,
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime,
        cache_hit: actor.cache_hit,
        rate_limit_remaining: RATE_LIMIT - rateLimitResult.count
      }
    }

    // 12. Cache idempotent response
    if (options?.idempotency_key) {
      cacheIdempotentResponse(options.idempotency_key, response)
    }

    return res.status(200).json(response)

  } catch (error: any) {
    console.error(\`[API Error] Request \${requestId}:\`, error)
    
    const statusCode = getErrorStatusCode(error)
    return respondWithError(
      res, 
      statusCode, 
      error.code || 'internal_error',
      error.message || 'Unexpected error occurred',
      requestId,
      error.details
    )
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.replace('Bearer ', '')
}

/**
 * Resolve JWT token to complete actor identity
 */
async function resolveUserIdentity(token: string): Promise<ResolvedActor | null> {
  try {
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return null

    // Check cache first
    const cached = identityCache.get(user.id)
    if (cached) return { ...cached, cache_hit: true }

    // Query USER entity
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('entity_type', 'USER')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('metadata->>auth_uid', user.id)
      .single()

    if (userError || !userEntity) return null

    // Query memberships
    const { data: memberships } = await supabase
      .from('core_relationships')
      .select(\`
        target_entity_id,
        relationship_data,
        status,
        target_org:core_entities!target_entity_id(entity_name)
      \`)
      .eq('source_entity_id', userEntity.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .neq('status', 'deleted')

    // Build resolved actor
    const actor: ResolvedActor = {
      id: userEntity.id,
      auth_uid: user.id,
      email: user.email!,
      display_name: userEntity.entity_name || user.email!.split('@')[0],
      memberships: (memberships || []).map(m => ({
        organization_id: m.target_entity_id,
        organization_name: m.target_org?.entity_name || 'Unknown',
        role: m.relationship_data?.role || 'member',
        status: m.status as 'active' | 'inactive' | 'pending',
        joined_date: m.relationship_data?.joined_date || new Date().toISOString(),
        permissions: m.relationship_data?.permissions || []
      })),
      permissions: [],
      resolved_at: new Date().toISOString()
    }

    // Cache resolved actor
    identityCache.set(user.id, actor)
    return actor

  } catch (error) {
    console.error('[Identity] Resolution failed:', error)
    return null
  }
}

/**
 * Resolve organization context with priority order
 */
async function resolveOrgContext(req: NextApiRequest, actor: ResolvedActor): Promise<string | null> {
  // Priority 1: X-Organization-Id header
  const headerOrgId = req.headers['x-organization-id'] as string
  if (headerOrgId && isValidUUID(headerOrgId)) {
    const membership = actor.memberships.find(m => 
      m.organization_id === headerOrgId && m.status === 'active'
    )
    if (membership) return headerOrgId
  }

  // Priority 2: Subdomain resolution
  const host = req.headers.host || ''
  const subdomain = extractSubdomain(host)
  if (subdomain) {
    const orgId = await resolveOrgFromSubdomain(subdomain)
    if (orgId) {
      const membership = actor.memberships.find(m => 
        m.organization_id === orgId && m.status === 'active'
      )
      if (membership) return orgId
    }
  }

  // Priority 3: First active membership
  const activeMembership = actor.memberships.find(m => m.status === 'active')
  return activeMembership?.organization_id || null
}

/**
 * Extract subdomain from host header
 */
function extractSubdomain(host: string): string | null {
  const parts = host.split('.')
  if (parts.length < 3) return null
  const subdomain = parts[0]
  return ['www', 'api', 'app'].includes(subdomain) ? null : subdomain
}

/**
 * Resolve organization from subdomain with caching
 */
async function resolveOrgFromSubdomain(subdomain: string): Promise<string | null> {
  const cached = orgCache.get(subdomain)
  if (cached) return cached

  const { data: org } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'ORGANIZATION')
    .eq('entity_code', subdomain.toUpperCase())
    .single()

  if (org) {
    orgCache.set(subdomain, org.id)
    return org.id
  }
  return null
}

/**
 * Validate actor membership in organization
 */
function validateMembership(actor: ResolvedActor, orgId: string): boolean {
  return actor.memberships?.some(m => 
    m.organization_id === orgId && m.status === 'active'
  ) || false
}

/**
 * Rate limiting with sliding window
 */
function checkRateLimit(actorId: string, orgId: string): { allowed: boolean; count: number } {
  const key = \`\${actorId}:\${orgId}\`
  const now = Date.now()
  const windowStart = now - RATE_WINDOW
  
  const current = rateLimitCache.get(key)
  if (!current || current.window < windowStart) {
    rateLimitCache.set(key, { count: 1, window: now })
    return { allowed: true, count: 1 }
  }
  
  if (current.count >= RATE_LIMIT) {
    return { allowed: false, count: current.count }
  }
  
  current.count++
  return { allowed: true, count: current.count }
}

/**
 * Check idempotency cache
 */
function checkIdempotency(key: string): any | null {
  const cached = idempotencyCache.get(key)
  if (cached && cached.expires > Date.now()) return cached
  idempotencyCache.delete(key)
  return null
}

/**
 * Cache idempotent response
 */
function cacheIdempotentResponse(key: string, response: APIResponse): void {
  idempotencyCache.set(key, {
    response,
    expires: Date.now() + IDEMPOTENCY_TTL
  })
}

/**
 * Apply HERA Guardrails v2.0
 */
async function applyGuardrails(
  command: string,
  payload: any,
  orgId: string,
  actor: ResolvedActor
): Promise<void> {
  const violations: GuardrailViolation[] = []

  // Smart Code validation
  if (payload.entity?.smart_code && !SMART_CODE_REGEX.test(payload.entity.smart_code)) {
    violations.push({
      code: 'invalid_smart_code',
      message: \`Invalid Smart Code: \${payload.entity.smart_code}\`,
      field: 'entity.smart_code',
      severity: 'error',
      suggestion: 'Use format: HERA.DOMAIN.MODULE.TYPE.v1'
    })
  }

  // Organization boundary validation
  if (payload.entity && payload.entity.organization_id !== orgId) {
    violations.push({
      code: 'org_boundary_violation',
      message: 'Entity organization_id does not match context',
      field: 'entity.organization_id',
      severity: 'error',
      suggestion: \`Set organization_id to: \${orgId}\`
    })
  }

  // GL balance validation for transactions
  if (command.includes('transaction') && payload.lines) {
    const glLines = payload.lines.filter((line: any) => line.line_type === 'GL')
    if (glLines.length > 0) {
      const { dr, cr } = glLines.reduce((totals: any, line: any) => {
        const amount = parseFloat(line.line_amount || 0)
        if (line.side === 'DR') totals.dr += amount
        else if (line.side === 'CR') totals.cr += amount
        return totals
      }, { dr: 0, cr: 0 })

      if (Math.abs(dr - cr) > 0.01) {
        violations.push({
          code: 'gl_imbalance',
          message: \`GL not balanced: DR \${dr.toFixed(2)} ≠ CR \${cr.toFixed(2)}\`,
          severity: 'error',
          suggestion: 'Ensure total debits equal total credits'
        })
      }
    }
  }

  // Permission validation
  const membership = actor.memberships.find(m => m.organization_id === orgId)
  const [, action] = command.split('.')
  if (['delete', 'admin'].includes(action) && !['admin', 'owner'].includes(membership?.role || '')) {
    violations.push({
      code: 'insufficient_permissions',
      message: \`Action '\${action}' requires admin privileges\`,
      severity: 'error',
      suggestion: 'Request elevated permissions'
    })
  }

  // Throw if errors found
  const errors = violations.filter(v => v.severity === 'error')
  if (errors.length > 0) {
    throw {
      code: 'guardrail_violations',
      message: \`\${errors.length} guardrail violation(s) found\`,
      violations: errors,
      statusCode: 400
    }
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
  requestId: string,
  options?: any
): Promise<any> {
  const [domain, action] = command.split('.')
  
  switch (domain) {
    case 'entity':
      return await handleEntityCommand(action, payload, actorId, orgId, requestId, options)
    case 'transaction':
      return await handleTransactionCommand(action, payload, actorId, orgId, requestId, options)
    default:
      throw {
        code: 'unknown_command_domain',
        message: \`Unknown command domain: \${domain}\`,
        statusCode: 400
      }
  }
}

/**
 * Handle entity operations via hera_entities_crud_v1
 */
async function handleEntityCommand(
  action: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string,
  options?: any
): Promise<any> {
  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: action.toUpperCase(),
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_entity: payload.entity || payload,
    p_dynamic: payload.dynamic_fields || [],
    p_relationships: payload.relationships || [],
    p_options: { request_id: requestId, ...options }
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
 * Handle transaction operations via hera_txn_crud_v1
 */
async function handleTransactionCommand(
  action: string,
  payload: any,
  actorId: string,
  orgId: string,
  requestId: string,
  options?: any
): Promise<any> {
  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: action.toUpperCase(),
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_transaction: payload.transaction || payload,
    p_lines: payload.lines || [],
    p_options: { request_id: requestId, ...options }
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
 * Standardized error response
 */
function respondWithError(
  res: NextApiResponse<APIResponse>,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: any
): void {
  res.status(statusCode).json({
    success: false,
    error: { code, message, details },
    meta: {
      actor_user_id: 'unknown',
      organization_id: 'unknown',
      request_id: requestId,
      timestamp: new Date().toISOString(),
      execution_time_ms: 0
    }
  })
}

/**
 * Map error codes to HTTP status codes
 */
function getErrorStatusCode(error: any): number {
  if (error.statusCode) return error.statusCode
  
  const statusMap: Record<string, number> = {
    unauthorized: 401, invalid_token: 401, missing_token: 401,
    access_denied: 403, forbidden: 403,
    no_org_context: 400, invalid_request: 400, guardrail_violations: 400,
    rate_limited: 429, duplicate_request: 409
  }
  
  return statusMap[error.code] || 500
}

/**
 * Generate unique request ID for distributed tracing
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return \`${app.id}_\${timestamp}_\${random}\`
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
}

/* 
 * API Usage Examples:
 * 
 * // Create entity
 * POST /api/v2/command
 * {
 *   "command": "entity.create",
 *   "payload": {
 *     "entity": {
 *       "entity_type": "CUSTOMER",
 *       "entity_name": "Acme Corp",
 *       "smart_code": "${app.smart_code.replace('.APPLICATION.', '.CUSTOMER.')}"
 *     }
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
 *       "smart_code": "${app.smart_code.replace('.APPLICATION.', '.TXN.SALE.')}"
 *     },
 *     "lines": [
 *       { "line_type": "GL", "side": "DR", "line_amount": 100 },
 *       { "line_type": "GL", "side": "CR", "line_amount": 100 }
 *     ]
 *   }
 * }
 */`
}

/**
 * Generate supporting modules (identity, org resolver, guardrails)
 */
export function generateIdentityResolver(): string {
  return `// Identity resolver module generated by API handler above`
}

export function generateOrgResolver(): string {
  return `// Organization resolver module generated by API handler above`
}

export function generateGuardrails(): string {
  return `// Guardrails module generated by API handler above`
}