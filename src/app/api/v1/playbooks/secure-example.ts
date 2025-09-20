/**
 * Example secure API implementation for Playbooks
 *
 * Demonstrates complete security stack:
 * - JWT authentication
 * - Organization isolation
 * - Permission checking
 * - Idempotency
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import {
  PermissionService,
  IdempotencyService,
  AuditService,
  ValidationSchemas,
  SecureQueryBuilder,
  SecurityContext,
  ForbiddenError,
  UnauthorizedError,
  createSecurityMiddleware
} from '@/lib/playbooks/security'
import type { PlaybookJWTClaims } from '@/lib/playbooks/security'

/**
 * Extract security context from request
 */
async function extractSecurityContext(req: NextRequest): Promise<SecurityContext> {
  // Get JWT token from header
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing authentication token')
  }

  const token = authHeader.substring(7)

  // Verify JWT and extract claims (using your JWT library)
  // This is a mock - replace with actual JWT verification
  const claims = (await verifyJWT(token)) as PlaybookJWTClaims

  if (!claims.organization_id) {
    throw new UnauthorizedError('Missing organization context')
  }

  return {
    userId: claims.sub,
    organizationId: claims.organization_id,
    permissions: claims.permissions || [],
    roles: claims.roles || [],
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined
  }
}

/**
 * Mock JWT verification - replace with actual implementation
 */
async function verifyJWT(token: string): Promise<PlaybookJWTClaims> {
  // In production, use proper JWT verification
  return {
    sub: 'user_123',
    organization_id: 'org_456',
    entity_id: 'entity_789',
    roles: ['admin'],
    permissions: ['playbook:create', 'playbook:read', 'playbook:publish'],
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 3600
  }
}

/**
 * POST /api/v1/playbooks - Create a new playbook with full security
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let securityContext: SecurityContext | null = null
  let auditService: AuditService | null = null
  let resourceId: string | null = null

  try {
    // 1. Extract security context
    securityContext = await extractSecurityContext(req)

    // 2. Initialize services with organization context
    const permissionService = new PermissionService(securityContext.organizationId)
    const idempotencyService = new IdempotencyService(securityContext.organizationId)
    auditService = new AuditService(securityContext.organizationId)

    // 3. Check permissions
    await permissionService.enforcePermissions(securityContext.userId, [
      PermissionService.PERMISSIONS.PLAYBOOK_CREATE
    ])

    // 4. Parse and validate request body
    const body = await req.json()
    const validated = ValidationSchemas.createPlaybook.parse(body)

    // 5. Verify organization context matches
    if (validated.organization_id !== securityContext.organizationId) {
      throw new ForbiddenError('Organization context mismatch')
    }

    // 6. Get idempotency key
    const idempotencyKey = req.headers.get('idempotency-key') || ''

    // 7. Process request with idempotency
    const result = await idempotencyService.processRequest(
      idempotencyKey,
      '/api/v1/playbooks',
      validated,
      async () => {
        // Set organization context for RLS
        universalApi.setOrganizationId(securityContext!.organizationId)

        // Create playbook entity
        const playbook = await universalApi.createEntity({
          entity_type: 'playbook_definition',
          entity_name: validated.name,
          entity_code: `PLAYBOOK-${validated.name}`,
          smart_code: `HERA.${validated.industry}.PLAYBOOK.DEF.${validated.name}.${validated.version}`,
          organization_id: validated.organization_id,
          metadata: {
            status: 'draft',
            version: validated.version,
            owner: securityContext!.userId,
            description: validated.description,
            created_at: new Date().toISOString()
          }
        })

        resourceId = playbook.id

        // Store extended properties
        await universalApi.setDynamicFields(playbook.id, {
          input_schema: JSON.stringify(validated.inputs),
          output_schema: JSON.stringify(validated.outputs),
          policies: JSON.stringify(validated.policies || {}),
          permissions_required: JSON.stringify(
            Array.from(new Set(validated.steps.flatMap(s => s.permissions_required || [])))
          )
        })

        // Create step entities
        for (const stepDef of validated.steps) {
          const step = await universalApi.createEntity({
            entity_type: 'playbook_step_definition',
            entity_name: stepDef.name,
            entity_code: `STEP-${validated.name}-${stepDef.name}`,
            smart_code: `HERA.${validated.industry}.PLAYBOOK.STEP.DEF.${validated.name}.${stepDef.name}.${validated.version}`,
            organization_id: validated.organization_id,
            metadata: {
              playbook_id: playbook.id,
              sequence: stepDef.sequence,
              worker_type: stepDef.worker_type
            }
          })

          // Create step relationship
          await universalApi.createRelationship({
            from_entity_id: playbook.id,
            to_entity_id: step.id,
            relationship_type: 'playbook_has_step',
            smart_code: 'HERA.PLAYBOOK.HAS_STEP.V1',
            organization_id: validated.organization_id,
            metadata: {
              sequence: stepDef.sequence
            }
          })
        }

        return playbook
      }
    )

    // 8. Audit successful creation
    await auditService.logAction(
      'playbook.create',
      securityContext.userId,
      result.response.id,
      {
        name: validated.name,
        version: validated.version,
        step_count: validated.steps.length,
        cached: result.cached,
        latency_ms: Date.now() - startTime,
        ip_address: securityContext.ipAddress,
        user_agent: securityContext.userAgent
      },
      true
    )

    // 9. Build secure response
    const queryBuilder = new SecureQueryBuilder(securityContext)
    const sanitizedResponse = queryBuilder.sanitizeResponse(result.response, 'playbook')

    // 10. Return response with security headers
    const response = NextResponse.json(sanitizedResponse, {
      status: result.cached ? 200 : 201
    })

    // Set security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

    if (result.cached) {
      response.headers.set('X-Idempotent-Replay', 'true')
    }

    return response
  } catch (error: any) {
    // Audit failure
    if (auditService && securityContext) {
      await auditService.logAction(
        'playbook.create',
        securityContext.userId,
        resourceId,
        {
          error: error.message,
          error_code: error.code,
          latency_ms: Date.now() - startTime,
          ip_address: securityContext.ipAddress,
          user_agent: securityContext.userAgent
        },
        false
      )
    }

    // Return error response
    const statusCode = error.statusCode || 500
    const errorResponse = {
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred',
        request_id: crypto.randomUUID()
      }
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

/**
 * GET /api/v1/playbooks - List playbooks with security filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Extract security context
    const securityContext = await extractSecurityContext(req)

    // Initialize services
    const permissionService = new PermissionService(securityContext.organizationId)
    const auditService = new AuditService(securityContext.organizationId)
    const queryBuilder = new SecureQueryBuilder(securityContext)

    // Check read permission
    await permissionService.enforcePermissions(securityContext.userId, [
      PermissionService.PERMISSIONS.PLAYBOOK_READ
    ])

    // Parse query parameters
    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build secure query
    const query = queryBuilder.buildEntityQuery('playbook_definition', {
      ...(status && { 'metadata.status': status })
    })

    // Set organization context
    universalApi.setOrganizationId(securityContext.organizationId)

    // Execute query
    const result = await universalApi.queryEntities({
      filters: query,
      limit,
      offset
    })

    // Sanitize results
    const sanitizedResults =
      result.data?.map(playbook => queryBuilder.sanitizeResponse(playbook, 'playbook')) || []

    // Audit read operation
    await auditService.logAction(
      'playbook.list',
      securityContext.userId,
      null,
      {
        count: sanitizedResults.length,
        filters: { status },
        limit,
        offset
      },
      true
    )

    return NextResponse.json({
      playbooks: sanitizedResults,
      total: result.total || 0,
      limit,
      offset
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred'
        }
      },
      { status: error.statusCode || 500 }
    )
  }
}

/**
 * Example: Complete step with security checks
 */
