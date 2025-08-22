'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, Users, DollarSign, TrendingUp, Clock, 
  Package, UserCheck, CreditCard, Star, Activity,
  Sparkles, CalendarDays, ShoppingBag
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'

export default function SalonDashboard() {
  const { currentOrganization } = useMultiOrgAuth()
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

  useEffect(() => {
    if (currentOrganization) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{currentOrganization?.name || 'Salon Dashboard'}</h1>
          <p className="text-muted-foreground">Welcome back! Here's your salon overview.</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <CalendarDays className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
          <Button variant="outline">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Quick Sale
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="services">Popular Services</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
        </TabsList>

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
  )
}