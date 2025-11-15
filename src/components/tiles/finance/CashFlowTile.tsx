/**
 * HERA Universal Tile System - Cash Flow Tile
 * Displays cash flow analysis with operational, investment, and financing flows
 * Smart Code: HERA.FINANCE.ANALYTICS.TILE.CASHFLOW.OVERVIEW.v1
 */

'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Building, TrendingUp, Coins, ChevronRight, ChevronDown, Eye, Download, FileText, Database, BarChart3, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CashFlowData {
  operating: {
    inflow: number
    outflow: number
    net: number
  }
  investing: {
    inflow: number
    outflow: number
    net: number
  }
  financing: {
    inflow: number
    outflow: number
    net: number
  }
  netCashFlow: number
  openingBalance: number
  closingBalance: number
  currency: string
  period: string
}

interface CashFlowTileProps {
  tileId: string
  title?: string
  subtitle?: string
  period?: 'monthly' | 'quarterly' | 'yearly'
  showBreakdown?: boolean
  onAction?: (actionId: string, params?: any) => void
  className?: string
}

export function CashFlowTile({
  tileId,
  title = 'Cash Flow Analysis',
  subtitle,
  period = 'monthly',
  showBreakdown = true,
  onAction,
  className = ''
}: CashFlowTileProps) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  // Mock cash flow data
  const mockCashFlowData: CashFlowData = {
    operating: {
      inflow: 2850000,
      outflow: 2120000,
      net: 730000
    },
    investing: {
      inflow: 150000,
      outflow: 420000,
      net: -270000
    },
    financing: {
      inflow: 500000,
      outflow: 180000,
      net: 320000
    },
    netCashFlow: 780000,
    openingBalance: 1250000,
    closingBalance: 2030000,
    currency: 'AED',
    period: selectedPeriod
  }

  useEffect(() => {
    const loadCashFlowData = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 900))
        setCashFlowData(mockCashFlowData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cash flow data')
      } finally {
        setLoading(false)
      }
    }

    loadCashFlowData()
  }, [selectedPeriod, tileId])

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    const absAmount = Math.abs(amount)
    if (absAmount >= 1000000) {
      return `${amount >= 0 ? '' : '-'}${(absAmount / 1000000).toFixed(1)}M ${currency}`
    } else if (absAmount >= 1000) {
      return `${amount >= 0 ? '' : '-'}${(absAmount / 1000).toFixed(0)}K ${currency}`
    }
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getCashFlowStatus = (netFlow: number) => {
    if (netFlow > 500000) return { status: 'excellent', color: 'text-green-600 bg-green-50' }
    if (netFlow > 0) return { status: 'good', color: 'text-blue-600 bg-blue-50' }
    if (netFlow > -200000) return { status: 'warning', color: 'text-yellow-600 bg-yellow-50' }
    return { status: 'critical', color: 'text-red-600 bg-red-50' }
  }

  const getFlowIcon = (net: number) => {
    if (net > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (net < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <ArrowUpDown className="h-4 w-4 text-gray-600" />
  }

  const handleAction = (actionId: string, params?: any) => {
    console.log('🎯 Cash Flow Tile Action:', { tileId, actionId, params })
    
    switch (actionId) {
      case 'view_details':
        // Navigate to detailed cash flow statement
        console.log('📊 Viewing detailed cash flow analysis:', params)
        break
      case 'drill_down':
        // Drill down into specific cash flow category
        console.log('🔍 Drilling down into cash flow category:', params)
        break
      case 'forecast':
        // Open cash flow forecasting
        console.log('🔮 Opening cash flow forecasting:', params)
        break
      case 'export':
        // Export cash flow data
        console.log('📤 Exporting cash flow data:', params)
        exportCashFlowData(params?.format || 'pdf')
        break
      case 'refresh':
        // Refresh cash flow data
        console.log('🔄 Refreshing cash flow data')
        setLoading(true)
        setTimeout(() => {
          setCashFlowData({...mockCashFlowData})
          setLoading(false)
        }, 900)
        break
      case 'compare_periods':
        // Compare cash flow across periods
        console.log('📈 Comparing cash flow across periods:', params)
        break
      default:
        console.log('Unknown action:', actionId)
    }
    
    onAction?.(actionId, params)
  }

  const exportCashFlowData = async (format: 'excel' | 'pdf' | 'csv') => {
    console.log(`📤 Exporting cash flow data as ${format.toUpperCase()}`)
    const exportData = {
      title: 'Cash Flow Analysis Export',
      period: selectedPeriod,
      netCashFlow: cashFlowData?.netCashFlow,
      currency: cashFlowData?.currency,
      operating: cashFlowData?.operating,
      investing: cashFlowData?.investing,
      financing: cashFlowData?.financing,
      openingBalance: cashFlowData?.openingBalance,
      closingBalance: cashFlowData?.closingBalance,
      exportedAt: new Date().toISOString()
    }
    
    // Simulate download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cash-flow-${selectedPeriod}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCategoryDrillDown = (category: string, data: any) => {
    console.log('📊 Drilling down into cash flow category:', { category, data })
    handleAction('drill_down', {
      category,
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.net,
      period: selectedPeriod
    })
  }

  if (loading) {
    return (
      <Card className={`h-96 ${className}`}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <Coins className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Loading cash flow data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !cashFlowData) {
    return (
      <Card className={`h-96 ${className}`}>
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <ArrowUpDown className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-600">Failed to load cash flow data</p>
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

  const flowStatus = getCashFlowStatus(cashFlowData.netCashFlow)

  return (
    <Card className={`h-96 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="text-sm border border-gray-300 rounded px-3 py-2 min-h-[44px] min-w-[44px] bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Net Cash Flow */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Cash Flow</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  cashFlowData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(cashFlowData.netCashFlow, cashFlowData.currency)}
                </span>
                {getFlowIcon(cashFlowData.netCashFlow)}
              </div>
            </div>
            <Badge className={`capitalize ${flowStatus.color}`}>
              {flowStatus.status}
            </Badge>
          </div>
        </div>

        {/* Cash Flow Categories */}
        {showBreakdown && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700">Cash Flow Breakdown</h4>
            
            {/* Operating */}
            <div 
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors group"
              onClick={() => handleCategoryDrillDown('operating', cashFlowData.operating)}
              title="Click to view detailed operating cash flow"
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium group-hover:text-blue-700">Operating</span>
                <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  cashFlowData.operating.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(cashFlowData.operating.net, cashFlowData.currency)}
                </div>
                <div className="text-xs text-gray-600">
                  In: {formatCurrency(cashFlowData.operating.inflow, cashFlowData.currency)} | 
                  Out: {formatCurrency(cashFlowData.operating.outflow, cashFlowData.currency)}
                </div>
              </div>
            </div>

            {/* Investing */}
            <div 
              className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors group"
              onClick={() => handleCategoryDrillDown('investing', cashFlowData.investing)}
              title="Click to view detailed investing cash flow"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium group-hover:text-purple-700">Investing</span>
                <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  cashFlowData.investing.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(cashFlowData.investing.net, cashFlowData.currency)}
                </div>
                <div className="text-xs text-gray-600">
                  In: {formatCurrency(cashFlowData.investing.inflow, cashFlowData.currency)} | 
                  Out: {formatCurrency(cashFlowData.investing.outflow, cashFlowData.currency)}
                </div>
              </div>
            </div>

            {/* Financing */}
            <div 
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors group"
              onClick={() => handleCategoryDrillDown('financing', cashFlowData.financing)}
              title="Click to view detailed financing cash flow"
            >
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium group-hover:text-green-700">Financing</span>
                <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  cashFlowData.financing.net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(cashFlowData.financing.net, cashFlowData.currency)}
                </div>
                <div className="text-xs text-gray-600">
                  In: {formatCurrency(cashFlowData.financing.inflow, cashFlowData.currency)} | 
                  Out: {formatCurrency(cashFlowData.financing.outflow, cashFlowData.currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cash Position */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg mb-4">
          <div>
            <p className="text-sm text-gray-600">Cash Position</p>
            <div className="text-sm">
              <span className="text-gray-700">Opening: </span>
              <span className="font-medium">
                {formatCurrency(cashFlowData.openingBalance, cashFlowData.currency)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Closing Balance</p>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(cashFlowData.closingBalance, cashFlowData.currency)}
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('view_details', { period: selectedPeriod })}
              className="text-xs hover:bg-blue-50"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleAction('forecast', { period: selectedPeriod })}
              className="text-xs hover:bg-green-50"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Forecast
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs hover:bg-purple-50"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1 min-w-[140px]">
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleAction('export', { format: 'pdf', period: selectedPeriod })}
                  >
                    <FileText className="h-3 w-3" />
                    Cash Flow Statement
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleAction('export', { format: 'excel', period: selectedPeriod })}
                  >
                    <Database className="h-3 w-3" />
                    Detailed Analysis
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => handleAction('compare_periods', { period: selectedPeriod })}
                  >
                    <BarChart3 className="h-3 w-3" />
                    Period Comparison
                  </button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('refresh')}
              className="text-xs p-1 h-6 w-6"
              title="Refresh data"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CashFlowTile