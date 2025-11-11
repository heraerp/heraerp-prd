/**
 * HERA App Registration Service
 * Smart Code: HERA.AUTH.APP_REGISTRATION.PRODUCTION.v1
 * 
 * Tracks cashew app usage and access patterns using hera_apps_register_v1 RPC
 * Provides complete audit trail of user interactions with the system
 */

import { getSupabaseService } from '@/lib/supabase-service'

export type AppAccessType = 'LOGIN' | 'LOGOUT' | 'NAVIGATION' | 'FEATURE_ACCESS' | 'ERROR' | 'SESSION_REFRESH'

export interface AppAccessMetadata {
  user_agent?: string
  timestamp: string
  module?: string
  auth_method?: string
  page_path?: string
  feature_name?: string
  error_type?: string
  session_duration?: string
  additional_data?: Record<string, any>
}

export interface AppRegistrationResult {
  success: boolean
  registration_id?: string
  timestamp: string
  duration_ms: number
  error?: string
}

/**
 * Handle HERA RPC calls with error handling
 */
async function handleRPCCall<T>(rpcName: string, params: any): Promise<T> {
  try {
    const supabaseService = getSupabaseService()
    const { data, error } = await supabaseService.rpc(rpcName, params)
    
    if (error) {
      console.error(`[${rpcName}] RPC Error:`, error)
      throw new Error(`${rpcName} failed: ${error.message}`)
    }
    
    return data
  } catch (error) {
    console.error(`[${rpcName}] Unexpected error:`, error)
    throw error
  }
}

/**
 * Register cashew app access with comprehensive tracking
 */
