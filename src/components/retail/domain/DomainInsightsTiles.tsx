/**
 * Domain Insights Tiles Component
 * Smart Code: HERA.RETAIL.DOMAIN.INSIGHTS_TILES.v1
 * 
 * Interactive KPI tiles and charts showing domain-specific metrics
 * Provides real-time insights and performance indicators
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  Activity,
  DollarSign,
  Package,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Percent,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface InsightTile {
  id: string
  title: string
  subtitle?: string
  value: string
  unit?: string
  description?: string
  trend: 'up' | 'down' | 'stable'
  change?: string
  changeDescription?: string
  color: string
  borderColor: string
  icon: any
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'none'
  chartData?: any[]
  metrics?: Array<{
    label: string
    value: string
    trend?: 'up' | 'down' | 'stable'
  }>
  action?: string
  actionLink?: string
  priority: 'high' | 'medium' | 'low'
  category: 'performance' | 'operations' | 'financial' | 'alerts'
}

interface DomainInsightsTilesProps {
  domain: string
  className?: string
}

export default function DomainInsightsTiles({ domain, className }: DomainInsightsTilesProps) {
  const [insightsTiles, setInsightsTiles] = useState<InsightTile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDomainInsights()
  }, [domain])

  const loadDomainInsights = async () => {
    setIsLoading(true)
    setRefreshing(true)
    
    try {
      // Generate domain-specific insights
      const tiles = generateDomainInsights(domain)
      setInsightsTiles(tiles)
    } catch (error) {
      console.error('Error loading domain insights:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const generateDomainInsights = (domain: string): InsightTile[] => {
    const commonInsights = getCommonInsights()
    const domainSpecificInsights = getDomainSpecificInsights(domain)
    
    return [...commonInsights, ...domainSpecificInsights]
  }

  const getCommonInsights = (): InsightTile[] => {
    return [
      {
        id: 'overall-performance',
        title: 'Overall Performance',
        subtitle: 'Domain Health Score',
        value: '94.2',
        unit: '%',
        description: 'Overall domain performance based on key metrics',
        trend: 'up',
        change: '+2.3%',
        changeDescription: 'vs last week',
        color: 'border-green-500',
        borderColor: 'border-l-green-500',
        icon: TrendingUp,
        chartType: 'area',
        chartData: [
          { name: 'Mon', value: 89 },
          { name: 'Tue', value: 91 },
          { name: 'Wed', value: 93 },
          { name: 'Thu', value: 94 },
          { name: 'Fri', value: 94 },
          { name: 'Sat', value: 92 },
          { name: 'Sun', value: 94 }
        ],
        action: 'View Details',
        priority: 'high',
        category: 'performance'
      }
    ]
  }

  const getDomainSpecificInsights = (domain: string): InsightTile[] => {
    switch (domain) {
      case 'inventory':
        return [
          {
            id: 'inventory-turnover',
            title: 'Inventory Turnover',
            subtitle: 'Annual Turnover Rate',
            value: '8.4',
            unit: 'x',
            description: 'Times inventory sold per year',
            trend: 'up',
            change: '+0.8x',
            changeDescription: 'vs last quarter',
            color: 'border-blue-500',
            borderColor: 'border-l-blue-500',
            icon: Activity,
            chartType: 'bar',
            chartData: [
              { name: 'Q1', value: 7.2 },
              { name: 'Q2', value: 7.8 },
              { name: 'Q3', value: 8.1 },
              { name: 'Q4', value: 8.4 }
            ],
            action: 'Analyze',
            priority: 'high',
            category: 'performance'
          },
          {
            id: 'stock-accuracy',
            title: 'Stock Accuracy',
            value: '99.1',
            unit: '%',
            description: 'Inventory record accuracy',
            trend: 'stable',
            change: '+0.1%',
            color: 'border-green-500',
            borderColor: 'border-l-green-500',
            icon: CheckCircle,
            chartType: 'none',
            action: 'View Report',
            priority: 'medium',
            category: 'operations'
          },
          {
            id: 'stockouts',
            title: 'Stockout Incidents',
            value: '12',
            description: 'This week',
            trend: 'down',
            change: '-5',
            changeDescription: 'vs last week',
            color: 'border-orange-500',
            borderColor: 'border-l-orange-500',
            icon: AlertTriangle,
            chartType: 'line',
            chartData: [
              { name: 'Week 1', value: 18 },
              { name: 'Week 2', value: 15 },
              { name: 'Week 3', value: 17 },
              { name: 'Week 4', value: 12 }
            ],
            action: 'Investigate',
            priority: 'high',
            category: 'alerts'
          },
          {
            id: 'dead-stock',
            title: 'Dead Stock Value',
            value: '₹2.4',
            unit: 'L',
            description: 'Non-moving inventory value',
            trend: 'down',
            change: '-₹0.3L',
            changeDescription: 'vs last month',
            color: 'border-red-500',
            borderColor: 'border-l-red-500',
            icon: Package,
            metrics: [
              { label: 'SKUs affected', value: '234', trend: 'down' },
              { label: 'Avg age', value: '180 days', trend: 'stable' }
            ],
            action: 'Clear Stock',
            priority: 'medium',
            category: 'operations'
          }
        ]

      case 'merchandising':
        return [
          {
            id: 'sales-performance',
            title: 'Sales Performance',
            subtitle: 'Total Sales',
            value: '₹12.8',
            unit: 'Cr',
            description: 'Monthly sales performance',
            trend: 'up',
            change: '+18.5%',
            changeDescription: 'vs last month',
            color: 'border-green-500',
            borderColor: 'border-l-green-500',
            icon: DollarSign,
            chartType: 'area',
            chartData: [
              { name: 'Week 1', value: 2.8 },
              { name: 'Week 2', value: 3.2 },
              { name: 'Week 3', value: 3.1 },
              { name: 'Week 4', value: 3.7 }
            ],
            action: 'View Trends',
            priority: 'high',
            category: 'financial'
          },
          {
            id: 'margin-analysis',
            title: 'Gross Margin',
            value: '42.3',
            unit: '%',
            description: 'Average gross margin',
            trend: 'up',
            change: '+1.2%',
            changeDescription: 'vs target',
            color: 'border-purple-500',
            borderColor: 'border-l-purple-500',
            icon: Percent,
            chartType: 'bar',
            chartData: [
              { name: 'Category A', value: 45 },
              { name: 'Category B', value: 38 },
              { name: 'Category C', value: 42 },
              { name: 'Category D', value: 44 }
            ],
            action: 'Optimize',
            priority: 'medium',
            category: 'financial'
          },
          {
            id: 'promotion-effectiveness',
            title: 'Promotion ROI',
            value: '3.2',
            unit: 'x',
            description: 'Average promotion return',
            trend: 'up',
            change: '+0.4x',
            changeDescription: 'vs last campaign',
            color: 'border-blue-500',
            borderColor: 'border-l-blue-500',
            icon: Target,
            metrics: [
              { label: 'Active campaigns', value: '8', trend: 'stable' },
              { label: 'Conversion rate', value: '12.4%', trend: 'up' }
            ],
            action: 'Launch New',
            priority: 'medium',
            category: 'performance'
          },
          {
            id: 'pricing-alerts',
            title: 'Pricing Alerts',
            value: '3',
            description: 'Competitor price changes',
            trend: 'stable',
            color: 'border-orange-500',
            borderColor: 'border-l-orange-500',
            icon: AlertTriangle,
            chartType: 'none',
            action: 'Review Pricing',
            priority: 'high',
            category: 'alerts'
          }
        ]

      case 'planning':
        return [
          {
            id: 'forecast-accuracy',
            title: 'Forecast Accuracy',
            value: '87.6',
            unit: '%',
            description: 'Demand forecast accuracy',
            trend: 'up',
            change: '+3.2%',
            changeDescription: 'vs last period',
            color: 'border-blue-500',
            borderColor: 'border-l-blue-500',
            icon: Target,
            chartType: 'line',
            chartData: [
              { name: 'Jan', value: 82 },
              { name: 'Feb', value: 84 },
              { name: 'Mar', value: 86 },
              { name: 'Apr', value: 88 }
            ],
            action: 'Improve Model',
            priority: 'high',
            category: 'performance'
          },
          {
            id: 'replenishment-efficiency',
            title: 'Replenishment Efficiency',
            value: '94.1',
            unit: '%',
            description: 'On-time replenishment rate',
            trend: 'up',
            change: '+1.8%',
            color: 'border-green-500',
            borderColor: 'border-l-green-500',
            icon: Zap,
            metrics: [
              { label: 'Avg lead time', value: '5.2 days', trend: 'down' },
              { label: 'Orders processed', value: '1,248', trend: 'up' }
            ],
            action: 'Optimize',
            priority: 'medium',
            category: 'operations'
          },
          {
            id: 'planning-alerts',
            title: 'Planning Exceptions',
            value: '7',
            description: 'Items requiring attention',
            trend: 'down',
            change: '-3',
            changeDescription: 'vs yesterday',
            color: 'border-yellow-500',
            borderColor: 'border-l-yellow-500',
            icon: AlertTriangle,
            chartType: 'none',
            action: 'Review Items',
            priority: 'high',
            category: 'alerts'
          },
          {
            id: 'seasonal-trends',
            title: 'Seasonal Index',
            value: '1.24',
            description: 'Current seasonal factor',
            trend: 'up',
            change: '+0.08',
            changeDescription: 'vs last year',
            color: 'border-purple-500',
            borderColor: 'border-l-purple-500',
            icon: Calendar,
            chartType: 'area',
            chartData: [
              { name: 'Jan', value: 0.9 },
              { name: 'Feb', value: 1.1 },
              { name: 'Mar', value: 1.2 },
              { name: 'Apr', value: 1.24 }
            ],
            action: 'Plan Ahead',
            priority: 'medium',
            category: 'performance'
          }
        ]

      default:
        return []
    }
  }

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-gray-500" />
    }
  }

  const renderChart = (tile: InsightTile) => {
    if (!tile.chartData || tile.chartType === 'none') return null

    const chartHeight = 60

    switch (tile.chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={tile.chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={tile.chartData}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.2}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={tile.chartData}>
              <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const handleTileAction = (tile: InsightTile) => {
    console.log(`Action: ${tile.action} for ${tile.title}`)
    alert(`${tile.action} for ${tile.title}\n\nThis would navigate to detailed analytics for ${tile.title.toLowerCase()}.`)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Domain Insights ({insightsTiles.length})
          </h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadDomainInsights}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              {insightsTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Card 
                    key={tile.id} 
                    className={`border-l-4 ${tile.borderColor} hover:shadow-lg transition-all duration-200 cursor-pointer group`}
                    onClick={() => tile.action && handleTileAction(tile)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900">
                              {tile.title}
                            </h4>
                            <Badge className={`text-xs ${getPriorityColor(tile.priority)}`}>
                              {tile.priority}
                            </Badge>
                          </div>
                          {tile.subtitle && (
                            <p className="text-xs text-gray-600 mb-2">{tile.subtitle}</p>
                          )}
                        </div>
                        <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      </div>

                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{tile.value}</span>
                        {tile.unit && (
                          <span className="text-sm font-medium text-gray-600">{tile.unit}</span>
                        )}
                        {tile.change && (
                          <div className="flex items-center gap-1 ml-2">
                            {renderTrendIcon(tile.trend)}
                            <span className={`text-xs ${
                              tile.trend === 'up' ? 'text-green-600' : 
                              tile.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {tile.change}
                            </span>
                          </div>
                        )}
                      </div>

                      {tile.changeDescription && (
                        <p className="text-xs text-gray-500 mb-3">{tile.changeDescription}</p>
                      )}

                      {tile.chartData && renderChart(tile)}

                      {tile.metrics ? (
                        <div className="space-y-1 mb-3">
                          {tile.metrics.map((metric, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{metric.label}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-900">{metric.value}</span>
                                {metric.trend && renderTrendIcon(metric.trend)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : tile.description && (
                        <p className="text-xs text-gray-600 mb-3">{tile.description}</p>
                      )}

                      {tile.action && (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {tile.action} →
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}