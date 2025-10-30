'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ArrowLeft,
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
  DollarSign,
  Globe
} from 'lucide-react'
import Link from 'next/link'

// Available HERA apps for selection
const AVAILABLE_APPS = [
  {
    id: 'salon',
    name: 'Salon & Beauty',
    icon: '💇',
    description: 'Appointments, inventory & POS',
    href: '/salon/auth',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'jewelry',
    name: 'Jewelry Store',
    icon: '💎',
    description: 'Retail, inventory & customer management',
    href: '/jewelry-access',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'crm',
    name: 'CRM Platform',
    icon: '👥',
    description: 'Pipeline, accounts & activities',
    href: '/crm-access',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'isp',
    name: 'ISP Operations',
    icon: '🌐',
    description: 'Provisioning, billing & tickets',
    href: '/isp-access',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'civicflow',
    name: 'CivicFlow',
    icon: '🏛️',
    description: 'Grants, reviews & tracking',
    href: '/civicflow-auth',
    color: 'from-indigo-500 to-purple-600'
  }
]

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
]

type ErrorType = 'validation' | 'auth' | 'network' | 'organization' | 'unknown'

interface ErrorState {
  message: string
  type: ErrorType
  details?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')
  const [showSuccess, setShowSuccess] = useState(false)

  // Check if user is already logged in and show notification
  useEffect(() => {
    const checkExistingSession = async () => {
      const { supabase } = await import('@/lib/supabase/client')
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        console.log('⚠️ User already logged in')
        showError(
          'You are already registered!',
          'auth',
          `Redirecting to your organizations...`
        )

        // Redirect after showing notification
        setTimeout(() => {
          router.push('/auth/organizations')
        }, 2000)
      }
    }

    checkExistingSession()
  }, [router])

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',

    // Step 2: Organization Info
    organizationName: '',
    industry: '',
    currency: 'USD',

    // Step 3: App Selection
    selectedApp: '',

    // Internal: Created after Step 1
    userId: '',
    sessionToken: ''
  })

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

  const showError = (message: string, type: ErrorType = 'unknown', details?: string) => {
    setError({ message, type, details })
    setLoading(false)
  }

  const clearError = () => setError(null)

  // Validate Step 1 (Account Info)
  const validateStep1 = (): boolean => {
    clearError()

    if (!formData.fullName.trim()) {
      showError('Please enter your full name', 'validation')
      return false
    }

    if (!formData.email.trim()) {
      showError('Please enter your email address', 'validation')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError('Please enter a valid email address', 'validation')
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

  // Validate Step 2 (Organization Info)
  const validateStep2 = (): boolean => {
    clearError()

    if (!formData.organizationName.trim()) {
      showError('Please enter your organization name', 'validation')
      return false
    }

    if (!formData.industry.trim()) {
      showError('Please select your industry', 'validation')
      return false
    }

    return true
  }

  // Validate Step 3 (App Selection)
  const validateStep3 = (): boolean => {
    clearError()

    if (!formData.selectedApp) {
      showError('Please select an application', 'validation')
      return false
    }

    return true
  }

  const handleNext = async () => {
    let isValid = false

    if (currentStep === 1) {
      isValid = validateStep1()

      // Create Supabase user account immediately after Step 1 validation
      if (isValid) {
        setLoading(true)
        clearError()

        try {
          const { supabase } = await import('@/lib/supabase/client')

          console.log('🔐 Creating user account after Step 1...')
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email.trim(),
            password: formData.password,
            options: {
              data: {
                full_name: formData.fullName.trim()
              }
            }
          })

          if (signUpError) {
            if (signUpError.message.toLowerCase().includes('already registered')) {
              showError('Email already registered', 'auth', 'Please sign in or use a different email')
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

          console.log('✅ User account created:', signUpData.user.id)

          // Store user data for later steps
          setFormData({
            ...formData,
            userId: signUpData.user.id,
            sessionToken: signUpData.session?.access_token
          })

          setLoading(false)
          setCurrentStep(currentStep + 1)
        } catch (error) {
          console.error('❌ User creation error:', error)
          showError('An unexpected error occurred', 'unknown', 'Please try again')
        }
      }
    } else if (currentStep === 2) {
      isValid = validateStep2()
      if (isValid) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      if (isValid) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    clearError()
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep3()) {
      return
    }

    setLoading(true)
    clearError()

    try {
      // User was already created in Step 1, use stored userId and sessionToken
      const userId = formData.userId
      const sessionToken = formData.sessionToken

      if (!userId || !sessionToken) {
        showError('Session expired', 'auth', 'Please start over')
        setCurrentStep(1)
        return
      }

      console.log('✅ Using existing user account:', userId)

      // Step 2: Create organization via API v2.3 (with auto-onboarding)
      console.log('🏢 Creating organization with auto-onboarding...')

      const orgResponse = await fetch('/api/v2/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          organization_name: formData.organizationName.trim(),
          organization_type: 'business_unit',
          industry_classification: formData.industry,
          settings: {
            currency: formData.currency,
            selected_app: formData.selectedApp,
            created_via: 'signup_flow',
            theme: { preset: 'default' }
          },
          status: 'active',
          role: 'owner', // User will be onboarded as owner
          auto_onboard: true // Automatically onboard user
        })
      })

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json()
        console.error('❌ Organization creation failed:', errorData)
        showError('Failed to create organization', 'organization', errorData.error || errorData.details || 'Please try again')
        return
      }

      const orgData = await orgResponse.json()
      console.log('✅ Organization created:', orgData)

      // Extract organization ID from response
      const organizationId = orgData.data?.organization?.id

      if (!organizationId) {
        console.error('❌ No organization ID in response:', orgData)
        showError('Organization created but ID missing', 'organization', 'Please contact support')
        return
      }

      console.log('✅ Organization ID:', organizationId)
      console.log('✅ Membership:', orgData.data?.membership)

      // Step 3: Store organization context in localStorage
      localStorage.setItem('organizationId', organizationId)
      localStorage.setItem('safeOrganizationId', organizationId)
      localStorage.setItem('salonRole', 'owner') // Set role as owner
      localStorage.setItem('userEmail', formData.email.trim())
      localStorage.setItem('userId', userId)

      // Step 4: Show success message
      setLoading(false)
      setShowSuccess(true)

      console.log('✅ Signup complete! Showing welcome message...')

      // Redirect to user management page after showing welcome message
      setTimeout(() => {
        const selectedAppConfig = AVAILABLE_APPS.find(app => app.id === formData.selectedApp)
        // Redirect to user management based on selected app
        const userManagementPath = selectedAppConfig?.id === 'salon'
          ? '/salon/staff'
          : selectedAppConfig?.id === 'crm'
          ? '/crm/users'
          : '/salon/staff' // Default fallback
        console.log('🎯 Redirecting to user management:', userManagementPath)
        router.push(userManagementPath)
      }, 3000)

    } catch (error) {
      console.error('❌ Signup error:', error)
      showError('An unexpected error occurred', 'unknown', 'Please try again')
    }
  }

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'validation': return <AlertCircle className="w-5 h-5 text-amber-500" />
      case 'auth': return <Shield className="w-5 h-5 text-red-500" />
      case 'network': return <Globe className="w-5 h-5 text-orange-500" />
      case 'organization': return <Building className="w-5 h-5 text-purple-500" />
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
      <div className="relative w-full max-w-2xl">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">
              HERA Platform • Create Your Account
            </span>
          </div>
          <h1 className="ink text-3xl md:text-4xl font-bold mb-2">
            {currentStep === 1 && 'Create Your Account'}
            {currentStep === 2 && 'Tell Us About Your Business'}
            {currentStep === 3 && 'Choose Your Application'}
            {currentStep === 4 && 'Confirm & Create'}
          </h1>
          <p className="ink-muted">
            {currentStep === 1 && 'Start your journey with HERA in just a few steps'}
            {currentStep === 2 && "We'll customize your experience based on your industry"}
            {currentStep === 3 && 'Select the application that best fits your needs'}
            {currentStep === 4 && 'Review your details and complete setup'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      currentStep > step ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs ink-muted px-2">
            <span>Account</span>
            <span>Business</span>
            <span>App</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Error display */}
        {error && (
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

        {/* Success welcome message */}
        {showSuccess && (
          <div className="mb-6 p-8 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-2">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-100 mb-2">
                  Welcome to HERA!
                </h3>
                <p className="text-green-200 text-lg mb-1">
                  Enterprise-Grade Business Management
                </p>
                <p className="text-green-300/80 text-sm">
                  Your organization <span className="font-semibold">{formData.organizationName}</span> is ready
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-green-300/70 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting to user management...</span>
              </div>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="card-glass p-8 rounded-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {currentStep === 1 && (
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
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <Mail className="inline-block w-4 h-4 mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="you@company.com"
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <Lock className="inline-block w-4 h-4 mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pr-12"
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      disabled={loading}
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
                      autoComplete="new-password"
                      disabled={loading}
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
            )}

            {/* Step 2: Organization Info */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <Building className="inline-block w-4 h-4 mr-2" />
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="Enter your business name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <Globe className="inline-block w-4 h-4 mr-2" />
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    disabled={loading}
                  >
                    <option value="">Select your industry</option>
                    <option value="salon">Salon & Beauty</option>
                    <option value="jewelry">Jewelry & Retail</option>
                    <option value="crm">Professional Services</option>
                    <option value="isp">Internet Service Provider</option>
                    <option value="civic">Government & Civic</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="finance">Finance & Accounting</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <DollarSign className="inline-block w-4 h-4 mr-2" />
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    disabled={loading}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: App Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="ink-muted text-sm mb-4">
                  Choose the application that best fits your business needs. You can always add more applications later.
                </p>
                <div className="grid gap-4">
                  {AVAILABLE_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, selectedApp: app.id })}
                      className={`relative group p-4 rounded-xl border-2 transition-all text-left ${
                        formData.selectedApp === app.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                      }`}
                      disabled={loading}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="ink font-semibold text-lg mb-1">{app.name}</h3>
                          <p className="ink-muted text-sm">{app.description}</p>
                        </div>
                        {formData.selectedApp === app.id && (
                          <CheckCircle2 className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="card-glass p-6 rounded-xl border border-slate-700/30">
                  <h3 className="ink font-semibold mb-4">Review Your Information</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="ink-muted">Full Name</span>
                      <span className="ink font-medium">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="ink-muted">Email</span>
                      <span className="ink font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="ink-muted">Organization</span>
                      <span className="ink font-medium">{formData.organizationName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="ink-muted">Industry</span>
                      <span className="ink font-medium">{formData.industry}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-700/50">
                      <span className="ink-muted">Currency</span>
                      <span className="ink font-medium">{formData.currency}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="ink-muted">Application</span>
                      <span className="ink font-medium">
                        {AVAILABLE_APPS.find(app => app.id === formData.selectedApp)?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-indigo-200 text-sm">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                        Your data is encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-slate-800 border border-slate-600 rounded-xl ink font-medium hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="inline-block w-5 h-5 mr-2" />
                  Back
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Continue
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="inline-block w-5 h-5 mr-2" />
                      Create Account
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Sign in link */}
        <div className="text-center mt-6">
          <p className="ink-muted text-sm">
            Already have an account?{' '}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
