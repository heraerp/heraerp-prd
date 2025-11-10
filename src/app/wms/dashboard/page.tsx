/**
 * WMS Dashboard Page
 * Smart Code: HERA.WMS.DASHBOARD.v1
 * 
 * Main dashboard for HERA Waste Management Demo
 * Organization: HERA Waste Management Demo (1fbab8d2-583c-44d2-8671-6d187c1ee755)
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Truck, 
  MapPin, 
  Recycle, 
  BarChart3, 
  Users, 
  Calendar, 
  Shield, 
  Building,
  LogOut,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'

export default function WMSDashboard() {
  const router = useRouter()
  const { 
    user, 
    organization, 
    isAuthenticated, 
    isLoading, 
    logout,
    contextLoading 
  } = useHERAAuth()

  // Show loading state
  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading WMS dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/wms/login')
    return null
  }

  // Show warning if no organization context
  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No organization context found. Please contact your administrator.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={logout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Mock dashboard data for demo
  const dashboardData = {
    routes: {
      total: 24,
      active: 18,
      completed: 6
    },
    fleet: {
      total: 12,
      active: 9,
      maintenance: 2,
      idle: 1
    },
    collections: {
      today: 156,
      scheduled: 180,
      completed: 132
    },
    efficiency: 87
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">HERA WMS</h1>
                  <p className="text-sm text-slate-500">Waste Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{organization.name}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Status */}
        <div className="mb-6">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully connected to <strong>{organization.name}</strong> 
              {organization.id && (
                <span className="ml-2 text-xs text-green-600 font-mono">
                  ({organization.id.substring(0, 8)}...)
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name || 'WMS User'}
          </h2>
          <p className="text-slate-600">
            Here's an overview of your waste management operations for today.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Routes</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.routes.active}</div>
              <p className="text-xs text-slate-500">
                {dashboardData.routes.total} total routes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Fleet Status</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.fleet.active}</div>
              <p className="text-xs text-slate-500">
                {dashboardData.fleet.total} vehicles total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Collections Today</CardTitle>
              <Recycle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.collections.completed}</div>
              <p className="text-xs text-slate-500">
                {dashboardData.collections.scheduled} scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Efficiency</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{dashboardData.efficiency}%</div>
              <p className="text-xs text-slate-500">
                Route efficiency score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Route Management
              </CardTitle>
              <CardDescription>
                Plan and optimize collection routes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                View All Routes
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Create New Route
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                Fleet Management
              </CardTitle>
              <CardDescription>
                Monitor and manage your vehicle fleet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                Fleet Dashboard
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Schedule Maintenance
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your waste management operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Route R-24 completed</p>
                  <p className="text-xs text-slate-500">156 collections completed successfully</p>
                </div>
                <span className="text-xs text-slate-500">2 min ago</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Truck className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Vehicle WM-007 departed</p>
                  <p className="text-xs text-slate-500">Started Route R-18 with 24 scheduled stops</p>
                </div>
                <span className="text-xs text-slate-500">15 min ago</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Maintenance alert</p>
                  <p className="text-xs text-slate-500">Vehicle WM-003 requires scheduled maintenance</p>
                </div>
                <span className="text-xs text-slate-500">1 hour ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}