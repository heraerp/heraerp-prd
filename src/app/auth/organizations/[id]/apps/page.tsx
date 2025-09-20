'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import {
  Package,
  Store,
  Heart,
  Briefcase,
  Factory,
  Users,
  Calculator,
  TrendingUp,
  FileText,
  Settings,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  Globe
} from 'lucide-react'

const AVAILABLE_APPS = [
  {
    id: 'crm',
    name: 'CRM & Sales',
    description: 'Customer relationship management with pipeline tracking',
    icon: Users,
    features: ['Contact Management', 'Sales Pipeline', 'Activity Tracking', 'Reports'],
    recommended: ['restaurant', 'salon', 'professional']
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Track stock levels, orders, and suppliers',
    icon: Package,
    features: ['Stock Tracking', 'Purchase Orders', 'Supplier Management', 'Barcode Support'],
    recommended: ['restaurant', 'retail', 'manufacturing']
  },
  {
    id: 'accounting',
    name: 'Accounting & Finance',
    description: 'Complete accounting with automated journal entries',
    icon: Calculator,
    features: ['Chart of Accounts', 'Auto-Journal', 'Financial Reports', 'Budgeting'],
    recommended: ['all']
  },
  {
    id: 'pos',
    name: 'Point of Sale',
    description: 'Modern POS for retail and restaurant operations',
    icon: Store,
    features: ['Quick Checkout', 'Payment Processing', 'Receipt Printing', 'Offline Mode'],
    recommended: ['restaurant', 'retail', 'salon']
  },
  {
    id: 'hrm',
    name: 'Human Resources',
    description: 'Employee management and payroll',
    icon: Users,
    features: ['Employee Records', 'Time Tracking', 'Leave Management', 'Payroll'],
    recommended: ['all']
  },
  {
    id: 'analytics',
    name: 'Analytics & Reports',
    description: 'Business intelligence and custom reporting',
    icon: TrendingUp,
    features: ['Dashboards', 'Custom Reports', 'Data Export', 'Real-time Analytics'],
    recommended: ['all']
  }
]

