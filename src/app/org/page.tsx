'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
        {
          id: 'crm',
          name: 'CRM & Sales',
          status: 'active',
          installed_at: new Date().toISOString()
        },
        {
          id: 'accounting',
          name: 'Accounting',
          status: 'active',
          installed_at: new Date().toISOString()
        },
        {
          id: 'inventory',
          name: 'Inventory',
          status: 'active',
          installed_at: new Date().toISOString()
        }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Glassmorphic orbs for depth */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text mb-3">
                Welcome to {currentOrganization.name}
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-xl font-medium">
                Manage your business applications and settings from one central dashboard.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50 px-6 py-3 text-lg font-semibold"
            >
              {currentOrganization.subdomain}.heraerp.com
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalUsers}
                </p>
                <div className="p-3 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Active Apps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.activeApps}
                </p>
                <div className="p-3 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-xl shadow-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Monthly Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${stats.monthlySpend}
                </p>
                <div className="p-3 bg-gradient-to-br from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40 backdrop-blur-sm rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
                Data Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.dataUsage}
                </p>
                <div className="p-3 bg-gradient-to-br from-orange-100/80 to-amber-100/80 dark:from-orange-900/40 dark:to-amber-900/40 backdrop-blur-sm rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installed Apps */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Installed Applications
            </h2>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/30"
            >
              <Link href={`/~${subdomain}/apps`}>
                View All Apps
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {installedApps.length === 0 ? (
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border-2 border-dashed border-gray-300/50 dark:border-gray-600/50">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Package className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  No apps installed yet
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Install your first app to start managing your business operations
                </p>
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Link href={`/~${subdomain}/apps`}>
                    <Plus className="w-5 h-5 mr-2" />
                    Browse Apps
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {installedApps.map(app => {
                const Icon = appIcons[app.id as keyof typeof appIcons] || Package

                return (
                  <Card
                    key={app.id}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <Badge
                          variant={app.status === 'active' ? 'default' : 'secondary'}
                          className={
                            app.status === 'active'
                              ? 'bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/50'
                              : 'bg-gray-100/80 dark:bg-gray-800/50 backdrop-blur-sm'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 text-xl text-gray-900 dark:text-white">
                        {app.name || app.id.toUpperCase()}
                      </CardTitle>
                      <CardDescription className="text-gray-700 dark:text-gray-300 text-base">
                        {appDescriptions[app.id as keyof typeof appDescriptions] ||
                          'Business application'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Installed {new Date(app.installed_at || Date.now()).toLocaleDateString()}
                        </div>
                        <Button
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                          asChild
                        >
                          <Link href={`/~${subdomain}/${app.id}`}>
                            Open App
                            <ArrowRight className="w-5 h-5 ml-2" />
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push(`/~${subdomain}/users`)}
            >
              <CardHeader className="pb-6 pt-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                      Invite Team Members
                    </CardTitle>
                    <CardDescription className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                      Add users and manage permissions for your organization
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push(`/~${subdomain}/settings`)}
            >
              <CardHeader className="pb-6 pt-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100/80 to-indigo-100/80 dark:from-purple-900/40 dark:to-indigo-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                      Organization Settings
                    </CardTitle>
                    <CardDescription className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                      Configure organization preferences and security settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push(`/~${subdomain}/billing`)}
            >
              <CardHeader className="pb-6 pt-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-100/80 to-emerald-100/80 dark:from-green-900/40 dark:to-emerald-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                      Billing & Subscription
                    </CardTitle>
                    <CardDescription className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                      Manage your subscription plan and billing information
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
