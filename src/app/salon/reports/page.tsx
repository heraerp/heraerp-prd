'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useToast } from '@/components/ui/use-toast'
import { useSalonSettings } from '@/contexts/salon-settings-context'
import { 
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Package,
  BarChart3,
  Download,
  Filter,
  FileText,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Scissors,
  Clock,
  Star,
  ShoppingBag,
  Activity,
  PieChart,
  LineChart,
  UserCheck,
  Package2,
  Wallet,
  Target,
  Award,
  Briefcase,
  CreditCard
} from 'lucide-react'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface ReportData {
  revenue_data?: Array<{
    date: string
    revenue: number
    appointments: number
    average_ticket: number
  }>
  services?: Array<{
    service_name: string
    bookings: number
    revenue: number
    average_price: number
    percentage_of_total: number
  }>
  staff?: Array<{
    staff_name: string
    appointments: number
    revenue: number
    average_rating: number
    productivity_rate: number
    commission_earned: number
  }>
  analytics?: {
    total_clients: number
    new_clients: number
    returning_clients: number
    retention_rate: number
    average_visits: number
    average_spend: number
    top_spenders: Array<{
      client_name: string
      total_spent: number
      visit_count: number
    }>
  }
  inventory?: {
    total_products: number
    low_stock_items: number
    total_value: number
    turnover_rate: number
    top_products: Array<{
      product_name: string
      units_sold: number
      revenue: number
    }>
  }
  financial_summary?: {
    total_revenue: number
    total_expenses: number
    total_tax: number
    net_profit: number
    profit_margin: number
  }
  summary?: any
}

