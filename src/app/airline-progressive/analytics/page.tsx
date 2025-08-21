'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { 
  BarChart3, TrendingUp, Users, Plane, DollarSign,
  Calendar, MapPin, Trophy, Star, Clock, Target,
  ArrowUp, ArrowDown, Filter, Download, RefreshCw,
  PieChart, Activity, Globe, Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

export default function AnalyticsPage() {
  const { workspace, isAnonymous } = useAuth()
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  // Sample analytics data
  const kpis = [
    {
      title: 'Total Revenue',
      value: '$2.4M',
      change: '+18%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Flights',
      value: '1,247',
      change: '+12%',
      changeType: 'increase',
      icon: Plane,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Customers',
      value: '8,432',
      change: '+24%',
      changeType: 'increase',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'On-Time Rate',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'increase',
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    }
  ]

  const topRoutes = [
    { route: 'JFK → LAX', flights: 127, revenue: '$425K', occupancy: '89%' },
    { route: 'LAX → JFK', flights: 124, revenue: '$418K', occupancy: '91%' },
    { route: 'ORD → MIA', flights: 98, revenue: '$312K', occupancy: '85%' },
    { route: 'DFW → LGA', flights: 87, revenue: '$289K', occupancy: '82%' },
    { route: 'ATL → SEA', flights: 76, revenue: '$241K', occupancy: '87%' }
  ]

  const recentActivity = [
    { time: '2 hours ago', event: 'Flight AA101 completed on-time', type: 'success' },
    { time: '4 hours ago', event: 'Lottery winner upgraded to Business Class', type: 'info' },
    { time: '6 hours ago', event: 'New route JFK-MIA added to schedule', type: 'info' },
    { time: '8 hours ago', event: 'Weather delay reported for Flight UA456', type: 'warning' },
    { time: '10 hours ago', event: 'Customer loyalty milestone reached', type: 'success' }
  ]

  const monthlyData = [
    { month: 'Jan', revenue: 1900000, flights: 920 },
    { month: 'Feb', revenue: 2100000, flights: 1050 },
    { month: 'Mar', revenue: 2300000, flights: 1180 },
    { month: 'Apr', revenue: 2200000, flights: 1120 },
    { month: 'May', revenue: 2400000, flights: 1247 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      <AirlineTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Performance insights and business metrics
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                      <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${
                        kpi.changeType === 'increase' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {kpi.changeType === 'increase' ? (
                        <ArrowUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDown className="w-3 h-3 mr-1" />
                      )}
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-sm text-gray-600">{kpi.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="flights">Flight Performance</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
              <TabsTrigger value="customers">Customer Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Routes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Routes</CardTitle>
                    <CardDescription>Most popular flight routes by revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topRoutes.map((route, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{route.route}</p>
                              <p className="text-sm text-gray-600">{route.flights} flights</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{route.revenue}</p>
                            <p className="text-sm text-gray-600">{route.occupancy} occupancy</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'success' ? 'bg-green-500' :
                            activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm">{activity.event}</p>
                            <p className="text-xs text-gray-600">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Revenue and flight volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {monthlyData.map((data, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-gray-100 rounded-t-lg relative h-48">
                          <div 
                            className="bg-gradient-to-t from-blue-500 to-purple-600 rounded-t-lg absolute bottom-0 w-full"
                            style={{ height: `${(data.revenue / 2500000) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{data.month}</p>
                        <p className="text-xs font-medium">${(data.revenue / 1000000).toFixed(1)}M</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flight Performance Tab */}
            <TabsContent value="flights" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>On-Time Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600 mb-2">94.2%</p>
                      <Progress value={94.2} className="mb-2" />
                      <p className="text-sm text-gray-600">Industry average: 87%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Load Factor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-2">87.3%</p>
                      <Progress value={87.3} className="mb-2" />
                      <p className="text-sm text-gray-600">+2.1% vs last month</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Flight Cancellations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-600 mb-2">1.8%</p>
                      <Progress value={1.8} className="mb-2" />
                      <p className="text-sm text-gray-600">Weather: 60% | Maintenance: 40%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Revenue Analysis Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Class</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Economy</span>
                        <div className="flex items-center gap-2">
                          <Progress value={65} className="w-20" />
                          <span className="text-sm font-medium">65%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Business</span>
                        <div className="flex items-center gap-2">
                          <Progress value={25} className="w-20" />
                          <span className="text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>First Class</span>
                        <div className="flex items-center gap-2">
                          <Progress value={10} className="w-20" />
                          <span className="text-sm font-medium">10%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue per Mile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-2">$0.14</p>
                      <p className="text-sm text-gray-600">+8% vs industry average</p>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Domestic</span>
                          <span className="font-medium">$0.12</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>International</span>
                          <span className="font-medium">$0.18</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Customer Insights Tab */}
            <TabsContent value="customers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Satisfaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600 mb-2">4.2/5</p>
                      <div className="flex justify-center gap-1 mb-2">
                        {[1, 2, 3, 4].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-600">Based on 1,247 reviews</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Repeat Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600 mb-2">68%</p>
                      <Progress value={68} className="mb-2" />
                      <p className="text-sm text-gray-600">+5% vs last quarter</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Loyalty Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-2">3,247</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Silver</span>
                          <span>1,890</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Gold</span>
                          <span>1,123</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Platinum</span>
                          <span>234</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}