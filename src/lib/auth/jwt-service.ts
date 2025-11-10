// HERA JWT Service for authentication and authorization
// Provides JWT token creation, validation, and user context management

import { supabase } from '@/lib/supabase'

export interface JWTPayload {
  sub: string // user ID
  email: string
  organization_id?: string
  role?: string
  permissions?: string[]
  user_metadata?: {
    hera_user_entity_id?: string
    organization_id?: string
    role?: string
    permissions?: string[]
    [key: string]: any
  }
  iat: number
  exp: number
  iss: string
}

export interface AuthContext {
  user: {
    id: string
    email: string
    role?: string
  }
  organization?: {
    id: string
    name: string
    type?: string
  }
  permissions: string[]
}

export class HERAJWTService {
  private readonly issuer = 'hera-erp'
  private readonly defaultExpiry = 3600 // 1 hour

  async validateToken(
    token: string
  ): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
    try {
      // For demo mode, accept demo tokens
      if (
        token.startsWith('demo-token') ||
        token.startsWith('anon_token_') ||
        token.startsWith('auth_token_')
      ) {
        const payload: JWTPayload = {
          sub: 'demo-user-123',
          email: 'demo@example.com',
          organization_id: 'demo-org-123',
          role: 'admin',
          permissions: [
            'entities:read',
            'entities:write',
            'transactions:read',
            'transactions:write'
          ],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + this.defaultExpiry,
          iss: this.issuer
        }
        return { valid: true, payload }
      }

      // Validate with Supabase for real tokens
      const {
        data: { user },
        error
      } = await supabase.auth.getUser(token)

      if (error || !user) {
        return { valid: false, error: 'Invalid token' }
      }

      // HERA DNA: Get organization from user metadata (stored during registration)
      // No separate user_organizations table - HERA uses universal architecture
      let organizationId: string | undefined = user.user_metadata?.organization_id

      console.log('[JWT Service] Organization lookup:', {
        userId: user.id,
        found: !!organizationId,
        organizationId,
        source: 'user_metadata'
      })

      // If not in metadata, follow USER_MEMBER_OF_ORG relationship (proper HERA architecture)
      if (!organizationId) {
        try {
          const { data: relationship } = await supabase
            .from('core_relationships')
            .select('to_entity_id')
            .eq('from_entity_id', user.id)
            .eq('relationship_type', 'USER_MEMBER_OF_ORG')
            .maybeSingle()

          if (relationship) {
            organizationId = relationship.to_entity_id
            console.log('[JWT Service] Using USER_MEMBER_OF_ORG relationship:', organizationId)
          }
        } catch (err) {
          console.warn('[JWT Service] Failed to fetch relationship:', err)
        }
      }

      // Derive role and permissions
      const role = (user.user_metadata?.role as string) || 'user'
      const metaPerms = (user.user_metadata?.permissions as string[]) || []

      const rolePerms: Record<string, string[]> = {
        owner: [
          'entities:read',
          'entities:write',
          'relationships:read',
          'relationships:write',
          'transactions:read',
          'transactions:write'
        ],
        admin: [
          'entities:read',
          'entities:write',
          'relationships:read',
          'relationships:write',
          'transactions:read',
          'transactions:write',
          'users:manage'
        ],
        manager: [
          'entities:read',
          'entities:write',
          'relationships:read',
          'relationships:write',
          'transactions:read',
          'transactions:write'
        ],
        receptionist: ['entities:read', 'relationships:read', 'transactions:read'],
        stylist: ['entities:read', 'relationships:read'],
        accountant: ['entities:read', 'transactions:read']
      }

      const derivedPerms = rolePerms[role] || ['entities:read']
      const permissions = Array.from(new Set([...(metaPerms || []), ...derivedPerms]))

      const payload: JWTPayload = {
        sub: user.id,
        email: user.email || '',
        organization_id: organizationId,
        role,
        permissions,
        user_metadata: user.user_metadata, // ✅ ENTERPRISE FIX: Include user_metadata for verifyAuth
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.defaultExpiry,
        iss: this.issuer
      }

      return { valid: true, payload }
    } catch (error) {
      return { valid: false, error: 'Token validation failed' }
    }
  }

  async getAuthContext(token: string): Promise<AuthContext | null> {
    const validation = await this.validateToken(token)

    if (!validation.valid || !validation.payload) {
      return null
    }

    const { payload } = validation

    return {
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      },
      organization: payload.organization_id
        ? {
            id: payload.organization_id,
            name: 'Demo Organization',
            type: 'business'
          }
        : undefined,
      permissions: payload.permissions || ['entities:read']
    }
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7)
  }

  async createToken(user: any, organization?: any): Promise<string> {
    // In a real implementation, this would create a proper JWT
    // For now, return a demo token format
    return `auth_token_${user.id}_${Date.now()}`
  }

  verifyPermission(context: AuthContext, permission: string): boolean {
    return context.permissions.includes(permission)
  }

  isTokenExpired(payload: JWTPayload): boolean {
    return payload.exp < Math.floor(Date.now() / 1000)
  }
}

// Export singleton instance
export const jwtService = new HERAJWTService()
export default HERAJWTService
