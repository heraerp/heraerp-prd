'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { 
  Package, Store, Heart, Briefcase, Factory, Users, 
  Calculator, TrendingUp, FileText, Settings, ArrowRight,
  CheckCircle, Loader2, Sparkles, Zap, Shield, Globe
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
                  'Authorization': `Bearer ${session.access_token}`
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
          const recommended = AVAILABLE_APPS
            .filter(app => 
              app.recommended.includes('all') || 
              app.recommended.includes(orgData.type || 'general')
            )
            .map(app => app.id)
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
                'Authorization': `Bearer ${session.access_token}`
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
        const recommended = AVAILABLE_APPS
          .filter(app => 
            app.recommended.includes('all') || 
            app.recommended.includes(org.type || 'general')
          )
          .map(app => app.id)
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
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
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
          'Authorization': `Bearer ${authToken}`
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Select Apps</h1>
                <p className="text-xs text-slate-600">{organization.name}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {organization.subdomain}.heraerp.com
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Recommended apps pre-selected
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Choose Your Business Apps
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the apps you need for {organization.name}. You can always add or remove apps later.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Apps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {AVAILABLE_APPS.map((app) => {
            const Icon = app.icon
            const isSelected = selectedApps.includes(app.id)
            const isRecommended = app.recommended.includes('all') || 
                                app.recommended.includes(organization.type || 'general')
            
            return (
              <Card 
                key={app.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-2 border-blue-500 shadow-lg' 
                    : 'border-2 border-transparent hover:border-gray-300'
                }`}
                onClick={() => toggleApp(app.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Recommended
                        </Badge>
                      )}
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-4">{app.name}</CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {app.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
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
          >
            Skip for Now
          </Button>
          <Button
            size="lg"
            onClick={handleInstallApps}
            disabled={isInstalling || selectedApps.length === 0}
            className="min-w-[200px]"
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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Instant Setup</h3>
            <p className="text-sm text-slate-600">
              Apps are ready to use immediately after installation
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">Fully Integrated</h3>
            <p className="text-sm text-slate-600">
              All apps work seamlessly together with shared data
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Settings className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Flexible</h3>
            <p className="text-sm text-slate-600">
              Add, remove, or configure apps anytime from settings
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}