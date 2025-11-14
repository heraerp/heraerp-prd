/**
 * HERA Universal Tile System - Revenue Dashboard Tile
 * Specialized financial tile for revenue analytics and trends
 * Smart Code: HERA.FINANCE.ANALYTICS.TILE.REVENUE.DASHBOARD.v1
 */

'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Download, ChevronDown, ChevronRight, FileText, Database, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RevenueData {
  total: number
  currency: string
  period: string
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    comparison: string
  }
  breakdown: Array<{
    label: string
    value: number
    percentage: number
    color: string
  }>
  periodComparison: {
    current: number
    previous: number
    growth: number
  }
}

interface RevenueDashboardTileProps {
  tileId: string
  title?: string
  subtitle?: string
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  showBreakdown?: boolean
  showTrends?: boolean
  onAction?: (actionId: string, params?: any) => void
  className?: string
}

export function RevenueDashboardTile({
  tileId,
  title = 'Revenue Overview',
  subtitle,
  period = 'monthly',
  showBreakdown = true,
  showTrends = true,
  onAction,
  className = ''
}: RevenueDashboardTileProps) {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  // Mock data for demonstration - in real app this would come from API
  const mockRevenueData: RevenueData = {
    total: 2847650,
    currency: 'AED',
    period: selectedPeriod,
    trend: {
      direction: 'up',
      percentage: 12.5,
      comparison: 'vs. last month'
    },
    breakdown: [
      { label: 'Product Sales', value: 1520000, percentage: 53.4, color: '#3b82f6' },
      { label: 'Services', value: 892000, percentage: 31.3, color: '#10b981' },
      { label: 'Consulting', value: 285650, percentage: 10.0, color: '#f59e0b' },
      { label: 'Other', value: 150000, percentage: 5.3, color: '#6b7280' }
    ],
    periodComparison: {
      current: 2847650,
      previous: 2532000,
      growth: 12.5
    }
  }

  useEffect(() => {
    // Simulate API call
    const loadRevenueData = async () => {
      try {
        setLoading(true)
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setRevenueData(mockRevenueData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue data')
      } finally {
        setLoading(false)
      }
    }

    loadRevenueData()
  }, [selectedPeriod, tileId])

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const handleAction = (actionId: string, params?: any) => {
    console.log('🎯 Revenue Tile Action:', { tileId, actionId, params })
    
    switch (actionId) {
      case 'drill_down':
        // Navigate to detailed revenue breakdown
        console.log('📊 Drilling down into revenue details:', params)
        break
      case 'export':
        // Export revenue data
        console.log('📤 Exporting revenue data:', { format: params?.format, period: selectedPeriod })
        exportRevenueData(params?.format || 'excel')
        break
      case 'refresh':
        // Refresh tile data
        console.log('🔄 Refreshing revenue data')
        setLoading(true)
        setTimeout(() => {
          setRevenueData({...mockRevenueData})
          setLoading(false)
        }, 1000)
        break
      default:
        console.log('Unknown action:', actionId)
    }
    
    onAction?.(actionId, params)
  }

  const exportRevenueData = async (format: 'excel' | 'pdf' | 'csv') => {
    console.log(`📤 Exporting revenue data as ${format.toUpperCase()}`)
    // In real implementation, this would call the export API
    const exportData = {
      title: 'Revenue Dashboard Export',
      period: selectedPeriod,
      total: revenueData?.total,
      currency: revenueData?.currency,
      breakdown: revenueData?.breakdown,
      exportedAt: new Date().toISOString()
    }
    
    // Simulate download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-dashboard-${selectedPeriod}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBreakdownDrillDown = (item: any) => {
    console.log('📊 Drilling down into breakdown item:', item)
    handleAction('drill_down', {
      category: item.label,
      value: item.value,
      percentage: item.percentage,
      period: selectedPeriod
    })
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4" />
      case 'down': return <TrendingDown className="h-4 w-4" />
      default: return null
    }
  }

  if (loading) {
    return (
      <Card className={`h-80 ${className}`}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Loading revenue data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !revenueData) {
    return (
      <Card className={`h-80 ${className}`}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600">Failed to load revenue data</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => handleAction('refresh')}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`h-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-2 min-h-[44px] min-w-[44px] bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Main Revenue Display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(revenueData.total, revenueData.currency)}
            </span>
            {showTrends && revenueData.trend && (
              <div className={`flex items-center gap-1 ${getTrendColor(revenueData.trend.direction)}`}>
                {getTrendIcon(revenueData.trend.direction)}
                <span className="text-sm font-medium">
                  {formatPercentage(revenueData.trend.percentage)}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 capitalize">
            {selectedPeriod} revenue {revenueData.trend?.comparison}
          </p>
        </div>

        {/* Revenue Breakdown */}
        {showBreakdown && revenueData.breakdown && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700">Revenue Sources</h4>
            <div className="space-y-2">
              {revenueData.breakdown.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleBreakdownDrillDown(item)}
                  title={`Click to view detailed breakdown for ${item.label}`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-700 hover:text-blue-600">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(item.value, revenueData.currency)}
                    </span>
                    <Badge variant="secondary" className="text-xs hover:bg-blue-50">
                      {item.percentage.toFixed(1)}%
                    </Badge>
                    <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('drill_down', { type: 'detailed_analysis', period: selectedPeriod })}
              className="text-xs hover:bg-blue-50"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Drill Down
            </Button>
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs hover:bg-green-50"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1 min-w-[120px]">
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleAction('export', { format: 'excel', period: selectedPeriod })}
                  >
                    <FileText className="h-3 w-3" />
                    Excel Report
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleAction('export', { format: 'pdf', period: selectedPeriod })}
                  >
                    <FileText className="h-3 w-3" />
                    PDF Summary
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleAction('export', { format: 'csv', period: selectedPeriod })}
                  >
                    <Database className="h-3 w-3" />
                    CSV Data
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('refresh')}
              className="text-xs p-1 h-6 w-6"
              title="Refresh data"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Updated 2m ago
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RevenueDashboardTile