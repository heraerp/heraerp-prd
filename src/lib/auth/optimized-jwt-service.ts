// Optimized JWT service for HERA authentication
// Provides session validation and refresh functionality

import { supabase } from '@/lib/supabase'

interface OptimizedSession {
  valid: boolean
  token?: string
  user?: any
  expiresAt?: number
  refreshed?: boolean
}

class OptimizedJWTService {
  private sessionCache: Map<string, OptimizedSession> = new Map()
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds

  async validateAndRefreshSession(token?: string): Promise<OptimizedSession> {
    try {
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return { valid: false }
      }

      // Check if token needs refresh
      const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000
      const needsRefresh = expiresAt - Date.now() < 300000 // Refresh if expires in < 5 minutes

      let refreshed = false
      let currentSession = session

      if (needsRefresh) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (!refreshError && refreshedSession) {
          currentSession = refreshedSession
          refreshed = true
        }
      }

      const optimizedSession: OptimizedSession = {
        valid: true,
        token: currentSession.access_token,
        user: currentSession.user,
        expiresAt: currentSession.expires_at ? currentSession.expires_at * 1000 : Date.now() + 3600000,
        refreshed
      }

      // Cache the session
      if (currentSession.access_token) {
        this.sessionCache.set(currentSession.access_token, optimizedSession)
        
        // Clear cache after duration
        setTimeout(() => {
          this.sessionCache.delete(currentSession.access_token!)
        }, this.CACHE_DURATION)
      }

      return optimizedSession

    } catch (error) {
      console.error('Session validation failed:', error)
      return { valid: false }
    }
  }

  validateToken(token: string): OptimizedSession {
    // Check cache first
    const cached = this.sessionCache.get(token)
    if (cached) {
      return cached
    }

    // Basic token format validation
    if (!token || !token.startsWith('eyJ')) {
      return { valid: false }
    }

    // For demo purposes, accept demo tokens
    if (token.startsWith('demo-token') || token.startsWith('anon_token_') || token.startsWith('auth_token_')) {
      return {
        valid: true,
        token,
        user: { id: 'demo-user', email: 'demo@example.com' },
        expiresAt: Date.now() + 3600000
      }
    }

    return { valid: false }
  }

  clearCache(): void {
    this.sessionCache.clear()
  }
}

export const optimizedJWT = new OptimizedJWTService()
export default OptimizedJWTService