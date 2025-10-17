// Demo Guard utilities for CivicFlow Communications

export const CIVICFLOW_DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

/**
 * Check if current request/session is in demo mode
 */
export function isDemoMode(orgId?: string | null): boolean {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Check URL path
    if (window.location.pathname.startsWith('/civicflow')) {
      // If no org ID provided or it matches demo org, we're in demo mode
      return !orgId || orgId === CIVICFLOW_DEMO_ORG_ID
    }
  }

  // Server-side check
  return orgId === CIVICFLOW_DEMO_ORG_ID
}

/**
 * Guard function to prevent external communications in demo mode
 */
export function demoGuard(orgId?: string | null): {
  isDemo: boolean
  message: string
} {
  const isDemo = isDemoMode(orgId)

  return {
    isDemo,
    message: isDemo
      ? 'Demo Mode: external sends disabled; all actions are simulated and logged.'
      : ''
  }
}
/**
 * Guard function for demo operations
 * Prevents certain operations in production unless explicitly allowed
 */
export function guardDemoOperation(opts?: { allowProd?: boolean; message?: string }) {
  const allowProd = !!opts?.allowProd;
  if (process.env.NODE_ENV === 'production' && !allowProd) {
    throw new Error(opts?.message ?? 'Demo-only operation blocked in production');
  }
  return true;
}
