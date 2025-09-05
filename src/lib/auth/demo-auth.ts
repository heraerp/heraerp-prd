/**
 * Demo Authentication Service
 * Handles automatic demo user login and organization assignment
 */

import { supabaseClient as supabase } from '@/lib/supabase-client'

// Universal demo user for all demo apps
const UNIVERSAL_DEMO_USER = {
  email: 'demo@heraerp.com',
  password: 'DemoHERA2025!'
}

// Demo app configurations (for organization context)
const DEMO_APPS = {
  salon: {
    organizationName: 'Bella Beauty Salon (Demo)',
    subdomain: 'demo-salon'
  },
  'salon-data': {
    organizationName: 'Bella Beauty Salon (Demo)',
    subdomain: 'demo-salon'
  },
  icecream: {
    organizationName: 'Kochi Ice Cream Manufacturing (Demo)',
    subdomain: 'demo-icecream'
  },
  restaurant: {
    organizationName: "Mario's Restaurant (Demo)",
    subdomain: 'demo-restaurant'
  },
  healthcare: {
    organizationName: 'Dr. Smith Family Practice (Demo)',
    subdomain: 'demo-healthcare'
  }
}

export type DemoAppType = keyof typeof DEMO_APPS

/**
 * Check if a route is a demo route
 */
export function isDemoRoute(pathname: string): boolean {
  const basePath = pathname.split('/')[1]
  return Object.keys(DEMO_APPS).includes(basePath)
}

/**
 * Get demo app type from pathname
 */
export function getDemoAppType(pathname: string): DemoAppType | null {
  const basePath = pathname.split('/')[1]
  return Object.keys(DEMO_APPS).includes(basePath) ? basePath as DemoAppType : null
}

/**
 * Get demo app configuration
 */
export function getDemoAppConfig(appType: DemoAppType) {
  return DEMO_APPS[appType]
}

/**
 * Auto-login demo user
 */
export async function autoLoginDemo(appType: DemoAppType) {
  const appConfig = getDemoAppConfig(appType)
  
  try {
    // Check if already logged in as the universal demo user
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email === UNIVERSAL_DEMO_USER.email) {
      return { success: true, session, message: 'Already logged in as demo user' }
    }
    
    // Sign out if logged in as different user
    if (session) {
      await supabase.auth.signOut()
    }
    
    // Sign in as universal demo user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: UNIVERSAL_DEMO_USER.email,
      password: UNIVERSAL_DEMO_USER.password
    })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      session: data.session,
      message: `Logged in as demo user for ${appConfig.organizationName}`
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check if current user is a demo user
 */
export async function isDemoUser(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) return false
  
  return session.user.email === UNIVERSAL_DEMO_USER.email
}

/**
 * Get demo organization info for app type
 */
export function getDemoOrgForApp(appType: DemoAppType) {
  return DEMO_APPS[appType]
}