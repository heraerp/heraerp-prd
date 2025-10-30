'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building,
  Globe,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield
} from 'lucide-react'
import Link from 'next/link'

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

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)

  const [formData, setFormData] = useState({
    organizationName: '',
    industry: '',
    currency: 'USD',
    selectedApp: ''
  })

  const showError = (message: string, type: ErrorType = 'unknown', details?: string) => {
    setError({ message, type, details })
    setLoading(false)
  }

  const clearError = () => setError(null)

  const validateStep1 = (): boolean => {
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

  const validateStep2 = (): boolean => {
    clearError()

    if (!formData.selectedApp) {
      showError('Please select an application', 'validation')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    clearError()
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push('/auth/organizations')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) {
      return
    }

    setLoading(true)
    clearError()

    try {
      const { supabase } = await import('@/lib/supabase/client')

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        showError('Session expired', 'auth', 'Please sign in again')
        router.push('/signup')
        return
      }

      console.log('🏢 Creating organization...')

      const orgResponse = await fetch('/api/v2/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          organization_name: formData.organizationName.trim(),
          organization_type: 'business_unit',
          industry_classification: formData.industry,
          settings: {
            currency: formData.currency,
            selected_app: formData.selectedApp,
            created_via: 'create_org_page',
            theme: { preset: 'default' }
          },
          status: 'active',
          role: 'owner',
          auto_onboard: true
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

      const organizationId = orgData.data?.organization?.id

      if (!organizationId) {
        console.error('❌ No organization ID in response:', orgData)
        showError('Organization created but ID missing', 'organization', 'Please contact support')
        return
      }

      const selectedAppConfig = AVAILABLE_APPS.find(app => app.id === formData.selectedApp)

      if (selectedAppConfig) {
        localStorage.setItem('organizationId', organizationId)
        localStorage.setItem('safeOrganizationId', organizationId)
        localStorage.setItem('salonRole', 'owner')
        localStorage.setItem('userEmail', session.user.email || '')
        localStorage.setItem('userId', session.user.id)

        console.log('✅ Organization setup complete! Redirecting to:', selectedAppConfig.href)

        setTimeout(() => {
          router.push(selectedAppConfig.href)
        }, 1500)
      }
    } catch (error) {
      console.error('❌ Create organization error:', error)
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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">
              HERA Platform • Create Organization
            </span>
          </div>
          <h1 className="ink text-3xl md:text-4xl font-bold mb-2">
            {currentStep === 1 ? 'Tell Us About Your Business' : 'Choose Your Application'}
          </h1>
          <p className="ink-muted">
            {currentStep === 1 ? "We'll customize your experience based on your industry" : 'Select the application that best fits your needs'}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep >= step ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 2 && <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${currentStep > step ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs ink-muted px-2">
            <span>Business Info</span>
            <span>App Selection</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              {getErrorIcon(error.type)}
              <div className="flex-1">
                <p className="text-red-200 font-medium">{error.message}</p>
                {error.details && <p className="text-red-300/70 text-sm mt-1">{error.details}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="card-glass p-8 rounded-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <Building className="inline-block w-4 h-4 mr-2" />
                    Organization Name
                  </label>
                  <input type="text" value={formData.organizationName} onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" placeholder="Enter your business name" disabled={loading} />
                </div>

                <div>
                  <label className="block ink text-sm font-medium mb-2">
                    <Globe className="inline-block w-4 h-4 mr-2" />
                    Industry
                  </label>
                  <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" disabled={loading}>
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
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl ink placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" disabled={loading}>
                    {CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.symbol} {currency.name} ({currency.code})</option>)}
                  </select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="ink-muted text-sm mb-4">Choose the application that best fits your business needs. You can always add more applications later.</p>
                <div className="grid gap-4">
                  {AVAILABLE_APPS.map((app) => (
                    <button key={app.id} type="button" onClick={() => setFormData({ ...formData, selectedApp: app.id })} className={`relative group p-4 rounded-xl border-2 transition-all text-left ${formData.selectedApp === app.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'}`} disabled={loading}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-2xl flex-shrink-0`}>{app.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="ink font-semibold text-lg mb-1">{app.name}</h3>
                          <p className="ink-muted text-sm">{app.description}</p>
                        </div>
                        {formData.selectedApp === app.id && <CheckCircle2 className="w-6 h-6 text-indigo-400 flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-8">
              <button type="button" onClick={handleBack} disabled={loading} className="flex-1 px-6 py-3 bg-slate-800 border border-slate-600 rounded-xl ink font-medium hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <ArrowLeft className="inline-block w-5 h-5 mr-2" />
                Back
              </button>

              {currentStep < 2 ? (
                <button type="button" onClick={handleNext} disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  Continue
                  <ArrowRight className="inline-block w-5 h-5 ml-2" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {loading ? (<><Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />Creating Organization...</>) : (<><CheckCircle2 className="inline-block w-5 h-5 mr-2" />Create Organization</>)}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="ink-muted text-sm">
            Changed your mind?{' '}
            <Link href="/auth/organizations" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Back to Organizations</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
