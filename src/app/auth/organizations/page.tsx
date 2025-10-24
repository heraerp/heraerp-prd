'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building,
  Plus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LogOut,
  Loader2,
  Users,
  Calendar,
  Shield
} from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  organization_name: string
  organization_code: string
  organization_type: string
  user_role?: string
  user_label?: string
  joined_at?: string
  settings?: {
    selected_app?: string
    currency?: string
  }
}

// Available HERA apps for selection
const AVAILABLE_APPS = [
  {
    id: 'salon',
    name: 'Salon & Beauty',
    icon: '💇',
    href: '/salon-access',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'jewelry',
    name: 'Jewelry Store',
    icon: '💎',
    href: '/jewelry-access',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'crm',
    name: 'CRM Platform',
    icon: '👥',
    href: '/crm-access',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'isp',
    name: 'ISP Operations',
    icon: '🌐',
    href: '/isp-access',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'civicflow',
    name: 'CivicFlow',
    icon: '🏛️',
    href: '/civicflow-auth',
    color: 'from-indigo-500 to-purple-600'
  }
]

export default function OrganizationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client')

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        console.log('❌ No session, redirecting to signup...')
        router.push('/signup')
        return
      }

      setUserEmail(session.user.email || '')

      // Fetch user's organizations via API v2
      const response = await fetch('/api/v2/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Organizations loaded:', data.data)
        setOrganizations(data.data || [])
      } else {
        console.error('❌ Failed to load organizations')
        setOrganizations([])
      }
    } catch (error) {
      console.error('❌ Error loading organizations:', error)
      setOrganizations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrg(org.id)

    // Store organization context
    localStorage.setItem('organizationId', org.id)
    localStorage.setItem('safeOrganizationId', org.id)
    localStorage.setItem('salonRole', org.user_role || 'member')
    localStorage.setItem('userEmail', userEmail)

    // Redirect to the app
    const selectedApp = org.settings?.selected_app || 'salon'
    const appConfig = AVAILABLE_APPS.find(app => app.id === selectedApp)

    if (appConfig) {
      console.log('✅ Redirecting to:', appConfig.href)
      setTimeout(() => {
        router.push(appConfig.href)
      }, 500)
    }
  }

  const handleSignOut = async () => {
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/signup')
  }

  const getAppIcon = (appId?: string) => {
    const app = AVAILABLE_APPS.find(a => a.id === appId)
    return app?.icon || '🏢'
  }

  const getAppColor = (appId?: string) => {
    const app = AVAILABLE_APPS.find(a => a.id === appId)
    return app?.color || 'from-slate-500 to-slate-700'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Animated background gradients (matching signup theme) */}
        <div className="fixed inset-0 -z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl" />
        </div>

        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="ink text-lg">Loading your organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Animated background gradients (matching signup theme) */}
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-indigo-500/15 to-violet-500/15 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-4xl">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 backdrop-blur-sm mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold tracking-wide">
              HERA Platform • Your Organizations
            </span>
          </div>
          <h1 className="ink text-3xl md:text-4xl font-bold mb-2">
            {organizations.length > 0 ? 'Select an Organization' : 'Create Your First Organization'}
          </h1>
          <p className="ink-muted mb-2">
            {organizations.length > 0
              ? 'Choose an organization to continue'
              : 'Get started by creating your first organization'}
          </p>
          {userEmail && (
            <p className="text-indigo-300 text-sm">
              Signed in as <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        {/* Organizations list or empty state */}
        <div className="card-glass p-8 rounded-2xl border border-slate-700/50 mb-6">
          {organizations.length > 0 ? (
            <div className="space-y-4">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrganization(org)}
                  disabled={selectedOrg === org.id}
                  className={`w-full group p-6 rounded-xl border-2 transition-all text-left ${
                    selectedOrg === org.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getAppColor(org.settings?.selected_app)} flex items-center justify-center text-3xl flex-shrink-0 shadow-lg`}>
                      {getAppIcon(org.settings?.selected_app)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="ink font-bold text-xl mb-1">{org.organization_name}</h3>
                          <p className="ink-muted text-sm">Code: {org.organization_code}</p>
                        </div>
                        {selectedOrg === org.id ? (
                          <Loader2 className="w-6 h-6 text-indigo-400 flex-shrink-0 animate-spin" />
                        ) : (
                          <ArrowRight className="w-6 h-6 text-slate-400 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm ink-muted">
                        {org.user_role && (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4" />
                            <span className="capitalize">
                              {org.user_label || org.user_role.replace('ORG_', '').toLowerCase()}
                            </span>
                          </div>
                        )}
                        {org.joined_at && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {formatDate(org.joined_at)}</span>
                          </div>
                        )}
                        {org.settings?.currency && (
                          <div className="flex items-center gap-1.5">
                            <span>💰 {org.settings.currency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Building className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="ink text-xl font-semibold mb-2">No Organizations Yet</h3>
              <p className="ink-muted mb-6">
                Create your first organization to get started with HERA
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => router.push('/signup/create-organization')}
            className="flex-1 w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
          >
            <Plus className="inline-block w-5 h-5 mr-2" />
            Create New Organization
          </button>

          <button
            onClick={handleSignOut}
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 border border-slate-600 rounded-xl ink font-medium hover:bg-slate-700 transition-all"
          >
            <LogOut className="inline-block w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="ink-muted text-sm">
            Need help?{' '}
            <Link href="/support" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
