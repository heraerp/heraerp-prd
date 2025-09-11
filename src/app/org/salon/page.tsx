'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA Authenticated Salon Dashboard
 * Smart Code: HERA.SALON.DASHBOARD.AUTH.v1
 * 
 * Multi-tenant salon dashboard with proper head office and branch hierarchy
 */

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useRouter } from 'next/navigation'
import { 
  Building2,
  Users,
  Shield,
  AlertCircle,
  ChevronRight,
  Scissors,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Crown,
  Loader2,
  Settings,
  Globe,
  Package,
  UserCheck,
  Star,
  CalendarDays,
  ShoppingBag,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SalonResourceCalendar } from '@/components/salon/SalonResourceCalendar'
import { universalApi } from '@/lib/universal-api'

// Define organization hierarchy
const SALON_HIERARCHY = {
  headOffice: {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP",
    name: "Hair Talkz Group",
    subdomain: "hairtalkz",
    type: "head_office"
  },
  branches: [
    {
      id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
      code: "SALON-BR1",
      name: "Hair Talkz • Park Regis Kris Kin (Karama)",
      subdomain: "hairtalkz-karama",
      type: "branch",
      parentId: "849b6efe-2bf0-438f-9c70-01835ac2fe15"
    },
    {
      id: "0b1b37cd-4096-4718-8cd4-e370f234005b",
      code: "SALON-BR2",
      name: "Hair Talkz • Mercure Gold (Al Mina Rd)",
      subdomain: "hairtalkz-almina",
      type: "branch",
      parentId: "849b6efe-2bf0-438f-9c70-01835ac2fe15"
    }
  ]
}

