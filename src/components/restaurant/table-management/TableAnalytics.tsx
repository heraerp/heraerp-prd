'use client'

import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Activity,
  Timer,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  Percent,
  Target
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { subDays, startOfWeek, endOfWeek } from 'date-fns'

interface TableAnalyticsProps {
  tables: any[]
  stats: any
}

export function TableAnalytics({ tables, stats }: TableAnalyticsProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week')
  const [selectedMetric, setSelectedMetric] = useState<
    'occupancy' | 'revenue' | 'turnover' | 'utilization'
  >('occupancy')

  // Mock analytics data (in production, this would come from API)
  const analyticsData = useMemo(() => {
    const days =
      dateRange === 'today' ? 24 : dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 365
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      data.push({
        date: dateRange === 'today' ? formatDate(date, 'HH:mm') : formatDate(date, 'MMM dd'),
        occupancy: Math.floor(Math.random() * 30) + 60,
        revenue: Math.floor(Math.random() * 3000) + 5000,
        turnover: Math.floor(Math.random() * 20) + 40,
        guests: Math.floor(Math.random() * 150) + 100,
        averagePartySize: (Math.random() * 2 + 2).toFixed(1),
        peakHour: Math.floor(Math.random() * 4) + 18
      })
    }

    return data
  }, [dateRange])

  // Table performance data
  const tablePerformance = useMemo(() => {
    return tables
      .map(table => ({
        table: table.table_number,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        occupancy: Math.floor(Math.random() * 30) + 60,
        turnover: Math.floor(Math.random() * 15) + 5,
        averagePartySize: (Math.random() * 2 + 2).toFixed(1)
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [tables])

  // Location distribution
  const locationDistribution = useMemo(() => {
    const distribution = tables.reduce(
      (acc, table) => {
        acc[table.location] = (acc[table.location] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(distribution).map(([location, count]) => ({
      name: location,
      value: count,
      percentage: (((count as number) / tables.length) * 100).toFixed(1)
    }))
  }, [tables])

  // Peak hours data
  const peakHoursData = useMemo(() => {
    const hours = []
    for (let i = 11; i <= 22; i++) {
      hours.push({
        hour: `${i}:00`,
        occupancy: Math.floor(Math.random() * 40) + (i >= 18 && i <= 21 ? 60 : 30),
        revenue: Math.floor(Math.random() * 2000) + (i >= 18 && i <= 21 ? 3000 : 1000)
      })
    }
    return hours
  }, [])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  const exportAnalytics = () => {
    const data = {
      dateRange,
      stats,
      analyticsData,
      tablePerformance,
      locationDistribution,
      peakHoursData,
      exportDate: new Date().toISOString()
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `table-analytics_${formatDate(new Date(), 'yyyy-MM-dd')}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Table Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">
              Analyze table performance and optimize operations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <Button variant="outline" onClick={exportAnalytics}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600 font-medium">Average Occupancy</span>
              <Percent className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats?.table_occupancy_rate || 0}%</p>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+5.2% from last period</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-600 font-medium">Revenue per Table</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-900">${stats?.revenue_per_table || 0}</p>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+12.8% from last period</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-600 font-medium">Avg Turnover Time</span>
              <Timer className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {stats?.average_turnover_time || 0}m
            </p>
            <div className="flex items-center mt-2 text-sm">
              <ArrowDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">-3.5m from last period</span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-600 font-medium">Avg Party Size</span>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats?.average_party_size || 0}</p>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600">+0.3 from last period</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trend */}
        <Card className="p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Occupancy Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="occupancy"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Table */}
        <Card className="p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Top Performing Tables</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tablePerformance.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="table" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location Distribution */}
        <Card className="p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Tables by Location</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={locationDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {locationDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Peak Hours */}
        <Card className="p-6 lg:col-span-2">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Peak Hours Analysis</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="occupancy"
                stroke="#3B82F6"
                name="Occupancy %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                name="Revenue $"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Table Performance Details */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">Detailed Table Performance</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turnover
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Party Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tablePerformance.map((table, index) => {
                const performanceScore =
                  (table.revenue / 5000) * 0.4 +
                  (table.occupancy / 100) * 0.4 +
                  (table.turnover / 20) * 0.2
                return (
                  <tr key={table.table}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.table}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${table.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span>{table.occupancy}%</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${table.occupancy}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.turnover}/day
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.averagePartySize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge
                        className={
                          performanceScore > 0.8
                            ? 'bg-green-100 text-green-800'
                            : performanceScore > 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {performanceScore > 0.8
                          ? 'Excellent'
                          : performanceScore > 0.6
                            ? 'Good'
                            : 'Needs Attention'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">Insights & Recommendations</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Optimize Peak Hours</p>
              <p className="text-sm text-blue-700">
                Tables T1-T5 show highest revenue during 7-9 PM. Consider dynamic pricing.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Improve Turnover</p>
              <p className="text-sm text-green-700">
                Outdoor tables have 15% faster turnover. Staff allocation could improve indoor
                efficiency.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
            <Activity className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900">Capacity Utilization</p>
              <p className="text-sm text-purple-700">
                Large tables (6+ capacity) are underutilized. Consider flexible seating
                arrangements.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