export default function ReportsPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()
  const { settings } = useSalonSettings()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [reportData, setReportData] = useState<ReportData>({})
  const [dateRange, setDateRange] = useState('last_30_days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchReportData()
    }
  }, [organizationId, contextLoading, dateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'last_7_days':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'last_30_days':
        startDate = new Date(now.setDate(now.getDate() - 30))
        break
      case 'last_90_days':
        startDate = new Date(now.setDate(now.getDate() - 90))
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate
        }
      default:
        startDate = new Date(now.setDate(now.getDate() - 30))
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

  const fetchReportData = async (reportType?: string) => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      const url = `/api/v1/salon/reports?organization_id=${organizationId}&start_date=${start}&end_date=${end}${reportType ? `&type=${reportType}` : ''}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setReportData(data)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load report data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    toast({
      title: 'Export Started',
      description: 'Your report is being generated...'
    })
    // Would implement actual export functionality
  }

  const formatCurrency = (amount: number) => {
    return `${settings?.payment_settings.currency || 'AED'} ${amount.toFixed(2)}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Business Reports & Analytics
                </h1>
                <p className="text-gray-600 text-lg">
                  Comprehensive insights into your salon performance
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats Overview */}
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(reportData.summary.revenue?.total_revenue || 0)}
                      </p>
                      <p className={`text-sm ${getStatusColor(reportData.summary.revenue?.growth_rate || 0)}`}>
                        {formatPercentage(reportData.summary.revenue?.growth_rate || 0)} vs last period
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Appointments</p>
                      <p className="text-2xl font-bold">
                        {reportData.summary.revenue?.total_appointments || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Avg: {formatCurrency(reportData.summary.revenue?.average_ticket || 0)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Clients</p>
                      <p className="text-2xl font-bold">
                        {reportData.summary.clients?.total_clients || 0}
                      </p>
                      <p className="text-sm text-blue-600">
                        +{reportData.summary.clients?.new_clients || 0} new this period
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(reportData.summary.financial?.net_profit || 0)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reportData.summary.financial?.profit_margin?.toFixed(1)}% margin
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-emerald-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Report Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="w-5 h-5" />
                      Revenue Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.revenue_data && reportData.revenue_data.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.revenue_data.slice(-7).map((day, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">
                                {formatCurrency(day.revenue)}
                              </span>
                              <Badge variant="outline">
                                {day.appointments} appts
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No revenue data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scissors className="w-5 h-5" />
                      Top Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.services && reportData.services.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.services.slice(0, 5).map((service, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{service.service_name}</span>
                              <span className="text-sm text-gray-600">
                                {formatCurrency(service.revenue)}
                              </span>
                            </div>
                            <Progress 
                              value={service.percentage_of_total} 
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{service.bookings} bookings</span>
                              <span>{service.percentage_of_total.toFixed(1)}% of total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No service data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Staff Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.staff && reportData.staff.length > 0 ? (
                      <div className="space-y-3">
                        {reportData.staff.slice(0, 5).map((member, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{member.staff_name}</p>
                              <p className="text-sm text-gray-600">
                                {member.appointments} appointments • {formatCurrency(member.revenue)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">
                                  {member.average_rating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {member.productivity_rate.toFixed(1)} appts/day
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No staff data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Client Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Client Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.analytics ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Retention Rate</p>
                            <p className="text-2xl font-bold">
                              {reportData.analytics.retention_rate.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg Spend</p>
                            <p className="text-2xl font-bold">
                              {formatCurrency(reportData.analytics.average_spend)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Top Spenders</p>
                          {reportData.analytics.top_spenders.slice(0, 3).map((client, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{client.client_name}</span>
                              <span className="font-medium">
                                {formatCurrency(client.total_spent)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No client data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of your revenue streams
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.revenue_data && reportData.revenue_data.length > 0 ? (
                    <div className="space-y-6">
                      {/* Revenue Chart Placeholder */}
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Revenue chart would be displayed here</p>
                      </div>
                      
                      {/* Revenue Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Date</th>
                              <th className="text-right py-2">Revenue</th>
                              <th className="text-right py-2">Appointments</th>
                              <th className="text-right py-2">Avg Ticket</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.revenue_data.map((day, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">
                                  {new Date(day.date).toLocaleDateString()}
                                </td>
                                <td className="text-right py-2">
                                  {formatCurrency(day.revenue)}
                                </td>
                                <td className="text-right py-2">
                                  {day.appointments}
                                </td>
                                <td className="text-right py-2">
                                  {formatCurrency(day.average_ticket)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No revenue data available for the selected period
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>
                    Analysis of your service offerings and their performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.services && reportData.services.length > 0 ? (
                    <div className="space-y-6">
                      {reportData.services.map((service, index) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{service.service_name}</h4>
                              <p className="text-sm text-gray-600">
                                {service.bookings} bookings • Average price: {formatCurrency(service.average_price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {formatCurrency(service.revenue)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {service.percentage_of_total.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>
                          <Progress value={service.percentage_of_total} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No service data available for the selected period
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance Report</CardTitle>
                  <CardDescription>
                    Individual performance metrics for your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.staff && reportData.staff.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Staff Member</th>
                            <th className="text-right py-2">Appointments</th>
                            <th className="text-right py-2">Revenue</th>
                            <th className="text-right py-2">Avg Rating</th>
                            <th className="text-right py-2">Productivity</th>
                            <th className="text-right py-2">Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.staff.map((member, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 font-medium">{member.staff_name}</td>
                              <td className="text-right py-2">{member.appointments}</td>
                              <td className="text-right py-2">{formatCurrency(member.revenue)}</td>
                              <td className="text-right py-2">
                                <div className="flex items-center justify-end gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  {member.average_rating.toFixed(1)}
                                </div>
                              </td>
                              <td className="text-right py-2">
                                {member.productivity_rate.toFixed(1)} appts/day
                              </td>
                              <td className="text-right py-2">
                                {formatCurrency(member.commission_earned)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No staff performance data available for the selected period
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Clients</p>
                        <p className="text-2xl font-bold">
                          {reportData.analytics?.total_clients || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">New Clients</p>
                        <p className="text-2xl font-bold">
                          {reportData.analytics?.new_clients || 0}
                        </p>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Retention Rate</p>
                        <p className="text-2xl font-bold">
                          {reportData.analytics?.retention_rate.toFixed(1) || 0}%
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-purple-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Spend</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(reportData.analytics?.average_spend || 0)}
                        </p>
                      </div>
                      <Wallet className="w-8 h-8 text-emerald-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Client Analytics</CardTitle>
                  <CardDescription>
                    Detailed insights into your client base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.analytics?.top_spenders && reportData.analytics.top_spenders.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Top Spenders</h4>
                        <div className="space-y-2">
                          {reportData.analytics.top_spenders.map((client, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{client.client_name}</p>
                                <p className="text-sm text-gray-600">
                                  {client.visit_count} visits
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  {formatCurrency(client.total_spent)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Avg: {formatCurrency(client.total_spent / client.visit_count)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No client analytics available for the selected period
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold">
                          {reportData.inventory?.total_products || 0}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-blue-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Low Stock Items</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {reportData.inventory?.low_stock_items || 0}
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-orange-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Inventory Value</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(reportData.inventory?.total_value || 0)}
                        </p>
                      </div>
                      <Package2 className="w-8 h-8 text-green-600 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Report</CardTitle>
                  <CardDescription>
                    Product inventory and sales performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.inventory?.top_products && reportData.inventory.top_products.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3">Top Selling Products</h4>
                      <div className="space-y-2">
                        {reportData.inventory.top_products.map((product, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{product.product_name}</p>
                              <p className="text-sm text-gray-600">
                                {product.units_sold} units sold
                              </p>
                            </div>
                            <p className="font-bold">
                              {formatCurrency(product.revenue)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No inventory data available
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Export Options */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" onClick={handleExportReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
                <Button variant="outline" onClick={handleExportReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Excel
                </Button>
                <Button variant="outline" onClick={handleExportReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Email Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}