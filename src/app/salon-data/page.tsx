'use client'
/**
 * HERA Salon Calendar Demo Page
 * Smart Code: HERA.SALON.DEMO.PAGE.v1
 * 
 * Comprehensive demonstration of salon calendar functionality using Universal HERA calendar DNA
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { apiClient } from '@/lib/api-client'
import { SalonCalendar } from '@/components/salon/SalonCalendar'
import { SalonBookingWorkflow } from '@/components/salon/SalonBookingWorkflow'
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
  AlertCircle,
  Info,
  Zap,
  Crown,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  const [selectedDemo, setSelectedDemo] = useState<'overview' | 'calendar' | 'workflow'>('overview')
  const [isBookingOpen, setIsBookingOpen] = useState(false)
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

  // Sample salon services for demo
  const salonServices = [
    {
      id: 'srv-brazilian',
      name: 'Brazilian Blowout',
      category: 'Chemical Treatment',
      duration: '4h 0m',
      price: 500,
      popularity: 95,
      skillLevel: 'Celebrity',
      icon: <Zap className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'srv-bridal',
      name: 'Complete Bridal Package',
      category: 'Bridal',
      duration: '6h 0m',
      price: 800,
      popularity: 98,
      skillLevel: 'Celebrity',
      icon: <Crown className="w-5 h-5 text-yellow-600" />,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'srv-keratin',
      name: 'Keratin Treatment',
      category: 'Chemical Treatment',
      duration: '3h 0m',
      price: 350,
      popularity: 88,
      skillLevel: 'Senior',
      icon: <Zap className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-100 text-blue-800'
    }
  ]

  const salonTeam = [
    {
      id: 'rocky',
      name: 'Rocky',
      title: 'Celebrity Hair Artist',
      level: 'Celebrity',
      specializations: ['Brazilian Blowout', 'Keratin Treatment', 'Bridal Styling'],
      rating: 4.9,
      reviews: 247,
      hourlyRate: 200,
      nextAvailable: 'Today 2:30 PM',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      avatar: 'R'
    },
    {
      id: 'vinay',
      name: 'Vinay',
      title: 'Senior Hair Stylist',
      level: 'Senior',
      specializations: ['Cutting', 'Styling', 'Color'],
      rating: 4.7,
      reviews: 156,
      hourlyRate: 150,
      nextAvailable: 'Today 4:00 PM',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      avatar: 'V'
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              HERA Salon Calendar System
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Universal Calendar DNA Implementation for Beauty & Wellness
            </p>
          </div>
        </div>
        
        <Alert className="max-w-4xl mx-auto">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-left">
            <strong>🧬 HERA DNA Universal Calendar Implementation:</strong> This demonstrates how the Universal Calendar DNA 
            adapts to salon operations using Sacred Six Tables architecture. Same components work for restaurants, 
            healthcare, manufacturing, and professional services with industry-specific configurations.
          </AlertDescription>
        </Alert>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <Tabs value={selectedDemo} onValueChange={(value: any) => setSelectedDemo(value)} className="w-full max-w-2xl">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Live Calendar</TabsTrigger>
            <TabsTrigger value="workflow">Booking Flow</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">{/* Header with real data */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to {salonName}
            </h2>
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

      {/* Services and Team Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Popular Services
            </CardTitle>
            <CardDescription>Our most requested treatments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {salonServices.map((service, index) => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      {service.duration}
                      <span>•</span>
                      <Badge variant="outline" className={service.color}>
                        {service.skillLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">AED {service.price}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-yellow-500" />
                    {service.popularity}% popular
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Salon Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Salon Team
            </CardTitle>
            <CardDescription>Our expert stylists and specialists</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {salonTeam.map(member => (
              <div key={member.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{member.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{member.name}</h4>
                    <Badge variant="outline" className={member.color}>
                      {member.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{member.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                      <span className="text-sm">{member.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">({member.reviews} reviews)</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">AED {member.hourlyRate}/hr</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-medium">
                    {member.nextAvailable}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
            </TabsContent>

          {/* Live Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Live Salon Calendar
                </CardTitle>
                <CardDescription>
                  Full-featured salon calendar with resource scheduling, drag-and-drop, and UAE prayer time integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Sparkles className="w-4 h-4" />
                  <AlertDescription>
                    <strong>🧬 Universal DNA Features:</strong> Prayer time blocks, VIP client highlighting, 
                    stylist specialization matching, chemical treatment scheduling, and real-time availability.
                  </AlertDescription>
                </Alert>
                <SalonCalendar className="min-h-[600px]" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Intelligent Booking Workflow
                </CardTitle>
                <CardDescription>
                  5-step booking process with service selection, stylist matching, and intelligent scheduling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Zap className="w-4 h-4" />
                  <AlertDescription>
                    <strong>🧠 Smart Features:</strong> Automatic stylist matching based on service requirements, 
                    VIP client recognition, allergy alerts, and intelligent time slot suggestions.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Workflow Steps</h4>
                    <div className="space-y-3">
                      {[
                        { step: 1, title: 'Service Selection', desc: 'Choose service with add-ons' },
                        { step: 2, title: 'Stylist Matching', desc: 'AI-powered stylist recommendation' },
                        { step: 3, title: 'Client Information', desc: 'Existing client or new registration' },
                        { step: 4, title: 'Time Booking', desc: 'Available slots with conflict detection' },
                        { step: 5, title: 'Confirmation', desc: 'Review and confirm appointment' }
                      ].map(item => (
                        <div key={item.step} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold">
                            {item.step}
                          </div>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-600">{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Smart Features</h4>
                    <div className="space-y-3">
                      {[
                        { icon: <Star className="w-4 h-4 text-yellow-500" />, title: 'VIP Recognition', desc: 'Automatic VIP client identification' },
                        { icon: <AlertCircle className="w-4 h-4 text-red-500" />, title: 'Allergy Alerts', desc: 'Safety warnings for chemical services' },
                        { icon: <Clock className="w-4 h-4 text-blue-500" />, title: 'Smart Scheduling', desc: 'Optimal time slot suggestions' },
                        { icon: <Users className="w-4 h-4 text-purple-500" />, title: 'Stylist Matching', desc: 'Skill and preference based matching' },
                        { icon: <MapPin className="w-4 h-4 text-green-500" />, title: 'Prayer Integration', desc: 'UAE prayer time consideration' }
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {feature.icon}
                          </div>
                          <div>
                            <div className="font-medium">{feature.title}</div>
                            <div className="text-sm text-gray-600">{feature.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center pt-6">
                  <Button onClick={() => setIsBookingOpen(true)} size="lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    Try Booking Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Technical Implementation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Technical Implementation
          </CardTitle>
          <CardDescription>
            How HERA's Universal Calendar DNA adapts to salon operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">✅ Sacred Six Tables</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Appointments → universal_transactions</li>
                <li>• Stylists → core_entities (staff)</li>
                <li>• Services → core_entities (service)</li>
                <li>• Availability → core_dynamic_data</li>
                <li>• Assignments → core_relationships</li>
                <li>• Service details → universal_transaction_lines</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-600">🧬 Smart Codes</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• HERA.SALON.CALENDAR.APPOINTMENT.*</li>
                <li>• HERA.SALON.STAFF.CELEBRITY.STYLIST.*</li>
                <li>• HERA.SALON.SERVICE.CHEMICAL.*</li>
                <li>• HERA.SALON.CUSTOMER.VIP.*</li>
                <li>• HERA.SALON.CALENDAR.BLOCK.PRAYER.*</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">⚡ Features</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Real-time availability checking</li>
                <li>• Double-booking prevention</li>
                <li>• Prayer time integration</li>
                <li>• VIP client workflows</li>
                <li>• Chemical service restrictions</li>
                <li>• Multi-tenant security</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Organization ID: <code className="bg-gray-200 px-2 py-1 rounded">{organizationId}</code>
        </p>
      </div>

      {/* Booking Workflow Dialog */}
      <SalonBookingWorkflow 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingComplete={(booking) => {
          console.log('Booking completed:', booking)
          setIsBookingOpen(false)
        }}
      />
    </div>
  )
}