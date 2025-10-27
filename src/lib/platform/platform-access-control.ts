'use client';

/**
 * HERA Platform Access Control
 * Smart Code: HERA.PLATFORM.ACCESS_CONTROL.v1
 * 
 * Manages access control and permissions for platform organization entities
 */

import { 
  PLATFORM_ORG, 
  PLATFORM_ACCESS_ROLES, 
  PLATFORM_PERMISSIONS,
  canAccessPlatformEntity 
} from './platform-org-constants';

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformUser {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  permissions: string[];
  metadata?: Record<string, any>;
}

export interface AccessRequest {
  user_id: string;
  resource_type: 'template' | 'component' | 'config' | 'admin';
  resource_id?: string;
  operation: 'read' | 'write' | 'delete' | 'admin';
  context?: Record<string, any>;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  restrictions?: Record<string, any>;
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export const PLATFORM_ROLE_DEFINITIONS = {
  [PLATFORM_ACCESS_ROLES.HERA_SYSTEM]: {
    name: 'HERA System',
    description: 'System-level access for internal HERA operations',
    permissions: [
      PLATFORM_PERMISSIONS.READ_TEMPLATES,
      PLATFORM_PERMISSIONS.WRITE_TEMPLATES,
      PLATFORM_PERMISSIONS.GENERATE_APPS,
      PLATFORM_PERMISSIONS.MANAGE_COMPONENTS,
      PLATFORM_PERMISSIONS.CONFIGURE_AI,
      PLATFORM_PERMISSIONS.ADMIN_PLATFORM
    ],
    restrictions: [],
    inherits: []
  },

  [PLATFORM_ACCESS_ROLES.PLATFORM_ADMIN]: {
    name: 'Platform Administrator',
    description: 'Full administrative access to platform configurations',
    permissions: [
      PLATFORM_PERMISSIONS.READ_TEMPLATES,
      PLATFORM_PERMISSIONS.WRITE_TEMPLATES,
      PLATFORM_PERMISSIONS.GENERATE_APPS,
      PLATFORM_PERMISSIONS.MANAGE_COMPONENTS,
      PLATFORM_PERMISSIONS.CONFIGURE_AI,
      PLATFORM_PERMISSIONS.ADMIN_PLATFORM
    ],
    restrictions: ['cannot_delete_system_templates'],
    inherits: []
  },

  [PLATFORM_ACCESS_ROLES.TENANT_ADMIN]: {
    name: 'Tenant Administrator',
    description: 'Can read templates and generate apps for their organization',
    permissions: [
      PLATFORM_PERMISSIONS.READ_TEMPLATES,
      PLATFORM_PERMISSIONS.GENERATE_APPS
    ],
    restrictions: [
      'read_only_platform_configs',
      'own_organization_only'
    ],
    inherits: []
  },

  [PLATFORM_ACCESS_ROLES.DEVELOPER]: {
    name: 'Developer',
    description: 'Development access to templates and components',
    permissions: [
      PLATFORM_PERMISSIONS.READ_TEMPLATES,
      PLATFORM_PERMISSIONS.GENERATE_APPS
    ],
    restrictions: [
      'read_only_platform_configs',
      'development_templates_only'
    ],
    inherits: []
  },

  [PLATFORM_ACCESS_ROLES.END_USER]: {
    name: 'End User',
    description: 'Basic user with no platform access',
    permissions: [],
    restrictions: ['no_platform_access'],
    inherits: []
  }
} as const;

// ============================================================================
// ACCESS CONTROL CLASS
// ============================================================================

export class PlatformAccessControl {
  /**
   * Check if user has access to specific platform resource
   */
  static checkAccess(user: PlatformUser, request: AccessRequest): AccessResult {
    // System role always has access
    if (user.role === PLATFORM_ACCESS_ROLES.HERA_SYSTEM) {
      return { allowed: true };
    }

    // Check if user can access platform entities at all
    if (!canAccessPlatformEntity(user.role, request.operation)) {
      return {
        allowed: false,
        reason: `Role ${user.role} does not have ${request.operation} access to platform resources`
      };
    }

    // Get role definition
    const roleDefinition = PLATFORM_ROLE_DEFINITIONS[user.role as keyof typeof PLATFORM_ROLE_DEFINITIONS];
    if (!roleDefinition) {
      return {
        allowed: false,
        reason: `Unknown role: ${user.role}`
      };
    }

    // Check specific resource type access
    const resourceAccessResult = this.checkResourceAccess(roleDefinition, request);
    if (!resourceAccessResult.allowed) {
      return resourceAccessResult;
    }

    // Check organization isolation
    const orgAccessResult = this.checkOrganizationAccess(user, request);
    if (!orgAccessResult.allowed) {
      return orgAccessResult;
    }

    // Check operation-specific restrictions
    const operationAccessResult = this.checkOperationAccess(roleDefinition, request);
    if (!operationAccessResult.allowed) {
      return operationAccessResult;
    }

    return { 
      allowed: true,
      restrictions: this.getAccessRestrictions(roleDefinition, request)
    };
  }

