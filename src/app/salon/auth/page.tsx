/**
 * HERA Salon Authentication Page - Enterprise Login
 *
 * Location: /salon/auth (Canonical authentication URL)
 *
 * Enterprise-grade authentication portal for salon professionals
 * Automatically detects user role and sets up organization context
 *
 * Features:
 * - Role-based authentication (Owner, Manager, Receptionist, Accountant)
 * - SalonLuxe theme integration
 * - Secure session management
 * - Organization context setup
 * - Password reset functionality
 * - Enhanced error handling with categorization
 *
 * Security:
 * - Bank-grade encryption
 * - Automatic session cleanup before login
 * - Role verification via `/api/v2/auth/resolve-membership`
 * - Organization boundary enforcement
 *
 * Post-Login Redirects:
 * - Owner → /salon/dashboard
 * - Receptionist → /salon/receptionist
 * - Manager → /salon/receptionist (configurable)
 * - Accountant → /salon/receptionist (configurable)
 */

'use client'

import { useState } from 'react'
import { Mail, Lock, Sparkles, ShieldAlert, AlertCircle, Wifi, Building2, XCircle } from 'lucide-react'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

type ErrorType = 'validation' | 'auth' | 'network' | 'organization' | 'unknown'

interface ErrorState {
  message: string
  type: ErrorType
  details?: string
}

