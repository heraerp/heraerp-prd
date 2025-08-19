// TODO: Update this page to use production data from useReport
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUIReport)
// 2. Update create handlers to use: await createReport(formData)
// 3. Update delete handlers to use: await deleteReport(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { useReport } from '@/hooks/useReport'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Star,
  Download,
  FileText,
  ArrowLeft,
  Save,
  TestTube,
  Target,
  Award,
  Activity,
  PieChart,
  LineChart,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const reportData = {
  revenue: {
    daily: [
      { date: '2025-01-01', amount: 1240 },
      { date: '2025-01-02', amount: 980 },
      { date: '2025-01-03', amount: 1350 },
      { date: '2025-01-04', amount: 1120 },
      { date: '2025-01-05', amount: 1450 },
      { date: '2025-01-06', amount: 1680 },
      { date: '2025-01-07', amount: 1890 },
    ],
    monthly: {
      currentMonth: 35240,
      lastMonth: 32160,
      growth: 9.6
    }
  },
  customers: {
    total: 234,
    newThisMonth: 18,
    returningRate: 78,
    averageSpend: 87,
    topCustomers: [
      { name: 'Lisa Wang', totalSpent: 2150, visits: 18 },
      { name: 'Sarah Johnson', totalSpent: 1240, visits: 12 },
      { name: 'Emma Davis', totalSpent: 980, visits: 10 },
      { name: 'Michael Chen', totalSpent: 870, visits: 9 },
      { name: 'Jessica Brown', totalSpent: 750, visits: 8 }
    ]
  },
  services: {
    mostPopular: [
      { name: 'Haircut & Style', bookings: 124, revenue: 10540 },
      { name: 'Hair Color', bookings: 89, revenue: 13350 },
      { name: 'Highlights', bookings: 67, revenue: 8710 },
      { name: 'Deep Conditioning', bookings: 45, revenue: 2925 },
      { name: 'Beard Trim', bookings: 156, revenue: 5460 }
    ],
    performance: {
      totalBookings: 481,
      completionRate: 94,
      averageRating: 4.7,
      cancellationRate: 6
    }
  },
  staff: {
    performance: [
      { name: 'Emma', bookings: 145, revenue: 12650, rating: 4.9, efficiency: 96 },
      { name: 'David', bookings: 132, revenue: 8950, rating: 4.7, efficiency: 94 },
      { name: 'Alex', bookings: 118, revenue: 9440, rating: 4.6, efficiency: 91 },
      { name: 'Sarah', bookings: 86, revenue: 7340, rating: 4.8, efficiency: 93 }
    ],
    metrics: {
      totalStaff: 4,
      averageBookings: 120,
      topPerformer: 'Emma',
      teamEfficiency: 94
    }
  },
  inventory: {
    lowStock: 8,
    outOfStock: 2,
    totalValue: 12450,
    topSelling: [
      { name: 'Professional Shampoo', unitsSold: 156, revenue: 4368 },
      { name: 'Styling Mousse', unitsSold: 234, revenue: 5265 },
      { name: 'Hair Color Products', unitsSold: 89, revenue: 3115 },
      { name: 'Premium Conditioner', unitsSold: 78, revenue: 3510 }
    ]
  }
}

