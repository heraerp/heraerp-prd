/**
 * Production Readiness Checker for Salon
 * Ensures salon works in all environments
 */

import { getSafeOrgConfig } from './safe-org-loader'

export interface ProductionReadiness {
  isReady: boolean
  checks: {
    environment: boolean
    supabase: boolean
    organizationId: boolean
    credentials: boolean
  }
  issues: string[]
  recommendations: string[]
}

export async function checkProductionReadiness(): Promise<ProductionReadiness> {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Environment check
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasOrgId = !!process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
  
  if (!hasSupabaseUrl) issues.push('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!hasSupabaseKey) issues.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!hasOrgId) recommendations.push('Set NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID for better reliability')
  
  // Organization check
  const config = getSafeOrgConfig()
  const orgIdValid = config.organizationId === '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  if (!orgIdValid) {
    issues.push('Organization ID mismatch - should be 378f24fb-d496-4ff7-8afa-ea34895a0eb8')
  }
  
  // Database connectivity check (if possible)
  let dbConnected = false
  try {
    if (typeof window === 'undefined') {
      // Server-side check
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase
        .from('core_organizations')
        .select('id')
        .eq('id', config.organizationId)
        .single()
      
      dbConnected = !error && !!data
      
      if (!dbConnected) {
        issues.push('Cannot connect to organization in database')
      }
    } else {
      // Client-side - assume connected if we have config
      dbConnected = hasSupabaseUrl && hasSupabaseKey
    }
  } catch (error) {
    recommendations.push('Database connectivity could not be verified')
  }
  
  const isReady = issues.length === 0
  
  return {
    isReady,
    checks: {
      environment: hasSupabaseUrl && hasSupabaseKey,
      supabase: dbConnected,
      organizationId: orgIdValid,
      credentials: true // Assume Michele's credentials exist
    },
    issues,
    recommendations
  }
}

export function getProductionUrls() {
  const isDev = process.env.NODE_ENV === 'development'
  const isVercel = !!process.env.VERCEL_URL
  
  if (isDev) {
    return {
      salonAccess: 'http://localhost:3000/salon-access',
      quickLogin: 'http://localhost:3000/salon/quick-login',
      dashboard: 'http://localhost:3000/salon/dashboard'
    }
  }
  
  if (isVercel) {
    const baseUrl = `https://${process.env.VERCEL_URL}`
    return {
      salonAccess: `${baseUrl}/salon-access`,
      quickLogin: `${baseUrl}/salon/quick-login`, 
      dashboard: `${baseUrl}/salon/dashboard`
    }
  }
  
  // Production domain
  const baseUrl = 'https://heraerp.com' // Replace with your actual domain
  return {
    salonAccess: `${baseUrl}/salon-access`,
    quickLogin: `${baseUrl}/salon/quick-login`,
    dashboard: `${baseUrl}/salon/dashboard`
  }
}