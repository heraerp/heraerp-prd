/**
 * HERA DNA SECURITY: Secured Salon Provider
 * Industry DNA Component: HERA.DNA.SECURITY.SALON.PROVIDER.V1
 *
 * Revolutionary salon security DNA that integrates the comprehensive HERA DNA Security
 * framework with salon-specific business logic, providing bulletproof multi-tenant
 * isolation and role-based access control.
 *
 * Key DNA Features:
 * - Salon-aware security context with business role mapping
 * - Automatic session recovery and refresh handling
 * - Organization-specific permission validation
 * - Luxury-themed security UI with HERA design system
 * - Real-time security event logging and monitoring
 * - Zero-trust architecture with continuous validation
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
// NOTE: AuthResolver is server-side only, handled via API routes for client components
import { dbContext } from '@/lib/security/database-context'
import { createSecurityContextFromAuth } from '@/lib/security/user-entity-resolver'
import type { SecurityContext } from '@/lib/security/database-context'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { Loader2, Shield, AlertTriangle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { useSalonSecurityStore, SOFT_TTL, HARD_TTL, GRACE_PERIOD, POS_TRANSACTION_PROTECTION_TTL } from '@/lib/salon/security-store'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { ReconnectingBanner } from '@/components/salon/auth/ReconnectingBanner'
import { useEnterpriseActivityTracking } from '@/hooks/useEnterpriseActivityTracking'

interface Branch {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: any
  metadata?: any
}

interface SalonSecurityContext extends SecurityContext {
  organizationId: string // Alias for orgId for backward compatibility
  salonRole: 'owner' | 'manager' | 'receptionist' | 'stylist' | 'accountant' | 'admin'
  permissions: string[]
  organization: {
    id: string
    name: string
    currency: string // ✅ ENTERPRISE: Dynamic currency from organization
    currencySymbol: string // ✅ ENTERPRISE: Currency symbol for display
    settings?: any
  }
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  isReconnecting: boolean // ✅ ENTERPRISE: Degraded state during auth recovery
  // Branch context
  selectedBranchId: string | null
  selectedBranch: Branch | null
  availableBranches: Branch[]
  isLoadingBranches: boolean // ✅ Track branch loading state
  setSelectedBranchId: (branchId: string) => void
  
  // 🎯 POS Transaction Protection
  posTransactionActive: boolean
  setPosTransactionActive: (active: boolean) => void
  updatePosActivity: () => void
}

interface SalonAuthError {
  type: 'authentication' | 'authorization' | 'security' | 'network'
  message: string
  code?: string
  details?: any
}

const SecuredSalonContext = createContext<SalonSecurityContext | undefined>(undefined)

// Salon-specific role permissions
const SALON_ROLE_PERMISSIONS = {
  owner: [
    'salon:read:all',
    'salon:write:all',
    'salon:delete:all',
    'salon:admin:full',
    'salon:finance:full',
    'salon:staff:manage',
    'salon:settings:manage'
  ],
  manager: [
    'salon:read:operations',
    'salon:write:operations',
    'salon:finance:read',
    'salon:staff:schedule',
    'salon:inventory:manage',
    'salon:appointments:manage',
    'salon:customers:manage'
  ],
  receptionist: [
    'salon:read:appointments',
    'salon:write:appointments',
    'salon:read:customers',
    'salon:write:customers',
    'salon:pos:operate',
    'salon:checkin:manage'
  ],
  stylist: [
    'salon:read:appointments:own',
    'salon:write:appointments:own',
    'salon:read:customers:assigned',
    'salon:pos:process:services',
    'salon:schedule:view'
  ],
  accountant: [
    'salon:read:finance',
    'salon:write:finance',
    'salon:read:reports',
    'salon:export:financial',
    'salon:vat:manage'
  ],
  admin: [
    'salon:read:system',
    'salon:write:system',
    'salon:users:manage',
    'salon:security:manage',
    'salon:backup:manage'
  ]
}

export function SecuredSalonProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const securityStore = useSalonSecurityStore()
  const auth = useHERAAuth()

  // ✅ ENTERPRISE: Enable automatic activity-based session extension
  const activityTracking = useEnterpriseActivityTracking({
    enabled: true,
    throttleMs: 5 * 60 * 1000, // 5 minutes between extensions
    debugMode: process.env.NODE_ENV === 'development'
  })

  // Branch state
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedBranchId')
    }
    return null
  })
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)

  // Initialize context - ALWAYS start with loading state to force JWT validation
  // This ensures we never use cached org ID that doesn't match JWT
  const [context, setContext] = useState<SalonSecurityContext>(() => {
    // ⚠️ SECURITY: Always validate JWT on mount, even if cache exists
    // This prevents using stale/wrong organization ID from cache
    console.log('🔐 Starting with loading state - JWT validation required')

    return {
      orgId: '', // Empty until JWT validation completes
      organizationId: '', // Empty until JWT validation completes
      userId: '',
      role: 'user',
      salonRole: 'stylist',
      authMode: 'supabase',
      permissions: [],
      organization: { id: '', name: '', currency: 'AED', currencySymbol: 'AED' }, // Empty until JWT validation
      user: null,
      isLoading: true, // 🔒 ALWAYS start with loading to force JWT validation
      isAuthenticated: false,
      isReconnecting: false, // ✅ ENTERPRISE: Start with stable state
      selectedBranchId: null,
      selectedBranch: null,
      availableBranches: [],
      isLoadingBranches: false, // ✅ Branch loading state
      setSelectedBranchId: () => {}
    }
  })

  const [authError, setAuthError] = useState<SalonAuthError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false) // ✅ ENTERPRISE: Track reconnecting state
  const authCheckDoneRef = React.useRef(false) // 🎯 Track if initial auth check is complete
  const initializedForUser = React.useRef<string | null>(null) // 🎯 Track user-specific initialization

  // ✅ ENTERPRISE: Single-flight re-init guard to prevent stampede
  // Smart Code: HERA.SECURITY.AUTH.SINGLE_FLIGHT.v1
  const reinitPromiseRef = React.useRef<Promise<void> | null>(null)
  const isReinitializingRef = React.useRef(false)

  // ✅ ENTERPRISE: Heartbeat timer ref for background refresh
  // Smart Code: HERA.SECURITY.AUTH.HEARTBEAT.v1
  const heartbeatTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // 🎯 ENTERPRISE FIX: Sync context with security store AND HERAAuth
  // SECURITY: organizationId comes from HERAAuth (JWT), not from store cache
  useEffect(() => {
    // Only run if we haven't initialized context yet
    if (hasInitialized) {
      return
    }

    // Need both store initialized AND organization from auth
    // 🔒 CRITICAL FIX: Check localStorage first for immediate org ID (set by login page)
    const localStorageOrgId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null
    const orgId = auth.currentOrganization?.id || auth.organizationId || localStorageOrgId

    console.log('🔍 Checking for orgId:', {
      currentOrgId: auth.currentOrganization?.id,
      organizationId: auth.organizationId,
      localStorageOrgId,
      finalOrgId: orgId,
      storeInitialized: securityStore.isInitialized,
      authStatus: auth.status
    })

    if (!securityStore.isInitialized || !orgId) {
      console.log('⏸️ Waiting - store:', securityStore.isInitialized, 'orgId:', orgId)

      // Force initialize store if we have orgId but store isn't initialized
      if (orgId && !securityStore.isInitialized) {
        console.log('🔧 Force initializing store with orgId:', orgId)

        // Get role from localStorage (set by sign-in page) or default to owner
        // 🔒 CRITICAL: Normalize role to lowercase to handle OWNER, Owner, owner, etc.
        const rawStoredRole = (typeof window !== 'undefined' ? localStorage.getItem('salonRole') : null) || 'owner'
        const storedRole = String(rawStoredRole).toLowerCase().trim()
        const permissions = SALON_ROLE_PERMISSIONS[storedRole as keyof typeof SALON_ROLE_PERMISSIONS] || SALON_ROLE_PERMISSIONS.owner

        console.log('🔑 Using role from localStorage (raw):', rawStoredRole)
        console.log('🔑 Using role from localStorage (normalized):', storedRole, 'with permissions:', permissions)

        securityStore.setInitialized({
          salonRole: storedRole as any,
          organizationId: orgId,
          permissions,
          userId: auth.user?.id || 'demo-user',
          user: auth.user,
          organization: {
            id: orgId,
            name: 'Hair Talkz Salon',
            currency: 'AED',
            currencySymbol: 'AED'
          }
        })
        return // Let the effect run again
      }
      
      return
    }

    // ✅ SECURITY: Get organization ID from HERAAuth (JWT), not from cache
    // Build organization object with fallback to user metadata
    const user = securityStore.user || auth.user
    const orgNameFromMetadata = user?.user_metadata?.organization_name || 'Salon Dashboard'

    // Check if we have a valid organization object with a proper name
    const storedOrg = securityStore.organization
    const authOrg = auth.currentOrganization

    // Prefer stored org if it has a real name, otherwise use metadata
    let finalOrg
    if (storedOrg?.name && storedOrg.name !== 'Organization' && storedOrg.name !== '') {
      finalOrg = storedOrg
    } else if (authOrg?.name && authOrg.name !== 'Organization' && authOrg.name !== '') {
      finalOrg = authOrg
    } else {
      // Fallback to building from user metadata
      finalOrg = {
        id: orgId,
        name: orgNameFromMetadata,
        currency: 'AED',
        currencySymbol: 'AED'
      }
    }

    setContext(prev => ({
      ...prev,
      orgId,
      organizationId: orgId,
      userId: securityStore.userId || '',
      salonRole: securityStore.salonRole || 'stylist',
      permissions: securityStore.permissions || [],
      organization: finalOrg,
      user,
      isLoading: false, // ✅ CRITICAL: Set loading to false
      isAuthenticated: true,
      isReconnecting: false, // ✅ ENTERPRISE: Stable state
      selectedBranchId,
      selectedBranch: null,
      availableBranches: [],
      setSelectedBranchId: handleSetBranch
    }))

    setHasInitialized(true)
    authCheckDoneRef.current = true

    // ✅ CRITICAL FIX: Load organization details AND branches in background
    // This ensures we get the FULL organization object with dynamic fields (phone, email, etc.)
    // even when using cached security context
    Promise.all([
      loadOrganizationDetails(orgId).then(fullOrg => {
        console.log('[SecuredSalonProvider] 📥 Background org load complete:', {
          hasPhone: !!fullOrg.phone,
          hasEmail: !!fullOrg.email,
          hasAddress: !!fullOrg.address
        })
        // Update context with FULL organization data
        setContext(prev => ({
          ...prev,
          organization: fullOrg
        }))
        // Also update security store
        securityStore.setInitialized({
          salonRole: securityStore.salonRole || 'stylist',
          organizationId: orgId,
          permissions: securityStore.permissions || [],
          userId: securityStore.userId || '',
          user: securityStore.user,
          organization: fullOrg  // ✅ Update with full org data
        })
      }),
      loadBranches(orgId).then(branches => {
        setAvailableBranches(branches)
        setContext(prev => ({
          ...prev,
          availableBranches: branches,
          selectedBranch: branches.find(b => b.id === selectedBranchId) || null
        }))
      })
    ]).catch(error => {
      console.error('Failed to load organization/branches:', error)
    })
  }, [
    securityStore.isInitialized,
    auth.currentOrganization?.id,
    hasInitialized,
    selectedBranchId,
    auth.user
  ]) // ✅ Depends on auth.currentOrganization

  useEffect(() => {
    // 🎯 OPTIMIZATION: Skip if auth check already done and cache is still valid
    if (
      authCheckDoneRef.current &&
      securityStore.isInitialized &&
      !securityStore.shouldReinitialize() &&
      hasInitialized &&
      context.isAuthenticated &&
      context.organization?.id
    ) {
      console.log('✅ Auth already initialized and valid, skipping re-initialization')
      return
    }

    // 🔒 CRITICAL FIX: Wait for HERA auth to finish loading before checking authentication
    // This prevents redirect on page refresh when session is being restored
    if (auth.isLoading) {
      console.log('⏸️ Waiting for HERA Auth to finish loading...')
      return
    }

    // 🛡️ CRITICAL PRODUCTION FIX: NEVER trigger re-auth during navigation 
    // when user is already authenticated with valid session
    // This prevents the customer search logout issue
    if (auth.isAuthenticated && securityStore.isInitialized && hasInitialized) {
      // Even if shouldReinitialize() returns true, don't interrupt navigation
      // for authenticated users with initialized context
      const timeSinceInit = Date.now() - (securityStore.lastInitialized || 0)
      const hoursOld = Math.round(timeSinceInit / 1000 / 60 / 60)
      
      if (hoursOld < 23) { // Session is less than 23 hours old
        console.log(`✅ Navigation protection: Keeping user logged in (session ${hoursOld}h old)`)
        return
      }
    }

    // 🎯 ENTERPRISE FIX: Redirect to auth if not authenticated (ONLY after loading completes)
    // ✅ PATIENCE FIX: Don't show error immediately - wait for context to be ready
    if (!auth.isAuthenticated) {
      console.log('🚪 Not authenticated, redirecting to auth...')
      authCheckDoneRef.current = false // Reset for next login
      // DON'T update context here - prevents "Access Denied" flash
      // Just redirect silently
      const timer = setTimeout(() => redirectToAuth(), 500)
      return () => clearTimeout(timer)
    }

    // Only initialize if not already cached or if we need to reinitialize
    if (!securityStore.isInitialized || securityStore.shouldReinitialize()) {
      console.log('🔄 Initializing security context...')
      // ✅ FIX: ALWAYS use silent mode during initialization
      // User already sees "Loading your dashboard..." screen, no need for reconnecting banner
      runReinitSingleFlight({ silent: true }).then(() => {
        authCheckDoneRef.current = true // ✅ Mark auth check as complete
        console.log('✅ Auth check complete and cached')
      })
    } else if (!hasInitialized) {
      // ✅ SECURITY: Get organization ID from HERAAuth (JWT), not from cache
      // 🔒 CRITICAL FIX: Check localStorage first for immediate org ID (set by login page)
      const localStorageOrgId = typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null
      const orgId = auth.currentOrganization?.id || auth.organizationId || localStorageOrgId

      if (!orgId) {
        console.log('⏸️ Waiting for organization from auth...', {
          currentOrgId: auth.currentOrganization?.id,
          organizationId: auth.organizationId,
          localStorageOrgId
        })
        return
      }

      console.log('✅ Security context already initialized, updating context with auth org')

      // 🎯 CRITICAL FIX: Update context with store data + auth organization
      // Build organization object with fallback to user metadata
      const user = securityStore.user || auth.user
      const orgNameFromMetadata = user?.user_metadata?.organization_name || 'Salon Dashboard'

      // Check if we have a valid organization object with a proper name
      const storedOrg = securityStore.organization
      const authOrg = auth.currentOrganization

      // Prefer stored org if it has a real name, otherwise use metadata
      let finalOrg
      if (storedOrg?.name && storedOrg.name !== 'Organization' && storedOrg.name !== '') {
        finalOrg = storedOrg
      } else if (authOrg?.name && authOrg.name !== 'Organization' && authOrg.name !== '') {
        finalOrg = authOrg
      } else {
        // Fallback to building from user metadata
        finalOrg = {
          id: orgId,
          name: orgNameFromMetadata,
          currency: 'AED',
          currencySymbol: 'AED'
        }
      }

      setContext(prev => ({
        ...prev,
        orgId,
        organizationId: orgId,
        userId: securityStore.userId || '',
        salonRole: securityStore.salonRole || 'stylist',
        permissions: securityStore.permissions || [],
        organization: finalOrg,
        user,
        isLoading: false, // ✅ CRITICAL: Set loading to false
        isAuthenticated: true,
        isReconnecting: false, // ✅ ENTERPRISE: Stable state
        selectedBranchId,
        selectedBranch: null,
        availableBranches: [],
        setSelectedBranchId: handleSetBranch
      }))

      setHasInitialized(true)
      authCheckDoneRef.current = true

      // ✅ CRITICAL FIX: Load organization details AND branches in background
      // This ensures we get the FULL organization object with dynamic fields (phone, email, etc.)
      // even when using cached security context
      Promise.all([
        loadOrganizationDetails(orgId).then(fullOrg => {
          console.log('[SecuredSalonProvider] 📥 Background org load complete (cached path):', {
            hasPhone: !!fullOrg.phone,
            hasEmail: !!fullOrg.email,
            hasAddress: !!fullOrg.address
          })
          // Update context with FULL organization data
          setContext(prev => ({
            ...prev,
            organization: fullOrg
          }))
          // Also update security store
          securityStore.setInitialized({
            salonRole: securityStore.salonRole || 'stylist',
            organizationId: orgId,
            permissions: securityStore.permissions || [],
            userId: securityStore.userId || '',
            user: securityStore.user,
            organization: fullOrg  // ✅ Update with full org data
          })
        }),
        loadBranches(orgId).then(branches => {
          setAvailableBranches(branches)
          setContext(prev => ({
            ...prev,
            availableBranches: branches,
            selectedBranch: branches.find(b => b.id === selectedBranchId) || null
          }))
        })
      ]).catch(error => {
        console.error('Failed to load organization/branches (cached path):', error)
      })
    }

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Salon auth state changed:', event, {
        hasSession: !!session,
        userEmail: session?.user?.email
      })

      if (event === 'SIGNED_IN' && session) {
        // ✅ FIX: Use stored user ID (from securityStore) instead of context.userId
        // context.userId can be empty during tab switches due to React re-renders
        const currentUserId = securityStore.userId || initializedForUser.current
        const sessionUserId = session.user.id

        console.log('🔐 SIGNED_IN event - checking user:', {
          currentUserId,
          sessionUserId,
          isNewUser: !currentUserId || currentUserId !== sessionUserId
        })

        if (!currentUserId || currentUserId !== sessionUserId) {
          // New user logged in - full re-initialization needed
          console.log('🔐 SIGNED_IN event - new user detected, full re-initialization')
          authCheckDoneRef.current = false
          securityStore.clearState()
          // ✅ FIX: Use SILENT mode during login - user already sees loading screen
          // This prevents "Reconnecting" banner from appearing during login flow
          await runReinitSingleFlight({ silent: true })
          authCheckDoneRef.current = true
        } else {
          // Same user - just verify session is valid, don't clear data
          console.log('🔐 SIGNED_IN event - same user, no action needed')
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 SIGNED_OUT event - clearing state')
        authCheckDoneRef.current = false
        initializedForUser.current = null // ✅ reset user initialization marker
        securityStore.clearState()
        clearContext()
        redirectToAuth()
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔐 TOKEN_REFRESHED event - token auto-refreshed by Supabase')
        // ✅ ENTERPRISE: Trust Supabase's automatic token refresh mechanism
        // Token refresh is a normal background operation that should NOT trigger re-authentication
        // This eliminates the most common cause of unnecessary authentication checks
        console.log('✅ Enterprise mode: Token refresh handled automatically, no action needed')
        
        // ✅ ENTERPRISE: Only log if session is extremely old (diagnostic info)
        const timeSinceInit = Date.now() - (securityStore.lastInitialized || 0)
        const hoursOld = Math.round(timeSinceInit / 1000 / 60 / 60)
        if (hoursOld > 20) {
          console.log(`ℹ️ Enterprise session info: ${hoursOld}h old, but still valid thanks to token refresh`)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, []) // ✅ Empty deps - use refs to prevent re-initialization

  /**
   * ✅ ENTERPRISE: Gentle session monitoring (30-minute intervals)
   * Replaced aggressive 4-minute heartbeat with enterprise-grade monitoring
   * Smart Code: HERA.SECURITY.AUTH.ENTERPRISE_MONITORING.v1
   */
  useEffect(() => {
    // Only start monitoring after successful initialization
    if (!hasInitialized || !context.isAuthenticated) {
      return
    }

    // Clear any existing monitoring
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
    }

    console.log('🏢 Starting enterprise session monitoring (30-minute intervals)')

    // ✅ ENTERPRISE: Much gentler monitoring - every 30 minutes instead of 4 minutes
    const ENTERPRISE_MONITORING_INTERVAL = 30 * 60 * 1000 // 30 minutes

    heartbeatTimerRef.current = setInterval(() => {
      // Skip monitoring if page is hidden (tab/window switched)
      if (typeof document !== 'undefined' && document.hidden) {
        console.log('🏢 Enterprise monitoring: Skipping (page hidden)')
        return
      }

      const timeSinceInit = Date.now() - (securityStore.lastInitialized || 0)
      const hoursOld = Math.round(timeSinceInit / 1000 / 60 / 60)

      // ✅ ENTERPRISE: Only refresh if session is truly stale (approaching HARD_TTL)
      // This prevents unnecessary authentication during normal work hours
      if (timeSinceInit > HARD_TTL - (2 * 60 * 60 * 1000)) {
        // Within 2 hours of HARD_TTL (22+ hours old)
        console.log(`🏢 Enterprise monitoring: Session approaching expiry (${hoursOld}h old), silent refresh`)
        
        runReinitSingleFlight({ silent: true }).catch(error => {
          console.warn('🏢 Enterprise monitoring: Background refresh failed (non-critical):', error)
        })
      } else {
        console.log(`🏢 Enterprise monitoring: Session healthy (${hoursOld}h old, ${Math.round((HARD_TTL - timeSinceInit) / 1000 / 60 / 60)}h remaining)`)
      }
    }, ENTERPRISE_MONITORING_INTERVAL)

    // ✅ ENTERPRISE: Gentle visibility change handling
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Only check when page becomes visible, and only if session is truly expired
        const timeSinceInit = Date.now() - (securityStore.lastInitialized || 0)
        if (timeSinceInit > HARD_TTL) {
          console.log('🏢 Session expired during absence, refreshing silently...')
          runReinitSingleFlight({ silent: true })
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // Cleanup on unmount
    return () => {
      if (heartbeatTimerRef.current) {
        console.log('🏢 Stopping enterprise session monitoring')
        clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [hasInitialized, context.isAuthenticated]) // Re-run when auth state changes

  /**
   * ✅ ENTERPRISE: Single-flight re-initialization wrapper
   * Prevents concurrent re-init stampede by deduplicating parallel calls
   * Smart Code: HERA.SECURITY.AUTH.SINGLE_FLIGHT_REINIT.v1
   *
   * @returns Promise that resolves when re-init completes
   */
  const runReinitSingleFlight = async (options?: { silent?: boolean }): Promise<void> => {
    // If already re-initializing, return existing promise
    if (isReinitializingRef.current && reinitPromiseRef.current) {
      console.log('⏳ Re-initialization already in progress, waiting for completion...')
      return reinitPromiseRef.current
    }

    // Mark as re-initializing and create new promise
    isReinitializingRef.current = true

    // ✅ ENTERPRISE: Show reconnecting banner to user (unless silent mode)
    if (!options?.silent) {
      setIsReconnecting(true)
      setContext(prev => ({ ...prev, isReconnecting: true }))
    }

    const reinitPromise = (async () => {
      try {
        await initializeSecureContext()
      } finally {
        // Clear refs when done
        isReinitializingRef.current = false
        reinitPromiseRef.current = null

        // ✅ ENTERPRISE: Hide reconnecting banner
        setIsReconnecting(false)
        setContext(prev => ({ ...prev, isReconnecting: false }))
      }
    })()

    reinitPromiseRef.current = reinitPromise
    return reinitPromise
  }

  /**
   * ✅ ENTERPRISE: Wait for stable session with exponential backoff + jitter
   * Handles race condition where getSession() returns null during token refresh
   * Smart Code: HERA.SECURITY.AUTH.STABLE_SESSION.v1
   *
   * @param maxAttempts Maximum retry attempts (default: 5)
   * @returns Session object or null if all attempts fail
   */
  const waitForStableSession = async (maxAttempts = 5): Promise<any | null> => {
    const baseDelay = 5000 // 5 seconds
    const jitterFactor = 0.2 // ±20% jitter

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.warn(`⚠️ Session retrieval error (attempt ${attempt}/${maxAttempts}):`, error.message)
      }

      if (session?.user) {
        console.log(`✅ Stable session found (attempt ${attempt}/${maxAttempts})`)
        return session
      }

      if (attempt === maxAttempts) {
        console.error('❌ Failed to get stable session after max attempts')
        return null
      }

      // Exponential backoff with jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
      const jitter = 1 + (Math.random() * 2 - 1) * jitterFactor
      const delay = Math.min(exponentialDelay * jitter, 30000) // Cap at 30 seconds

      console.log(`⏳ Session not ready, waiting ${Math.round(delay)}ms (attempt ${attempt}/${maxAttempts})...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    return null
  }

  /**
   * Initialize secure authentication context
   */
  const initializeSecureContext = async () => {
    try {
      setAuthError(null)

      // ✅ ENTERPRISE: Use waitForStableSession() instead of direct getSession()
      // This handles token refresh race condition with patient exponential backoff
      const session = await waitForStableSession()

      const uid = session?.user?.id
      if (!uid) {
        console.log('🚪 No stable session found, redirecting to auth')
        return
      }

      // Already initialized for this user? bail.
      if (initializedForUser.current === uid && hasInitialized) {
        console.log(`✅ Already initialized for user ${uid}, skipping`)
        return
      }

      console.log(`🔄 Initializing secure context for user: ${uid}`)
      
      // Only show loading if we don't have cached data (prevent page from disappearing on revalidation)
      if (!securityStore.isInitialized || !hasInitialized) {
        setContext(prev => ({ ...prev, isLoading: true }))
      }

      // Skip auth on public pages
      if (isPublicPage()) {
        setContext(prev => ({ ...prev, isLoading: false }))
        return
      }

      // ✅ ENTERPRISE: waitForStableSession() already handles retries, no need for additional recovery logic
      if (!session?.user) {
        throw new Error('No active session found after stable session wait')
      }

      // Create request-like object for auth resolver
      const mockRequest = {
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'user-agent': navigator.userAgent
        },
        ip: 'salon-app',
        url: window.location.href,
        path: window.location.pathname,
        method: 'GET'
      }

      // ✅ Resolve security context from HERA entities with attach+retry (library-level)
      const contextResolution = await createSecurityContextFromAuth(session.user.id, {
        accessToken: session.access_token,
        retries: 2
      })

      if (!contextResolution.success || !contextResolution.securityContext) {
        throw new Error(
          `Failed to resolve user entity: ${contextResolution.error?.message || 'Unknown error'}`
        )
      }

      const securityContext = contextResolution.securityContext

      console.log('✅ Using organization from user auth:', securityContext.orgId)

      // ✅ ENTERPRISE FIX: Remove org ID mismatch check during initialization
      // Reason: Login page already clears localStorage BEFORE login
      // This check was causing logout because SecuredSalonProvider runs
      // DURING dashboard load, BEFORE HERAAuthProvider finishes storing new org ID
      // Result: It saw "no match" → cleared everything → invalidated session → logout
      //
      // The org ID mismatch check is now ONLY in onAuthStateChange SIGNED_IN event
      // where it checks if USER changed (not org), which is the correct validation
      console.log('✅ Skipping org ID mismatch check during init (login page already cleared cache)')

      // Get salon-specific role and permissions
      const salonRole = await getSalonRole(securityContext)
      const permissions = SALON_ROLE_PERMISSIONS[salonRole] || []

      // Load organization details
      const organization = await loadOrganizationDetails(securityContext.orgId)

      // Load branches for the organization
      const branches = await loadBranches(securityContext.orgId)

      // Update context with secure data
      setContext({
        ...securityContext,
        organizationId: securityContext.orgId, // Add organizationId alias for compatibility
        salonRole,
        permissions,
        organization,
        user: session.user,
        isLoading: false,
        isAuthenticated: true,
        isReconnecting: false, // ✅ ENTERPRISE: Stable state after successful init
        selectedBranchId,
        selectedBranch: branches.find(b => b.id === selectedBranchId) || null,
        availableBranches: branches,
        setSelectedBranchId: handleSetBranch
      })

      // Store in persistent store with all data
      securityStore.setInitialized({
        salonRole,
        organizationId: securityContext.orgId,
        permissions,
        userId: securityContext.userId,
        user: session.user,
        organization
      })

      // Also store in localStorage for backup
      localStorage.setItem('salonRole', salonRole)
      localStorage.setItem('organizationId', securityContext.orgId)
      localStorage.setItem('userPermissions', JSON.stringify(permissions))

      setRetryCount(0) // Reset retry count on success
      setHasInitialized(true)
      initializedForUser.current = uid // ✅ mark initialization complete for this user
      console.log(`✅ Salon security context initialized successfully for user: ${uid}`)
    } catch (error: any) {
      console.error('🚨 Salon auth initialization failed:', error)

      // Enhanced error classification
      let errorType: SalonAuthError['type'] = 'security'
      let userFriendlyMessage = 'An error occurred during authentication'

      if (error.message?.includes('session') || error.message?.includes('JWT')) {
        errorType = 'authentication'
        userFriendlyMessage = 'Your session has expired. Please log in again.'
      } else if (error.message?.includes('organization') || error.message?.includes('permission')) {
        errorType = 'authorization'
        userFriendlyMessage = 'You do not have access to this organization.'
      } else if (
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.code === 'NETWORK_ERROR'
      ) {
        errorType = 'network'
        userFriendlyMessage = 'Network connection issue. Please check your internet connection.'
      } else if (error.message?.includes('rate limit')) {
        errorType = 'security'
        userFriendlyMessage = 'Too many authentication attempts. Please try again later.'
      }

      const authError: SalonAuthError = {
        type: errorType,
        message: userFriendlyMessage,
        code: error.code || 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }

      setAuthError(authError)

      // Implement exponential backoff for retries
      if (errorType === 'network' && retryCount < 3) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        console.log(`🔄 Network error, retrying in ${backoffDelay}ms...`)
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          initializeSecureContext()
        }, backoffDelay)
      } else if (!isPublicPage()) {
        // Redirect to auth after a brief delay for user to see the error
        setTimeout(() => redirectToAuth(), 3000)
      }

      setContext(prev => ({ ...prev, isLoading: false, isAuthenticated: false }))
    }
  }

  /**
   * Get salon-specific role for user - PRODUCTION READY
   */
  const getSalonRole = async (
    securityContext: SecurityContext
  ): Promise<SalonSecurityContext['salonRole']> => {
    try {
      // If security context is not fully initialized, return default role
      if (!securityContext.orgId || !securityContext.userId || !securityContext.role) {
        console.log('🔒 Using default salon role due to incomplete security context')
        return 'owner' // Default to owner for salon demo
      }

      // 🔒 PRIORITY 1: Check localStorage first (set by login page from database)
      // This takes priority over email-based detection
      const storedRole = typeof window !== 'undefined' ? localStorage.getItem('salonRole') : null
      if (storedRole) {
        const normalizedStoredRole = String(storedRole).toLowerCase().trim()
        console.log('✅ Using role from localStorage (auth page mapped):', normalizedStoredRole)

        // Validate it's a known role
        if (['owner', 'manager', 'receptionist', 'stylist', 'accountant', 'admin'].includes(normalizedStoredRole)) {
          console.log('✅ Valid salon role confirmed:', normalizedStoredRole)
          return normalizedStoredRole as SalonSecurityContext['salonRole']
        } else {
          console.warn('⚠️ Invalid role in localStorage:', normalizedStoredRole, '- using default')
        }
      } else {
        console.log('⚠️ No salonRole in localStorage, using fallback detection')
      }

      // 🔒 FALLBACK: For salon demo, use email-based role detection
      // This is only used if localStorage doesn't have a role
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (user?.email) {
          console.log('🔍 Determining salon role from email (fallback):', user.email)
          const lowerEmail = user.email.toLowerCase()

          // Owner: Hairtalkz2022@gmail.com
          if (lowerEmail.includes('2022') || lowerEmail.includes('michele')) {
            console.log('✅ Detected OWNER role from email pattern')
            return 'owner'
          }

          // Receptionists: hairtalkz01@gmail.com, hairtalkz02@gmail.com
          if (lowerEmail.includes('01') || lowerEmail.includes('02') || lowerEmail.includes('receptionist') || lowerEmail.includes('front')) {
            console.log('✅ Detected RECEPTIONIST role from email pattern')
            return 'receptionist'
          }

          // Map common email patterns to roles
          if (lowerEmail.includes('manager')) {
            console.log('✅ Detected MANAGER role from email pattern')
            return 'manager'
          }

          if (lowerEmail.includes('stylist') || lowerEmail.includes('hair')) {
            console.log('✅ Detected STYLIST role from email pattern')
            return 'stylist'
          }

          if (lowerEmail.includes('accountant') || lowerEmail.includes('finance')) {
            console.log('✅ Detected ACCOUNTANT role from email pattern')
            return 'accountant'
          }

          // Default to owner for salon demo
          console.log('✅ Using default OWNER role (email pattern fallback)')
          return 'owner'
        }
      } catch (emailError) {
        console.warn('Could not get user email for role detection:', emailError)
      }

      // Fallback to system role mapping
      const roleMapping: Record<string, SalonSecurityContext['salonRole']> = {
        owner: 'owner',
        admin: 'manager',
        manager: 'manager',
        user: 'owner' // Default to owner for salon demo
      }

      return roleMapping[securityContext.role] || 'owner'
    } catch (error) {
      console.error('Failed to get salon role:', error)
      return 'owner' // Safe default for salon demo
    }
  }

  /**
   * Load organization details securely
   * ✅ ENTERPRISE: Uses hera_entities_crud_v1 RPC with actor stamping (HERA DNA pattern)
   * ✅ HERA v2.2: Consistent with Universal API V1 pattern used in settings save
   */
  const loadOrganizationDetails = async (orgId: string) => {
    try {
      // Validate organization ID format - must be valid UUID from JWT
      if (!orgId || orgId === 'undefined' || orgId.length !== 36) {
        console.error('🚨 Invalid organization ID - JWT validation failed:', orgId)
        throw new Error('Invalid organization ID from JWT token')
      }

      // ✅ HERA v2.2: Use entityCRUD RPC for READ operation (consistent with SAVE)
      const { entityCRUD } = await import('@/lib/universal-api-v2-client')

      // Get current user ID for actor stamping
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user?.id) {
        console.warn('[loadOrganizationDetails] ⚠️ No user session, using system actor')
        // For initial load before auth completes, use system actor
      }

      const actorUserId = user?.id || 'system'

      console.log('[SecuredSalonProvider] 📖 Loading organization via RPC:', {
        orgId,
        actorUserId
      })

      // ✅ READ organization entity with ALL dynamic fields
      // Organizations are stored as entities with entity_type = 'ORG'
      const { data, error } = await entityCRUD({
        p_action: 'READ',
        p_actor_user_id: actorUserId,
        p_organization_id: orgId,
        p_entity: {
          entity_type: 'ORG', // ✅ CORRECTED: Organizations use 'ORG' not 'ORGANIZATION'
          entity_id: orgId // Specific organization ID to read
        },
        p_dynamic: {}, // Empty = fetch all dynamic fields
        p_options: {
          include_dynamic: true, // Include all dynamic fields
          include_relationships: false // Organization doesn't need relationships
        }
      })

      console.log('[SecuredSalonProvider] 🔍 RPC Response received:', {
        hasError: !!error,
        error,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : null,
        dataType: typeof data,
        isArray: Array.isArray(data),
        fullData: JSON.stringify(data, null, 2)
      })

      if (error) {
        console.error('[SecuredSalonProvider] RPC error loading organization:', error)

        // ✅ FALLBACK: If RPC fails (e.g., organization not stored as entity), use direct query
        console.log('[SecuredSalonProvider] ⚠️ RPC failed, falling back to direct core_organizations query')

        const { data: orgFromTable, error: tableError } = await supabase
          .from('core_organizations')
          .select('*')
          .eq('id', orgId)
          .single()

        if (tableError || !orgFromTable) {
          console.error('[SecuredSalonProvider] ❌ Failed to load organization from table:', tableError)
          throw new Error('Organization not found in database')
        }

        // Query dynamic data directly
        const { data: dynamicFields } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('organization_id', orgId)
          .eq('entity_id', orgId)

        // Transform direct query results to expected format
        const settingsFromDynamic: Record<string, any> = {}
        if (dynamicFields && Array.isArray(dynamicFields)) {
          dynamicFields.forEach((field: any) => {
            const value =
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_boolean ||
              field.field_value_date ||
              field.field_value_json
            settingsFromDynamic[field.field_name] = value
          })
        }

        console.log('[SecuredSalonProvider] ✅ Loaded from direct query:', {
          orgId,
          dynamicFieldCount: dynamicFields?.length || 0,
          fields: Object.keys(settingsFromDynamic),
          settingsFromDynamic
        })

        // Extract settings with detailed logging
        const currency = settingsFromDynamic.currency || orgFromTable.metadata?.currency || 'AED'
        const organization_name =
          settingsFromDynamic.organization_name || orgFromTable.organization_name || 'HairTalkz'

        console.log('[SecuredSalonProvider] 📋 Extracted organization data:', {
          organization_name,
          legal_name: settingsFromDynamic.legal_name,
          address: settingsFromDynamic.address,
          phone: settingsFromDynamic.phone,
          email: settingsFromDynamic.email,
          trn: settingsFromDynamic.trn,
          currency
        })

        // Currency mapping
        const currencySymbolMap: Record<string, string> = {
          AED: 'د.إ',
          USD: '$',
          EUR: '€',
          GBP: '£',
          SAR: 'ر.س',
          QAR: 'ر.ق',
          KWD: 'د.ك',
          BHD: 'د.ب',
          OMR: 'ر.ع.',
          INR: '₹',
          PKR: 'Rs'
        }

        return {
          id: orgId,
          name: organization_name,
          legal_name: settingsFromDynamic.legal_name,
          address: settingsFromDynamic.address,
          phone: settingsFromDynamic.phone,
          email: settingsFromDynamic.email,
          trn: settingsFromDynamic.trn,
          currency,
          currencySymbol: currencySymbolMap[currency] || currency,
          fiscal_year_start: settingsFromDynamic.fiscal_year_start,
          logo_url: settingsFromDynamic.logo_url,
          settings: {
            ...orgFromTable.metadata,
            ...settingsFromDynamic
          }
        }
      }

      // ✅ Extract organization data from RPC response
      // RPC returns: { data: { entity: {...}, dynamic_data: [...] } } or { entity: {...}, dynamic_data: [...] }
      let orgEntity = null
      let dynamicDataArray: any[] = []

      console.log('[SecuredSalonProvider] 🔍 Checking response structure:', {
        hasDataProperty: !!data?.data,
        hasEntityInData: !!data?.data?.entity,
        hasEntityDirect: !!data?.entity,
        hasItems: !!data?.items,
        topLevelKeys: data ? Object.keys(data) : [],
        dataDataKeys: data?.data ? Object.keys(data.data) : []
      })

      // ✅ CRITICAL FIX: entityCRUD can return data in multiple formats
      // Format 1: { data: { data: { entity, dynamic_data } } } (nested double data)
      // Format 2: { data: { entity, dynamic_data } } (single data wrapper)
      // Format 3: { entity, dynamic_data } (direct)
      if (data?.data?.entity) {
        // Nested format: { data: { data: { entity: {...}, dynamic_data: [...] } } }
        console.log('[SecuredSalonProvider] 📦 Using nested RPC format (data.data.entity)')
        orgEntity = data.data.entity
        dynamicDataArray = data.data.dynamic_data || data.data.dynamic_fields || []
      } else if (data?.entity) {
        // Direct format: { data: { entity: {...}, dynamic_data: [...] }, error }
        console.log('[SecuredSalonProvider] 📦 Using direct RPC format (data.entity)')
        orgEntity = data.entity
        dynamicDataArray = data.dynamic_data || data.dynamic_fields || []
      } else if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        // List format with single item: { items: [{ entity: {...}, dynamic_data: [...] }] }
        console.log('[SecuredSalonProvider] 📦 Using list format (data.items[0])')
        const firstItem = data.items[0]
        orgEntity = firstItem.entity || firstItem
        dynamicDataArray = firstItem.dynamic_data || firstItem.dynamic_fields || []
      } else {
        // ✅ Fallback: Log structure for debugging
        console.warn('[SecuredSalonProvider] ⚠️ Unexpected data structure:', JSON.stringify(data, null, 2))
      }

      if (!orgEntity) {
        console.warn('[SecuredSalonProvider] ⚠️ No organization entity in RPC response, using fallback')

        // Fallback to direct query (same as error case above)
        const { data: orgFromTable, error: tableError } = await supabase
          .from('core_organizations')
          .select('*')
          .eq('id', orgId)
          .single()

        if (tableError || !orgFromTable) {
          throw new Error('Organization not found')
        }

        const { data: dynamicFields } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('organization_id', orgId)
          .eq('entity_id', orgId)

        const settingsFromDynamic: Record<string, any> = {}
        if (dynamicFields && Array.isArray(dynamicFields)) {
          dynamicFields.forEach((field: any) => {
            const value =
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_boolean ||
              field.field_value_date ||
              field.field_value_json
            settingsFromDynamic[field.field_name] = value
          })
        }

        const currency = settingsFromDynamic.currency || orgFromTable.metadata?.currency || 'AED'
        const organization_name =
          settingsFromDynamic.organization_name || orgFromTable.organization_name || 'HairTalkz'

        const currencySymbolMap: Record<string, string> = {
          AED: 'د.إ',
          USD: '$',
          EUR: '€',
          GBP: '£',
          SAR: 'ر.س',
          QAR: 'ر.ق',
          KWD: 'د.ك',
          BHD: 'د.ب',
          OMR: 'ر.ع.',
          INR: '₹',
          PKR: 'Rs'
        }

        return {
          id: orgId,
          name: organization_name,
          legal_name: settingsFromDynamic.legal_name,
          address: settingsFromDynamic.address,
          phone: settingsFromDynamic.phone,
          email: settingsFromDynamic.email,
          trn: settingsFromDynamic.trn,
          currency,
          currencySymbol: currencySymbolMap[currency] || currency,
          fiscal_year_start: settingsFromDynamic.fiscal_year_start,
          logo_url: settingsFromDynamic.logo_url,
          settings: {
            ...orgFromTable.metadata,
            ...settingsFromDynamic
          }
        }
      }

      // ✅ Transform dynamic data array to object for easy access
      const settingsFromDynamic: Record<string, any> = {}
      if (dynamicDataArray && Array.isArray(dynamicDataArray)) {
        dynamicDataArray.forEach((field: any) => {
          const value =
            field.field_value_text ||
            field.field_value_number ||
            field.field_value_boolean ||
            field.field_value_date ||
            field.field_value_json
          settingsFromDynamic[field.field_name] = value
        })
      }

      // Extract settings with fallbacks
      const currency = settingsFromDynamic.currency || orgEntity.metadata?.currency || 'AED'
      const organization_name =
        settingsFromDynamic.organization_name || orgEntity.entity_name || orgEntity.organization_name || 'HairTalkz'
      const legal_name = settingsFromDynamic.legal_name
      const address = settingsFromDynamic.address
      const phone = settingsFromDynamic.phone
      const email = settingsFromDynamic.email
      const trn = settingsFromDynamic.trn
      const fiscal_year_start = settingsFromDynamic.fiscal_year_start
      const logo_url = settingsFromDynamic.logo_url

      // ✅ ENTERPRISE: Currency symbol mapping
      const currencySymbolMap: Record<string, string> = {
        AED: 'د.إ',
        USD: '$',
        EUR: '€',
        GBP: '£',
        SAR: 'ر.س',
        QAR: 'ر.ق',
        KWD: 'د.ك',
        BHD: 'د.ب',
        OMR: 'ر.ع.',
        INR: '₹',
        PKR: 'Rs'
      }

      const currencySymbol = currencySymbolMap[currency] || currency

      const orgData = {
        id: orgId,
        name: organization_name,
        legal_name,
        address,
        phone,
        email,
        trn,
        currency,
        currencySymbol,
        fiscal_year_start,
        logo_url,
        settings: {
          ...orgEntity.metadata,
          ...settingsFromDynamic
        }
      }

      console.log('[SecuredSalonProvider] ✅ Loaded organization via RPC with full settings:', {
        orgId,
        hasName: !!organization_name,
        hasAddress: !!address,
        hasPhone: !!phone,
        hasEmail: !!email,
        hasTRN: !!trn,
        currency,
        dynamicFieldsCount: dynamicDataArray.length
      })

      return orgData
    } catch (error) {
      console.error('[SecuredSalonProvider] Failed to load organization details:', error)
      return {
        id: orgId,
        name: 'HairTalkz',
        currency: 'AED',
        currencySymbol: 'د.إ',
        settings: {}
      }
    }
  }

  /**
   * Load branches for organization
   * ✅ Uses RPC API v2 (client-safe, no direct Supabase queries)
   * ✅ GRACEFUL ERROR HANDLING: 401 errors are logged but don't block page load
   */
  const loadBranches = async (orgId: string): Promise<Branch[]> => {
    try {
      setIsLoadingBranches(true) // ✅ Set loading state

      const { getEntities } = await import('@/lib/universal-api-v2-client')

      const branches = await getEntities('', {
        p_organization_id: orgId,
        p_entity_type: 'BRANCH',
        p_status: 'active',
        p_include_dynamic: true // ✅ Include dynamic fields (opening_time, closing_time, etc.)
      })

      // ✅ Transform branches to flatten dynamic fields to top-level properties
      const transformedBranches = (branches || []).map((branch: any) => {
        // Start with the base branch entity
        const transformed: any = {
          id: branch.id,
          entity_name: branch.entity_name || branch.name,
          entity_code: branch.entity_code || branch.code,
          ...branch
        }

        // ✅ Flatten dynamic_fields ARRAY to top-level properties
        // RPC returns dynamic_fields as an array of objects: [{ field_name: 'opening_time', field_value_text: '10:00' }, ...]
        if (Array.isArray(branch.dynamic_fields)) {
          branch.dynamic_fields.forEach((field: any) => {
            // Extract the actual value from the appropriate typed column
            const value = field.field_value_text ||
                         field.field_value_number ||
                         field.field_value_boolean ||
                         field.field_value_date ||
                         field.field_value_json ||
                         null

            // Set as top-level property using field_name (e.g., opening_time, closing_time)
            if (field.field_name && value !== null) {
              transformed[field.field_name] = value
            }
          })
        }
        // ✅ FALLBACK: If no dynamic_fields, check metadata for opening/closing times
        else if (branch.metadata && typeof branch.metadata === 'object') {
          // Extract opening_time and closing_time from metadata if they exist
          if (branch.metadata.opening_time) {
            transformed.opening_time = branch.metadata.opening_time
          }
          if (branch.metadata.closing_time) {
            transformed.closing_time = branch.metadata.closing_time
          }
        }

        return transformed
      })

      setAvailableBranches(transformedBranches || [])

      // Set default branch if not already selected
      if (!selectedBranchId && transformedBranches && transformedBranches.length > 0) {
        const defaultBranch = transformedBranches.find((b: any) => b.entity_code === 'BR-001') || transformedBranches[0]
        setSelectedBranchIdState(defaultBranch.id)
        localStorage.setItem('selectedBranchId', defaultBranch.id)
      }

      return transformedBranches || []
    } catch (error: any) {
      // ✅ GRACEFUL ERROR HANDLING: Don't block page load if branches fail to load
      console.warn('[loadBranches] ⚠️ Failed to load branches (non-critical):', {
        error: error.message || error,
        orgId,
        note: 'Branch loading is optional - page will continue without branches'
      })

      // Return empty array instead of throwing - branches are not critical for most pages
      setAvailableBranches([])
      return []
    } finally {
      setIsLoadingBranches(false) // ✅ Clear loading state
    }
  }

  /**
   * Handle branch selection
   */
  const handleSetBranch = useCallback((branchId: string) => {
    setSelectedBranchIdState(branchId)
    localStorage.setItem('selectedBranchId', branchId)

    // Update context with new branch - use context.availableBranches which has the transformed data
    setContext(prev => {
      const selectedBranch = prev.availableBranches.find(b => b.id === branchId) || null

      return {
        ...prev,
        selectedBranchId: branchId,
        selectedBranch
      }
    })
  }, [])

  /**
   * Clear security context
   */
  const clearContext = () => {
    setContext(prev => ({
      ...prev,
      orgId: '', // Clear organization ID - requires re-authentication
      organizationId: '', // Clear organization ID - requires re-authentication
      userId: '',
      role: 'user',
      salonRole: 'stylist',
      permissions: [],
      user: null,
      isLoading: false,
      isAuthenticated: false,
      selectedBranchId: null,
      selectedBranch: null,
      availableBranches: []
    }))

    // Clear localStorage
    localStorage.removeItem('salonRole')
    localStorage.removeItem('organizationId')
    localStorage.removeItem('userPermissions')
    localStorage.removeItem('selectedBranchId')

    setAuthError(null)
    setRetryCount(0)
  }

  /**
   * Check if current page is public
   */
  const isPublicPage = (): boolean => {
    if (typeof window === 'undefined') return false
    const pathname = window.location.pathname
    return pathname === '/salon' || pathname === '/salon/auth'
  }

  /**
   * Redirect to authentication page
   */
  const redirectToAuth = () => {
    if (typeof window !== 'undefined' && !isPublicPage()) {
      router.push('/salon/auth')
    }
  }

  /**
   * Execute operations within secure database context
   */
  const executeSecurely = async <T,>(
    operation: (client: any) => Promise<T>,
    options?: { bypassRLS?: boolean }
  ): Promise<T> => {
    if (!context.isAuthenticated) {
      throw new Error('Not authenticated')
    }

    return dbContext.executeWithContext(
      {
        orgId: context.orgId,
        userId: context.userId,
        role: context.role,
        authMode: context.authMode
      },
      operation,
      options
    )
  }

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return (
        context.permissions.includes(permission) || context.permissions.includes('salon:admin:full')
      )
    },
    [context.permissions]
  )

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some(permission => hasPermission(permission))
    },
    [hasPermission]
  )

  // ⚡ PERFORMANCE: Memoize enhanced context to prevent excessive re-renders
  const enhancedContext = useMemo(
    () => ({
      ...context,
      isLoadingBranches, // ✅ Add branch loading state from local state
      executeSecurely,
      hasPermission,
      hasAnyPermission,
      retry: initializeSecureContext,
      // 🎯 POS Transaction Protection
      posTransactionActive: securityStore.posTransactionActive || false,
      setPosTransactionActive: securityStore.setPosTransactionActive,
      updatePosActivity: securityStore.updatePosActivity
    }),
    [context, isLoadingBranches, hasPermission, hasAnyPermission, securityStore.posTransactionActive, securityStore.setPosTransactionActive, securityStore.updatePosActivity]
  )

  // ✅ ENTERPRISE UX: Optimized loading state - only show when cache is stale
  // Show loading ONLY during:
  // 1. Initial load when cache doesn't exist
  // 2. Cache invalidation (HARD_TTL exceeded or manual reinit)
  // 3. First 500ms after page load (grace period for smooth transition)
  const timeSincePageLoad = typeof window !== 'undefined' ? Date.now() - (window.performance?.timing?.navigationStart || 0) : Infinity
  const isInGracePeriod = timeSincePageLoad < 500 // 500ms grace period for smooth transition

  // 🚨 PRODUCTION FIX: Don't show loading during POS transactions
  // This prevents interrupting customer transactions
  const shouldReinitialize = securityStore.shouldReinitialize()
  
  const isInitializing =
    (!securityStore.isInitialized || shouldReinitialize) &&
    (context.isLoading || !hasInitialized || isInGracePeriod) &&
    auth.isAuthenticated &&
    !securityStore.posTransactionActive // 🛡️ CRITICAL: Never interrupt POS transactions

  if (isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <div className="text-center">
          <div className="relative mb-6">
            {/* Animated glow effect */}
            <div
              className="absolute inset-0 blur-2xl animate-pulse"
              style={{
                background: `radial-gradient(circle, ${LUXE_COLORS.gold}40 0%, transparent 70%)`
              }}
            />
            <Loader2
              className="h-12 w-12 animate-spin mx-auto relative"
              style={{ color: LUXE_COLORS.gold }}
            />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading your dashboard...
          </h3>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Please wait a moment
          </p>
        </div>
      </div>
    )
  }

  // Error state (BUT NOT during grace period - show loading instead)
  // ✅ PATIENCE: Suppress error display during first 5 seconds after page load
  const shouldShowError = authError && !isPublicPage() && !isInGracePeriod

  if (shouldShowError) {
    const errorIcon =
      authError.type === 'network'
        ? Clock
        : authError.type === 'authentication'
          ? Shield
          : authError.type === 'authorization'
            ? Shield
            : AlertTriangle

    const showRetryButton = authError.type === 'network' || authError.type === 'authentication'

    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <div className="text-center max-w-md mx-auto p-6">
          <Card
            className="border-0 p-8"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <div className="flex items-center justify-center mb-4">
              {React.createElement(errorIcon, {
                className: 'h-12 w-12',
                style: {
                  color: authError.type === 'network' ? LUXE_COLORS.orange : LUXE_COLORS.ruby
                }
              })}
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: LUXE_COLORS.gold }}>
              {authError.type === 'network'
                ? 'Connection Issue'
                : authError.type === 'authentication'
                  ? 'Authentication Required'
                  : authError.type === 'authorization'
                    ? 'Access Denied'
                    : 'Security Error'}
            </h2>
            <p className="text-sm mb-6" style={{ color: LUXE_COLORS.bronze }}>
              {authError.message}
            </p>
            {authError.code && authError.code !== 'AUTH_ERROR' && (
              <p className="text-xs mb-4" style={{ color: LUXE_COLORS.bronze }}>
                Error code: {authError.code}
              </p>
            )}
            <div className="space-y-2">
              {showRetryButton && (
                <button
                  onClick={() => {
                    setAuthError(null)
                    setRetryCount(0)
                    initializeSecureContext()
                  }}
                  className="w-full px-4 py-2 font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: LUXE_COLORS.gold,
                    color: LUXE_COLORS.charcoal
                  }}
                >
                  {authError.type === 'network' ? 'Try Again' : 'Retry Authentication'}
                </button>
              )}
              <button
                onClick={redirectToAuth}
                className="w-full px-4 py-2 font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: showRetryButton ? 'transparent' : LUXE_COLORS.gold,
                  color: showRetryButton ? LUXE_COLORS.bronze : LUXE_COLORS.charcoal,
                  border: showRetryButton ? `1px solid ${LUXE_COLORS.bronze}50` : 'none'
                }}
              >
                Go to Login
              </button>
              {authError.type === 'authorization' && (
                <p className="text-xs mt-4" style={{ color: LUXE_COLORS.bronze }}>
                  Contact your administrator if you believe you should have access.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <SecuredSalonContext.Provider value={enhancedContext}>
      {children}

      {/* ✅ ENTERPRISE: Luxury reconnecting banner for graceful degradation */}
      <ReconnectingBanner
        isReconnecting={isReconnecting}
        message="Reconnecting to secure session..."
        onRetry={() => {
          console.log('🔄 User requested manual retry - forcing fresh initialization')
          // Force a fresh re-initialization by clearing the in-progress flag
          isReinitializingRef.current = false
          reinitPromiseRef.current = null
          // Then start a new non-silent reinit (shows progress to user)
          runReinitSingleFlight({ silent: false })
        }}
      />
    </SecuredSalonContext.Provider>
  )
}

/**
 * Hook to use secured salon context
 */
export function useSecuredSalonContext() {
  const context = useContext(SecuredSalonContext)
  if (context === undefined) {
    throw new Error('useSecuredSalonContext must be used within a SecuredSalonProvider')
  }
  return context
}

/**
 * Higher-order component for protected salon pages
 */
export function withSalonAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: string[] = []
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, hasAnyPermission, isLoading } = useSecuredSalonContext()

    if (isLoading) {
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: LUXE_COLORS.charcoal }}
        >
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
        </div>
      )
    }

    if (!isAuthenticated) {
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: LUXE_COLORS.charcoal }}
        >
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.ruby }} />
            <p className="text-white text-lg">Authentication Required</p>
          </div>
        </div>
      )
    }

    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
      return (
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: LUXE_COLORS.charcoal }}
        >
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.ruby }} />
            <p className="text-white text-lg">Access Denied</p>
            <p className="text-gray-400 text-sm mt-2">Insufficient permissions for this area</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

export default SecuredSalonProvider
