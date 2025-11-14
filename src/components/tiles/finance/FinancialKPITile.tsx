/**
 * HERA Universal Tile System - Financial KPI Tile
 * Displays key financial performance indicators with trends
 * Smart Code: HERA.FINANCE.ANALYTICS.TILE.KPI.DASHBOARD.v1
 */

'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Info, MoreHorizontal, Eye, BarChart3, Download, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface KPIData {
  id: string
  name: string
  value: number | string
  target?: number
  unit: string
  format: 'number' | 'currency' | 'percentage'
  trend: {
    direction: 'up' | 'down' | 'stable'
    value: number
    period: string
  }
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description?: string
}

interface FinancialKPITileProps {
  tileId: string
  title?: string
  kpiType: 'profit_margin' | 'roe' | 'current_ratio' | 'debt_equity' | 'custom'
  showTarget?: boolean
  showTrend?: boolean
  period?: 'monthly' | 'quarterly' | 'yearly'
  onAction?: (actionId: string, params?: any) => void
  className?: string
}

export function FinancialKPITile({
  tileId,
  title,
  kpiType,
  showTarget = true,
  showTrend = true,
  period = 'quarterly',
  onAction,
  className = ''
}: FinancialKPITileProps) {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock KPI data based on type
  const getMockKPIData = (type: string): KPIData => {
    const kpiTemplates: Record<string, Partial<KPIData>> = {
      profit_margin: {
        name: 'Profit Margin',
        value: 24.5,
        target: 25,
        unit: '%',
        format: 'percentage',
        description: 'Net profit as percentage of revenue'
      },
      roe: {
        name: 'Return on Equity',
        value: 18.2,
        target: 15,
        unit: '%',
        format: 'percentage',
        description: 'Net income relative to shareholder equity'
      },
      current_ratio: {
        name: 'Current Ratio',
        value: 2.15,
        target: 2.0,
        unit: ':1',
        format: 'number',
        description: 'Current assets to current liabilities ratio'
      },
      debt_equity: {
        name: 'Debt-to-Equity',
        value: 0.65,
        target: 0.5,
        unit: ':1',
        format: 'number',
        description: 'Total debt relative to total equity'
      }
    }

    const template = kpiTemplates[type] || {
      name: 'Custom KPI',
      value: 75.4,
      target: 80,
      unit: '%',
      format: 'percentage',
      description: 'Custom financial metric'
    }

    // Calculate status based on target
    const currentValue = typeof template.value === 'number' ? template.value : 0
    const targetValue = template.target || 0
    const ratio = currentValue / targetValue

    let status: KPIData['status']
    let trendDirection: 'up' | 'down' | 'stable'
    let trendValue: number

    if (type === 'debt_equity') {
      // For debt-to-equity, lower is better
      status = ratio <= 0.8 ? 'excellent' : ratio <= 1.0 ? 'good' : ratio <= 1.2 ? 'warning' : 'critical'
      trendDirection = Math.random() > 0.5 ? 'down' : 'up'
      trendValue = Math.random() * 10 - 2 // -2% to +8%
    } else {
      // For most KPIs, higher is better
      status = ratio >= 1.1 ? 'excellent' : ratio >= 0.95 ? 'good' : ratio >= 0.85 ? 'warning' : 'critical'
      trendDirection = Math.random() > 0.3 ? 'up' : 'down'
      trendValue = Math.random() * 15 - 3 // -3% to +12%
    }

    return {
      id: `kpi_${type}`,
      ...template,
      trend: {
        direction: trendDirection,
        value: trendValue,
        period: `vs. last ${period}`
      },
      status
    } as KPIData
  }

  useEffect(() => {
    const loadKPIData = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        const data = getMockKPIData(kpiType)
        setKpiData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPI data')
      } finally {
        setLoading(false)
      }
    }

    loadKPIData()
  }, [kpiType, period, tileId])

  const formatValue = (value: number | string, format: string, unit: string) => {
    if (typeof value === 'string') return value

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-AE', {
          style: 'currency',
          currency: 'AED',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}${unit}`
      case 'number':
        return `${value.toFixed(2)}${unit}`
      default:
        return `${value}${unit}`
    }
  }

  const getStatusColor = (status: KPIData['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50'
      case 'good': return 'text-blue-600 bg-blue-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: KPIData['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />
      case 'good': return <Target className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-3 w-3" />
      case 'down': return <TrendingDown className="h-3 w-3" />
      default: return null
    }
  }

  const getTrendColor = (direction: string, kpiType: string) => {
    // For debt-to-equity, down trend is good
    if (kpiType === 'debt_equity') {
      return direction === 'down' ? 'text-green-600' : 'text-red-600'
    }
    // For most KPIs, up trend is good
    return direction === 'up' ? 'text-green-600' : 'text-red-600'
  }

  const handleAction = (actionId: string, params?: any) => {
    console.log('🎯 KPI Tile Action:', { tileId, actionId, params })
    
    switch (actionId) {
      case 'view_details':
        // Navigate to detailed KPI analysis
        console.log('📊 Viewing detailed KPI analysis:', params)
        break
      case 'compare_periods':
        // Compare KPI across different periods
        console.log('📈 Comparing KPI across periods:', params)
        break
      case 'set_target':
        // Open target setting dialog
        console.log('🎯 Setting new target for KPI:', params)
        break
      case 'export':
        // Export KPI data
        console.log('📤 Exporting KPI data:', params)
        exportKPIData(params?.format || 'pdf')
        break
      case 'refresh':
        // Refresh KPI data
        console.log('🔄 Refreshing KPI data')
        setLoading(true)
        setTimeout(() => {
          const refreshedData = getMockKPIData(kpiType)
          setKpiData(refreshedData)
          setLoading(false)
        }, 800)
        break
      default:
        console.log('Unknown action:', actionId)
    }
    
    onAction?.(actionId, params)
  }

  const exportKPIData = async (format: 'excel' | 'pdf' | 'csv') => {
    console.log(`📤 Exporting KPI data as ${format.toUpperCase()}`)
    const exportData = {
      title: `${kpiData?.name} Analysis`,
      kpiType,
      period,
      currentValue: kpiData?.value,
      target: kpiData?.target,
      status: kpiData?.status,
      trend: kpiData?.trend,
      exportedAt: new Date().toISOString()
    }
    
    // Simulate download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kpi-${kpiType}-${period}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card className={`h-40 ${className}`}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <Target className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Loading KPI...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !kpiData) {
    return (
      <Card className={`h-40 ${className}`}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">Failed to load KPI</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayTitle = title || kpiData.name

  return (
    <Card className={`h-40 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700 truncate">
            {displayTitle}
          </CardTitle>
          <div className={`p-1.5 rounded-full ${getStatusColor(kpiData.status)}`}>
            {getStatusIcon(kpiData.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Main KPI Value */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-gray-900">
              {formatValue(kpiData.value, kpiData.format, kpiData.unit)}
            </span>
            {showTrend && (
              <div className={`flex items-center gap-1 ${getTrendColor(kpiData.trend.direction, kpiType)}`}>
                {getTrendIcon(kpiData.trend.direction)}
                <span className="text-xs font-medium">
                  {Math.abs(kpiData.trend.value).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Target Comparison */}
          {showTarget && kpiData.target && (
            <div className="text-xs text-gray-600">
              Target: {formatValue(kpiData.target, kpiData.format, kpiData.unit)}
              {typeof kpiData.value === 'number' && (
                <span className={`ml-1 ${
                  kpiData.value >= kpiData.target ? 'text-green-600' : 'text-red-600'
                }`}>
                  ({kpiData.value >= kpiData.target ? '+' : ''}{(kpiData.value - kpiData.target).toFixed(1)}{kpiData.unit})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status and Interactive Elements */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs capitalize ${getStatusColor(kpiData.status)} cursor-pointer hover:opacity-80`}
              onClick={() => handleAction('view_details', { kpiType, period, focus: 'status' })}
              title={`Click to analyze ${kpiData.status} status`}
              className="min-h-[44px] active:scale-95 transition-transform touch-manipulation"
            >
              {kpiData.status}
            </Badge>
            {showTrend && (
              <button
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                onClick={() => handleAction('compare_periods', { kpiType, period })}
                title="Compare across periods"
                className="min-h-[44px] px-2 py-1 rounded hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation"
              >
                {kpiData.trend.period}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showTarget && kpiData.target && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('set_target', { kpiType, currentTarget: kpiData.target })}
                className="text-xs min-h-[44px] min-w-[44px] active:scale-95 transition-transform"
                title="Adjust target"
              >
                <Target className="h-3 w-3" />
              </Button>
            )}
            <div className="relative group">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs min-h-[44px] min-w-[44px] active:scale-95 transition-transform"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1 min-w-[140px]">
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 min-h-[44px] active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => handleAction('view_details', { kpiType, period })}
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 min-h-[44px] active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => handleAction('compare_periods', { kpiType, period })}
                  >
                    <BarChart3 className="h-3 w-3" />
                    Compare Periods
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 min-h-[44px] active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => handleAction('export', { format: 'pdf', kpiType })}
                  >
                    <Download className="h-3 w-3" />
                    Export Report
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 min-h-[44px] active:bg-gray-100 transition-colors touch-manipulation"
                    onClick={() => handleAction('refresh')}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Description */}
        {kpiData.description && (
          <button
            className="mt-2 text-xs text-gray-500 hover:text-blue-600 truncate text-left w-full transition-colors"
            title={`${kpiData.description} - Click for more info`}
            onClick={() => handleAction('view_details', { kpiType, period, focus: 'definition' })}
            className="min-h-[44px] px-2 py-1 rounded hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation"
          >
            {kpiData.description}
          </button>
        )}
      </CardContent>
    </Card>
  )
}

export default FinancialKPITile