export default function ReportsProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createReport, 
    updateReport, 
    deleteReport 
  } = useReport(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedReport, setSelectedReport] = useState('overview')

  // Simulate real-time data updates
  useEffect(() => {
    if (testMode) {
      const interval = setInterval(() => {
        // Simulate small data changes for demonstration
        setHasChanges(true)
      }, 8000)


      if (!isAuthenticated) {


        return (


          <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


            <Alert>


              <AlertCircle className="h-4 w-4" />


              <AlertDescription>


                Please log in to access reports management.


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


              <p className="text-gray-600">Loading your profile...</p>


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


                Organization not found. Please contact support.


              </AlertDescription>


            </Alert>


          </div>


        )


      }



      return () => clearInterval(interval)
    }
  }, [testMode])

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Reports data saved')
  }

  const handleExportReport = (reportType: string) => {
    console.log(`Exporting ${reportType} report...`)
    // In real implementation, this would generate and download a report
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Progressive Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/salon-progressive">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-sm text-gray-600">Business insights and performance metrics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {testMode && hasChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveProgress}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  Save Progress
                </Button>
              )}

              {lastSaved && (
                <div className="text-xs text-gray-500">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge variant="secondary" className="flex items-center gap-1">
                <TestTube className="h-3 w-3" />
                Test Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Report Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => handleExportReport('comprehensive')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${reportData.revenue.monthly.currentMonth.toLocaleString()}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${getGrowthColor(reportData.revenue.monthly.growth)}`}>
                    {getGrowthIcon(reportData.revenue.monthly.growth)}
                    {Math.abs(reportData.revenue.monthly.growth)}% vs last month
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.customers.total}</p>
                  <p className="text-sm text-gray-500">
                    +{reportData.customers.newThisMonth} new this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-purple-600">{reportData.services.performance.totalBookings}</p>
                  <p className="text-sm text-gray-500">
                    {reportData.services.performance.completionRate}% completion rate
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{reportData.services.performance.averageRating}</p>
                  <p className="text-sm text-gray-500">
                    Customer satisfaction
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* Revenue Report */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-green-500" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Month</span>
                      <span className="text-lg font-bold text-green-600">
                        ${reportData.revenue.monthly.currentMonth.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Month</span>
                      <span className="text-lg font-bold text-gray-600">
                        ${reportData.revenue.monthly.lastMonth.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Growth</span>
                      <span className={`text-lg font-bold flex items-center gap-1 ${getGrowthColor(reportData.revenue.monthly.growth)}`}>
                        {getGrowthIcon(reportData.revenue.monthly.growth)}
                        {Math.abs(reportData.revenue.monthly.growth)}%
                      </span>
                    </div>
                    
                    {/* Simulated Chart Data */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Daily Revenue (Last 7 Days)</p>
                      {reportData.revenue.daily.map((day, index) => (
                        <div key={day.date} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(day.amount / 2000) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-16">${day.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Revenue Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Monthly Target: $40,000</span>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Quarterly Target: $120,000</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Annual Target: $480,000</span>
                        <span className="text-sm font-medium">62%</span>
                      </div>
                      <Progress value={62} className="h-2" />
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">Quick Actions</p>
                      <div className="space-y-2">
                        <Button size="sm" variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Export Monthly Report
                        </Button>
                        <Button size="sm" variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Download Revenue Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Report */}
          <TabsContent value="customers" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Customer Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{reportData.customers.total}</p>
                      <p className="text-xs text-gray-600">Total Customers</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{reportData.customers.newThisMonth}</p>
                      <p className="text-xs text-gray-600">New This Month</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Returning Rate</span>
                        <span className="text-sm font-medium">{reportData.customers.returningRate}%</span>
                      </div>
                      <Progress value={reportData.customers.returningRate} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between py-2">
                      <span className="text-sm">Average Spend</span>
                      <span className="font-medium">${reportData.customers.averageSpend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Top Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.customers.topCustomers.map((customer, index) => (
                      <div key={customer.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            <p className="text-xs text-gray-600">{customer.visits} visits</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600">${customer.totalSpent}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Report */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    Popular Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.services.mostPopular.map((service, index) => (
                      <div key={service.name} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{service.name}</span>
                          <span className="text-sm text-gray-600">{service.bookings} bookings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${(service.bookings / 200) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-green-600">${service.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Service Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{reportData.services.performance.completionRate}%</p>
                      <p className="text-xs text-gray-600">Completion Rate</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{reportData.services.performance.cancellationRate}%</p>
                      <p className="text-xs text-gray-600">Cancellation Rate</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Rating</span>
                      <span className="font-bold text-yellow-600 flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {reportData.services.performance.averageRating}/5
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Bookings</span>
                      <span className="font-medium">{reportData.services.performance.totalBookings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Staff Report */}
          <TabsContent value="staff" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Staff Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.staff.performance.map((staff) => (
                    <div key={staff.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{staff.name}</h4>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {staff.rating}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Bookings</p>
                          <p className="font-bold">{staff.bookings}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-bold text-green-600">${staff.revenue}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Efficiency</p>
                          <p className="font-bold">{staff.efficiency}%</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={staff.efficiency} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                    Inventory Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{reportData.inventory.lowStock}</p>
                      <p className="text-xs text-gray-600">Low Stock Items</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{reportData.inventory.outOfStock}</p>
                      <p className="text-xs text-gray-600">Out of Stock</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-sm">Total Inventory Value</span>
                    <span className="font-bold text-green-600">${reportData.inventory.totalValue.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.inventory.topSelling.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">{product.unitsSold} units sold</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600">${product.revenue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Progressive Features Notice */}
        {testMode && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Test Mode Active</p>
                  <p className="text-sm text-blue-700">
                    View comprehensive business analytics with real-time data simulation. Export reports and track performance metrics. 
                    All changes are saved locally in test mode. Click "Save Progress" to persist your analytics preferences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}