export async function registerCashewAccess(
  actorUserId: string,
  organizationId: string,
  accessType: AppAccessType,
  metadata?: Partial<AppAccessMetadata>
): Promise<AppRegistrationResult> {
  const startTime = Date.now()
  
  try {
    console.log(`📱 [APP_REGISTRATION] Registering ${accessType} for user:`, actorUserId)

    // Prepare comprehensive metadata
    const accessMetadata: AppAccessMetadata = {
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      timestamp: new Date().toISOString(),
      module: 'cashew_erp',
      ...metadata
    }

    // Register access via hera_apps_register_v1
    const result = await handleRPCCall('hera_apps_register_v1', {
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_app_code: 'CASHEW_MANUFACTURING_ERP',
      p_app_version: 'v1.0.0',
      p_access_type: accessType,
      p_access_metadata: accessMetadata
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ [APP_REGISTRATION] ${accessType} registered successfully in ${duration}ms`)

    return {
      success: true,
      registration_id: result?.registration_id,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    }

  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime

    console.error(`❌ [APP_REGISTRATION] Failed to register ${accessType} after ${duration}ms:`, error)

    return {
      success: false,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Register user login with detailed metadata
 */
export async function registerLogin(
  actorUserId: string,
  organizationId: string,
  authMethod: string = 'session_api',
  additionalData?: Record<string, any>
): Promise<AppRegistrationResult> {
  return registerCashewAccess(actorUserId, organizationId, 'LOGIN', {
    auth_method: authMethod,
    module: 'cashew_login',
    additional_data: additionalData
  })
}

/**
 * Register user logout with session duration
 */
export async function registerLogout(
  actorUserId: string,
  organizationId: string,
  sessionDuration?: string,
  additionalData?: Record<string, any>
): Promise<AppRegistrationResult> {
  return registerCashewAccess(actorUserId, organizationId, 'LOGOUT', {
    session_duration: sessionDuration,
    module: 'cashew_logout',
    additional_data: additionalData
  })
}

/**
 * Register page navigation with path tracking
 */
export async function registerNavigation(
  actorUserId: string,
  organizationId: string,
  pagePath: string,
  additionalData?: Record<string, any>
): Promise<AppRegistrationResult> {
  return registerCashewAccess(actorUserId, organizationId, 'NAVIGATION', {
    page_path: pagePath,
    module: 'cashew_navigation',
    additional_data: additionalData
  })
}

/**
 * Register specific feature access (entity/transaction operations)
 */
export async function registerFeatureAccess(
  actorUserId: string,
  organizationId: string,
  featureName: string,
  additionalData?: Record<string, any>
): Promise<AppRegistrationResult> {
  return registerCashewAccess(actorUserId, organizationId, 'FEATURE_ACCESS', {
    feature_name: featureName,
    module: 'cashew_features',
    additional_data: additionalData
  })
}

/**
 * Register session refresh
 */
export async function registerSessionRefresh(
  actorUserId: string,
  organizationId: string,
  additionalData?: Record<string, any>
): Promise<AppRegistrationResult> {
  return registerCashewAccess(actorUserId, organizationId, 'SESSION_REFRESH', {
    module: 'cashew_session',
    additional_data: additionalData
  })
}

/**
 * Register error for tracking and debugging
 */
export async function registerError(
  actorUserId: string,
  organizationId: string,
  errorType: string,
  errorDetails?: Record<string, any>
): Promise<AppRegistrationResult> {
  return registerCashewAccess(actorUserId, organizationId, 'ERROR', {
    error_type: errorType,
    module: 'cashew_error_tracking',
    additional_data: errorDetails
  })
}

/**
 * Bulk register multiple access events (for performance)
 */
export async function registerBulkAccess(
  registrations: Array<{
    actorUserId: string
    organizationId: string
    accessType: AppAccessType
    metadata?: Partial<AppAccessMetadata>
  }>
): Promise<AppRegistrationResult[]> {
  console.log(`📱 [APP_REGISTRATION] Processing ${registrations.length} bulk registrations`)

  const results: AppRegistrationResult[] = []

  // Process in parallel for performance
  const promises = registrations.map(async (registration) => {
    return registerCashewAccess(
      registration.actorUserId,
      registration.organizationId,
      registration.accessType,
      registration.metadata
    )
  })

  try {
    const bulkResults = await Promise.allSettled(promises)
    
    bulkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        console.error(`❌ [APP_REGISTRATION] Bulk registration ${index} failed:`, result.reason)
        results.push({
          success: false,
          timestamp: new Date().toISOString(),
          duration_ms: 0,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        })
      }
    })

    const successCount = results.filter(r => r.success).length
    console.log(`✅ [APP_REGISTRATION] Bulk registration completed: ${successCount}/${registrations.length} successful`)

    return results
  } catch (error) {
    console.error('❌ [APP_REGISTRATION] Bulk registration failed:', error)
    throw error
  }
}

/**
 * Get app usage analytics (if needed for dashboard)
 */
export async function getCashewUsageAnalytics(
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  try {
    // This would be implemented if there's a corresponding RPC for analytics
    // For now, just return a placeholder
    console.log('📊 [APP_REGISTRATION] Analytics requested for org:', organizationId)
    
    return {
      message: 'Analytics endpoint not yet implemented',
      organization_id: organizationId,
      period: { start: startDate, end: endDate }
    }
  } catch (error) {
    console.error('❌ [APP_REGISTRATION] Failed to get analytics:', error)
    throw error
  }
}

/**
 * Helper to get user agent info for registration
 */
export function getUserAgentInfo(): string {
  if (typeof window === 'undefined') return 'server'
  
  const ua = navigator.userAgent
  
  // Extract basic browser info
  if (ua.includes('Chrome')) return `Chrome/${ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown'}`
  if (ua.includes('Firefox')) return `Firefox/${ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'unknown'}`
  if (ua.includes('Safari') && !ua.includes('Chrome')) return `Safari/${ua.match(/Version\/([0-9.]+)/)?.[1] || 'unknown'}`
  if (ua.includes('Edge')) return `Edge/${ua.match(/Edge\/([0-9.]+)/)?.[1] || 'unknown'}`
  
  return 'unknown'
}

/**
 * Helper to get current page context for registration
 */
export function getCurrentPageContext(): { path: string; module: string } {
  if (typeof window === 'undefined') {
    return { path: 'server', module: 'server' }
  }

  const path = window.location.pathname
  
  // Extract module from cashew URLs
  if (path.startsWith('/cashew/')) {
    const pathParts = path.split('/')
    if (pathParts.length >= 3) {
      return {
        path,
        module: `cashew_${pathParts[2]}` // e.g., cashew_entities, cashew_transactions
      }
    }
  }

  return {
    path,
    module: path.startsWith('/cashew') ? 'cashew_general' : 'unknown'
  }
}