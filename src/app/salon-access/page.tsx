/**
 * HERA Salon Access Page
 * Enterprise-grade authentication portal for salon professionals
 * Automatically detects user role and sets up organization context
 *
 * Features:
 * - Role-based authentication (Owner, Receptionist, Staff)
 * - SalonLuxe theme integration
 * - Secure session management
 * - Organization context setup
 */

'use client'

import { useState } from 'react'
import { Mail, Lock, Sparkles } from 'lucide-react'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export default function SalonAccessPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Detect role based on email domain or user metadata
  const detectRole = (userEmail: string): string => {
    const lowerEmail = userEmail.toLowerCase()

    // Role detection logic - can be extended based on your needs
    // Owner detection (customize based on your organization's email pattern)
    if (lowerEmail.includes('owner') || lowerEmail.includes('admin')) {
      return 'owner'
    }

    // Receptionist detection
    if (lowerEmail.includes('receptionist') || lowerEmail.includes('reception')) {
      return 'receptionist'
    }

    // Default to staff for all other users
    return 'staff'
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')
    setMessage('🔐 Signing in...')

    try {
      // Import supabase client
      const { supabase } = await import('@/lib/supabase/client')

      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        setError(`❌ Sign-in failed: ${authError.message}`)
        setMessage('')
        setLoading(false)
        return
      }

      if (data.session && data.user) {
        setMessage('✅ Authentication successful! Setting up your account...')

        // Detect role based on email
        const userRole = detectRole(data.user.email || email)

        // Set organization and role in localStorage
        const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
        localStorage.setItem('organizationId', orgId)
        localStorage.setItem('safeOrganizationId', orgId)
        localStorage.setItem('salonRole', userRole)

        // Store user info
        localStorage.setItem('userEmail', data.user.email || email)
        localStorage.setItem('userId', data.user.id)

        setMessage(`🎉 Welcome! You are signed in as ${userRole.toUpperCase()}`)

        // Redirect based on role
        const redirectPath = userRole === 'owner' ? '/salon/dashboard' : '/salon/receptionist'

        setTimeout(() => {
          window.location.href = redirectPath
        }, 1500)
      } else {
        setError('❌ Sign-in failed: No session created')
        setMessage('')
        setLoading(false)
      }

    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(`❌ Error: ${err.message || 'Unknown error occurred'}`)
      setMessage('')
      setLoading(false)
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
            className="rounded-xl p-4 mb-6 backdrop-blur-xl"
            style={{
              background: error
                ? 'linear-gradient(135deg, rgba(232, 180, 184, 0.2) 0%, rgba(232, 180, 184, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
              border: `1px solid ${error ? SALON_LUXE_COLORS.danger.border : SALON_LUXE_COLORS.border.base}`,
              boxShadow: error
                ? `0 4px 16px ${SALON_LUXE_COLORS.shadow.danger}`
                : `0 4px 16px ${SALON_LUXE_COLORS.shadow.goldLighter}`
            }}
          >
            <p
              className="text-base font-medium"
              style={{
                color: error ? SALON_LUXE_COLORS.danger.base : SALON_LUXE_COLORS.champagne.light
              }}
            >
              {error || message}
            </p>
          </div>
        )}

        {/* Sign-In Form */}
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
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: SALON_LUXE_COLORS.champagne.base }}
            >
              Password
            </label>
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
