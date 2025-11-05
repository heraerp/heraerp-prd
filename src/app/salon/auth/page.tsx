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

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Sparkles, ShieldAlert, AlertCircle, Wifi, Building2, XCircle, Eye, EyeOff } from 'lucide-react'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { getRoleDisplayName, getRoleRedirectPath, type AppRole } from '@/lib/auth/role-normalizer'
import { useLoadingStore } from '@/lib/stores/loading-store'

type ErrorType = 'validation' | 'auth' | 'network' | 'organization' | 'unknown'

interface ErrorState {
  message: string
  type: ErrorType
  details?: string
}

export default function SalonAuthPage() {
  const { login } = useHERAAuth()
  const router = useRouter()
  const { startLoading, updateProgress, reset } = useLoadingStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ErrorState | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  // ✅ Reset global loading on mount (in case of back navigation)
  useEffect(() => {
    reset()
  }, [])

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

  // ❌ REMOVED: useEffect watching auth state (caused login loops)
  // Auth redirect now happens synchronously in handleSignIn after login() completes

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
      // ✅ ENTERPRISE FIX: Clear ALL localStorage BEFORE login to prevent org ID mismatch
      // This prevents stale cache (e.g., from Hairtalkz) contaminating new session (HERA Salon Demo)
      // Without this, SecuredSalonProvider detects mismatch and triggers logout
      console.log('🧹 Clearing ALL localStorage before login...')
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'organizationId',
          'salonOrgId',
          'salonRole',
          'userPermissions',
          'selectedBranchId',
          'userId',
          'userEntityId',
          'userEmail',
          'userName',
          'salonUserName',
          'defaultBranchId',
          'organizationName',
          'primaryRole'
        ]

        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log(`✅ Cleared ${keysToRemove.length} localStorage keys:`, keysToRemove)
      }

      // ✅ Use enhanced HERAAuthProvider login (now synchronous, returns data)
      // - Clears all caches (via clearFirst option)
      // - Authenticates with Supabase
      // - Calls /api/v2/auth/resolve-membership
      // - Stores ALL 9 localStorage keys
      // - Returns resolved membership data
      const result = await login(email, password, { clearFirst: true })

      console.log('✅ Login successful, received data:', {
        role: result.role,
        organizationId: result.organizationId,
        userEntityId: result.userEntityId,
        organizations: result.membershipData?.organizations
      })

      // ✅ ENTERPRISE: Validate user has organizations (from membershipData, not context)
      const userOrganizations = result.membershipData?.organizations || []
      if (userOrganizations.length === 0) {
        showError(
          'No organizations found',
          'organization',
          'Your account is not linked to any organization. Please contact support.'
        )
        return
      }

      // ✅ ENTERPRISE: Validate user has SALON app access
      const firstOrg = userOrganizations[0]
      const userApps = firstOrg?.apps || []
      const hasSalonApp = userApps.some((app: any) => app.code.toUpperCase() === 'SALON')

      if (!hasSalonApp) {
        showError(
          'SALON app not purchased',
          'organization',
          `Your organization (${firstOrg?.name || 'Unknown'}) does not have the SALON app. Redirecting to app store...`
        )

        // Redirect to app store after brief delay
        setTimeout(() => {
          router.push('/apps?mode=store&highlight=SALON')
        }, 2000)
        return
      }

      // ✅ ENTERPRISE: Role already normalized by HERAAuthProvider
      const salonRole = result.role as AppRole

      console.log('✅ Using normalized role:', {
        salonRole,
        source: 'HERAAuthProvider (already normalized)'
      })

      // Update salonRole in localStorage (for backwards compatibility)
      // Note: HERAAuthProvider already did this, but we do it again for safety
      localStorage.setItem('salonRole', salonRole)

      // Get enterprise-grade display name using helper (app-aware)
      const displayName = getRoleDisplayName(salonRole, 'salon')
      setMessage(`🎉 Welcome! Signing you in as ${displayName}...`)

      // ⚡ ENTERPRISE LOADING EXPERIENCE - Use global loading overlay
      // This will persist across the route change for seamless UX
      startLoading(`Welcome! Signing you in as ${displayName}...`, 'Setting up your session...')

      // Smooth progress animation (0-60% during navigation)
      let currentProgress = 0
      const progressInterval = setInterval(() => {
        currentProgress += 10
        if (currentProgress <= 60) {
          updateProgress(currentProgress)
        } else {
          clearInterval(progressInterval)
        }
      }, 50)

      // Navigate to dashboard (global loading will continue)
      setTimeout(async () => {
        updateProgress(70, undefined, 'Loading your workspace...')

        // ✅ ENTERPRISE: Use centralized role redirect helper with app context
        const redirectPath = getRoleRedirectPath(salonRole, 'salon')

        console.log('✅ Navigating to:', {
          role: salonRole,
          path: redirectPath,
          source: 'getRoleRedirectPath()'
        })

        // ✅ Use router.push with initializing flag
        // Dashboard will continue progress to 100% then hide overlay
        await router.push(redirectPath + '?initializing=true')
      }, 300)

    } catch (err: any) {
      console.error('Sign-in error:', err)

      // Enhanced error handling
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        showError(
          'Invalid email or password',
          'auth',
          'Please check your credentials and try again.'
        )
      } else if (err.message?.toLowerCase().includes('email not confirmed')) {
        showError(
          'Email not verified',
          'auth',
          'Please check your inbox for the verification email.'
        )
      } else if (err.message?.toLowerCase().includes('too many requests')) {
        showError(
          'Too many login attempts',
          'auth',
          'Please wait a few minutes before trying again.'
        )
      } else if (err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch')) {
        showError(
          'Network connection issue',
          'network',
          'Please check your internet connection and try again.'
        )
      } else {
        showError(
          'Sign-in failed',
          'auth',
          err.message || 'An unexpected error occurred. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // ✅ No local loading overlay - using GlobalLoadingOverlay instead
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
            className="rounded-xl p-6 mb-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              background: error
                ? 'linear-gradient(135deg, rgba(255, 107, 147, 0.18) 0%, rgba(244, 63, 94, 0.12) 100%)'
                : 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
              border: `2px solid ${error ? SALON_LUXE_COLORS.error.border : SALON_LUXE_COLORS.border.base}`,
              boxShadow: error
                ? `0 8px 24px rgba(255, 107, 147, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                : `0 4px 16px ${SALON_LUXE_COLORS.shadow.goldLighter}, inset 0 1px 0 rgba(212, 175, 55, 0.1)`
            }}
          >
            {error ? (
              <div className="flex items-start gap-4">
                {/* Error Icon - Enhanced with solid gradient */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.error.base} 0%, ${SALON_LUXE_COLORS.error.dark} 100%)`,
                    boxShadow: `0 4px 12px rgba(255, 107, 147, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                  }}
                >
                  {error.type === 'auth' && <ShieldAlert className="w-6 h-6" style={{ color: '#FFFFFF' }} />}
                  {error.type === 'network' && <Wifi className="w-6 h-6" style={{ color: '#FFFFFF' }} />}
                  {error.type === 'organization' && <Building2 className="w-6 h-6" style={{ color: '#FFFFFF' }} />}
                  {error.type === 'validation' && <AlertCircle className="w-6 h-6" style={{ color: '#FFFFFF' }} />}
                  {error.type === 'unknown' && <XCircle className="w-6 h-6" style={{ color: '#FFFFFF' }} />}
                </div>

                {/* Error Text - Enhanced typography */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-lg font-bold mb-2"
                    style={{ color: SALON_LUXE_COLORS.error.base, letterSpacing: '-0.01em' }}
                  >
                    {error.message}
                  </p>
                  {error.details && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: SALON_LUXE_COLORS.champagne.base, opacity: 0.95 }}
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
              <div className="relative">
                <SalonLuxeInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  style={{ color: SALON_LUXE_COLORS.bronze }}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
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