export async function completeStep(req: NextRequest, runId: string, sequence: number) {
  const securityContext = await extractSecurityContext(req)
  const permissionService = new PermissionService(securityContext.organizationId)
  const auditService = new AuditService(securityContext.organizationId)

  try {
    // Check base permission
    await permissionService.enforcePermissions(securityContext.userId, [
      PermissionService.PERMISSIONS.STEP_COMPLETE
    ])

    // Get step details
    universalApi.setOrganizationId(securityContext.organizationId)

    const lines = await universalApi.queryTransactionLines({
      filters: {
        transaction_id: runId,
        'metadata.sequence': sequence
      }
    })

    const step = lines.data?.[0]
    if (!step) {
      throw new Error('Step not found')
    }

    // Check step-specific permissions
    const requiredPermissions = step.metadata?.permissions_required || []
    await permissionService.enforcePermissions(securityContext.userId, requiredPermissions)

    // Validate request body
    const body = await req.json()
    const validated = ValidationSchemas.completeStep.parse(body)

    // Complete step
    await universalApi.updateTransactionLine(step.id, {
      metadata: {
        ...step.metadata,
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: securityContext.userId,
        outputs: validated.outputs,
        ai_confidence: validated.ai_confidence,
        ai_insights: validated.ai_insights,
        worker_notes: validated.worker_notes
      }
    })

    // Audit completion
    await auditService.logAction(
      'step.complete',
      securityContext.userId,
      step.id,
      {
        run_id: runId,
        sequence,
        step_name: step.metadata?.step_name
      },
      true
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    await auditService.logAction(
      'step.complete',
      securityContext.userId,
      null,
      {
        run_id: runId,
        sequence,
        error: error.message
      },
      false
    )

    throw error
  }
}
