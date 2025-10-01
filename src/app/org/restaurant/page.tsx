'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA Authenticated Restaurant Dashboard
 * Smart Code: HERA.RESTAURANT.DASHBOARD.AUTH.V1
 *
 * Multi-tenant restaurant dashboard with proper head office and branch hierarchy
 * Can be used by any restaurant group with multiple locations
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  Shield,
  AlertCircle,
  ChevronRight,
  UtensilsCrossed,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Crown,
  Loader2,
  Package,
  ChefHat,
  Clock,
  ShoppingCart,
  Receipt,
  Utensils
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

export default function AuthenticatedRestaurantDashboard() {
  const { currentOrganization, isAuthenticated, isLoading, isLoadingOrgs, user } = useHERAAuth()

  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'orders' | 'branches' | 'settings'>(
    'overview'
  )
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeCustomers: 0,
    monthlyRevenue: 0,
    popularDishes: [],
    inventoryAlerts: [],
    kitchenOrders: []
  })
  const [loading, setLoading] = useState(true)

  // Detect organization type and hierarchy
  const isHeadOffice = currentOrganization?.metadata?.type === 'head_office'
  const isBranch = currentOrganization?.metadata?.type === 'branch'
  const parentId = currentOrganization?.metadata?.parentId

  // Get accessible organizations based on role
  const getAccessibleOrganizations = async () => {
    if (!currentOrganization) return []

    if (isHeadOffice) {
      // Head office can see all branches in the same group
      try {
        const branches = await universalApi.getEntities({
          entity_type: 'organization',
          filters: {
            'metadata->parentId': currentOrganization.id
          }
        })
        return [currentOrganization, ...branches]
      } catch (error) {
        console.error('Error fetching branches:', error)
        return [currentOrganization]
      }
    } else if (isBranch) {
      // Branch can only see itself
      return [currentOrganization]
    }

    return [currentOrganization]
  }

  const [accessibleOrgs, setAccessibleOrgs] = useState<any[]>([])

  useEffect(() => {
    if (currentOrganization) {
      getAccessibleOrganizations().then(setAccessibleOrgs)
      loadDashboardData()
    }
  }, [currentOrganization])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load restaurant dashboard data
      const response = await fetch('/api/v1/restaurant/dashboard', {
        headers: {
          'organization-id': currentOrganization?.id || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Use mock data for demo
      setStats({
        todayOrders: 47,
        todayRevenue: 3250,
        activeCustomers: 156,
        monthlyRevenue: 87500,
        popularDishes: [
          { name: 'Margherita Pizza', orders: 23, revenue: 345 },
          { name: 'Caesar Salad', orders: 19, revenue: 190 },
          { name: 'Grilled Salmon', orders: 15, revenue: 450 }
        ],
        inventoryAlerts: [
          { item: 'Tomatoes', current: 5, min: 20, unit: 'kg' },
          { item: 'Mozzarella', current: 3, min: 10, unit: 'kg' }
        ],
        kitchenOrders: [
          { id: 'ORD-001', table: 'T-5', items: 3, status: 'preparing', time: '12:30' },
          { id: 'ORD-002', table: 'T-12', items: 2, status: 'ready', time: '12:25' }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  // Three-layer authorization pattern
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-muted-foreground dark:text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  if (isLoading || isLoadingOrgs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-muted-foreground dark:text-muted-foreground">
            Loading restaurant dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-background">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found.
            <Button className="mt-4 w-full" onClick={() => router.push('/auth/organizations')}>
              Select Organization
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-50/30 to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 dark:bg-background/95 backdrop-blur-xl border-b border-border dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                <UtensilsCrossed className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100 dark:text-foreground">
                  {currentOrganization?.organization_name}
                </h1>
                <p className="text-xs text-muted-foreground dark:text-gray-300 font-medium">
                  {isHeadOffice ? (
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-yellow-600" />
                      Restaurant Group Dashboard
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Restaurant Location
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Shield className="w-3 h-3 mr-1" />
                Authenticated
              </Badge>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Info */}
        <Alert className="mb-6 bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-700">
          <Building2 className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Restaurant Management:</strong>
            {isHeadOffice
              ? ` You are viewing the group dashboard. You can monitor all ${accessibleOrgs.length - 1} restaurant locations.`
              : ` You are viewing your restaurant location. Focus on your local operations and customers.`}
          </AlertDescription>
        </Alert>

        {/* Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as any)}>
          <TabsList className="bg-muted dark:bg-muted mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            {isHeadOffice && <TabsTrigger value="branches">Locations</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Today's Orders
                      </p>
                      <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                        {stats.todayOrders}
                      </p>
                    </div>
                    <Receipt className="w-8 h-8 text-orange-600" />
                  </div>
                  {isHeadOffice && (
                    <p className="text-xs text-muted-foreground mt-2">All locations</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Today's Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                        ${stats.todayRevenue}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Active Tables
                      </p>
                      <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                        {isHeadOffice ? '23' : '8'}
                      </p>
                    </div>
                    <Utensils className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Avg Order Time
                      </p>
                      <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                        18 min
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Dishes */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Today's Popular Dishes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularDishes.map((dish: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                          <Utensils className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-100 dark:text-foreground">
                            {dish.name}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {dish.orders} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-100 dark:text-foreground">
                          ${dish.revenue}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Kitchen Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  Active Kitchen Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.kitchenOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border dark:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={order.status === 'ready' ? 'default' : 'secondary'}
                          className={order.status === 'ready' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {order.status}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-100 dark:text-foreground">
                            {order.id}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                            Table {order.table} • {order.items} items
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {order.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-background dark:bg-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    Order management system coming soon
                  </p>
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab (Head Office Only) */}
          {isHeadOffice && (
            <TabsContent value="branches">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accessibleOrgs
                  .filter(org => org.id !== currentOrganization.id)
                  .map(branch => (
                    <Card key={branch.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            {branch.organization_name}
                          </CardTitle>
                          <Badge variant="outline">{branch.organization_code}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                Today's Revenue
                              </p>
                              <p className="text-lg font-semibold text-gray-100 dark:text-foreground">
                                $1,625
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                Orders
                              </p>
                              <p className="text-lg font-semibold text-gray-100 dark:text-foreground">
                                23
                              </p>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => {
                              // Switch to branch view
                              console.log('Switching to branch:', branch.id)
                            }}
                          >
                            View Location Details
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted dark:bg-muted">
                    <h3 className="font-medium text-gray-100 dark:text-foreground mb-2">
                      Organization Type
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {isHeadOffice
                        ? 'Restaurant Group (Head Office)'
                        : 'Restaurant Location (Branch)'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted dark:bg-muted">
                    <h3 className="font-medium text-gray-100 dark:text-foreground mb-2">
                      Access Level
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {isHeadOffice
                        ? 'Full access to all restaurant locations and consolidated reporting'
                        : 'Access limited to this restaurant location only'}
                    </p>
                  </div>

                  {isHeadOffice && (
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <h3 className="font-medium text-orange-900 dark:text-orange-200 mb-2">
                        Group Management
                      </h3>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                        <li>• Monitor all restaurant locations</li>
                        <li>• View consolidated financial reports</li>
                        <li>• Manage group-wide menu items</li>
                        <li>• Track inventory across locations</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
