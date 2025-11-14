'use client'

/**
 * HERA Page Load Analytics Component
 * Detailed page performance analysis and optimization insights
 * Smart Code: HERA.MONITORING.PAGE_ANALYTICS.v1
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  Globe, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  Filter,
  Search
} from 'lucide-react'

interface PagePerformance {
  path: string
  avgLoadTime: number
  p95LoadTime: number
  visits: number
  bounceRate: number
  errorRate: number
  trend: 'up' | 'down' | 'stable'
}

interface PageLoadAnalyticsProps {
  pages: PagePerformance[]
  timeRange: '1h' | '6h' | '24h' | '7d'
}

interface SortConfig {
  field: keyof PagePerformance
  direction: 'asc' | 'desc'
}

export function PageLoadAnalytics({ pages, timeRange }: PageLoadAnalyticsProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'avgLoadTime', direction: 'desc' })
  const [filterText, setFilterText] = useState('')
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'fast' | 'average' | 'slow'>('all')

  // Filter and sort pages
  const filteredPages = pages
    .filter(page => {
      if (filterText && !page.path.toLowerCase().includes(filterText.toLowerCase())) {
        return false
      }
      
      if (performanceFilter !== 'all') {
        const isFast = page.avgLoadTime < 2000
        const isSlow = page.avgLoadTime > 4000
        
        if (performanceFilter === 'fast' && !isFast) return false
        if (performanceFilter === 'slow' && !isSlow) return false
        if (performanceFilter === 'average' && (isFast || isSlow)) return false
      }
      
      return true
    })
    .sort((a, b) => {
      const { field, direction } = sortConfig
      const aValue = a[field]
      const bValue = b[field]
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })

  // Handle sorting
  const handleSort = (field: keyof PagePerformance) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Get performance category
  const getPerformanceCategory = (loadTime: number) => {
    if (loadTime < 2000) return { label: 'Fast', color: 'text-green-500', variant: 'default' as const }
    if (loadTime < 4000) return { label: 'Average', color: 'text-yellow-500', variant: 'secondary' as const }
    return { label: 'Slow', color: 'text-red-500', variant: 'destructive' as const }
  }

  // Calculate summary statistics
  const stats = {
    totalPages: pages.length,
    fastPages: pages.filter(p => p.avgLoadTime < 2000).length,
    slowPages: pages.filter(p => p.avgLoadTime > 4000).length,
    avgLoadTime: pages.reduce((sum, p) => sum + p.avgLoadTime, 0) / pages.length,
    totalVisits: pages.reduce((sum, p) => sum + p.visits, 0),
    avgBounceRate: pages.reduce((sum, p) => sum + p.bounceRate, 0) / pages.length,
    avgErrorRate: pages.reduce((sum, p) => sum + p.errorRate, 0) / pages.length
  }

  // Prepare chart data
  const performanceDistribution = [
    { name: 'Fast (<2s)', value: stats.fastPages, color: '#10b981' },
    { name: 'Average (2-4s)', value: pages.filter(p => p.avgLoadTime >= 2000 && p.avgLoadTime <= 4000).length, color: '#eab308' },
    { name: 'Slow (>4s)', value: stats.slowPages, color: '#ef4444' }
  ]

  const topSlowPages = [...pages]
    .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
    .slice(0, 10)

  const trendData = pages.map(page => ({
    name: page.path.split('/').pop() || page.path,
    loadTime: page.avgLoadTime,
    visits: page.visits,
    bounceRate: page.bounceRate * 100,
    errorRate: page.errorRate * 100
  }))

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalPages}</div>
            <div className="text-sm text-muted-foreground">Total Pages</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(stats.avgLoadTime)}ms</div>
            <div className="text-sm text-muted-foreground">Avg Load Time</div>
            <Badge 
              className="mt-1" 
              variant={getPerformanceCategory(stats.avgLoadTime).variant}
            >
              {getPerformanceCategory(stats.avgLoadTime).label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Visits</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{Math.round(stats.avgBounceRate * 100)}%</div>
            <div className="text-sm text-muted-foreground">Avg Bounce Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution and Top Slow Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Performance Distribution
            </CardTitle>
            <CardDescription>
              Pages categorized by load time performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={performanceDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Pages']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Slow Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Pages Needing Optimization
            </CardTitle>
            <CardDescription>
              Pages with the highest load times requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSlowPages.slice(0, 5).map((page, index) => {
              const category = getPerformanceCategory(page.avgLoadTime)
              return (
                <div key={page.path} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{page.path}</div>
                    <div className="text-xs text-muted-foreground">
                      {page.visits} visits • {Math.round(page.bounceRate * 100)}% bounce rate
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{Math.round(page.avgLoadTime)}ms</div>
                    <Badge variant={category.variant} className="text-xs">
                      {category.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Page Load Time vs Traffic Analysis
          </CardTitle>
          <CardDescription>
            Relationship between page performance and user engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              <AreaChart data={trendData.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(0,0,0,0.5)"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="rgba(0,0,0,0.5)"
                  fontSize={12}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'loadTime' ? `${value}ms` : 
                    name === 'visits' ? value :
                    `${value}%`,
                    name === 'loadTime' ? 'Load Time' :
                    name === 'visits' ? 'Visits' :
                    name === 'bounceRate' ? 'Bounce Rate' :
                    'Error Rate'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="loadTime" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Page Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Detailed Page Analysis
              </CardTitle>
              <CardDescription>
                Complete performance metrics for all pages
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* Performance Filter */}
              <select 
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="all">All Pages</option>
                <option value="fast">Fast (&lt;2s)</option>
                <option value="average">Average (2-4s)</option>
                <option value="slow">Slow (&gt;4s)</option>
              </select>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter pages..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-border rounded-md text-sm w-48"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('path')}
                      className="gap-1 h-auto p-0 font-semibold"
                    >
                      Page Path
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('avgLoadTime')}
                      className="gap-1 h-auto p-0 font-semibold"
                    >
                      Load Time
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('p95LoadTime')}
                      className="gap-1 h-auto p-0 font-semibold"
                    >
                      95th %tile
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('visits')}
                      className="gap-1 h-auto p-0 font-semibold"
                    >
                      Visits
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('bounceRate')}
                      className="gap-1 h-auto p-0 font-semibold"
                    >
                      Bounce Rate
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </th>
                  <th className="text-center p-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('errorRate')}
                      className="gap-1 h-auto p-0 font-semibold"
                    >
                      Error Rate
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </th>
                  <th className="text-center p-3">Trend</th>
                  <th className="text-center p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => {
                  const category = getPerformanceCategory(page.avgLoadTime)
                  const score = Math.max(0, Math.min(100, (1 - (page.avgLoadTime / 10000)) * 100))
                  
                  return (
                    <tr key={page.path} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium text-sm">{page.path}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-medium">{Math.round(page.avgLoadTime)}ms</div>
                        <Badge variant={category.variant} className="mt-1">
                          {category.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-medium">{Math.round(page.p95LoadTime)}ms</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-medium">{page.visits.toLocaleString()}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-medium">{Math.round(page.bounceRate * 100)}%</div>
                        <Progress 
                          value={page.bounceRate * 100} 
                          className="mt-1 h-1"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-medium">{Math.round(page.errorRate * 100)}%</div>
                        <Progress 
                          value={page.errorRate * 100} 
                          className="mt-1 h-1"
                        />
                      </td>
                      <td className="p-3 text-center">
                        {page.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                        {page.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                        {page.trend === 'stable' && <div className="w-4 h-4 bg-gray-300 rounded-full mx-auto" />}
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold">
                          {Math.round(score)}
                        </div>
                        <div className="w-12 bg-muted rounded-full h-2 mx-auto">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${score}%`,
                              backgroundColor: score > 80 ? '#10b981' : score > 60 ? '#eab308' : '#ef4444'
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredPages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No pages match the current filters.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}