  /**
   * Check resource-specific access
   */
  private static checkResourceAccess(
    roleDefinition: any, 
    request: AccessRequest
  ): AccessResult {
    const requiredPermission = this.getRequiredPermission(request);
    
    if (!requiredPermission) {
      return { allowed: true };
    }

    if (!roleDefinition.permissions.includes(requiredPermission)) {
      return {
        allowed: false,
        reason: `Role lacks required permission: ${requiredPermission}`
      };
    }

    return { allowed: true };
  }

  /**
   * Check organization-level access
   */
  private static checkOrganizationAccess(
    user: PlatformUser, 
    request: AccessRequest
  ): AccessResult {
    const roleDefinition = PLATFORM_ROLE_DEFINITIONS[user.role as keyof typeof PLATFORM_ROLE_DEFINITIONS];
    
    // Platform admins and system can access across organizations
    if ([PLATFORM_ACCESS_ROLES.HERA_SYSTEM, PLATFORM_ACCESS_ROLES.PLATFORM_ADMIN].includes(user.role as any)) {
      return { allowed: true };
    }

    // Tenant admins are restricted to their organization for generation
    if (user.role === PLATFORM_ACCESS_ROLES.TENANT_ADMIN) {
      if (request.operation === 'write' && request.context?.target_organization_id) {
        if (request.context.target_organization_id !== user.organization_id) {
          return {
            allowed: false,
            reason: 'Cannot generate apps for other organizations'
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check operation-specific access
   */
  private static checkOperationAccess(
    roleDefinition: any, 
    request: AccessRequest
  ): AccessResult {
    // Check for system template protection
    if (roleDefinition.restrictions.includes('cannot_delete_system_templates')) {
      if (request.operation === 'delete' && request.context?.is_system_template) {
        return {
          allowed: false,
          reason: 'Cannot delete system templates'
        };
      }
    }

    // Check for development template restrictions
    if (roleDefinition.restrictions.includes('development_templates_only')) {
      if (request.context?.template_category && request.context.template_category !== 'development') {
        return {
          allowed: false,
          reason: 'Access limited to development templates only'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Get required permission for request
   */
  private static getRequiredPermission(request: AccessRequest): string | null {
    switch (request.resource_type) {
      case 'template':
        return request.operation === 'read' 
          ? PLATFORM_PERMISSIONS.READ_TEMPLATES 
          : PLATFORM_PERMISSIONS.WRITE_TEMPLATES;
          
      case 'component':
        return PLATFORM_PERMISSIONS.MANAGE_COMPONENTS;
        
      case 'config':
        return request.operation === 'read'
          ? PLATFORM_PERMISSIONS.READ_TEMPLATES
          : PLATFORM_PERMISSIONS.ADMIN_PLATFORM;
          
      case 'admin':
        return PLATFORM_PERMISSIONS.ADMIN_PLATFORM;
        
      default:
        return null;
    }
  }

  /**
   * Get access restrictions for successful requests
   */
  private static getAccessRestrictions(
    roleDefinition: any, 
    request: AccessRequest
  ): Record<string, any> {
    const restrictions: Record<string, any> = {};

    if (roleDefinition.restrictions.includes('read_only_platform_configs')) {
      restrictions.read_only = true;
    }

    if (roleDefinition.restrictions.includes('own_organization_only')) {
      restrictions.organization_scope = 'own_only';
    }

    if (roleDefinition.restrictions.includes('development_templates_only')) {
      restrictions.template_categories = ['development'];
    }

    return restrictions;
  }

  /**
   * Get effective permissions for user
   */
  static getUserPermissions(user: PlatformUser): string[] {
    const roleDefinition = PLATFORM_ROLE_DEFINITIONS[user.role as keyof typeof PLATFORM_ROLE_DEFINITIONS];
    if (!roleDefinition) {
      return [];
    }

    return [...roleDefinition.permissions, ...(user.permissions || [])];
  }

  /**
   * Check if user can perform bulk operations
   */
  static canPerformBulkOperation(
    user: PlatformUser, 
    operation: 'read' | 'write' | 'delete',
    resourceCount: number
  ): AccessResult {
    // System and platform admins can perform unlimited bulk operations
    if ([PLATFORM_ACCESS_ROLES.HERA_SYSTEM, PLATFORM_ACCESS_ROLES.PLATFORM_ADMIN].includes(user.role as any)) {
      return { allowed: true };
    }

    // Tenant admins have limits
    if (user.role === PLATFORM_ACCESS_ROLES.TENANT_ADMIN) {
      const maxBulkRead = 100;
      const maxBulkWrite = 10;

      if (operation === 'read' && resourceCount > maxBulkRead) {
        return {
          allowed: false,
          reason: `Bulk read limited to ${maxBulkRead} resources`
        };
      }

      if (operation === 'write' && resourceCount > maxBulkWrite) {
        return {
          allowed: false,
          reason: `Bulk write limited to ${maxBulkWrite} resources`
        };
      }

      if (operation === 'delete') {
        return {
          allowed: false,
          reason: 'Bulk delete not allowed for tenant admins'
        };
      }
    }

    // Developers cannot perform bulk writes or deletes
    if (user.role === PLATFORM_ACCESS_ROLES.DEVELOPER) {
      if (['write', 'delete'].includes(operation)) {
        return {
          allowed: false,
          reason: 'Developers cannot perform bulk write or delete operations'
        };
      }

      if (operation === 'read' && resourceCount > 50) {
        return {
          allowed: false,
          reason: 'Developer bulk read limited to 50 resources'
        };
      }
    }

    return { allowed: true };
  }
}

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Express middleware for platform access control
 */
export function platformAccessMiddleware(
  requiredPermission: string,
  options: {
    resource_type?: string;
    allow_own_org_only?: boolean;
  } = {}
) {
  return (req: any, res: any, next: any) => {
    const user = req.user as PlatformUser;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'PLATFORM_AUTH_REQUIRED'
      });
    }

    const accessRequest: AccessRequest = {
      user_id: user.id,
      resource_type: (options.resource_type as any) || 'template',
      operation: req.method.toLowerCase() === 'get' ? 'read' : 'write',
      context: {
        target_organization_id: req.body?.organization_id || req.query?.organization_id,
        ...req.body,
        ...req.query
      }
    };

    const accessResult = PlatformAccessControl.checkAccess(user, accessRequest);
    
    if (!accessResult.allowed) {
      return res.status(403).json({
        error: 'Access denied',
        reason: accessResult.reason,
        code: 'PLATFORM_ACCESS_DENIED'
      });
    }

    // Add access restrictions to request context
    req.platformAccess = {
      restrictions: accessResult.restrictions,
      user_role: user.role,
      permissions: PlatformAccessControl.getUserPermissions(user)
    };

    next();
  };
}

/**
 * React hook for platform access control
 */
export function usePlatformAccess(user: PlatformUser | null) {
  const checkAccess = (request: Omit<AccessRequest, 'user_id'>) => {
    if (!user) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    return PlatformAccessControl.checkAccess(user, {
      ...request,
      user_id: user.id
    });
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    const permissions = PlatformAccessControl.getUserPermissions(user);
    return permissions.includes(permission);
  };

  const canAccessTemplates = (operation: 'read' | 'write' = 'read') => {
    return checkAccess({
      resource_type: 'template',
      operation
    }).allowed;
  };

  const canManageComponents = () => {
    return hasPermission(PLATFORM_PERMISSIONS.MANAGE_COMPONENTS);
  };

  const canAdminPlatform = () => {
    return hasPermission(PLATFORM_PERMISSIONS.ADMIN_PLATFORM);
  };

  return {
    checkAccess,
    hasPermission,
    canAccessTemplates,
    canManageComponents,
    canAdminPlatform,
    userRole: user?.role,
    permissions: user ? PlatformAccessControl.getUserPermissions(user) : []
  };
}

export default PlatformAccessControl;