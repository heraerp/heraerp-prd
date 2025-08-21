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
  salon: Scissors,
  restaurant: Store,
  budgeting: Calculator,
  healthcare: Heart,
  financial: Briefcase,
  retail: Package
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
      const response = await fetch(`/api/v1/organizations/${currentOrganization?.id}/apps`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInstalledApps(data.installed_apps || [])
        setStats(prev => ({ ...prev, activeApps: data.installed_apps?.length || 0 }))
      }
    } catch (error) {
      console.error('Error loading apps:', error)
    }
  }

  if (!currentOrganization) {
    return null
  }

  const subdomain = currentOrganization.subdomain

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          Welcome to {currentOrganization.name}
        </h1>
        <p className="text-gray-600">
          Manage your business applications and settings from one central dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">{stats.totalUsers}</p>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Apps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">{stats.activeApps}</p>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">${stats.monthlySpend}</p>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Data Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">{stats.dataUsage}</p>
              <Activity className="w-5 h-5 text-gray-400" />
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
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                        {app.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{app.name}</CardTitle>
                    <CardDescription>
                      Installed {new Date(app.installed_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/~${subdomain}/${app.id}`}>
                        Open App
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/~${subdomain}/users`)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Invite Team Members</CardTitle>
              </div>
              <CardDescription>
                Add users and manage permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/~${subdomain}/settings`)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Organization Settings</CardTitle>
              </div>
              <CardDescription>
                Configure organization preferences
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/~${subdomain}/billing`)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">Billing & Subscription</CardTitle>
              </div>
              <CardDescription>
                Manage your subscription plan
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}