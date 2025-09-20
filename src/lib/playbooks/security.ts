/**
 * HERA Playbook Security Service
 * 
 * Provides multi-tenant security, permission management,
 * and idempotency for the playbook system.
 * 
 * All security enforced using HERA's 6 sacred tables.
 */

import { universalApi } from '@/lib/universal-api';
import { createHash } from 'crypto';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

// Error types
export class SecurityError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ForbiddenError extends SecurityError {
  constructor(message: string) {
    super('FORBIDDEN', message, 403);
  }
}

export class UnauthorizedError extends SecurityError {
  constructor(message: string) {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ConflictError extends SecurityError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

// JWT Claims interface
export interface PlaybookJWTClaims {
  sub: string;                    // User ID
  organization_id: string;        // Organization context
  entity_id: string;             // User as entity
  roles: string[];               // User roles
  permissions: string[];         // Granted permissions
  playbook_permissions?: {
    can_create: boolean;
    can_execute: boolean;
    can_approve: boolean;
    max_cost_per_run?: number;
  };
  iat: number;
  exp: number;
}

// Security context
export interface SecurityContext {
  userId: string;
  organizationId: string;
  permissions: string[];
  roles: string[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Permission Service
 */
export class PermissionService {
  // Permission definitions
  static readonly PERMISSIONS = {
    // Playbook management
    PLAYBOOK_CREATE: 'playbook:create',
    PLAYBOOK_READ: 'playbook:read',
    PLAYBOOK_UPDATE: 'playbook:update',
    PLAYBOOK_DELETE: 'playbook:delete',
    PLAYBOOK_PUBLISH: 'playbook:publish',
    PLAYBOOK_ARCHIVE: 'playbook:archive',
    
    // Execution permissions
    RUN_CREATE: 'playbook_run:create',
    RUN_READ: 'playbook_run:read',
    RUN_CANCEL: 'playbook_run:cancel',
    RUN_APPROVE: 'playbook_run:approve',
    
    // Step permissions
    STEP_COMPLETE: 'playbook_step:complete',
    STEP_SKIP: 'playbook_step:skip',
    STEP_RETRY: 'playbook_step:retry',
    
    // Admin permissions
    ADMIN: 'playbook:admin',
    AUDIT: 'playbook:audit',
    
    // Special permissions
    READ_ALL: 'playbook:read_all',
    READ_SENSITIVE: 'playbook:read_sensitive',
    EXECUTE_SYSTEM: 'playbook:execute_system',
    EXECUTE_AI: 'playbook:execute_ai'
  } as const;

  constructor(private organizationId: string) {}

  /**
   * Check if user has permission
   */
  async checkPermission(
    userId: string,
    permission: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    // Get user permissions
    const userPermissions = await this.getUserPermissions(userId);
    
    // Check direct permission
    if (userPermissions.includes(permission)) {
      return true;
    }
    
    // Check wildcard permissions
    const [resource, action] = permission.split(':');
    if (userPermissions.includes(`${resource}:*`)) {
      return true;
    }
    
    // Check admin permission
    if (userPermissions.includes(PermissionService.PERMISSIONS.ADMIN)) {
      return true;
    }
    
    // Check contextual permissions
    if (context) {
      return this.checkContextualPermission(
        userId,
        permission,
        context,
        userPermissions
      );
    }
    
    return false;
  }

  /**
   * Enforce required permissions
   */
  async enforcePermissions(
    userId: string,
    requiredPermissions: string[],
    context?: Record<string, any>
  ): Promise<void> {
    for (const permission of requiredPermissions) {
      const hasPermission = await this.checkPermission(
        userId,
        permission,
        context
      );
      
      if (!hasPermission) {
        throw new ForbiddenError(
          `Missing required permission: ${permission}`
        );
      }
    }
  }

  /**
   * Get user permissions from database
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    // Get user entity
    const userEntity = await universalApi.queryEntities({
      filters: {
        entity_type: 'user',
        'metadata.user_id': userId
      },
      organization_id: this.organizationId
    });
    
    if (!userEntity.data?.[0]) {
      return [];
    }
    
    // Get role relationships
    const roleRelationships = await universalApi.queryRelationships({
      from_entity_id: userEntity.data[0].id,
      relationship_type: 'has_role',
      organization_id: this.organizationId
    });
    
    // Collect permissions from roles
    const permissions = new Set<string>();
    
    for (const rel of roleRelationships.data || []) {
      const role = await universalApi.getEntity(rel.to_entity_id);
      const rolePermissions = role.metadata?.permissions || [];
      rolePermissions.forEach((p: string) => permissions.add(p));
    }
    
    // Get direct permissions
    const directPermissions = userEntity.data[0].metadata?.permissions || [];
    directPermissions.forEach((p: string) => permissions.add(p));
    
    return Array.from(permissions);
  }

  /**
   * Check contextual permissions
   */
  private async checkContextualPermission(
    userId: string,
    permission: string,
    context: Record<string, any>,
    userPermissions: string[]
  ): Promise<boolean> {
    // Example: Check if user owns the resource
    if (permission.endsWith(':read') && context.ownerId === userId) {
      return true;
    }
    
    // Example: Check department-based access
    if (context.department && userPermissions.includes(`${context.department}:${permission}`)) {
      return true;
    }
    
    return false;
  }
}

/**
 * Idempotency Service
 */
export class IdempotencyService {
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private organizationId: string) {}

  /**
   * Process idempotent request
   */
  async processRequest<T>(
    key: string,
    endpoint: string,
    request: any,
    handler: () => Promise<T>
  ): Promise<{ response: T; cached: boolean }> {
    if (!key) {
      // No idempotency requested
      const response = await handler();
      return { response, cached: false };
    }
    
    // Generate request hash
    const requestHash = this.hashRequest(request);
    
    // Check for existing record
    const existing = await this.findRecord(key, endpoint);
    
    if (existing) {
      // Validate request hasn't changed
      if (existing.request_hash !== requestHash) {
        throw new ConflictError(
          'Idempotency key used with different request'
        );
      }
      
      // Return cached response
      return {
        response: existing.response as T,
        cached: true
      };
    }
    
    // Execute request
    let response: T;
    let error: Error | null = null;
    
    try {
      response = await handler();
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      // Store result (success or failure)
      await this.storeRecord(
        key,
        endpoint,
        requestHash,
        error ? { error: error.message } : response!,
        error ? 500 : 200
      );
    }
    
    return { response: response!, cached: false };
  }

  /**
   * Find idempotency record
   */
  private async findRecord(
    key: string,
    endpoint: string
  ): Promise<any | null> {
    const records = await universalApi.queryDynamicData({
      entity_type: 'idempotency_record',
      filters: {
        field_name: 'idempotency_key',
        field_value_text: key,
        'metadata.endpoint': endpoint,
        'metadata.organization_id': this.organizationId
      }
    });
    
    const record = records.data?.[0];
    if (!record) return null;
    
    // Check expiration
    const expiresAt = new Date(record.metadata?.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }
    
    return record.metadata;
  }

  /**
   * Store idempotency record
   */
  private async storeRecord(
    key: string,
    endpoint: string,
    requestHash: string,
    response: any,
    statusCode: number
  ): Promise<void> {
    // Create entity for idempotency record
    const entity = await universalApi.createEntity({
      entity_type: 'idempotency_record',
      entity_name: `Idempotency: ${key}`,
      entity_code: `IDEM-${key}`,
      smart_code: 'HERA.SECURITY.IDEMPOTENCY.RECORD.V1',
      organization_id: this.organizationId,
      metadata: {
        expires_at: new Date(Date.now() + this.TTL_MS).toISOString()
      }
    });
    
    // Store details in dynamic data
    await universalApi.setDynamicFields(entity.id, {
      idempotency_key: key,
      endpoint: endpoint,
      request_hash: requestHash,
      response: JSON.stringify(response),
      status_code: statusCode.toString(),
      organization_id: this.organizationId
    });
  }

  /**
   * Generate request hash
   */
  private hashRequest(request: any): string {
    const normalized = JSON.stringify(request, Object.keys(request).sort());
    return createHash('sha256').update(normalized).digest('hex');
  }
}

/**
 * Security Audit Service
 */
export class AuditService {
  constructor(private organizationId: string) {}

  /**
   * Create audit log entry
   */
  async logAction(
    action: string,
    userId: string,
    resourceId: string | null,
    details: Record<string, any>,
    success: boolean = true
  ): Promise<void> {
    await universalApi.createTransaction({
      transaction_type: 'security_audit',
      transaction_code: `AUDIT-${Date.now()}`,
      smart_code: this.getAuditSmartCode(action),
      organization_id: this.organizationId,
      from_entity_id: userId,
      reference_entity_id: resourceId,
      metadata: {
        action,
        details,
        success,
        timestamp: new Date().toISOString(),
        ...this.extractSecurityContext(details)
      }
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(
    filters: {
      userId?: string;
      resourceId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ): Promise<any[]> {
    const logs = await universalApi.queryTransactions({
      filters: {
        transaction_type: 'security_audit',
        organization_id: this.organizationId,
        ...(filters.userId && { from_entity_id: filters.userId }),
        ...(filters.resourceId && { reference_entity_id: filters.resourceId }),
        ...(filters.action && { 'metadata.action': filters.action })
      },
      limit
    });
    
    return logs.data || [];
  }

  /**
   * Get audit smart code for action
   */
  private getAuditSmartCode(action: string): string {
    const [resource, operation] = action.split('.');
    return `HERA.SECURITY.AUDIT.${resource.toUpperCase()}.${operation.toUpperCase()}.V1`;
  }

  /**
   * Extract security context from request
   */
  private extractSecurityContext(details: any): Record<string, any> {
    return {
      ip_address: details.ip_address || 'unknown',
      user_agent: details.user_agent || 'unknown',
      session_id: details.session_id,
      request_id: details.request_id
    };
  }
}

/**
 * Request validation schemas
 */
export const ValidationSchemas = {
  createPlaybook: z.object({
    organization_id: z.string().uuid(),
    industry: z.string().regex(/^[A-Z]+$/),
    module: z.string().regex(/^[A-Z]+$/),
    name: z.string().regex(/^[A-Z_]+$/),
    version: z.string().regex(/^V\d+$/),
    description: z.string().optional(),
    inputs: z.record(z.any()),
    outputs: z.record(z.any()),
    policies: z.record(z.any()).optional(),
    steps: z.array(z.object({
      name: z.string(),
      sequence: z.number().int().positive(),
      worker_type: z.enum(['human', 'ai', 'system', 'external']),
      permissions_required: z.array(z.string()).optional()
    }))
  }),
  
  startRun: z.object({
    organization_id: z.string().uuid(),
    playbook_id: z.string().uuid(),
    subject_entity_id: z.string().uuid().optional(),
    inputs: z.record(z.any()),
    correlation_id: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional()
  }),
  
  completeStep: z.object({
    outputs: z.record(z.any()),
    ai_confidence: z.number().min(0).max(1).optional(),
    ai_insights: z.string().optional(),
    worker_notes: z.string().optional()
  })
};

/**
 * Secure query builder
 */
export class SecureQueryBuilder {
  constructor(
    private securityContext: SecurityContext
  ) {}

  /**
   * Build secure entity query
   */
  buildEntityQuery(
    entityType: string,
    additionalFilters?: Record<string, any>
  ): any {
    const query = {
      entity_type: entityType,
      organization_id: this.securityContext.organizationId,
      ...additionalFilters
    };
    
    // Apply permission-based filters
    if (entityType === 'playbook_definition') {
      if (!this.hasPermission(PermissionService.PERMISSIONS.READ_ALL)) {
        // Non-admins only see published playbooks
        query['metadata.status'] = 'published';
      }
    }
    
    return query;
  }

  /**
   * Build secure transaction query
   */
  buildTransactionQuery(
    transactionType: string,
    additionalFilters?: Record<string, any>
  ): any {
    const query = {
      transaction_type: transactionType,
      organization_id: this.securityContext.organizationId,
      ...additionalFilters
    };
    
    // Apply permission-based filters
    if (transactionType === 'playbook_run') {
      if (!this.hasPermission(PermissionService.PERMISSIONS.READ_ALL)) {
        // Non-admins only see their own runs
        query['metadata.created_by'] = this.securityContext.userId;
      }
    }
    
    return query;
  }

  /**
   * Sanitize response based on permissions
   */
  sanitizeResponse(data: any, resourceType: string): any {
    if (this.hasPermission(PermissionService.PERMISSIONS.READ_SENSITIVE)) {
      return data; // Full access
    }
    
    // Remove sensitive fields
    const sanitized = { ...data };
    
    if (resourceType === 'playbook') {
      delete sanitized.metadata?.internal_notes;
      delete sanitized.metadata?.cost_details;
    }
    
    if (resourceType === 'run') {
      delete sanitized.metadata?.error_details;
      delete sanitized.metadata?.performance_metrics;
    }
    
    return sanitized;
  }

  private hasPermission(permission: string): boolean {
    return this.securityContext.permissions.includes(permission);
  }
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(
  permissionService: PermissionService,
  auditService: AuditService
) {
  return {
    /**
     * Require specific permissions
     */
    requirePermission: (...permissions: string[]) => {
      return async (req: NextRequest, context: any) => {
        const userId = context.userId;
        
        try {
          await permissionService.enforcePermissions(
            userId,
            permissions,
            { path: req.nextUrl.pathname }
          );
        } catch (error) {
          await auditService.logAction(
            'permission.denied',
            userId,
            null,
            {
              permissions,
              path: req.nextUrl.pathname,
              error: error.message
            },
            false
          );
          throw error;
        }
      };
    },

    /**
     * Validate request body
     */
    validateRequest: (schema: z.ZodSchema) => {
      return async (req: NextRequest, context: any) => {
        try {
          const body = await req.json();
          const validated = schema.parse(body);
          context.validatedBody = validated;
        } catch (error) {
          throw new SecurityError(
            'INVALID_REQUEST',
            'Request validation failed',
            400
          );
        }
      };
    },

    /**
     * Log security action
     */
    auditLog: (action: string) => {
      return async (req: NextRequest, context: any, response: any) => {
        await auditService.logAction(
          action,
          context.userId,
          context.resourceId,
          {
            method: req.method,
            path: req.nextUrl.pathname,
            status: response.status,
            ip_address: req.headers.get('x-forwarded-for'),
            user_agent: req.headers.get('user-agent')
          }
        );
      };
    }
  };
}