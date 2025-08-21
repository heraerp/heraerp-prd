'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { 
  Package, 
  Users, 
  Settings, 
  ArrowRight,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Scissors,
  Store,
  Calculator,
  Heart,
  Briefcase,
  Plus
} from 'lucide-react'
import Link from 'next/link'

const appIcons = {
  crm: Users,
  inventory: Package,
  accounting: Calculator,
  pos: Store,
  hrm: Users,
  analytics: TrendingUp,
  salon: Scissors,
  restaurant: Store,
  budgeting: Calculator,
  healthcare: Heart,
  financial: Briefcase,
  retail: Package
}

const appDescriptions = {
  crm: 'Customer relationship management',
  inventory: 'Stock and supplier management',
  accounting: 'Financial management & reporting',
  pos: 'Point of sale system',
  hrm: 'Human resource management',
  analytics: 'Business intelligence & reports'
}

export default function OrganizationDashboard() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [installedApps, setInstalledApps] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 1,
    activeApps: 0,
    monthlySpend: 0,
    dataUsage: '12.5 MB'
  })

  useEffect(() => {
    if (!isAuthenticated || !currentOrganization) {
      router.push('/auth')
      return
    }

    // Load installed apps
    loadInstalledApps()
  }, [isAuthenticated, currentOrganization, router])

  const loadInstalledApps = async () => {
    try {
      // For demo purposes, show sample installed apps
      const demoApps = [
        { id: 'crm', name: 'CRM & Sales', status: 'active', installed_at: new Date().toISOString() },
        { id: 'accounting', name: 'Accounting', status: 'active', installed_at: new Date().toISOString() },
        { id: 'inventory', name: 'Inventory', status: 'active', installed_at: new Date().toISOString() }
      ]
      
      setInstalledApps(demoApps)
      setStats(prev => ({ ...prev, activeApps: demoApps.length }))
      
      // Uncomment for production:
      // const response = await fetch(`/api/v1/organizations/${currentOrganization?.id}/apps`)
      // if (response.ok) {
      //   const data = await response.json()
      //   setInstalledApps(data.installed_apps || [])
      //   setStats(prev => ({ ...prev, activeApps: data.installed_apps?.length || 0 }))
      // }
    } catch (error) {
      console.error('Error loading apps:', error)
    }
  }

  if (!currentOrganization) {
    return null
  }

  const subdomain = currentOrganization.subdomain

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome to {currentOrganization.name}
              </h1>
              <p className="text-slate-600 text-lg">
                Manage your business applications and settings from one central dashboard.
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-4 py-2">
              {currentOrganization.subdomain}.heraerp.com
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Users className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Active Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-purple-900">{stats.activeApps}</p>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Package className="w-5 h-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Monthly Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-green-900">${stats.monthlySpend}</p>
                <div className="p-2 bg-green-200 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Data Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-orange-900">{stats.dataUsage}</p>
                <div className="p-2 bg-orange-200 rounded-lg">
                  <Activity className="w-5 h-5 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Installed Apps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Installed Applications</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/~${subdomain}/apps`}>
              View All Apps
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {installedApps.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No apps installed yet</h3>
              <p className="text-gray-600 mb-4">
                Install your first app to start managing your business
              </p>
              <Button asChild>
                <Link href={`/~${subdomain}/apps`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Apps
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {installedApps.map((app) => {
              const Icon = appIcons[app.id as keyof typeof appIcons] || Package
              
              return (
                <Card key={app.id} className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge 
                        variant={app.status === 'active' ? 'default' : 'secondary'}
                        className={app.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{app.name || app.id.toUpperCase()}</CardTitle>
                    <CardDescription>
                      {appDescriptions[app.id as keyof typeof appDescriptions] || 'Business application'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-slate-600">
                        Installed {new Date(app.installed_at || Date.now()).toLocaleDateString()}
                      </div>
                      <Button className="w-full" asChild>
                        <Link href={`/~${subdomain}/${app.id}`}>
                          Open App
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500 group" onClick={() => router.push(`/~${subdomain}/users`)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Invite Team Members</CardTitle>
                    <CardDescription>
                      Add users and manage permissions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-500 group" onClick={() => router.push(`/~${subdomain}/settings`)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Organization Settings</CardTitle>
                    <CardDescription>
                      Configure organization preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-500 group" onClick={() => router.push(`/~${subdomain}/billing`)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Billing & Subscription</CardTitle>
                    <CardDescription>
                      Manage your subscription plan
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}