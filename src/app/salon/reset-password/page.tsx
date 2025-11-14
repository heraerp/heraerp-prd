/**
 * Password Reset Page
 * Enterprise-grade password reset for salon professionals
 * Users land here after clicking the reset link in their email
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength('weak')
      return
    }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 2) setPasswordStrength('weak')
    else if (strength <= 4) setPasswordStrength('medium')
    else setPasswordStrength('strong')
  }, [password])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength === 'weak') {
      setError('Please choose a stronger password')
      return
    }

    setLoading(true)

    try {
      const { supabase } = await import('@/lib/supabase/client')

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('🚨 Password update error:', updateError)
        setError(updateError.message || 'Failed to reset password. Please try again.')
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setLoading(false)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/salon/auth')
      }, 3000)

    } catch (err: any) {
      console.error('Password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return SALON_LUXE_COLORS.danger.base
      case 'medium': return SALON_LUXE_COLORS.warning
      case 'strong': return SALON_LUXE_COLORS.success
      default: return SALON_LUXE_COLORS.bronze
    }
  }

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak'
      case 'medium': return 'Medium'
      case 'strong': return 'Strong'
      default: return ''
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center p-4"
        style={{
          backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 0% 100%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)
          `
        }}
      >
        <div
          className="w-full max-w-md relative z-10 rounded-2xl p-10 backdrop-blur-xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.success}30 0%, ${SALON_LUXE_COLORS.success}15 100%)`,
              border: `2px solid ${SALON_LUXE_COLORS.success}50`
            }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: SALON_LUXE_COLORS.success }} />
          </div>

          <h1
            className="text-3xl font-bold mb-4"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne.light} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Password Reset Successful
          </h1>

          <p className="text-base mb-6" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
            Your password has been updated successfully. Redirecting to login...
          </p>

          <div
            className="inline-block px-4 py-2 rounded-lg"
            style={{
              background: `${SALON_LUXE_COLORS.gold.base}20`,
              border: `1px solid ${SALON_LUXE_COLORS.gold.base}30`
            }}
          >
            <p className="text-sm" style={{ color: SALON_LUXE_COLORS.gold.base }}>
              Redirecting in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    )
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

      {/* Reset Password Card */}
      <div
        className="w-full max-w-md relative z-10 rounded-2xl p-10 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
          border: `1px solid ${SALON_LUXE_COLORS.border.base}`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4)'
            }}
          >
            <Lock className="h-8 w-8" style={{ color: SALON_LUXE_COLORS.charcoal.dark }} />
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.champagne.light} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            Reset Password
          </h1>
          <p className="text-sm" style={{ color: SALON_LUXE_COLORS.bronze }}>
            Create a strong password for your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(232, 180, 184, 0.15) 0%, rgba(232, 180, 184, 0.08) 100%)',
              border: `1px solid ${SALON_LUXE_COLORS.danger.border}`,
              boxShadow: `0 4px 16px ${SALON_LUXE_COLORS.shadow.danger}`
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: SALON_LUXE_COLORS.danger.base }} />
            <p className="text-sm" style={{ color: SALON_LUXE_COLORS.danger.base }}>
              {error}
            </p>
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: SALON_LUXE_COLORS.champagne.base }}
            >
              New Password
            </label>
            <div className="relative">
              <SalonLuxeInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: SALON_LUXE_COLORS.bronze }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze }}>
                    Password strength
                  </span>
                  <span className="text-xs font-semibold" style={{ color: getStrengthColor() }}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: `${SALON_LUXE_COLORS.charcoal.light}80` }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      background: getStrengthColor(),
                      width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium mb-2"
              style={{ color: SALON_LUXE_COLORS.champagne.base }}
            >
              Confirm Password
            </label>
            <div className="relative">
              <SalonLuxeInput
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: SALON_LUXE_COLORS.bronze }}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <p
                className="text-xs mt-1"
                style={{ color: password === confirmPassword ? SALON_LUXE_COLORS.success : SALON_LUXE_COLORS.danger.base }}
              >
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          {/* Password Requirements */}
          <div
            className="rounded-lg p-4 text-xs space-y-1"
            style={{
              background: `${SALON_LUXE_COLORS.gold.base}08`,
              border: `1px solid ${SALON_LUXE_COLORS.border.light}`
            }}
          >
            <p className="font-semibold mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              Password must contain:
            </p>
            <p style={{ color: password.length >= 8 ? SALON_LUXE_COLORS.success : SALON_LUXE_COLORS.bronze }}>
              {password.length >= 8 ? '✓' : '○'} At least 8 characters
            </p>
            <p style={{ color: /[a-z]/.test(password) && /[A-Z]/.test(password) ? SALON_LUXE_COLORS.success : SALON_LUXE_COLORS.bronze }}>
              {/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✓' : '○'} Uppercase & lowercase letters
            </p>
            <p style={{ color: /[0-9]/.test(password) ? SALON_LUXE_COLORS.success : SALON_LUXE_COLORS.bronze }}>
              {/[0-9]/.test(password) ? '✓' : '○'} At least one number
            </p>
            <p style={{ color: /[^a-zA-Z0-9]/.test(password) ? SALON_LUXE_COLORS.success : SALON_LUXE_COLORS.bronze }}>
              {/[^a-zA-Z0-9]/.test(password) ? '✓' : '○'} Special character (!@#$%^&*)
            </p>
          </div>

          <SalonLuxeButton
            type="submit"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            loading={loading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {loading ? 'Resetting Password...' : '🔒 Reset Password'}
          </SalonLuxeButton>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push('/salon/auth')}
            className="text-sm font-medium hover:underline transition-colors"
            style={{ color: SALON_LUXE_COLORS.bronze }}
          >
            ← Back to Sign In
          </button>
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
