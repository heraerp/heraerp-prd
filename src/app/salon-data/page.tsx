'use client'
/**
 * HERA Salon Modern Full-Screen Dashboard
 * Smart Code: HERA.SALON.MODERN.DASHBOARD.v1
 * 
 * Full-screen mobile-friendly modern salon interface
 */

import React, { useEffect, useState } from 'react'
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
  Sparkles,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  Plus,
  Loader2,
  RefreshCw,
  Heart,
  Crown,
  Palette,
  Gem,
  Zap,
  Instagram,
  Phone,
  MapPin,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
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

export default function SalonModernDashboard() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'calendar' | 'services' | 'team'>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

    setRefreshing(true)

    try {
      const [customers, products, appointments, sales] = await Promise.all([
        apiClient.getEntities(organizationId, 'customer'),
        apiClient.getEntities(organizationId, 'product'),
        apiClient.getTransactions(organizationId, 'appointment', 50),
        apiClient.getTransactions(organizationId, 'sale', 50)
      ])

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

      const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse" />
            <Scissors className="w-10 h-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading your salon...</p>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Today\'s Appointments',
      value: data.appointments.toString(),
      subtitle: 'appointments',
      icon: CalendarCheck,
      gradient: 'from-pink-400 to-rose-600',
      bgGradient: 'from-pink-50 to-rose-50',
      darkBgGradient: 'dark:from-pink-900/20 dark:to-rose-900/20'
    },
    {
      title: 'Active Clients',
      value: data.customers.toString(),
      subtitle: 'total clients',
      icon: UserCheck,
      gradient: 'from-purple-400 to-indigo-600',
      bgGradient: 'from-purple-50 to-indigo-50',
      darkBgGradient: 'dark:from-purple-900/20 dark:to-indigo-900/20'
    },
    {
      title: 'Today\'s Revenue',
      value: `${data.todayRevenue.toFixed(0)}`,
      subtitle: 'AED',
      icon: TrendingUp,
      gradient: 'from-emerald-400 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      darkBgGradient: 'dark:from-emerald-900/20 dark:to-teal-900/20'
    },
    {
      title: 'Products',
      value: data.products.toString(),
      subtitle: 'in stock',
      icon: Package,
      gradient: 'from-amber-400 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      darkBgGradient: 'dark:from-amber-900/20 dark:to-orange-900/20'
    }
  ]

  const services = [
    {
      name: 'Brazilian Blowout',
      duration: '4 hours',
      price: 'AED 500',
      category: 'Chemical Treatment',
      popular: true,
      icon: <Zap className="w-5 h-5" />,
      gradient: 'from-purple-400 to-pink-600'
    },
    {
      name: 'Complete Bridal Package',
      duration: '6 hours',
      price: 'AED 800',
      category: 'Bridal',
      popular: true,
      icon: <Crown className="w-5 h-5" />,
      gradient: 'from-pink-400 to-rose-600'
    },
    {
      name: 'Keratin Treatment',
      duration: '3 hours',
      price: 'AED 350',
      category: 'Chemical Treatment',
      icon: <Sparkles className="w-5 h-5" />,
      gradient: 'from-indigo-400 to-purple-600'
    },
    {
      name: 'Hair Color & Highlights',
      duration: '3 hours',
      price: 'AED 280',
      category: 'Color',
      icon: <Palette className="w-5 h-5" />,
      gradient: 'from-rose-400 to-pink-600'
    },
    {
      name: 'Premium Cut & Style',
      duration: '1.5 hours',
      price: 'AED 150',
      category: 'Cut & Style',
      icon: <Scissors className="w-5 h-5" />,
      gradient: 'from-teal-400 to-emerald-600'
    },
    {
      name: 'Luxury Spa Treatment',
      duration: '2 hours',
      price: 'AED 300',
      category: 'Spa',
      icon: <Gem className="w-5 h-5" />,
      gradient: 'from-amber-400 to-orange-600'
    }
  ]

  const team = [
    {
      name: 'Rocky',
      title: 'Celebrity Hair Artist',
      specialties: ['Brazilian Blowout', 'Bridal Styling', 'Color Specialist'],
      rating: 4.9,
      reviews: 247,
      instagram: '@rocky_hair_dubai',
      avatar: 'R',
      gradient: 'from-purple-400 to-pink-600',
      available: true
    },
    {
      name: 'Vinay',
      title: 'Senior Hair Stylist',
      specialties: ['Cutting Expert', 'Men\'s Styling', 'Color'],
      rating: 4.7,
      reviews: 156,
      instagram: '@vinay_styles',
      avatar: 'V',
      gradient: 'from-blue-400 to-indigo-600',
      available: true
    },
    {
      name: 'Maya',
      title: 'Color Specialist',
      specialties: ['Balayage', 'Color Correction', 'Highlights'],
      rating: 4.8,
      reviews: 189,
      instagram: '@maya_colorist',
      avatar: 'M',
      gradient: 'from-pink-400 to-rose-600',
      available: false
    },
    {
      name: 'Sophia',
      title: 'Bridal Specialist',
      specialties: ['Bridal Hair', 'Updos', 'Special Events'],
      rating: 4.9,
      reviews: 203,
      instagram: '@sophia_bridal',
      avatar: 'S',
      gradient: 'from-amber-400 to-orange-600',
      available: true
    }
  ]

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'services', label: 'Services', icon: <Scissors className="w-5 h-5" /> },
    { id: 'team', label: 'Our Team', icon: <Users className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-pink-100 dark:border-purple-800/30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Luxury Salon
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Dubai Marina</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTab(item.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                    selectedTab === item.id
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-400 hover:bg-pink-100 dark:hover:bg-purple-900/30"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-pink-100 dark:hover:bg-purple-900/30"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-pink-100 dark:border-purple-800/30 bg-white dark:bg-gray-900">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedTab(item.id as any)
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all",
                    selectedTab === item.id
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-pink-100 dark:hover:bg-purple-900/30"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tab */}
        {selectedTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
              <Button variant="outline" className="border-pink-300 hover:bg-pink-50 dark:hover:bg-purple-900/30">
                <Phone className="w-4 h-4 mr-2" />
                Call Client
              </Button>
              <Button variant="outline" className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30">
                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br",
                    stat.bgGradient,
                    stat.darkBgGradient,
                    "backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br opacity-20",
                    stat.gradient,
                    "blur-2xl"
                  )} />
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center mb-4",
                      stat.gradient
                    )}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {stat.subtitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {stat.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="border-pink-100 dark:border-purple-800/30 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentAppointments.slice(0, 3).map((apt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {apt.transaction_code?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Appointment #{apt.id?.slice(-4) || '0001'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(apt.transaction_date).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-pink-100 dark:border-purple-800/30 shadow-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Top Rated Stylist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">R</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Rocky</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Celebrity Hair Artist</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">4.9</span>
                        <span className="text-sm text-gray-500">(247 reviews)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100 dark:border-purple-800/30 shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-500" />
                    Most Popular Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Brazilian Blowout</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">4 hours • AED 500</p>
                      <Badge className="mt-1 bg-purple-100 text-purple-700 dark:bg-purple-900/50">
                        Booked 15 times this week
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {selectedTab === 'calendar' && (
          <div className="animate-fadeIn">
            <Card className="border-pink-100 dark:border-purple-800/30 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Salon Calendar
                </CardTitle>
                <CardDescription>
                  Manage appointments and staff schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <SalonCalendar className="min-h-[600px]" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Tab */}
        {selectedTab === 'services' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Our Premium Services
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Experience luxury hair treatments and styling
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className="border-pink-100 dark:border-purple-800/30 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer overflow-hidden group"
                >
                  <div className={cn(
                    "h-2 bg-gradient-to-r",
                    service.gradient
                  )} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center",
                        service.gradient
                      )}>
                        <div className="text-white">{service.icon}</div>
                      </div>
                      {service.popular && (
                        <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/50">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {service.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {service.duration}
                      </div>
                      <p className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {service.price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Team Tab */}
        {selectedTab === 'team' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Meet Our Expert Team
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Award-winning stylists ready to transform your look
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {team.map((member, index) => (
                <Card
                  key={index}
                  className="border-pink-100 dark:border-purple-800/30 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all cursor-pointer overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-20 h-20 rounded-full bg-gradient-to-r flex items-center justify-center flex-shrink-0",
                        member.gradient
                      )}>
                        <span className="text-2xl font-bold text-white">{member.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{member.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.title}</p>
                          </div>
                          <Badge
                            variant={member.available ? "default" : "secondary"}
                            className={member.available ? "bg-green-100 text-green-700 dark:bg-green-900/50" : ""}
                          >
                            {member.available ? "Available" : "Busy"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-medium">{member.rating}</span>
                          </div>
                          <span className="text-sm text-gray-500">({member.reviews} reviews)</span>
                          <a
                            href={`https://instagram.com/${member.instagram.slice(1)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-purple-600 transition-colors"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        </div>

                        <div className="mt-4 space-y-1">
                          {member.specialties.map((specialty, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="mr-2 mb-1 text-xs border-pink-300 text-pink-700 dark:border-purple-600 dark:text-purple-300"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white transform hover:scale-110 transition-all">
        <Plus className="w-6 h-6" />
      </button>

      {/* Footer */}
      <footer className="mt-12 border-t border-pink-100 dark:border-purple-800/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              Dubai Marina Walk, Dubai, UAE
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:+97144234567" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 transition-colors">
                <Phone className="w-4 h-4" />
                +971 4 423 4567
              </a>
              <a href="https://instagram.com/luxurysalondubai" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-purple-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}