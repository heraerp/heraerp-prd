'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building,
  ArrowRight,
  Sparkles,
  LogOut,
  Loader2,
  Shield,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function OrganizationsPage() {
  const router = useRouter()
  const { organizations, switchOrganization, user, isAuthenticated, isLoading: authLoading } =
    useHERAAuth()
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login...')
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  // ✅ DIAGNOSTIC: Log ALL organizations data when loaded
  useEffect(() => {
    if (organizations.length > 0) {
      console.log('🔍 [ORG PAGE] ====================== ORGANIZATIONS DATA ======================')
      console.log('🔍 [ORG PAGE] Total organizations loaded:', organizations.length)

      organizations.forEach((org, index) => {
        console.log(`\n🔍 [ORG PAGE] Organization ${index + 1}/${organizations.length}:`)
        console.log('  - ID:', org.id)
        console.log('  - Name:', org.name)
        console.log('  - Code:', org.code)
        console.log('  - Type:', org.type)
        console.log('  - Primary Role:', (org as any).primary_role)
        console.log('  - User Role:', org.user_role)
        console.log('  - All Roles:', (org as any).roles)
        console.log('  - Apps:', (org as any).apps)
        console.log('  - Apps Count:', ((org as any).apps || []).length)
        console.log('  - First App:', ((org as any).apps || [])[0])
        console.log('  - Settings:', (org as any).settings)
        console.log('  - Joined At:', (org as any).joined_at)
      })

      console.log('\n🔍 [ORG PAGE] ====================== END ORGANIZATIONS DATA ======================\n')
    }
  }, [organizations])

  const handleSelectOrganization = async (org: any) => {
    setSelectedOrg(org.id)

    // ✅ COMPREHENSIVE DEBUG LOGGING
    console.log('🏢 [ORG SELECTOR] ======================')
    console.log('🏢 [ORG SELECTOR] Selecting organization:', org.name)
    console.log('🏢 [ORG SELECTOR] Full org object:', org)
    console.log('🏢 [ORG SELECTOR] Org ID:', org.id)
    console.log('🏢 [ORG SELECTOR] Org Code:', org.code)
    console.log('🏢 [ORG SELECTOR] Org Name:', org.name)
    console.log('🏢 [ORG SELECTOR] Org Type:', org.type)
    console.log('🏢 [ORG SELECTOR] Primary Role:', (org as any).primary_role)
    console.log('🏢 [ORG SELECTOR] User Role:', (org as any).user_role)
    console.log('🏢 [ORG SELECTOR] All Roles:', (org as any).roles)
    console.log('🏢 [ORG SELECTOR] Apps:', (org as any).apps)
    console.log('🏢 [ORG SELECTOR] Settings:', (org as any).settings)
    console.log('🏢 [ORG SELECTOR] ======================')

    try {
      // ✅ CRITICAL FIX: Get apps from the CLICKED org parameter (not context)
      // The org parameter already has all the data we need from the map iteration
      const orgApps = (org as any).apps || []

      console.log('📱 [ORG SELECTOR] Apps for selected organization:', {
        orgId: org.id,
        orgName: org.name,
        apps: orgApps,
        appsCount: orgApps.length,
        firstAppCode: orgApps[0]?.code,
        firstAppName: orgApps[0]?.name
      })

      // Redirect to appropriate app
      if (orgApps.length > 0) {
        const firstApp = orgApps[0]
        const appPath = `/${firstApp.code.toLowerCase()}/dashboard`
        console.log(`✅ Redirecting to ${firstApp.name} -> ${appPath}`)

        // ✅ ENTERPRISE: Switch organization context (updates role and localStorage)
        await switchOrganization(org.id)

        // Short delay for smooth UX
        setTimeout(() => {
          router.push(appPath)
        }, 300)
      } else {
        console.warn('⚠️ Organization has no apps installed')
        alert('This organization has no apps installed. Please contact your administrator.')
        setSelectedOrg(null)
      }
    } catch (error) {
      console.error('❌ Error switching organization:', error)
      alert('Failed to switch organization. Please try again.')
      setSelectedOrg(null)
    }
  }

  const handleSignOut = async () => {
    const { supabase } = await import('@/lib/supabase/client')
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/auth/login')
  }

  const getAppIcon = (appCode?: string) => {
    const iconMap: Record<string, string> = {
      SALON: '💇',
      CASHEW: '💰',
      CRM: '👥',
      ERP: '🏢',
      INVENTORY: '📦',
      POS: '🛒'
    }
    return iconMap[appCode?.toUpperCase() || ''] || '🏢'
  }

  const getAppColor = (appCode?: string) => {
    const colorMap: Record<string, string> = {
      SALON: 'from-amber-500 to-orange-600',
      CASHEW: 'from-green-500 to-emerald-600',
      CRM: 'from-blue-500 to-cyan-600',
      ERP: 'from-slate-500 to-slate-700',
      INVENTORY: 'from-purple-500 to-pink-600',
      POS: 'from-indigo-500 to-purple-600'
    }
    return colorMap[appCode?.toUpperCase() || ''] || 'from-slate-500 to-slate-700'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        {/* Background gradients matching public theme */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl" />

        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="ink text-lg">Loading your organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Enhanced Design */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Background gradients matching public theme */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Badge matching public theme */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-8">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                HERA Platform
              </span>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
              <span className="ink block mb-2">
                {organizations.length > 0 ? 'Select Organization' : 'Create Organization'}
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400">
                {organizations.length > 0 ? 'Choose to Continue' : 'Get Started'}
              </span>
            </h1>

            {user?.email && (
              <p className="ink-muted text-xl max-w-3xl mx-auto mb-8">
                Signed in as <span className="font-semibold ink">{user.email}</span>
              </p>
            )}

            <p className="ink-muted text-lg max-w-3xl mx-auto">
              {organizations.length > 0
                ? 'Select an organization to access your workspace and begin managing your business operations.'
                : 'Create your first organization to unlock the full power of HERA.'}
            </p>
          </div>
        </div>
      </section>

      {/* Organizations Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          {organizations.length > 0 ? (
            <div className="space-y-6">
              {organizations.map(org => {
                const orgApps = (org as any).apps || []
                const firstAppCode = orgApps[0]?.code

                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrganization(org)}
                    disabled={selectedOrg === org.id}
                    className={`w-full group relative transition-all duration-300 ${
                      selectedOrg === org.id ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    {/* Background glow effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${getAppColor(firstAppCode)} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300`}
                    />

                    {/* Card */}
                    <div
                      className={`relative card-glass p-8 rounded-2xl border-2 transition-all text-left ${
                        selectedOrg === org.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-border hover:border-indigo-500/30 bg-white/5 dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        {/* App Icon */}
                        <div
                          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getAppColor(firstAppCode)} flex items-center justify-center text-4xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
                        >
                          {getAppIcon(firstAppCode)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="ink font-bold text-2xl mb-1">{org.name}</h3>
                              <p className="ink-muted text-sm">Code: {org.code}</p>
                            </div>
                            {selectedOrg === org.id ? (
                              <Loader2 className="w-7 h-7 text-indigo-400 flex-shrink-0 animate-spin" />
                            ) : (
                              <ArrowRight className="w-7 h-7 text-slate-400 flex-shrink-0 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-sm ink-muted mb-4">
                            {org.user_role && (
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span className="capitalize">
                                  {(org as any).user_label ||
                                    org.user_role.replace('ORG_', '').toLowerCase()}
                                </span>
                              </div>
                            )}
                            {(org as any).joined_at && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Joined {formatDate((org as any).joined_at)}</span>
                              </div>
                            )}
                            {(org as any).settings?.currency && (
                              <div className="flex items-center gap-2">
                                <span>💰 {(org as any).settings.currency}</span>
                              </div>
                            )}
                          </div>

                          {/* App badges */}
                          {orgApps.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {orgApps.map((app: any) => (
                                <span
                                  key={app.code}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                                >
                                  {app.code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                              No apps installed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-20">
              <div className="relative group mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto border-4 border-indigo-500/20">
                  <Building className="w-16 h-16 text-indigo-400" />
                </div>
              </div>
              <h3 className="ink text-3xl font-bold mb-4">No Organizations Yet</h3>
              <p className="ink-muted text-lg max-w-2xl mx-auto mb-8">
                Create your first organization to get started with HERA. You'll be able to manage
                your business operations, invite team members, and access powerful ERP features.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-8">
            <Link
              href="/signup/create-organization"
              className="group relative overflow-hidden px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Create New Organization
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="px-6 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          <div className="text-center">
            <p className="ink-muted text-sm">
              Need help?{' '}
              <Link
                href="/contact"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
