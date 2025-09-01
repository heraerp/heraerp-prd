'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { apiClient } from '@/lib/api-client'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  Clock,
  Scissors,
  Package,
  CreditCard,
  BarChart,
  Settings,
  Heart,
  Sparkles,
  CalendarCheck,
  UserCheck,
  PackageCheck,
  TrendingUp,
  Plus,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Default organization ID for salon
const DEFAULT_SALON_ORG_ID = '550e8400-e29b-41d4-a716-446655440000'

interface DashboardData {
  appointments: number
  customers: number
  todayRevenue: number
  products: number
  recentAppointments: any[]
  topServices: any[]
  loading: boolean
  error: string | null
}

export default function SalonDataDashboard() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DashboardData>({
    appointments: 0,
    customers: 0,
    todayRevenue: 0,
    products: 0,
    recentAppointments: [],
    topServices: [],
    loading: true,
    error: null
  })

  // Use organization from context or default
  const organizationId = currentOrganization?.id || DEFAULT_SALON_ORG_ID
  
  useEffect(() => {
    if (!contextLoading) {
      fetchDashboardData()
    }
  }, [organizationId, contextLoading])

  const fetchDashboardData = async () => {
    if (!organizationId) {
      setData(prev => ({ ...prev, loading: false, error: 'No organization ID available' }))
      return
    }

    console.log('Fetching salon data for organization:', organizationId)
    setRefreshing(true)

    try {
      // Fetch all data using the new API client
      const [customers, products, appointments, sales] = await Promise.all([
        apiClient.getEntities(organizationId, 'customer'),
        apiClient.getEntities(organizationId, 'product'),
        apiClient.getTransactions(organizationId, 'appointment', 50),
        apiClient.getTransactions(organizationId, 'sale', 50)
      ])

      console.log('Fetched data:', {
        customers: customers.length,
        products: products.length,
        appointments: appointments.length,
        sales: sales.length
      })

      // Filter today's data (API doesn't support date filtering yet)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.transaction_date)
        return aptDate >= today
      })

      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.transaction_date)
        return saleDate >= today
      })

      // Calculate today's revenue
      const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      // Filter services from products (simple filter for now)
      const services = products.filter(p => 
        p.entity_name.toLowerCase().includes('service') || 
        p.entity_type === 'service'
      )

      setData({
        appointments: todayAppointments.length,
        customers: customers.length,
        todayRevenue: todayRevenue,
        products: products.length,
        recentAppointments: todayAppointments.slice(0, 4),
        topServices: services.slice(0, 3),
        loading: false,
        error: null
      })

      console.log('Dashboard data fetched:', {
        customers: customers.length,
        appointments: todayAppointments.length,
        products: products.length,
        revenue: todayRevenue
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to fetch dashboard data' 
      }))
    } finally {
      setRefreshing(false)
    }
  }

  // Loading state
  if (contextLoading || data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading salon dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (data.error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const salonName = currentOrganization?.name || 'Dubai Luxury Salon & Spa'

  const statsCards = [
    {
      title: 'Today\'s Appointments',
      value: data.appointments.toString(),
      change: 'Live data',
      icon: CalendarCheck,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200'
    },
    {
      title: 'Active Customers',
      value: data.customers.toString(),
      change: 'Total in database',
      icon: UserCheck,
      color: 'from-purple-500 to-violet-500',
      bgColor: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Today\'s Revenue',
      value: `AED ${data.todayRevenue.toFixed(2)}`,
      change: 'From sales today',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'Products in Stock',
      value: data.products.toString(),
      change: 'Total products',
      icon: PackageCheck,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200'
    }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {salonName}
            </h1>
            <p className="text-gray-600 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Real-time data from Supabase
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2">
              <Heart className="w-4 h-4 mr-2" />
              Professional Plan
            </Badge>
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => router.push('/salon/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className={`bg-gradient-to-br ${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Recent Appointments
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => router.push('/salon/appointments')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {data.recentAppointments.map((apt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">Appointment #{apt.id.slice(-6)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.transaction_date).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      {apt.transaction_type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No appointments today</p>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Available Services
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => router.push('/salon/services')}>
                Manage Services
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.topServices.length > 0 ? (
              <div className="space-y-3">
                {data.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-violet-400 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{service.entity_name}</p>
                        <p className="text-sm text-gray-600">{service.entity_code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No services found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organization Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Organization ID: <code className="bg-gray-200 px-2 py-1 rounded">{organizationId}</code>
        </p>
      </div>
    </div>
  )
}