'use client'

import React, { useState, useEffect } from 'react'
import './salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { 
  Scissors, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  Star,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  Sparkles,
  Heart,
  Zap,
  TrendingUp,
  CheckCircle,
  UserPlus,
  Play,
  Save,
  TestTube,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Database API Integration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA3ODcsImV4cCI6MjA2OTE3Njc4N30.MeQGn3wi7WFDLfw_DNUKzvfOYle9vGX9BEN67wuSTLQ'

// API functions for database integration
const fetchSalonData = async () => {
  try {
    const response = await fetch('/api/v1/salon/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch salon data')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching salon data:', error)
    return fallbackData // Use fallback data if API fails
  }
}

// Fallback demo data for initial load
const fallbackData = {
  todayAppointments: [
    { id: 1, client: 'Sarah Johnson', service: 'Haircut & Style', time: '10:00 AM', stylist: 'Emma', duration: '60 min', price: 85 },
    { id: 2, client: 'Mike Chen', service: 'Beard Trim', time: '11:30 AM', stylist: 'David', duration: '30 min', price: 35 },
    { id: 3, client: 'Lisa Wang', service: 'Hair Color', time: '2:00 PM', stylist: 'Emma', duration: '120 min', price: 150 },
    { id: 4, client: 'James Wilson', service: 'Full Service', time: '4:00 PM', stylist: 'Alex', duration: '90 min', price: 120 }
  ],
  quickStats: {
    todayRevenue: 1240,
    appointmentsToday: 8,
    clientsServed: 6,
    averageTicket: 87
  },
  recentClients: [
    { id: 1, name: 'Sarah Johnson', lastVisit: '2 days ago', totalSpent: 340, visits: 5, favorite: 'Haircut & Style' },
    { id: 2, name: 'Mike Chen', lastVisit: '1 week ago', totalSpent: 180, visits: 3, favorite: 'Beard Trim' },
    { id: 3, name: 'Lisa Wang', lastVisit: '3 days ago', totalSpent: 520, visits: 8, favorite: 'Hair Color' }
  ]
}

interface SalonProgressiveProps {
  initialTestMode?: boolean
}

export default function SalonProduction({ initialTestMode = false }: SalonProgressiveProps) {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  
  const [testMode, setTestMode] = useState(initialTestMode)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentUser, setCurrentUser] = useState<string>('Production User')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Production data from database
  const [salonData, setSalonData] = useState(fallbackData)

  useEffect(() => {
    // Load real data from database on component mount
    const loadSalonData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const data = await fetchSalonData()
        setSalonData(data)
      } catch (err) {
        setError('Failed to load salon data')
        console.error('Error loading salon data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSalonData()

    // Set up periodic refresh for real-time updates (every 30 seconds)
    const refreshInterval = setInterval(loadSalonData, 30000)
    
    return () => clearInterval(refreshInterval)
  }, [])

  const handleSaveProgress = async () => {
    setIsLoading(true)
    try {
      // In production, this would save changes to database
      const response = await fetch('/api/v1/salon/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salonData),
      })
      
      if (response.ok) {
        setLastSaved(new Date())
        setHasChanges(false)
        console.log('Production data saved successfully')
      } else {
        throw new Error('Failed to save data')
      }
    } catch (error) {
      console.error('Error saving salon data:', error)
      setError('Failed to save changes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTestMode = () => {
    setTestMode(!testMode)
    if (!testMode) {
      setHasChanges(false)
    }
  }

  // Authentication checks - prevent unauthorized access
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the salon dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your salon profile...</p>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization context found. Please contact support or try logging in again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  HERA Salon
                </h1>
                <p className="text-sm text-gray-600">Beauty & Wellness Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Progressive Controls */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                <Button
                  variant={testMode ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleTestMode}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {testMode ? "Testing" : "Live"}
                </Button>
                
                {testMode && hasChanges && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}
              </div>

              {lastSaved && (
                <div className="text-xs text-gray-500">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge variant={testMode ? "secondary" : "default"}>
                {testMode ? "Test Mode" : "Production"}
              </Badge>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-6">
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-2 text-gray-600">Loading salon data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-light mb-2">Welcome to Your Salon Dashboard</h2>
                <p className="text-pink-100 mb-6">Manage appointments, clients, and services with style</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    <span>Try features instantly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    <span>Save your progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>No registration required</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center">
                <Sparkles className="h-16 w-16 text-pink-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${salonData.quickStats.todayRevenue}
                    {testMode && hasChanges && (
                      <Zap className="inline h-4 w-4 text-yellow-500 ml-1" />
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold text-blue-600">{salonData.quickStats.appointmentsToday}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Clients Served</p>
                  <p className="text-2xl font-bold text-purple-600">{salonData.quickStats.clientsServed}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Average Ticket</p>
                  <p className="text-2xl font-bold text-pink-600">${salonData.quickStats.averageTicket}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Appointments */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salonData.todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.client}</p>
                            <p className="text-sm text-gray-600">{apt.service} • {apt.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{apt.time}</p>
                          <p className="text-sm text-green-600">${apt.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Clients */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Recent Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salonData.recentClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.visits} visits • ${client.totalSpent} total</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{client.lastVisit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quick Navigation Cards */}
          <TabsContent value="appointments">
            <Card className="p-8 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">Appointment Management</h3>
              <p className="text-gray-600 mb-6">Schedule, reschedule, and manage all appointments</p>
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/salon/appointments">
                  <Calendar className="h-5 w-5 mr-2" />
                  Manage Appointments
                </Link>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="p-8 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-purple-500" />
              <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
              <p className="text-gray-600 mb-6">Track client history, preferences, and loyalty</p>
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Link href="/salon/customers">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Manage Customers
                </Link>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="p-8 text-center">
              <Scissors className="h-16 w-16 mx-auto mb-4 text-pink-500" />
              <h3 className="text-xl font-semibold mb-2">Service Catalog</h3>
              <p className="text-gray-600 mb-6">Manage services, pricing, and staff assignments</p>
              <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700">
                <Link href="/salon/services">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Manage Services
                </Link>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="p-8 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">Inventory Management</h3>
              <p className="text-gray-600 mb-6">Track products, supplies, and stock levels</p>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href="/salon/inventory">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Manage Inventory
                </Link>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="p-8 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">Reports & Analytics</h3>
              <p className="text-gray-600 mb-6">Business insights, performance metrics, and trends</p>
              <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Link href="/salon/reports">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View Reports
                </Link>
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progressive Features Notice */}
        {testMode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Test Mode Active</p>
                  <p className="text-sm text-blue-700">
                    Try all features without registration. Data changes automatically to show functionality. 
                    Click "Save Progress" to persist your changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}