'use client'

// HERA Universal Calendar Analytics
// Provides analytics and insights for calendar usage across industries

import React, { useState, useEffect, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

import {
  UniversalResource,
  UniversalAppointment,
  ResourceUtilization,
  CalendarAnalytics as CalendarAnalyticsType
} from '@/types/calendar.types'
import { useCalendarAPI } from '@/services/calendarAPI'

interface CalendarAnalyticsProps {
  organization_id: string
  industry_type: string
  resources: UniversalResource[]
  appointments: UniversalAppointment[]
  is_open: boolean
  on_close: () => void
  date_range: {
    start: Date
    end: Date
  }
}

export function CalendarAnalytics({
  organization_id,
  industry_type,
  resources,
  appointments,
  is_open,
  on_close,
  date_range
}: CalendarAnalyticsProps) {
  // ==================== STATE MANAGEMENT ====================
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<CalendarAnalyticsType | null>(null)
  const [utilization, setUtilization] = useState<ResourceUtilization[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  // API instance
  const calendarAPI = useCalendarAPI(organization_id, 'current-user')

  // ==================== DATA LOADING ====================
  useEffect(() => {
    if (is_open) {
      loadAnalyticsData()
    }
  }, [is_open, date_range])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Load comprehensive analytics
      const analyticsData = await calendarAPI.getCalendarAnalytics(
        date_range.start,
        date_range.end,
        true // Include industry benchmarks
      )
      setAnalytics(analyticsData)

      // Load resource utilization
      const utilizationData = await calendarAPI.getResourceUtilization(
        resources.map(r => r.entity_id),
        date_range.start,
        date_range.end,
        'week'
      )
      setUtilization(utilizationData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==================== COMPUTED ANALYTICS ====================
  const computedMetrics = useMemo(() => {
    const filteredAppointments = appointments.filter(
      apt => apt.start_time >= date_range.start && apt.start_time <= date_range.end
    )

    const totalAppointments = filteredAppointments.length
    const confirmedAppointments = filteredAppointments.filter(
      apt => apt.status === 'confirmed'
    ).length
    const completedAppointments = filteredAppointments.filter(
      apt => apt.status === 'completed'
    ).length
    const cancelledAppointments = filteredAppointments.filter(
      apt => apt.status === 'cancelled'
    ).length
    const noShowAppointments = filteredAppointments.filter(apt => apt.status === 'no_show').length

    const averageUtilization =
      utilization.length > 0
        ? utilization.reduce((sum, u) => sum + u.utilization_percentage, 0) / utilization.length
        : 0

    const totalRevenue = utilization.reduce((sum, u) => sum + (u.revenue_generated || 0), 0)

    // Peak hours analysis
    const hourCounts: Record<number, number> = {}
    filteredAppointments.forEach(apt => {
      const hour = new Date(apt.start_time).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const peakHour =
      Object.entries(hourCounts).length > 0
        ? Object.entries(hourCounts).reduce((a, b) =>
            hourCounts[a[0] as any] > hourCounts[b[0] as any] ? a : b
          )?.[0]
        : null

    // Day of week analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayCounts: Record<number, number> = {}
    filteredAppointments.forEach(apt => {
      const day = new Date(apt.start_time).getDay()
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    const peakDay =
      Object.entries(dayCounts).length > 0
        ? Object.entries(dayCounts).reduce((a, b) =>
            dayCounts[a[0] as any] > dayCounts[b[0] as any] ? a : b
          )?.[0]
        : null

    return {
      totalAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      confirmationRate:
        totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
      completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
      cancellationRate:
        totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      noShowRate: totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0,
      averageUtilization,
      totalRevenue,
      peakHour: peakHour ? parseInt(peakHour) : null,
      peakDay: peakDay ? dayNames[parseInt(peakDay)] : null
    }
  }, [appointments, utilization, date_range])

  // ==================== INDUSTRY BENCHMARKS ====================
  const industryBenchmarks = {
    healthcare: {
      utilization: 75,
      noShowRate: 15,
      cancellationRate: 10,
      completionRate: 85
    },
    restaurant: {
      utilization: 65,
      noShowRate: 8,
      cancellationRate: 12,
      completionRate: 80
    },
    professional: {
      utilization: 70,
      noShowRate: 5,
      cancellationRate: 8,
      completionRate: 90
    },
    manufacturing: {
      utilization: 85,
      noShowRate: 2,
      cancellationRate: 5,
      completionRate: 95
    },
    universal: {
      utilization: 70,
      noShowRate: 10,
      cancellationRate: 10,
      completionRate: 85
    }
  }

  const benchmark =
    industryBenchmarks[industry_type as keyof typeof industryBenchmarks] ||
    industryBenchmarks.universal

  // ==================== RENDER HELPERS ====================
  const getPerformanceIndicator = (
    value: number,
    benchmarkValue: number,
    higherIsBetter: boolean = true
  ) => {
    const threshold = benchmarkValue * 0.1 // 10% threshold
    const isGood = higherIsBetter
      ? value >= benchmarkValue - threshold
      : value <= benchmarkValue + threshold

    return isGood ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-orange-600" />
    )
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600'
    if (utilization >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{computedMetrics.totalAppointments}</div>
            <div className="text-sm text-gray-600">Total Appointments</div>
            <div className="text-xs text-gray-500 mt-1">
              Last{' '}
              {Math.ceil(
                (date_range.end.getTime() - date_range.start.getTime()) / (1000 * 60 * 60 * 24)
              )}{' '}
              days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div
              className={`text-2xl font-bold ${getUtilizationColor(computedMetrics.averageUtilization)}`}
            >
              {Math.round(computedMetrics.averageUtilization)}%
            </div>
            <div className="text-sm text-gray-600">Average Utilization</div>
            <div className="flex items-center justify-center mt-1">
              {getPerformanceIndicator(computedMetrics.averageUtilization, benchmark.utilization)}
              <span className="text-xs text-gray-500 ml-1">vs {benchmark.utilization}% target</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(computedMetrics.completionRate)}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="flex items-center justify-center mt-1">
              {getPerformanceIndicator(computedMetrics.completionRate, benchmark.completionRate)}
              <span className="text-xs text-gray-500 ml-1">
                vs {benchmark.completionRate}% target
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">
              ${computedMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-xs text-gray-500 mt-1">
              {computedMetrics.totalRevenue > 0 ? 'Tracked revenue' : 'Revenue tracking off'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance vs Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Performance vs Industry Benchmarks</span>
          </CardTitle>
          <CardDescription>
            How your {industry_type} calendar performance compares to industry standards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Resource Utilization</span>
                {getPerformanceIndicator(computedMetrics.averageUtilization, benchmark.utilization)}
              </div>
              <div className="text-right">
                <div className="font-medium">{Math.round(computedMetrics.averageUtilization)}%</div>
                <div className="text-sm text-gray-500">Target: {benchmark.utilization}%</div>
              </div>
            </div>
            <Progress value={computedMetrics.averageUtilization} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">No-Show Rate</span>
                {getPerformanceIndicator(computedMetrics.noShowRate, benchmark.noShowRate, false)}
              </div>
              <div className="text-right">
                <div className="font-medium">{Math.round(computedMetrics.noShowRate)}%</div>
                <div className="text-sm text-gray-500">Target: ≤{benchmark.noShowRate}%</div>
              </div>
            </div>
            <Progress value={Math.min(computedMetrics.noShowRate, 50)} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Completion Rate</span>
                {getPerformanceIndicator(computedMetrics.completionRate, benchmark.completionRate)}
              </div>
              <div className="text-right">
                <div className="font-medium">{Math.round(computedMetrics.completionRate)}%</div>
                <div className="text-sm text-gray-500">Target: {benchmark.completionRate}%</div>
              </div>
            </div>
            <Progress value={computedMetrics.completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Peak Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peak Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Busiest Day:</span>
              <Badge variant="secondary">{computedMetrics.peakDay}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Peak Hour:</span>
              <Badge variant="secondary">
                {computedMetrics.peakHour !== null
                  ? `${computedMetrics.peakHour}:00 - ${computedMetrics.peakHour + 1}:00`
                  : 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-600">Completed:</span>
              <span className="font-medium">{computedMetrics.completedAppointments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-600">Confirmed:</span>
              <span className="font-medium">{computedMetrics.confirmedAppointments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-600">Cancelled:</span>
              <span className="font-medium">{computedMetrics.cancelledAppointments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-600">No-Show:</span>
              <span className="font-medium">{computedMetrics.noShowAppointments}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderResourcesTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {utilization.length > 0 ? (
          utilization
            .sort((a, b) => b.utilization_percentage - a.utilization_percentage)
            .map(resource => (
              <Card key={resource.resource_entity_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{resource.resource_name}</h3>
                      <p className="text-sm text-gray-600">
                        {resource.appointments_count} appointments •{' '}
                        {Math.round(resource.total_booked_hours)} hours
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${getUtilizationColor(resource.utilization_percentage)}`}
                      >
                        {Math.round(resource.utilization_percentage)}%
                      </div>
                      <div className="text-sm text-gray-500">Utilization</div>
                    </div>
                  </div>

                  <Progress value={resource.utilization_percentage} className="h-2 mb-3" />

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <div className="font-medium">
                        {Math.round(resource.total_available_hours)}h
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Booked:</span>
                      <div className="font-medium">{Math.round(resource.total_booked_hours)}h</div>
                    </div>
                    {resource.revenue_generated && (
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <div className="font-medium">
                          ${resource.revenue_generated.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {(resource.no_show_rate > 0 || resource.cancellation_rate > 0) && (
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t">
                      <div>
                        <span className="text-gray-600">No-show rate:</span>
                        <div className="font-medium text-orange-600">
                          {Math.round(resource.no_show_rate)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cancellation rate:</span>
                        <div className="font-medium text-red-600">
                          {Math.round(resource.cancellation_rate)}%
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No resource utilization data available</p>
          </div>
        )}
      </div>
    </div>
  )

  // ==================== RENDER ====================
  return (
    <Sheet open={is_open} onOpenChange={on_close}>
      <SheetContent className="w-[800px] sm:w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Calendar Analytics</span>
            <Badge variant="outline">{industry_type}</Badge>
          </SheetTitle>
          <SheetDescription>
            Performance insights and analytics for your calendar system
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Analysis period: {date_range.start.toLocaleDateString()} -{' '}
              {date_range.end.toLocaleDateString()}
            </div>
            <Button variant="outline" size="sm" onClick={loadAnalyticsData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading analytics...</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">{renderOverviewTab()}</TabsContent>

              <TabsContent value="resources">{renderResourcesTab()}</TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
