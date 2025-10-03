// HERA JWT Service for authentication and authorization
// Provides JWT token creation, validation, and user context management

import { supabase } from '@/lib/supabase'

export interface JWTPayload {
  sub: string // user ID
  email: string
  organization_id?: string
  role?: string
  permissions?: string[]
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
          email: 'demo@hairtalkz.com', // Use salon email for demo
          organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon ID
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

      // For salon users, determine organization_id based on email
      let organizationId = user.user_metadata?.organization_id

      // Default to HairTalkz for salon users (michele@hairtalkz.com should use HairTalkz org)
      if (user.email?.includes('hairtalkz.com') || user.email?.includes('michele')) {
        organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0' // Hair Talkz Salon ID
      }

      const payload: JWTPayload = {
        sub: user.id,
        email: user.email || '',
        organization_id: organizationId,
        role: user.user_metadata?.role || 'user',
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
