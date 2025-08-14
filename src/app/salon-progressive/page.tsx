'use client'

import React, { useState, useEffect } from 'react'
import './salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
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
  Award,
  Crown
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const demoData = {
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

export default function SalonProgressive({ initialTestMode = true }: SalonProgressiveProps) {
  const [testMode, setTestMode] = useState(initialTestMode)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentUser, setCurrentUser] = useState<string>('Demo User')

  // Simulate data changes for test mode
  const [localData, setLocalData] = useState(demoData)

  useEffect(() => {
    // Simulate real-time updates in test mode
    if (testMode) {
      const interval = setInterval(() => {
        setLocalData(prev => ({
          ...prev,
          quickStats: {
            ...prev.quickStats,
            todayRevenue: prev.quickStats.todayRevenue + Math.floor(Math.random() * 50)
          }
        }))
        setHasChanges(true)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [testMode])

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Progressive data saved:', localData)
  }

  const handleToggleTestMode = () => {
    setTestMode(!testMode)
    if (!testMode) {
      setHasChanges(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Enterprise Glassmorphism Header */}
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
          <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-pink-500/90 to-purple-600/90 rounded-2xl flex items-center justify-center shadow-xl shadow-pink-500/20 backdrop-blur-sm border border-white/20">
                <Scissors className="h-7 w-7 text-white drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  HERA Salon Pro
                </h1>
                <p className="text-sm text-slate-700 font-medium">Beauty & Wellness Management Suite</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enterprise Controls */}
              <div className="flex items-center gap-3 bg-white/30 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg shadow-black/5">
                <Button
                  variant={testMode ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleTestMode}
                  className={`flex items-center gap-2 font-medium transition-all duration-200 ${
                    testMode 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700" 
                      : "bg-white/50 text-slate-700 border-white/30 hover:bg-white/70"
                  }`}
                >
                  <TestTube className="h-4 w-4" />
                  {testMode ? "Demo Active" : "Live Mode"}
                </Button>
                
                {testMode && hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md font-medium"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}
              </div>

              {lastSaved && (
                <div className="text-xs text-slate-600 font-medium bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge className={`px-3 py-1 font-medium border ${
                testMode 
                  ? "bg-amber-500/20 text-amber-800 border-amber-500/30" 
                  : "bg-emerald-500/20 text-emerald-800 border-emerald-500/30"
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${testMode ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                {testMode ? "Demo Mode" : "Production"}
              </Badge>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-8">
        {/* Enterprise Welcome Banner */}
        <Card className="bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90 text-white border-0 shadow-2xl shadow-indigo-500/20 backdrop-blur-sm">
          <CardContent className="p-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold mb-3 drop-shadow-sm">Welcome to HERA Salon Pro</h2>
                <p className="text-indigo-100 mb-8 text-lg font-medium">Enterprise-grade salon management with real-time analytics</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <Play className="h-5 w-5 text-white" />
                    <span className="font-medium text-white">Instant Demo Access</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <Save className="h-5 w-5 text-white" />
                    <span className="font-medium text-white">Auto-Save Progress</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <CheckCircle className="h-5 w-5 text-white" />
                    <span className="font-medium text-white">Zero Setup Required</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"></div>
                  <Sparkles className="h-20 w-20 text-white drop-shadow-lg relative" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Today's Revenue</p>
                  <p className="text-3xl font-bold text-emerald-700 tracking-tight">
                    ${localData.quickStats.todayRevenue}
                    {testMode && hasChanges && (
                      <Zap className="inline h-5 w-5 text-amber-500 ml-2 animate-pulse" />
                    )}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <DollarSign className="h-10 w-10 text-emerald-600 relative drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Appointments</p>
                  <p className="text-3xl font-bold text-blue-700 tracking-tight">{localData.quickStats.appointmentsToday}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <Calendar className="h-10 w-10 text-blue-600 relative drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Clients Served</p>
                  <p className="text-3xl font-bold text-purple-700 tracking-tight">{localData.quickStats.clientsServed}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <Users className="h-10 w-10 text-purple-600 relative drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl shadow-pink-500/10 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Average Ticket</p>
                  <p className="text-3xl font-bold text-pink-700 tracking-tight">${localData.quickStats.averageTicket}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-500/20 rounded-xl blur-md group-hover:blur-lg transition-all"></div>
                  <TrendingUp className="h-10 w-10 text-pink-600 relative drop-shadow-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white/30 backdrop-blur-lg border border-white/20 shadow-lg">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-700 font-medium">Dashboard</TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-700 font-medium">Appointments</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-700 font-medium">Customers</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-700 font-medium">Services</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-700 font-medium">Inventory</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-700 font-medium">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Today's Appointments */}
              <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold">Today's Appointments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {localData.todayAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/60 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                            <User className="h-6 w-6 text-pink-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{apt.client}</p>
                            <p className="text-sm text-slate-600 font-medium">{apt.service} • {apt.duration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800">{apt.time}</p>
                          <p className="text-sm text-emerald-700 font-bold">${apt.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Clients */}
              <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Heart className="h-6 w-6 text-pink-600" />
                    </div>
                    <span className="text-lg font-semibold">Recent Clients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {localData.recentClients.map((client) => (
                      <div key={client.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/60 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                            <User className="h-6 w-6 text-purple-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{client.name}</p>
                            <p className="text-sm text-slate-600 font-medium">{client.visits} visits • ${client.totalSpent} total</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Star className="h-5 w-5 text-amber-500" />
                          <span className="text-sm font-medium text-slate-700">{client.lastVisit}</span>
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
                <Link href="/salon-progressive/appointments">
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
                <Link href="/salon-progressive/customers">
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
                <Link href="/salon-progressive/services">
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
                <Link href="/salon-progressive/inventory">
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
                <Link href="/salon-progressive/reports">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View Reports
                </Link>
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Progressive Features Notice */}
        {testMode && (
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <TestTube className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Demo Mode Active</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">
                    Try all features without registration. Experience real-time data simulation and seamless functionality. 
                    Click "Save Progress" to persist your changes locally for continued exploration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enterprise HERA Technology Footer */}
        <div className="mt-12 mb-8">
          <Card className="bg-white/25 backdrop-blur-xl border border-white/15 shadow-lg">
            <CardContent className="px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 rounded-lg flex items-center justify-center shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-slate-800">
                        Powered by <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">HERA</span>
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        Universal Enterprise Resource Architecture
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">Patent Pending Technology</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-slate-400" />
                    <span className="font-medium">Enterprise Grade</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  )
}