export default function OrganizationAppsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { organizations, isAuthenticated, refreshOrganizations, session } = useMultiOrgAuth()
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [isInstalling, setIsInstalling] = useState(false)
  const [error, setError] = useState('')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(true)

  useEffect(() => {
    async function getOrgId() {
      const { id } = await params
      setOrganizationId(id)
    }
    getOrgId()
  }, [params])

  useEffect(() => {
    async function loadOrganization() {
      if (!organizationId) return

      // Check if organization data was passed via localStorage (for new orgs)
      const storedOrgData = localStorage.getItem(`new-org-${organizationId}`)
      if (storedOrgData) {
        try {
          const orgData = JSON.parse(storedOrgData)
          const org = {
            id: orgData.id,
            name: orgData.name,
            subdomain: orgData.subdomain,
            type: orgData.type || 'general',
            subscription_plan: 'trial',
            role: 'owner',
            permissions: ['*'],
            is_active: true
          }
          setOrganization(org)

          // For salon organizations, skip app selection and go directly to salon dashboard
          if (orgData.type === 'salon') {
            // Trigger salon setup if not already done
            if (session?.access_token) {
              fetch('/api/v1/salon/setup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  organizationId: orgData.id,
                  organizationName: orgData.name,
                  subdomain: orgData.subdomain,
                  ownerEmail: ''
                })
              }).catch(console.error)
            }

            // Clean up localStorage
            localStorage.removeItem(`new-org-${organizationId}`)

            // Redirect to salon dashboard with subdomain
            router.push(`/~${orgData.subdomain}/salon`)
            return
          }

          // Pre-select recommended apps
          const recommended = AVAILABLE_APPS.filter(
            app =>
              app.recommended.includes('all') || app.recommended.includes(orgData.type || 'general')
          ).map(app => app.id)
          setSelectedApps(['accounting', ...recommended.filter(id => id !== 'accounting')])

          // Clean up localStorage
          localStorage.removeItem(`new-org-${organizationId}`)
          setIsLoadingOrg(false)
          return
        } catch (e) {
          console.error('Error parsing org data:', e)
        }
      }

      // Otherwise, try to find in existing organizations
      let org = organizations.find(o => o.id === organizationId)

      if (!org && isAuthenticated) {
        // If not found, refresh organizations list
        await refreshOrganizations()
        // Try again after refresh
        org = organizations.find(o => o.id === organizationId)
      }

      if (org) {
        setOrganization(org)

        // For salon organizations, skip app selection and go directly to salon dashboard
        if (org.type === 'salon') {
          // Trigger salon setup if not already done
          if (session?.access_token) {
            fetch('/api/v1/salon/setup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                organizationId: org.id,
                organizationName: org.name,
                subdomain: org.subdomain,
                ownerEmail: org.email || ''
              })
            }).catch(console.error)
          }

          // Redirect to salon dashboard with subdomain
          router.push(`/~${org.subdomain}/salon`)
          return
        }

        // Pre-select recommended apps based on organization type
        const recommended = AVAILABLE_APPS.filter(
          app => app.recommended.includes('all') || app.recommended.includes(org.type || 'general')
        ).map(app => app.id)
        setSelectedApps(['accounting', ...recommended.filter(id => id !== 'accounting')])
      } else if (!isAuthenticated) {
        // If not authenticated, redirect to login
        router.push('/auth/login')
      } else {
        // If authenticated but org not found, it's an error
        setError('Organization not found')
      }

      setIsLoadingOrg(false)
    }

    loadOrganization()
  }, [organizationId, organizations, isAuthenticated, refreshOrganizations, router])

  const toggleApp = (appId: string) => {
    setSelectedApps(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    )
  }

  const handleInstallApps = async () => {
    if (selectedApps.length === 0) {
      setError('Please select at least one app to install')
      return
    }

    setIsInstalling(true)
    setError('')

    try {
      // Get auth token
      const authToken = session?.access_token
      if (!authToken) {
        throw new Error('No authentication token available')
      }

      // Install selected apps
      const response = await fetch(`/api/v1/organizations/${organizationId}/apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ apps: selectedApps })
      })

      if (!response.ok) {
        throw new Error('Failed to install apps')
      }

      // Redirect to the organization
      if (organization && process.env.NODE_ENV === 'production') {
        window.location.href = `https://${organization.subdomain}.heraerp.com`
      } else if (organization) {
        router.push(`/~${organization.subdomain}`)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to install apps')
      setIsInstalling(false)
    }
  }

  if (isLoadingOrg || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/20 animate-pulse">
            <Loader2 className="w-10 h-10 text-primary dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-muted-foreground dark:text-muted-foreground mt-4">
            Loading organization...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Glassmorphic orbs for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse animation-delay-4000" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-background/70 dark:bg-background/70 backdrop-blur-xl border-b border-border/20 dark:border-border/50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl shadow-lg border border-border/20">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                  Select Apps
                </h1>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {organization.name}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50"
            >
              {organization.subdomain}.heraerp.com
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/30 dark:to-emerald-900/30 backdrop-blur-sm text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4 shadow-md">
            <Sparkles className="w-4 h-4 mr-2" />
            Recommended apps pre-selected
          </div>
          <h2 className="text-3xl font-bold text-gray-100 dark:text-foreground mb-4">
            Choose Your Business Apps
          </h2>
          <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
            Select the apps you need for {organization.name}. You can always add or remove apps
            later.
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50/80 dark:bg-red-900/30 backdrop-blur border-red-200/50 dark:border-red-800/50"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {AVAILABLE_APPS.map(app => {
            const Icon = app.icon
            const isSelected = selectedApps.includes(app.id)
            const isRecommended =
              app.recommended.includes('all') ||
              app.recommended.includes(organization.type || 'general')

            return (
              <Card
                key={app.id}
                className={`bg-background/80 dark:bg-background/80 backdrop-blur-xl cursor-pointer transition-all transform hover:-translate-y-1 hover:scale-105 duration-200 ${
                  isSelected
                    ? 'border-2 border-blue-500/50 dark:border-blue-400/50 shadow-2xl'
                    : 'border border-border/20 dark:border-border/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 hover:shadow-xl'
                }`}
                onClick={() => toggleApp(app.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-foreground shadow-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isRecommended && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/50"
                        >
                          Recommended
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-gray-100 dark:text-foreground">
                    {app.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                    {app.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {app.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground"
                      >
                        <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              // Skip and go to organization dashboard
              if (organization) {
                router.push(`/org?org=${organization.id}`)
              } else {
                router.push('/auth/organizations')
              }
            }}
            className="border-border/50 dark:border-border/50 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-background/50 dark:hover:bg-muted/50 transition-all"
          >
            Skip for Now
          </Button>
          <Button
            size="lg"
            onClick={handleInstallApps}
            disabled={isInstalling || selectedApps.length === 0}
            className="min-w-[200px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-foreground font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {isInstalling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing Apps...
              </>
            ) : (
              <>
                Install {selectedApps.length} App{selectedApps.length !== 1 ? 's' : ''}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Zap className="h-6 w-6 text-primary dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-100 dark:text-foreground">Instant Setup</h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Apps are ready to use immediately after installation
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="h-6 w-6 text-primary dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-100 dark:text-foreground">
              Fully Integrated
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              All apps work seamlessly together with shared data
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Settings className="h-6 w-6 text-primary dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-100 dark:text-foreground">Flexible</h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Add, remove, or configure apps anytime from settings
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
