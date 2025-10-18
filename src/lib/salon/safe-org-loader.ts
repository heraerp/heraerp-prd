/**
 * Safe Organization Loader for Salon Dashboard
 * Provides bulletproof organization loading for both production and local environments
 */

export const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

export interface SafeOrgConfig {
  organizationId: string
  fallbackName: string
  environment: 'production' | 'local' | 'development'
}

/**
 * Get safe organization configuration for salon dashboard
 * Works in all environments with proper fallbacks
 */
export function getSafeOrgConfig(): SafeOrgConfig {
  // Primary: Environment variable
  const envOrgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
  
  // Secondary: Hardcoded safe value
  const safeOrgId = SALON_ORG_ID
  
  // Final organization ID (prefer env, fallback to safe)
  const organizationId = envOrgId || safeOrgId
  
  // Detect environment
  const environment = process.env.NODE_ENV === 'production' ? 'production' 
    : process.env.VERCEL_ENV ? 'production' 
    : 'local'
  
  return {
    organizationId,
    fallbackName: 'Hair Talkz Salon',
    environment: environment as 'production' | 'local' | 'development'
  }
}

/**
 * Safe URL generator for salon dashboard
 * Creates proper URLs for both local and production
 */
export function getSalonDashboardUrl(path: string = ''): string {
  const config = getSafeOrgConfig()
  
  if (typeof window === 'undefined') {
    // Server-side: return relative path
    return `/salon${path ? `/${path.replace(/^\//, '')}` : ''}`
  }
  
  // Client-side: use current origin
  const origin = window.location.origin
  return `${origin}/salon${path ? `/${path.replace(/^\//, '')}` : ''}`
}

/**
 * Safe authentication helper
 * Ensures organization context is properly set
 */
export function setSafeOrgContext() {
  const config = getSafeOrgConfig()
  
  if (typeof window !== 'undefined') {
    // Store in localStorage as backup
    localStorage.setItem('safeOrganizationId', config.organizationId)
    localStorage.setItem('safeOrganizationName', config.fallbackName)
    
    console.log('🛡️ Safe org context set:', config)
  }
  
  return config
}

/**
 * Validate organization ID format
 */
export function isValidOrgId(orgId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(orgId)
}

/**
 * Get organization ID with validation
 */
export function getSafeOrganizationId(): string {
  const config = getSafeOrgConfig()
  
  if (!isValidOrgId(config.organizationId)) {
    console.error('❌ Invalid organization ID format:', config.organizationId)
    return SALON_ORG_ID // Fallback to known good ID
  }
  
  return config.organizationId
}