export default function AuthenticatedSalonDashboard() {
  const { 
    currentOrganization, 
    isAuthenticated, 
    isLoading,
    isLoadingOrgs,
    user 
  } = useMultiOrgAuth()
  
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'calendar' | 'branches' | 'settings'>('overview')
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    todayRevenue: 0,
    activeClients: 0,
    monthlyRevenue: 0,
    upcomingAppointments: [],
    popularServices: [],
    inventoryAlerts: []
  })
  const [loading, setLoading] = useState(true)

  
  // Determine if current user is head office
  const isHeadOffice = currentOrganization?.id === SALON_HIERARCHY.headOffice.id
  const isBranch = SALON_HIERARCHY.branches.some(branch => branch.id === currentOrganization?.id)
  
  // Get accessible organizations based on role
  const getAccessibleOrganizations = () => {
    if (!currentOrganization) return []
    
    if (isHeadOffice) {
      // Head office can see all branches
      return [
        SALON_HIERARCHY.headOffice,
        ...SALON_HIERARCHY.branches
      ]
    } else if (isBranch) {
      // Branch can only see itself
      return SALON_HIERARCHY.branches.filter(branch => branch.id === currentOrganization.id)
    }
    
    return []
  }

  const accessibleOrgs = getAccessibleOrganizations()

  useEffect(() => {
    if (currentOrganization && (isHeadOffice || isBranch)) {
      loadDashboardData()
    }
  }, [currentOrganization])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load salon dashboard data
      const response = await fetch('/api/v1/salon/dashboard', {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (isLoading || isLoadingOrgs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading salon dashboard...</p>
        </div>
      </div>
    )
  }

  if (!currentOrganization || (!isHeadOffice && !isBranch)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have access to this salon organization.
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/auth/organizations')}
            >
              Select Organization
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentOrganization?.organization_name}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {isHeadOffice ? (
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-yellow-600" />
                      Head Office Dashboard
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Branch Location
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
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Organization Info */}
        <Alert className="mb-6 bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-700">
          <Building2 className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-700 dark:text-purple-300">
            <strong>Organization Structure:</strong> 
            {isHeadOffice 
              ? ` You are logged in as Head Office. You can view and manage all ${SALON_HIERARCHY.branches.length} branches.`
              : ` You are logged in as a branch. You can only view and manage your own location's data.`
            }
          </AlertDescription>
        </Alert>

        {/* Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="bg-gray-100 dark:bg-gray-800 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            {isHeadOffice && (
              <TabsTrigger value="branches">Branches</TabsTrigger>
            )}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from yesterday
            </p>
            {isHeadOffice && (
              <p className="text-xs text-gray-500 mt-1">All branches</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15</span> new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+22%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

            {/* Access Information */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accessibleOrgs.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          org.type === 'head_office' 
                            ? "bg-gradient-to-r from-yellow-500 to-orange-600" 
                            : "bg-gradient-to-r from-pink-500 to-purple-600"
                        )}>
                          {org.type === 'head_office' ? (
                            <Crown className="w-5 h-5 text-white" />
                          ) : (
                            <MapPin className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {org.subdomain}.heraerp.com • {org.code}
                          </p>
                        </div>
                      </div>
                      {org.id === currentOrganization.id && (
                        <Badge className="bg-green-100 text-green-700">Current</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  {isHeadOffice ? 'All Branches Calendar' : 'Branch Calendar'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <SalonResourceCalendar 
                  className="min-h-[800px]" 
                  organizations={accessibleOrgs}
                  currentOrganizationId={selectedBranch || currentOrganization.id}
                  canViewAllBranches={isHeadOffice}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab (Head Office Only) */}
          {isHeadOffice && (
            <TabsContent value="branches">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SALON_HIERARCHY.branches.map((branch) => (
                  <Card key={branch.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          {branch.name.split('•')[1]?.trim()}
                        </CardTitle>
                        <Badge variant="outline">{branch.code}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">AED 1,225</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Appointments</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">23</p>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            setSelectedBranch(branch.id)
                            setSelectedTab('calendar')
                          }}
                        >
                          View Branch Calendar
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
            <div className="space-y-6">
              {/* Quick Settings Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                  const subdomain = currentOrganization?.settings?.subdomain || currentOrganization?.organization_code?.toLowerCase();
                  router.push(`/org/${subdomain}/settings/subdomain`);
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">Subdomain Settings</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Configure your custom subdomain and domains
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">General Settings</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Organization preferences and configuration
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Access Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Current URL: </span>
                          <code className="text-sm px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                            {currentOrganization?.settings?.subdomain || currentOrganization?.organization_code?.toLowerCase()}.heraerp.com
                          </code>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Organization: </span>
                          <span className="text-sm font-medium">{currentOrganization?.organization_name}</span>
                        </div>
                      </div>
                    </div>

                    {isHeadOffice && (
                      <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <h3 className="font-medium text-purple-900 dark:text-purple-200 mb-2">Head Office Privileges</h3>
                        <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                          <li>• View all branch data and calendars</li>
                          <li>• Generate consolidated reports</li>
                          <li>• Manage branch configurations</li>
                          <li>• Access cross-branch analytics</li>
                          <li>• Configure organization-wide subdomain settings</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">Loading appointments...</p>
                ) : stats.upcomingAppointments.length > 0 ? (
                  stats.upcomingAppointments.map((apt: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{apt.clientName}</p>
                          <p className="text-sm text-muted-foreground">{apt.service}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{apt.time}</p>
                        <p className="text-sm text-muted-foreground">with {apt.staff}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No appointments scheduled for today</p>
                    <Button className="mt-4">Book First Appointment</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Services This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Hair Cut & Style', count: 145, revenue: 4350 },
                  { name: 'Hair Color', count: 89, revenue: 6230 },
                  { name: 'Manicure & Pedicure', count: 76, revenue: 3040 },
                  { name: 'Facial Treatment', count: 54, revenue: 4320 },
                  { name: 'Massage Therapy', count: 42, revenue: 3360 }
                ].map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.count} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${service.revenue}</p>
                      <Badge variant="secondary">Popular</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { product: 'Professional Hair Color - Blonde', current: 3, min: 10, status: 'critical' },
                  { product: 'Keratin Treatment Kit', current: 5, min: 8, status: 'warning' },
                  { product: 'Nail Polish - Red', current: 12, min: 15, status: 'low' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Package className={`h-5 w-5 ${
                        item.status === 'critical' ? 'text-red-500' : 
                        item.status === 'warning' ? 'text-yellow-500' : 
                        'text-orange-500'
                      }`} />
                      <div>
                        <p className="font-medium">{item.product}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.current} | Min: {item.min}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Reorder</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance - This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Emma Johnson', clients: 42, revenue: 3150, rating: 4.9 },
                  { name: 'Sarah Williams', clients: 38, revenue: 2890, rating: 4.8 },
                  { name: 'Michael Chen', clients: 35, revenue: 2650, rating: 4.9 },
                  { name: 'Lisa Anderson', clients: 32, revenue: 2400, rating: 4.7 }
                ].map((staff, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.clients} clients served</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${staff.revenue}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{staff.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}