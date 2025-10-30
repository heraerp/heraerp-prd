'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Building,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'

type ErrorType = 'validation' | 'auth' | 'network' | 'invitation' | 'unknown'

interface ErrorState {
  message: string
  type: ErrorType
  details?: string
}

interface InvitationData {
  organization_id: string
  organization_name: string
  invited_by: string
  role: string
  invited_email: string
  app_type: string
  app_name: string
}

export default function AcceptInviteClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [success, setSuccess] = useState(false)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  })

  // Get invitation token from URL
  const invitationToken = searchParams?.get('token') || ''

  // Password strength calculation
  useEffect(() => {
    const password = formData.password
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
  }, [formData.password])

  // Load invitation details on mount
  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationToken) {
        showError('Invalid invitation link', 'invitation', 'The invitation link is missing or invalid')
        setLoading(false)
        return
      }

      try {
        // Verify invitation token and get details
        const response = await fetch(`/api/v2/invitations/verify?token=${invitationToken}`)

        if (!response.ok) {
          const errorData = await response.json()
          showError('Invalid or expired invitation', 'invitation', errorData.error || 'Please contact your administrator')
          setLoading(false)
          return
        }

        const data = await response.json()
        setInvitationData(data)
        setLoading(false)
      } catch (error) {
        console.error('❌ Failed to load invitation:', error)
        showError('Failed to load invitation', 'network', 'Please check your connection and try again')
        setLoading(false)
      }
    }

    loadInvitation()
  }, [invitationToken])

  const showError = (message: string, type: ErrorType = 'unknown', details?: string) => {
    setError({ message, type, details })
    setSubmitting(false)
  }

  const clearError = () => setError(null)

  const validateForm = (): boolean => {
    clearError()

    if (!formData.fullName.trim()) {
      showError('Please enter your full name', 'validation')
      return false
    }

    if (!formData.password) {
      showError('Please enter a password', 'validation')
      return false
    }

    if (formData.password.length < 8) {
      showError('Password must be at least 8 characters long', 'validation')
      return false
    }

    if (passwordStrength === 'weak') {
      showError('Please choose a stronger password', 'validation', 'Include uppercase, lowercase, numbers, and special characters')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match', 'validation')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !invitationData) {
      return
    }

    setSubmitting(true)
    clearError()

    try {
      const { supabase } = await import('@/lib/supabase/client')

      // Step 1: Create user account
      console.log('🔐 Creating user account...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitationData.invited_email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim()
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          showError('Email already registered', 'auth', 'Please sign in instead')
        } else if (signUpError.message.toLowerCase().includes('password')) {
          showError('Password requirements not met', 'validation', signUpError.message)
        } else {
          showError(signUpError.message || 'Failed to create account', 'auth')
        }
        return
      }

      if (!signUpData.user) {
        showError('Account creation failed', 'auth', 'Please try again')
        return
      }

      const userId = signUpData.user.id
      console.log('✅ User account created:', userId)

      // Step 2: Accept invitation and create membership
      console.log('👤 Accepting invitation...')

      const acceptResponse = await fetch('/api/v2/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signUpData.session?.access_token}`
        },
        body: JSON.stringify({
          invitation_token: invitationToken,
          user_id: userId
        })
      })

      if (!acceptResponse.ok) {
        const errorData = await acceptResponse.json()
        showError('Failed to accept invitation', 'invitation', errorData.error || 'Please contact your administrator')
        return
      }

      const acceptData = await acceptResponse.json()
      console.log('✅ Invitation accepted:', acceptData)

      // Step 3: Store organization context and redirect
      localStorage.setItem('organizationId', invitationData.organization_id)
      localStorage.setItem('safeOrganizationId', invitationData.organization_id)
      localStorage.setItem('salonRole', invitationData.role.toLowerCase())
      localStorage.setItem('userEmail', invitationData.invited_email)
      localStorage.setItem('userId', userId)

      setSuccess(true)

      // Redirect to app after short delay
      setTimeout(() => {
        const appRedirectMap: { [key: string]: string } = {
          'salon': '/salon/auth',
          'jewelry': '/jewelry-access',
          'crm': '/crm-access',
          'isp': '/isp-access',
          'civicflow': '/civicflow-auth'
        }

        const redirectPath = appRedirectMap[invitationData.app_type] || '/salon/auth'
        console.log('✅ Redirecting to:', redirectPath)
        router.push(redirectPath)
      }, 2000)

    } catch (error) {
      console.error('❌ Accept invitation error:', error)
      showError('An unexpected error occurred', 'unknown', 'Please try again')
    }
  }

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'validation': return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'auth': return <Shield className="w-5 h-5 text-red-500" />
      case 'network': return <Loader2 className="w-5 h-5 text-orange-500" />
      case 'invitation': return <UserPlus className="w-5 h-5 text-purple-500" />
      default: return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-amber-500'
      case 'strong': return 'bg-green-500'
    }
  }

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return 'w-1/3'
      case 'medium': return 'w-2/3'
      case 'strong': return 'w-full'
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Animated background gradients (public HERA theme) */}
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm mb-6 shadow-lg">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">
              Team Invitation
            </span>
          </div>
          <h1 className="ink text-3xl md:text-4xl font-bold mb-2">
            {loading ? 'Loading Invitation...' : success ? 'Welcome Aboard!' : 'Accept Invitation'}
          </h1>
          <p className="ink-muted">
            {loading ? 'Please wait while we verify your invitation' :
             success ? 'Your account has been created successfully' :
             'Create your account to join the team'}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="card-glass p-12 rounded-2xl border border-slate-700/50 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="ink-muted">Verifying invitation...</p>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="card-glass p-8 rounded-2xl border border-green-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="ink text-xl font-semibold mb-2">Account Created!</h3>
              <p className="ink-muted mb-4">
                You've successfully joined <span className="ink font-medium">{invitationData?.organization_name}</span>
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="ink-muted">Redirecting to {invitationData?.app_name}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && !success && error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              {getErrorIcon(error.type)}
              <div className="flex-1">
                <p className="text-red-200 font-medium">{error.message}</p>
                {error.details && (
                  <p className="text-red-300/70 text-sm mt-1">{error.details}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!loading && !success && invitationData && (
          <>
            {/* Invitation details card */}
            <div className="card-glass p-6 rounded-2xl border border-slate-700/50 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="ink font-semibold text-lg mb-1">{invitationData.organization_name}</h3>
                  <p className="ink-muted text-sm">You've been invited to join as <span className="ink capitalize font-medium">{invitationData.role}</span></p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-t border-slate-700/30">
                  <span className="ink-muted">Email</span>
                  <span className="ink font-medium">{invitationData.invited_email}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-700/30">
                  <span className="ink-muted">Application</span>
                  <span className="ink font-medium">{invitationData.app_name}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-slate-700/30">
                  <span className="ink-muted">Invited by</span>
                  <span className="ink font-medium">{invitationData.invited_by}</span>
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="card-glass p-8 rounded-2xl border border-slate-700/50">
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label className="block ink text-sm font-medium mb-2">
                      <User className="inline-block w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      placeholder="Enter your full name"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block ink text-sm font-medium mb-2">
                      <Lock className="inline-block w-4 h-4 mr-2" />
                      Create Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pr-12"
                        placeholder="Create a strong password"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs ink-muted">Password Strength</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength === 'weak' ? 'text-red-400' :
                            passwordStrength === 'medium' ? 'text-amber-400' :
                            'text-green-400'
                          }`}>
                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full ${getPasswordStrengthColor()} ${getPasswordStrengthWidth()} transition-all duration-300`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block ink text-sm font-medium mb-2">
                      <Lock className="inline-block w-4 h-4 mr-2" />
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pr-12"
                        placeholder="Re-enter your password"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="inline-block w-5 h-5 mr-2" />
                      Accept & Join
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Already have account link */}
            <div className="text-center mt-6">
              <p className="ink-muted text-sm">
                Already have an account?{' '}
                <Link href="/salon/auth" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
