/**
 * HERA Demo Authorization Service
 * Implements HERA Authorization DNA Pattern for demo users
 */

import { getSupabase } from '../supabase'

// Demo user configuration following HERA Authorization DNA
export const DEMO_USERS = {
  'salon-receptionist': {
    supabase_user_id: 'demo|salon-receptionist',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon
    redirect_path: '/salon/dashboard',
    session_duration: 30 * 60 * 1000, // 30 minutes
    role: 'HERA.SEC.ROLE.RECEPTIONIST.DEMO.V1',
    scopes: [
      'read:HERA.SALON.SERVICE.APPOINTMENT',
      'write:HERA.SALON.SERVICE.APPOINTMENT',
      'read:HERA.SALON.CRM.CUSTOMER',
      'write:HERA.SALON.CRM.CUSTOMER',
      'read:HERA.SALON.SERVICE.CATALOG',
      'read:HERA.SALON.INVENTORY.PRODUCT'
    ]
  }
} as const

export type DemoUserType = keyof typeof DEMO_USERS

interface DemoAuthResult {
  success: boolean
  user?: {
    id: string
    entity_id: string
    organization_id: string
    role: string
    scopes: string[]
    expires_at: string
  }
  redirect_url?: string
  error?: string
}

class DemoAuthService {
  private getSupabaseClient() {
    try {
      return getSupabase()
    } catch (error) {
      console.error('Failed to get Supabase client:', error)
      return null
    }
  }

  /**
   * Initialize demo session following HERA Authorization DNA
   */
  async initializeDemoSession(demoType: DemoUserType): Promise<DemoAuthResult> {
    try {
      console.log('🧬 HERA Demo Auth: Calling server-side demo API', { demoType })

      const response = await fetch('/api/v1/demo/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ demoType })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Server demo API failed:', errorData)
        return {
          success: false,
          error: errorData.error || `Server error: ${response.status}`
        }
      }

      const result = await response.json()

      if (!result.success) {
        return result
      }

      console.log('✅ HERA Demo Auth: Server session created', {
        entity_id: result.user.entity_id,
        organization_id: result.user.organization_id,
        scopes_count: result.user.scopes.length
      })

      return result
    } catch (error) {
      console.error('💥 Demo session initialization error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Resolve Supabase user ID to HERA user entity (Identity Bridge)
   */
  private async resolveHERAUser(supabaseUserId: string): Promise<DemoAuthResult> {
    try {
      const supabase = this.getSupabaseClient()
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' }
      }

      // Query Platform org for user entity with bridge metadata
      const { data: userEntity, error } = await supabase
        .from('core_entities')
        .select('id, entity_name, metadata')
        .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
        .eq('entity_type', 'user')
        .contains('metadata', { supabase_user_id: supabaseUserId })
        .single()

      if (error || !userEntity) {
        console.error('❌ HERA user entity not found:', error)
        return {
          success: false,
          error: `Demo user not found: ${supabaseUserId}`
        }
      }

      console.log('🔗 HERA Identity Bridge resolved:', {
        supabase_user_id: supabaseUserId,
        hera_entity_id: userEntity.id,
        entity_name: userEntity.entity_name
      })

      return {
        success: true,
        user: {
          id: supabaseUserId,
          entity_id: userEntity.id,
          organization_id: '', // Will be set by caller
          role: '',
          scopes: [],
          expires_at: ''
        }
      }
    } catch (error) {
      console.error('💥 HERA user resolution error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User resolution failed'
      }
    }
  }

  /**
   * Log demo session start as universal transaction (Audit Trail)
   */
  private async logDemoSessionStart(
    userEntityId: string,
    organizationId: string,
    demoType: DemoUserType
  ): Promise<void> {
    try {
      const supabase = this.getSupabaseClient()
      if (!supabase) {
        console.warn('⚠️ Demo session audit log skipped: Supabase client not available')
        return
      }

      const { error } = await supabase.from('universal_transactions').insert({
        organization_id: organizationId,
        transaction_type: 'demo_session_start',
        smart_code: 'HERA.SEC.DEMO.SESSION.START.V1',
        source_entity_id: userEntityId,
        total_amount: 0,
        transaction_status: 'completed',
        ai_confidence: 1.0,
        ai_classification: {
          category: 'demo_session',
          type: 'authentication'
        },
        ai_insights: {
          demo_type: demoType,
          session_purpose: 'demonstration',
          security_level: 'demo'
        },
        business_context: {
          demo_user: true,
          session_type: 'demonstration',
          expires_after: '30_minutes'
        },
        metadata: {
          demo_type: demoType,
          session_start: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
        }
      })

      if (error) {
        console.error('⚠️ Demo session audit log failed:', error)
        // Don't fail the session for audit log issues
      } else {
        console.log('📊 Demo session logged for audit trail')
      }
    } catch (error) {
      console.error('💥 Demo session audit error:', error)
      // Don't fail the session for audit log issues
    }
  }

  /**
   * Set session context for RLS enforcement
   */
  private async setSessionContext(context: {
    org_id: string
    user_id: string
    scopes: string[]
  }): Promise<void> {
    try {
      // This would typically be done via RPC call to set PostgreSQL session variables
      // For now, we'll store in localStorage for client-side access
      if (typeof window !== 'undefined') {
        const sessionContext = {
          organization_id: context.org_id,
          user_entity_id: context.user_id,
          scopes: context.scopes,
          session_type: 'demo',
          set_at: new Date().toISOString()
        }

        localStorage.setItem('hera_session_context', JSON.stringify(sessionContext))
        console.log('🔐 HERA Session context set:', sessionContext)
      }
    } catch (error) {
      console.error('💥 Session context setup error:', error)
    }
  }

  /**
   * Check if user has required scope for operation
   */
  hasScope(requiredScope: string, userScopes: string[]): boolean {
    // Exact match or wildcard match
    return userScopes.some(
      scope =>
        scope === requiredScope ||
        (scope.endsWith('*') && requiredScope.startsWith(scope.slice(0, -1)))
    )
  }

  /**
   * Get current demo session context
   */
  getCurrentSessionContext(): {
    organization_id: string
    user_entity_id: string
    scopes: string[]
    session_type: string
  } | null {
    try {
      if (typeof window === 'undefined') return null

      const contextStr = localStorage.getItem('hera_session_context')
      return contextStr ? JSON.parse(contextStr) : null
    } catch (error) {
      console.error('💥 Session context retrieval error:', error)
      return null
    }
  }

  /**
   * Clear demo session
   */
  async clearDemoSession(): Promise<void> {
    try {
      const supabase = this.getSupabaseClient()

      // Sign out from Supabase if available
      if (supabase) {
        await supabase.auth.signOut()
      }

      // Clear session context
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hera_session_context')
      }

      console.log('🧹 Demo session cleared')
    } catch (error) {
      console.error('💥 Session clearing error:', error)
    }
  }
}

// Export singleton instance
export const demoAuthService = new DemoAuthService()
export default demoAuthService