export default function SalonAuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ErrorState | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const showError = (message: string, type: ErrorType = 'unknown', details?: string) => {
    setError({ message, type, details })
    setMessage('')
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      showError('Please enter your email address', 'validation')
      return
    }

    setLoading(true)
    setError(null)
    setMessage('📧 Sending reset link...')

    try {
      const { supabase } = await import('@/lib/supabase/client')

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/salon/reset-password`
      })

      if (resetError) {
        console.error('🚨 Password reset error:', resetError)

        if (resetError.message.toLowerCase().includes('rate limit')) {
          showError(
            'Too many reset requests',
            'auth',
            'Please wait a few minutes before requesting another password reset.'
          )
        } else if (resetError.message.toLowerCase().includes('network')) {
          showError(
            'Network error',
            'network',
            'Unable to send reset email. Please check your connection and try again.'
          )
        } else {
          showError(
            'Reset failed',
            'auth',
            'Unable to send password reset email. Please try again later.'
          )
        }
        setLoading(false)
        return
      }

      // Success
      setResetEmailSent(true)
      setMessage('✅ Password reset email sent! Please check your inbox.')
      setLoading(false)

      console.log('✅ Password reset email sent to:', email)

    } catch (err: any) {
      console.error('Password reset error:', err)
      showError(
        'Unexpected error',
        'unknown',
        'Failed to send reset email. Please try again.'
      )
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      showError('Please enter both email and password', 'validation')
      return
    }

    setLoading(true)
    setError(null)
    setMessage('🔐 Signing in...')

    try {
      // 🔒 CRITICAL: Clear ALL cached data before new login
      console.log('🧹 Clearing all cached data before login...')
      localStorage.clear()

      // Clear Zustand store
      try {
        const { useSalonSecurityStore } = await import('@/lib/salon/security-store')
        const securityStore = useSalonSecurityStore.getState()
        securityStore.clearState()
        console.log('✅ Zustand store cleared')
      } catch (e) {
        console.warn('⚠️ Could not clear security store:', e)
      }

      // Import supabase client
      const { supabase } = await import('@/lib/supabase/client')

      // Sign out any existing session first
      await supabase.auth.signOut()
      console.log('✅ Previous session cleared')

      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        console.error('🚨 Authentication error details:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          email: email.trim()
        })

        // User-friendly error messages based on error type
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          showError(
            'Invalid email or password',
            'auth',
            'Please check your credentials and try again.'
          )
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          showError(
            'Email not verified',
            'auth',
            'Please check your inbox for the verification email.'
          )
        } else if (authError.message.toLowerCase().includes('too many requests')) {
          showError(
            'Too many login attempts',
            'auth',
            'Please wait a few minutes before trying again.'
          )
        } else if (authError.message.toLowerCase().includes('network')) {
          showError(
            'Network connection issue',
            'network',
            'Please check your internet connection and try again.'
          )
        } else {
          showError(
            'Sign-in failed',
            'auth',
            authError.message
          )
        }
        return
      }

      if (data.session && data.user) {
        setMessage('✅ Authentication successful! Loading your role...')

        // Fetch role from database via API
        let userRole = 'receptionist' // Default fallback
        let organizationId: string | undefined // ✅ Declare at function scope

        try {
          const response = await fetch('/api/v2/auth/resolve-membership', {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          })

          if (response.ok) {
            const membershipData = await response.json()

            console.log('📊 Full API response:', JSON.stringify(membershipData, null, 2))

            // Check if user has organization membership
            if (!membershipData.membership && !membershipData.success) {
              showError(
                'No organization access',
                'organization',
                'Your account is not associated with any salon. Please contact your administrator.'
              )
              return
            }

            // ✅ Extract organization ID from API response (NO HARDCODING)
            organizationId =
              membershipData.membership?.organization_id ||
              membershipData.organization_id ||
              membershipData.membership?.org_entity_id

            if (!organizationId) {
              console.error('🚨 No organization ID in API response:', membershipData)
              showError(
                'Organization not found',
                'organization',
                'Could not determine your organization. Please contact support.'
              )
              return
            }

            console.log('✅ Organization ID from API:', organizationId)

            // Extract role from API response with multiple fallback paths
            console.log('🔍 DEBUG - Checking role paths:')
            console.log('  - membershipData.membership?.roles:', membershipData.membership?.roles)
            console.log('  - membershipData.membership?.roles?.[0]:', membershipData.membership?.roles?.[0])
            console.log('  - membershipData.role:', membershipData.role)
            console.log('  - membershipData.membership?.role:', membershipData.membership?.role)

            let roleFromDB =
              membershipData.membership?.roles?.[0] ||
              membershipData.role ||
              membershipData.membership?.role

            console.log('🔍 DEBUG - roleFromDB (before normalization):', roleFromDB)
            console.log('🔍 DEBUG - roleFromDB type:', typeof roleFromDB)
            console.log('🔍 DEBUG - roleFromDB as JSON:', JSON.stringify(roleFromDB))

            // 🔒 CRITICAL: Normalize role to lowercase and trim whitespace
            // This ensures OWNER, Owner, owner, ORG_OWNER, RECEPTIONIST, etc. all work
            if (roleFromDB) {
              const rawRole = roleFromDB
              // Map HERA RBAC roles (ORG_OWNER, ORG_ADMIN, ORG_EMPLOYEE) to salon roles
              const roleMapping: Record<string, string> = {
                'org_owner': 'owner',
                'org_admin': 'manager',
                'org_manager': 'manager',
                'org_accountant': 'accountant',
                'org_employee': 'receptionist',
                'owner': 'owner',
                'manager': 'manager',
                'receptionist': 'receptionist',
                'accountant': 'accountant',
                'member': 'receptionist'
              }

              const normalizedRaw = String(roleFromDB).toLowerCase().trim()
              roleFromDB = roleMapping[normalizedRaw] || normalizedRaw
              userRole = roleFromDB

              console.log('✅ Role fetched from database (raw):', rawRole)
              console.log('✅ Role after normalization (trimmed, lowercase):', JSON.stringify(normalizedRaw))
              console.log('✅ Role after mapping:', JSON.stringify(roleFromDB))
              console.log('✅ userRole variable set to:', userRole)
              console.log('✅ userRole === "owner":', userRole === 'owner')
              console.log('✅ userRole === "receptionist":', userRole === 'receptionist')
              console.log('✅ userRole === "manager":', userRole === 'manager')
              console.log('✅ userRole === "accountant":', userRole === 'accountant')
            } else {
              console.warn('⚠️ No role in API response, using fallback:', userRole)
              console.warn('⚠️ API response structure:', membershipData)
              showError(
                'Role not found',
                'organization',
                'Could not determine your role in the organization. Please contact support.'
              )
              return
            }
          } else if (response.status === 401) {
            showError(
              'Session expired',
              'auth',
              'Your session has expired. Please sign in again.'
            )
            return
          } else {
            const errorText = await response.text()
            console.warn('⚠️ Failed to fetch role from API:', response.status, errorText)
            showError(
              'Unable to load organization',
              'organization',
              'Could not connect to the organization server. Please try again.'
            )
            return
          }
        } catch (apiError: any) {
          console.warn('⚠️ Error fetching role from API, using fallback:', apiError)
          showError(
            'Connection error',
            'network',
            'Unable to verify your organization membership. Please check your connection.'
          )
          return
        }

        console.log('🔍 DEBUG - Email:', data.user.email || email)
        console.log('🔍 DEBUG - Final Role:', userRole)
        console.log('🔍 DEBUG - Role type:', typeof userRole)
        console.log('🔍 DEBUG - Role length:', userRole?.length)

        // ✅ SAFETY CHECK: Ensure organizationId is defined before proceeding
        if (!organizationId) {
          console.error('🚨 CRITICAL: organizationId is undefined after API call')
          showError(
            'Configuration error',
            'organization',
            'Unable to determine organization. Please try again or contact support.'
          )
          return
        }

        // 🔒 CRITICAL: Set organization and role in localStorage AFTER fetching from API
        console.log('💾 Setting fresh data in localStorage:')
        console.log('  - organizationId:', organizationId)
        console.log('  - salonRole:', userRole)
        console.log('  - userEmail:', data.user.email || email)
        console.log('  - userId:', data.user.id)

        localStorage.setItem('organizationId', organizationId)
        localStorage.setItem('safeOrganizationId', organizationId)
        localStorage.setItem('salonRole', userRole) // Fresh role from database
        localStorage.setItem('userEmail', data.user.email || email)
        localStorage.setItem('userId', data.user.id)
        // Store user display info for dashboard header
        localStorage.setItem('salonUserEmail', data.user.email || email)
        localStorage.setItem('salonUserName', data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User')

        console.log('✅ LocalStorage updated with fresh role from database')

        // 🎯 Enterprise-grade role display names
        const roleDisplayNames: Record<string, string> = {
          'owner': 'Salon Owner',
          'manager': 'Salon Manager',
          'receptionist': 'Front Desk',
          'accountant': 'Accountant',
          'stylist': 'Stylist'
        }

        const displayName = roleDisplayNames[userRole] || 'Team Member'
        setMessage(`🎉 Welcome! Signing you in as ${displayName}...`)

        // Redirect based on role (with detailed logging)
        let redirectPath
        console.log('🔍 === REDIRECT LOGIC START ===')
        console.log('🔍 userRole value:', userRole)
        console.log('🔍 userRole type:', typeof userRole)
        console.log('🔍 userRole JSON:', JSON.stringify(userRole))
        console.log('🔍 userRole length:', userRole?.length)
        console.log('🔍 userRole === "owner":', userRole === 'owner')
        console.log('🔍 userRole === "receptionist":', userRole === 'receptionist')

        // CRITICAL: Force exact string comparison
        const normalizedRole = String(userRole).toLowerCase().trim()
        console.log('🔍 normalizedRole after force normalization:', normalizedRole)
        console.log('🔍 normalizedRole === "owner":', normalizedRole === 'owner')

        // Direct salon routing - enterprise wrapper removed
        if (normalizedRole === 'owner') {
          redirectPath = '/salon/dashboard'
          console.log('✅ OWNER detected - redirecting to dashboard')
          console.log('✅ Redirect path set to:', redirectPath)
        } else if (normalizedRole === 'receptionist') {
          redirectPath = '/salon/receptionist'
          console.log('✅ RECEPTIONIST detected - redirecting to receptionist page')
          console.log('✅ Redirect path set to:', redirectPath)
        } else {
          redirectPath = '/salon/receptionist' // default fallback
          console.log('⚠️ Unknown role - using default receptionist redirect')
          console.log('⚠️ Role was:', normalizedRole)
        }

        console.log('🔍 === REDIRECT LOGIC END ===')
        console.log('🎯 FINAL REDIRECT PATH:', redirectPath)
        console.log('🎯 Redirecting in 1.5 seconds...')

        setTimeout(() => {
          console.log('🚀 EXECUTING REDIRECT NOW to:', redirectPath)
          window.location.href = redirectPath
        }, 1500)
      } else {
        showError(
          'Authentication failed',
          'auth',
          'No session was created. Please try again or contact support.'
        )
      }

    } catch (err: any) {
      console.error('Sign-in error:', err)
      if (err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch')) {
        showError(
          'Network error',
          'network',
          'Unable to connect to the server. Please check your internet connection.'
        )
      } else {
        showError(
          'Unexpected error',
          'unknown',
          err.message || 'An unexpected error occurred. Please try again.'
        )
      }
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{
        backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 0% 100%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse 60% 50% at 100% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)
        `
      }}
    >
      {/* Animated gradient overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, rgba(212, 175, 55, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 70% 80%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)
          `,
          animation: 'gradient-slow 20s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }}
      />

      {/* Login Card */}
      <div
        className="w-full max-w-lg relative z-10 rounded-2xl p-10 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4)'
            }}
          >
            <Sparkles className="h-8 w-8" style={{ color: SALON_LUXE_COLORS.charcoal.dark }} />
          </div>

          {/* Title */}
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne.light} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}
          >
            HERA Salon
          </h1>
          <h2
            className="text-xl font-semibold mb-1"
            style={{ color: SALON_LUXE_COLORS.champagne.base }}
          >
            Enterprise Login
          </h2>
          <p className="text-sm" style={{ color: SALON_LUXE_COLORS.bronze }}>
            Secure Access Portal for Salon Professionals
          </p>
        </div>

        {/* Status Messages */}
        {(message || error) && (
          <div
            className="rounded-xl p-5 mb-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              background: error
                ? 'linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(232, 180, 184, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
              border: `1px solid ${error ? SALON_LUXE_COLORS.danger.border : SALON_LUXE_COLORS.border.base}`,
              boxShadow: error
                ? `0 4px 16px ${SALON_LUXE_COLORS.shadow.danger}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                : `0 4px 16px ${SALON_LUXE_COLORS.shadow.goldLighter}, inset 0 1px 0 rgba(212, 175, 55, 0.1)`
            }}
          >
            {error ? (
              <div className="flex items-start gap-3">
                {/* Error Icon */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.danger.base}20 0%, ${SALON_LUXE_COLORS.danger.base}10 100%)`,
                    border: `1px solid ${SALON_LUXE_COLORS.danger.border}`
                  }}
                >
                  {error.type === 'auth' && <ShieldAlert className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />}
                  {error.type === 'network' && <Wifi className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />}
                  {error.type === 'organization' && <Building2 className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />}
                  {error.type === 'validation' && <AlertCircle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />}
                  {error.type === 'unknown' && <XCircle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.danger.base }} />}
                </div>

                {/* Error Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-base font-semibold mb-1"
                    style={{ color: SALON_LUXE_COLORS.danger.base }}
                  >
                    {error.message}
                  </p>
                  {error.details && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: SALON_LUXE_COLORS.danger.text }}
                    >
                      {error.details}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 animate-pulse" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                <p
                  className="text-base font-medium"
                  style={{ color: SALON_LUXE_COLORS.champagne.light }}
                >
                  {message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sign-In Form */}
        {!showForgotPassword ? (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: SALON_LUXE_COLORS.champagne.base }}
              >
                Email Address
              </label>
              <SalonLuxeInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@gmail.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                  style={{ color: SALON_LUXE_COLORS.champagne.base }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError(null)
                    setMessage('')
                  }}
                  className="text-sm font-medium hover:underline transition-colors"
                  style={{ color: SALON_LUXE_COLORS.gold.base }}
                >
                  Forgot password?
                </button>
              </div>
              <SalonLuxeInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                disabled={loading}
              />
            </div>

            <SalonLuxeButton
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {loading ? 'Signing In...' : '🔓 Sign In'}
            </SalonLuxeButton>
          </form>
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPassword} className="space-y-6">
            {!resetEmailSent ? (
              <>
                <div className="text-center mb-4">
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: SALON_LUXE_COLORS.champagne.light }}
                  >
                    Reset Your Password
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: SALON_LUXE_COLORS.bronze }}
                  >
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-medium mb-2"
                    style={{ color: SALON_LUXE_COLORS.champagne.base }}
                  >
                    Email Address
                  </label>
                  <SalonLuxeInput
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <SalonLuxeButton
                    type="submit"
                    disabled={loading}
                    loading={loading}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    {loading ? 'Sending...' : '📧 Send Reset Link'}
                  </SalonLuxeButton>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setError(null)
                      setMessage('')
                    }}
                    className="w-full text-sm font-medium hover:underline transition-colors"
                    style={{ color: SALON_LUXE_COLORS.bronze }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </>
            ) : (
              /* Reset Email Sent Success */
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}20 0%, ${SALON_LUXE_COLORS.gold.base}10 100%)`,
                    border: `2px solid ${SALON_LUXE_COLORS.gold.base}30`
                  }}
                >
                  <Mail className="w-8 h-8" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                </div>

                <h3
                  className="text-xl font-semibold mb-3"
                  style={{ color: SALON_LUXE_COLORS.champagne.light }}
                >
                  Check Your Email
                </h3>

                <p
                  className="text-sm mb-2 leading-relaxed"
                  style={{ color: SALON_LUXE_COLORS.champagne.base }}
                >
                  We've sent a password reset link to:
                </p>

                <p
                  className="text-base font-semibold mb-6"
                  style={{ color: SALON_LUXE_COLORS.gold.base }}
                >
                  {email}
                </p>

                <div
                  className="rounded-lg p-4 mb-6 text-left"
                  style={{
                    background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}10 0%, ${SALON_LUXE_COLORS.gold.base}05 100%)`,
                    border: `1px solid ${SALON_LUXE_COLORS.border.base}`
                  }}
                >
                  <p
                    className="text-sm mb-2"
                    style={{ color: SALON_LUXE_COLORS.champagne.base }}
                  >
                    <strong>Next steps:</strong>
                  </p>
                  <ol
                    className="text-sm space-y-1 list-decimal list-inside"
                    style={{ color: SALON_LUXE_COLORS.bronze }}
                  >
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the reset link in the email</li>
                    <li>Create a new password</li>
                    <li>Sign in with your new password</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetEmailSent(false)
                    setError(null)
                    setMessage('')
                  }}
                  className="w-full text-sm font-medium hover:underline transition-colors"
                  style={{ color: SALON_LUXE_COLORS.gold.base }}
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </form>
        )}

        {/* Information */}
        <div
          className="mt-8 pt-6 border-t"
          style={{ borderColor: SALON_LUXE_COLORS.border.light }}
        >
          <p
            className="font-semibold mb-3 text-center"
            style={{ color: SALON_LUXE_COLORS.champagne.light }}
          >
            Enterprise Features
          </p>
          <div className="grid grid-cols-3 gap-4 text-center text-xs" style={{ color: SALON_LUXE_COLORS.bronze }}>
            <div>
              <div className="text-2xl mb-1">🔐</div>
              <p style={{ color: SALON_LUXE_COLORS.champagne.base }}>Secure</p>
              <p>Bank-grade encryption</p>
            </div>
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <p style={{ color: SALON_LUXE_COLORS.champagne.base }}>Fast</p>
              <p>Instant access</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🎯</div>
              <p style={{ color: SALON_LUXE_COLORS.champagne.base }}>Smart</p>
              <p>Role-based access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes gradient-slow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          33% {
            opacity: 0.4;
            transform: scale(1.1) rotate(2deg);
          }
          66% {
            opacity: 0.25;
            transform: scale(0.95) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  )
}
