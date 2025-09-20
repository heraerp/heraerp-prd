/**
 * HERA Playbooks Server-Side Authentication Service
 * 
 * Provides JWT authentication and permission checking for API endpoints.
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { universalApi } from '@/lib/universal-api';

export interface AuthResult {
  success: boolean;
  userId?: string;
  userName?: string;
  organizationId?: string;
  roles?: string[];
  permissions?: string[];
  error?: string;
}

export interface JWTPayload {
  sub: string;                    // User ID
  email: string;                  // User email
  name: string;                   // User name
  organization_id: string;        // Organization context
  roles: string[];               // User roles
  permissions: string[];         // User permissions
  iat: number;                   // Issued at
  exp: number;                   // Expires at
}

/**
 * Server-side authentication service for playbook APIs
 */
class PlaybookAuthService {
  
  /**
   * Authenticate request and extract user context
   */
  async authenticate(request: NextRequest): Promise<AuthResult> {
    try {
      // Extract JWT token from Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'Authorization header missing or invalid'
        };
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify and decode JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET environment variable not set');
        return {
          success: false,
          error: 'Server configuration error'
        };
      }
      
      let decoded: JWTPayload;
      try {
        decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      } catch (jwtError) {
        return {
          success: false,
          error: 'Invalid or expired token'
        };
      }
      
      // Validate required fields
      if (!decoded.sub || !decoded.organization_id) {
        return {
          success: false,
          error: 'Invalid token payload'
        };
      }
      
      // Optional: Verify user still exists and is active
      const userExists = await this.verifyUserExists(decoded.sub, decoded.organization_id);
      if (!userExists) {
        return {
          success: false,
          error: 'User not found or inactive'
        };
      }
      
      return {
        success: true,
        userId: decoded.sub,
        userName: decoded.name,
        organizationId: decoded.organization_id,
        roles: decoded.roles || [],
        permissions: decoded.permissions || []
      };
      
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }
  
  /**
   * Check if user has specific permission
   */
  async checkPermission(
    userId: string,
    organizationId: string,
    permission: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Set organization context
      universalApi.setOrganizationId(organizationId);
      
      // Get user entity and permissions
      const userEntity = await this.getUserEntity(userId);
      if (!userEntity) return false;
      
      // Check direct permissions
      const hasDirectPermission = userEntity.metadata?.permissions?.includes(permission);
      if (hasDirectPermission) return true;
      
      // Check role-based permissions
      const roles = userEntity.metadata?.roles || [];
      for (const role of roles) {
        const rolePermissions = await this.getRolePermissions(role, organizationId);
        if (rolePermissions.includes(permission)) return true;
      }
      
      // Check context-specific permissions
      if (context) {
        const hasContextPermission = await this.checkContextualPermission(
          userId,
          organizationId,
          permission,
          context
        );
        if (hasContextPermission) return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }
  
  /**
   * Verify user exists and is active
   */
  private async verifyUserExists(userId: string, organizationId: string): Promise<boolean> {
    try {
      universalApi.setOrganizationId(organizationId);
      
      const users = await universalApi.readEntities({
        filters: {
          id: userId,
          entity_type: 'user',
          organization_id: organizationId
        }
      });
      
      if (!users || users.length === 0) return false;
      
      const user = users[0];
      const isActive = user.metadata?.status !== 'inactive';
      
      return isActive;
      
    } catch (error) {
      console.error('User verification error:', error);
      return false;
    }
  }
  
  /**
   * Get user entity from database
   */
  private async getUserEntity(userId: string): Promise<any> {
    try {
      const users = await universalApi.readEntities({
        filters: {
          id: userId,
          entity_type: 'user'
        }
      });
      
      return users && users.length > 0 ? users[0] : null;
      
    } catch (error) {
      console.error('Get user entity error:', error);
      return null;
    }
  }
  
  /**
   * Get permissions for a specific role
   */
  private async getRolePermissions(role: string, organizationId: string): Promise<string[]> {
    try {
      const roles = await universalApi.readEntities({
        filters: {
          entity_type: 'role',
          entity_code: role,
          organization_id: organizationId
        }
      });
      
      if (!roles || roles.length === 0) return [];
      
      return roles[0].metadata?.permissions || [];
      
    } catch (error) {
      console.error('Get role permissions error:', error);
      return [];
    }
  }
  
  /**
   * Check contextual permissions (e.g., playbook-specific permissions)
   */
  private async checkContextualPermission(
    userId: string,
    organizationId: string,
    permission: string,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      // For playbook permissions, check if user has access to specific playbook
      if (permission === 'PLAYBOOK_RUN_COMPLETE' && context.playbook_id) {
        return await this.checkPlaybookAccess(userId, organizationId, context.playbook_id);
      }
      
      // Add more contextual checks as needed
      return false;
      
    } catch (error) {
      console.error('Contextual permission check error:', error);
      return false;
    }
  }
  
  /**
   * Check if user has access to specific playbook
   */
  private async checkPlaybookAccess(
    userId: string,
    organizationId: string,
    playbookId: string
  ): Promise<boolean> {
    try {
      // Check if playbook exists and user has access
      const playbooks = await universalApi.readEntities({
        filters: {
          id: playbookId,
          entity_type: 'playbook',
          organization_id: organizationId
        }
      });
      
      if (!playbooks || playbooks.length === 0) return false;
      
      const playbook = playbooks[0];
      
      // Check if playbook has access restrictions
      const accessControl = playbook.metadata?.access_control;
      if (!accessControl) return true; // No restrictions = public access
      
      // Check if user is explicitly allowed
      const allowedUsers = accessControl.allowed_users || [];
      if (allowedUsers.includes(userId)) return true;
      
      // Check if user's role is allowed
      const userEntity = await this.getUserEntity(userId);
      const userRoles = userEntity?.metadata?.roles || [];
      const allowedRoles = accessControl.allowed_roles || [];
      
      return userRoles.some(role => allowedRoles.includes(role));
      
    } catch (error) {
      console.error('Playbook access check error:', error);
      return false;
    }
  }
  
  /**
   * Generate a JWT token for testing/development
   */
  generateTestToken(payload: Partial<JWTPayload>): string {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret';
    
    const fullPayload: JWTPayload = {
      sub: payload.sub || 'test-user-id',
      email: payload.email || 'test@example.com',
      name: payload.name || 'Test User',
      organization_id: payload.organization_id || 'test-org-id',
      roles: payload.roles || ['user'],
      permissions: payload.permissions || ['PLAYBOOK_RUN_COMPLETE'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return jwt.sign(fullPayload, jwtSecret);
  }
}

// Export singleton instance
export const playbookAuthService = new PlaybookAuthService();