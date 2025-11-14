'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Store,
  Scissors,
  Package,
  Heart,
  Calculator,
  Briefcase,
  Loader2
} from 'lucide-react'

interface AppOption {
  id: string
  title: string
  description: string
  icon: any
  route: string
  color: string
}

const availableApps: AppOption[] = [
  {
    id: 'salon',
    title: 'Salon Management',
    description:
      'Complete salon operations with appointment booking, staff management, and inventory',
    icon: Scissors,
    route: '/dashboard-progressive/salon',
    color: 'from-pink-500 to-purple-600'
  },
  {
    id: 'restaurant',
    title: 'Restaurant POS',
    description: 'Full restaurant management with menu, orders, inventory, and kitchen operations',
    icon: Store,
    route: '/dashboard-progressive/restaurant',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'retail',
    title: 'Retail Store',
    description: 'Inventory management, POS, customer tracking, and sales analytics',
    icon: Package,
    route: '/dashboard-progressive/retail',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'healthcare',
    title: 'Healthcare Practice',
    description: 'Patient management, appointments, prescriptions, and billing',
    icon: Heart,
    route: '/dashboard-progressive/healthcare',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'budgeting',
    title: 'Universal Budgeting',
    description: 'Enterprise budgeting and forecasting for any business type',
    icon: Calculator,
    route: '/budgeting',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'financial',
    title: 'Financial Management',
    description: 'Complete accounting with GL, AR, AP, and financial reporting',
    icon: Briefcase,
    route: '/financial-progressive',
    color: 'from-gray-600 to-gray-900'
  }
]

export default function SetupPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, currentOrganization } = useHERAAuth()
  const [selectedApp, setSelectedApp] = useState<string | null>(null)

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  const handleAppSelection = (app: AppOption) => {
    setSelectedApp(app.id)
    // Navigate to the selected app
    router.push(app.route)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-light text-gray-100 mb-4">Choose Your HERA Application</h1>
            <p className="text-xl text-muted-foreground">
              {currentOrganization
                ? `Welcome to ${currentOrganization.name}. Select an app to get started.`
                : 'Select an application to begin your business management journey'}
            </p>
          </div>

          {/* App Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableApps.map(app => {
              const Icon = app.icon
              return (
                <Card
                  key={app.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  onClick={() => handleAppSelection(app)}
                >
                  <CardHeader>
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${app.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-8 h-8 text-foreground" />
                    </div>
                    <CardTitle className="text-xl">{app.title}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full justify-between group-hover:text-primary"
                      disabled={selectedApp === app.id}
                    >
                      {selectedApp === app.id ? (
                        <>
                          <span>Loading...</span>
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <span>Open App</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              All apps include sample data and are ready to use immediately. No setup required.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push('/custom-request')}>
                Need a Custom Solution?
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
