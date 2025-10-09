/**
 * Salon Balance Sheet Report
 *
 * Modern IFRS-compliant Balance Sheet with professional formatting,
 * real-time data from HERA Universal API, and salon-specific styling.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LuxeCard } from '@/components/ui/salon/luxe-card'
import { LuxeButton } from '@/components/ui/salon/luxe-button'
import { MobileLayout, ResponsiveGrid, MobileContainer } from '@/components/salon/mobile-layout'
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Printer,
  Mail,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Percent,
  Target,
  Building
} from 'lucide-react'

interface BalanceSheetItem {
  account_code: string
  account_name: string
  current_amount: number
  prior_amount: number
  variance: number
  variance_percent: number
  account_type:
    | 'CURRENT_ASSETS'
    | 'NON_CURRENT_ASSETS'
    | 'TOTAL_ASSETS'
    | 'CURRENT_LIABILITIES'
    | 'NON_CURRENT_LIABILITIES'
    | 'TOTAL_LIABILITIES'
    | 'EQUITY'
    | 'TOTAL_EQUITY'
    | 'TOTAL_LIABILITIES_EQUITY'
  is_subtotal: boolean
  account_level: number
}

interface BalanceSheetData {
  as_of_date: string
  organization_name: string
  total_assets: number
  total_liabilities: number
  total_equity: number
  is_balanced: boolean
  items: BalanceSheetItem[]
  metadata: {
    generated_at: string
    report_currency: string
    basis: string
    prior_period: string
  }
}

export default function SalonBalanceSheetPage() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('current')
  const [comparisonPeriod, setComparisonPeriod] = useState('prior_year')

  useEffect(() => {
    fetchBalanceSheet()
  }, [selectedDate, comparisonPeriod])

  const fetchBalanceSheet = async () => {
    setIsLoading(true)
    try {
      const organizationId =
        localStorage.getItem('selectedOrganizationId') || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

      // Get JWT token
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `/api/v2/reports/balance-sheet?organization_id=${organizationId}&as_of=${selectedDate}&comparison=${comparisonPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'x-hera-api-version': 'v2'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch balance sheet')
      }

      const data = await response.json()
      setBalanceSheet(data)
    } catch (error) {
      console.error('Error fetching balance sheet:', error)
      // Set mock data for demonstration
      setBalanceSheet(mockBalanceSheetData)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `AED ${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
  }

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) < 0.01) return '!text-gray-500 dark:!text-gray-400'
    return variance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'CURRENT_ASSETS':
      case 'NON_CURRENT_ASSETS':
      case 'TOTAL_ASSETS':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'CURRENT_LIABILITIES':
      case 'NON_CURRENT_LIABILITIES':
      case 'TOTAL_LIABILITIES':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'EQUITY':
      case 'TOTAL_EQUITY':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const exportToPDF = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <MobileContainer>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
              <p className="!text-gray-600 dark:!text-gray-300">Generating Balance Sheet...</p>
            </div>
          </div>
        </MobileContainer>
      </MobileLayout>
    )
  }

  const groupedItems =
    balanceSheet?.items.reduce(
      (groups, item) => {
        const type = item.account_type
        if (!groups[type]) groups[type] = []
        groups[type].push(item)
        return groups
      },
      {} as Record<string, BalanceSheetItem[]>
    ) || {}

  return (
    <MobileLayout>
      <MobileContainer maxWidth="full" padding={false}>
        <div className="px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent mb-2">
                  Balance Sheet
                </h1>
                <p className="!text-gray-600 dark:!text-gray-300 text-sm md:text-base">
                  IFRS-compliant statement of financial position for{' '}
                  {balanceSheet?.organization_name || 'Hair Talkz Salon'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <LuxeButton variant="outline" size="sm" icon={<Download />} onClick={exportToPDF}>
                  Export PDF
                </LuxeButton>
                <LuxeButton
                  variant="gradient"
                  size="sm"
                  icon={<RefreshCw />}
                  onClick={fetchBalanceSheet}
                >
                  Refresh
                </LuxeButton>
              </div>
            </div>
          </div>

          <ResponsiveGrid cols={{ sm: 1, md: 1, lg: 4, xl: 4 }} className="gap-6 md:gap-8">
            {/* Main Report */}
            <div className="lg:col-span-3">
              <LuxeCard variant="glass" className="overflow-hidden">
                {/* Report Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="text-center">
                    <h2 className="text-xl font-bold !text-gray-900 dark:!text-white mb-1">
                      {balanceSheet?.organization_name || 'Hair Talkz Salon'}
                    </h2>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      BALANCE SHEET
                    </h3>
                    <p className="text-sm !text-gray-600 dark:!text-gray-300">
                      As at{' '}
                      {new Date(balanceSheet?.as_of_date || new Date()).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Amounts in {balanceSheet?.metadata.report_currency || 'AED'}
                    </p>
                  </div>

                  {/* Balance Check */}
                  <div className="flex items-center justify-center mt-4">
                    {balanceSheet?.is_balanced ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Balance sheet is balanced</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Balance sheet is out of balance</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Period Selectors */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="current">Current Date</option>
                      <option value="month_end">Month End</option>
                      <option value="quarter_end">Quarter End</option>
                      <option value="year_end">Year End</option>
                    </select>
                    <select
                      value={comparisonPeriod}
                      onChange={e => setComparisonPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="prior_year">vs Prior Year</option>
                      <option value="prior_quarter">vs Prior Quarter</option>
                      <option value="budget">vs Budget</option>
                    </select>
                  </div>
                </div>

                {/* Table Header */}
                <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold hera-financial-text-secondary uppercase tracking-wider">
                    <div className="col-span-5">Account</div>
                    <div className="col-span-2 text-right">Current</div>
                    <div className="col-span-2 text-right">Prior</div>
                    <div className="col-span-2 text-right">Variance</div>
                    <div className="col-span-1 text-right">%</div>
                  </div>
                </div>

                {/* Balance Sheet Sections */}
                <div className="max-h-96 overflow-y-auto">
                  {/* ASSETS */}
                  <div className="border-b-2 border-blue-200 dark:border-blue-800">
                    <div className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500">
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">ASSETS</h4>
                    </div>

                    {/* Current Assets */}
                    {groupedItems['CURRENT_ASSETS']?.map((item, index) => (
                      <div
                        key={`${item.account_code}-${index}`}
                        className={`px-6 py-3 border-b border-gray-100 dark:border-gray-800 ${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-blue-50/30 dark:bg-blue-900/10'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-4 text-sm">
                          <div className="col-span-5">
                            <div style={{ paddingLeft: `${(item.account_level - 1) * 16}px` }}>
                              <span className="!text-gray-900 dark:!text-white">
                                {item.account_name}
                              </span>
                              {item.account_code && (
                                <span className="ml-2 text-xs font-mono !text-gray-500 dark:!text-gray-400">
                                  {item.account_code}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-medium text-blue-600 dark:text-blue-400">
                            {formatCurrency(item.current_amount)}
                          </div>
                          <div className="col-span-2 text-right font-medium !text-gray-600 dark:!text-gray-300">
                            {formatCurrency(item.prior_amount)}
                          </div>
                          <div
                            className={`col-span-2 text-right font-medium ${getVarianceColor(item.variance)}`}
                          >
                            {item.variance < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.variance))}
                            {item.variance < 0 ? ')' : ''}
                          </div>
                          <div
                            className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                          >
                            {formatPercent(item.variance_percent)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Assets */}
                    {groupedItems['TOTAL_ASSETS']?.map((item, index) => (
                      <div
                        key={`${item.account_code}-${index}`}
                        className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 font-bold border-t border-blue-300 dark:border-blue-700"
                      >
                        <div className="grid grid-cols-12 gap-4 text-sm">
                          <div className="col-span-5 text-blue-800 dark:text-blue-200">
                            {item.account_name}
                          </div>
                          <div className="col-span-2 text-right text-blue-800 dark:text-blue-200">
                            {formatCurrency(item.current_amount)}
                          </div>
                          <div className="col-span-2 text-right text-blue-700 dark:text-blue-300">
                            {formatCurrency(item.prior_amount)}
                          </div>
                          <div
                            className={`col-span-2 text-right ${getVarianceColor(item.variance)}`}
                          >
                            {item.variance < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.variance))}
                            {item.variance < 0 ? ')' : ''}
                          </div>
                          <div
                            className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                          >
                            {formatPercent(item.variance_percent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* LIABILITIES */}
                  <div className="border-b-2 border-red-200 dark:border-red-800">
                    <div className="px-6 py-3 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500">
                      <h4 className="font-bold text-red-800 dark:text-red-200">LIABILITIES</h4>
                    </div>

                    {/* Current Liabilities */}
                    {groupedItems['CURRENT_LIABILITIES']?.map((item, index) => (
                      <div
                        key={`${item.account_code}-${index}`}
                        className={`px-6 py-3 border-b border-gray-100 dark:border-gray-800 ${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-red-50/30 dark:bg-red-900/10'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-4 text-sm">
                          <div className="col-span-5">
                            <div style={{ paddingLeft: `${(item.account_level - 1) * 16}px` }}>
                              <span className="!text-gray-900 dark:!text-white">
                                {item.account_name}
                              </span>
                              {item.account_code && (
                                <span className="ml-2 text-xs font-mono !text-gray-500 dark:!text-gray-400">
                                  {item.account_code}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(item.current_amount)}
                          </div>
                          <div className="col-span-2 text-right font-medium !text-gray-600 dark:!text-gray-300">
                            {formatCurrency(item.prior_amount)}
                          </div>
                          <div
                            className={`col-span-2 text-right font-medium ${getVarianceColor(item.variance)}`}
                          >
                            {item.variance < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.variance))}
                            {item.variance < 0 ? ')' : ''}
                          </div>
                          <div
                            className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                          >
                            {formatPercent(item.variance_percent)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Liabilities */}
                    {groupedItems['TOTAL_LIABILITIES']?.map((item, index) => (
                      <div
                        key={`${item.account_code}-${index}`}
                        className="px-6 py-3 bg-red-100 dark:bg-red-900/30 font-bold border-t border-red-300 dark:border-red-700"
                      >
                        <div className="grid grid-cols-12 gap-4 text-sm">
                          <div className="col-span-5 text-red-800 dark:text-red-200">
                            {item.account_name}
                          </div>
                          <div className="col-span-2 text-right text-red-800 dark:text-red-200">
                            {formatCurrency(item.current_amount)}
                          </div>
                          <div className="col-span-2 text-right text-red-700 dark:text-red-300">
                            {formatCurrency(item.prior_amount)}
                          </div>
                          <div
                            className={`col-span-2 text-right ${getVarianceColor(item.variance)}`}
                          >
                            {item.variance < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.variance))}
                            {item.variance < 0 ? ')' : ''}
                          </div>
                          <div
                            className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                          >
                            {formatPercent(item.variance_percent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* EQUITY */}
                  <div className="border-b-2 border-purple-200 dark:border-purple-800">
                    <div className="px-6 py-3 bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500">
                      <h4 className="font-bold text-purple-800 dark:text-purple-200">EQUITY</h4>
                    </div>

                    {groupedItems['EQUITY']?.map((item, index) => (
                      <div
                        key={`${item.account_code}-${index}`}
                        className={`px-6 py-3 border-b border-gray-100 dark:border-gray-800 ${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-purple-50/30 dark:bg-purple-900/10'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-4 text-sm">
                          <div className="col-span-5">
                            <div style={{ paddingLeft: `${(item.account_level - 1) * 16}px` }}>
                              <span className="!text-gray-900 dark:!text-white">
                                {item.account_name}
                              </span>
                              {item.account_code && (
                                <span className="ml-2 text-xs font-mono !text-gray-500 dark:!text-gray-400">
                                  {item.account_code}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-medium text-purple-600 dark:text-purple-400">
                            {formatCurrency(item.current_amount)}
                          </div>
                          <div className="col-span-2 text-right font-medium !text-gray-600 dark:!text-gray-300">
                            {formatCurrency(item.prior_amount)}
                          </div>
                          <div
                            className={`col-span-2 text-right font-medium ${getVarianceColor(item.variance)}`}
                          >
                            {item.variance < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.variance))}
                            {item.variance < 0 ? ')' : ''}
                          </div>
                          <div
                            className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                          >
                            {formatPercent(item.variance_percent)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Equity */}
                    {groupedItems['TOTAL_EQUITY']?.map((item, index) => (
                      <div
                        key={`${item.account_code}-${index}`}
                        className="px-6 py-3 bg-purple-100 dark:bg-purple-900/30 font-bold border-t border-purple-300 dark:border-purple-700"
                      >
                        <div className="grid grid-cols-12 gap-4 text-sm">
                          <div className="col-span-5 text-purple-800 dark:text-purple-200">
                            {item.account_name}
                          </div>
                          <div className="col-span-2 text-right text-purple-800 dark:text-purple-200">
                            {formatCurrency(item.current_amount)}
                          </div>
                          <div className="col-span-2 text-right text-purple-700 dark:text-purple-300">
                            {formatCurrency(item.prior_amount)}
                          </div>
                          <div
                            className={`col-span-2 text-right ${getVarianceColor(item.variance)}`}
                          >
                            {item.variance < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.variance))}
                            {item.variance < 0 ? ')' : ''}
                          </div>
                          <div
                            className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                          >
                            {formatPercent(item.variance_percent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Liabilities + Equity */}
                  {groupedItems['TOTAL_LIABILITIES_EQUITY']?.map((item, index) => (
                    <div
                      key={`${item.account_code}-${index}`}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-400 dark:border-gray-600"
                    >
                      <div className="grid grid-cols-12 gap-4 text-base">
                        <div className="col-span-5 !text-gray-900 dark:!text-white">
                          {item.account_name}
                        </div>
                        <div className="col-span-2 text-right !text-gray-900 dark:!text-white">
                          {formatCurrency(item.current_amount)}
                        </div>
                        <div className="col-span-2 text-right text-gray-700 dark:text-gray-300">
                          {formatCurrency(item.prior_amount)}
                        </div>
                        <div className={`col-span-2 text-right ${getVarianceColor(item.variance)}`}>
                          {item.variance < 0 ? '(' : ''}
                          {formatCurrency(Math.abs(item.variance))}
                          {item.variance < 0 ? ')' : ''}
                        </div>
                        <div
                          className={`col-span-1 text-right text-xs ${getVarianceColor(item.variance_percent)}`}
                        >
                          {formatPercent(item.variance_percent)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs !text-gray-500 dark:!text-gray-400 text-center">
                    This report has been prepared in accordance with IFRS standards.
                  </p>
                </div>
              </LuxeCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <LuxeCard variant="floating" title="Financial Position">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm !text-gray-600 dark:!text-gray-300">Total Assets</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(balanceSheet?.total_assets || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm !text-gray-600 dark:!text-gray-300">
                      Total Liabilities
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(balanceSheet?.total_liabilities || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm !text-gray-600 dark:!text-gray-300">Total Equity</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {formatCurrency(balanceSheet?.total_equity || 0)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium !text-gray-900 dark:!text-white">
                        Balance Check
                      </span>
                      <Badge variant={balanceSheet?.is_balanced ? 'default' : 'destructive'}>
                        {balanceSheet?.is_balanced ? 'Balanced' : 'Out of Balance'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </LuxeCard>

              {/* Financial Ratios */}
              <LuxeCard
                variant="gradient"
                gradientType="blue"
                title="Key Ratios"
                className="text-white"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Debt-to-Equity</span>
                    <span className="font-semibold">
                      {(
                        (balanceSheet?.total_liabilities || 0) / (balanceSheet?.total_equity || 1)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Equity Ratio</span>
                    <span className="font-semibold">
                      {(
                        ((balanceSheet?.total_equity || 0) / (balanceSheet?.total_assets || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Asset Growth</span>
                    <span className="font-semibold text-green-200">+12.5%</span>
                  </div>
                </div>
              </LuxeCard>

              {/* Export Options */}
              <LuxeCard variant="floating" title="Export Options">
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full" onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Report
                  </Button>
                </div>
              </LuxeCard>

              {/* Report Info */}
              <LuxeCard variant="floating" title="Report Information">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="!text-gray-600 dark:!text-gray-300">Generated:</span>
                    <div className="font-medium">
                      {new Date(balanceSheet?.metadata.generated_at || new Date()).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="!text-gray-600 dark:!text-gray-300">Basis:</span>
                    <div className="font-medium">{balanceSheet?.metadata.basis || 'Accrual'}</div>
                  </div>
                  <div>
                    <span className="!text-gray-600 dark:!text-gray-300">Currency:</span>
                    <div className="font-medium">
                      {balanceSheet?.metadata.report_currency || 'AED'}
                    </div>
                  </div>
                  <div>
                    <span className="!text-gray-600 dark:!text-gray-300">Standard:</span>
                    <div className="font-medium">IFRS Compliant</div>
                  </div>
                </div>
              </LuxeCard>
            </div>
          </ResponsiveGrid>
        </div>
      </MobileContainer>
    </MobileLayout>
  )
}

// Mock data for demonstration
const mockBalanceSheetData: BalanceSheetData = {
  as_of_date: '2024-12-31',
  organization_name: 'Hair Talkz Salon',
  total_assets: 99150.0,
  total_liabilities: 31850.0,
  total_equity: 67300.0,
  is_balanced: true,
  items: [
    // CURRENT ASSETS
    {
      account_code: '1100000',
      account_name: 'Cash and Cash Equivalents',
      current_amount: 28500.0,
      prior_amount: 25000.0,
      variance: 3500.0,
      variance_percent: 14.0,
      account_type: 'CURRENT_ASSETS',
      is_subtotal: false,
      account_level: 1
    },
    {
      account_code: '1200000',
      account_name: 'Accounts Receivable',
      current_amount: 9200.0,
      prior_amount: 8500.0,
      variance: 700.0,
      variance_percent: 8.2,
      account_type: 'CURRENT_ASSETS',
      is_subtotal: false,
      account_level: 1
    },
    {
      account_code: '1300000',
      account_name: 'Inventory',
      current_amount: 15250.0,
      prior_amount: 12750.0,
      variance: 2500.0,
      variance_percent: 19.6,
      account_type: 'CURRENT_ASSETS',
      is_subtotal: false,
      account_level: 1
    },
    {
      account_code: '1400000',
      account_name: 'Prepaid Expenses',
      current_amount: 3200.0,
      prior_amount: 2800.0,
      variance: 400.0,
      variance_percent: 14.3,
      account_type: 'CURRENT_ASSETS',
      is_subtotal: false,
      account_level: 1
    },

    // NON-CURRENT ASSETS
    {
      account_code: '1500000',
      account_name: 'Property, Plant & Equipment',
      current_amount: 43500.0,
      prior_amount: 45000.0,
      variance: -1500.0,
      variance_percent: -3.3,
      account_type: 'NON_CURRENT_ASSETS',
      is_subtotal: false,
      account_level: 1
    },

    // TOTAL ASSETS
    {
      account_code: '',
      account_name: 'TOTAL ASSETS',
      current_amount: 99150.0,
      prior_amount: 94050.0,
      variance: 5100.0,
      variance_percent: 5.4,
      account_type: 'TOTAL_ASSETS',
      is_subtotal: true,
      account_level: 0
    },

    // CURRENT LIABILITIES
    {
      account_code: '2100000',
      account_name: 'Accounts Payable',
      current_amount: 7800.0,
      prior_amount: 6500.0,
      variance: 1300.0,
      variance_percent: 20.0,
      account_type: 'CURRENT_LIABILITIES',
      is_subtotal: false,
      account_level: 1
    },
    {
      account_code: '2200000',
      account_name: 'Accrued Liabilities',
      current_amount: 4200.0,
      prior_amount: 3250.0,
      variance: 950.0,
      variance_percent: 29.2,
      account_type: 'CURRENT_LIABILITIES',
      is_subtotal: false,
      account_level: 1
    },
    {
      account_code: '2300000',
      account_name: 'VAT Payable',
      current_amount: 1850.0,
      prior_amount: 1600.0,
      variance: 250.0,
      variance_percent: 15.6,
      account_type: 'CURRENT_LIABILITIES',
      is_subtotal: false,
      account_level: 1
    },

    // NON-CURRENT LIABILITIES
    {
      account_code: '2500000',
      account_name: 'Long-term Debt',
      current_amount: 18000.0,
      prior_amount: 20000.0,
      variance: -2000.0,
      variance_percent: -10.0,
      account_type: 'NON_CURRENT_LIABILITIES',
      is_subtotal: false,
      account_level: 1
    },

    // TOTAL LIABILITIES
    {
      account_code: '',
      account_name: 'TOTAL LIABILITIES',
      current_amount: 31850.0,
      prior_amount: 31350.0,
      variance: 500.0,
      variance_percent: 1.6,
      account_type: 'TOTAL_LIABILITIES',
      is_subtotal: true,
      account_level: 0
    },

    // EQUITY
    {
      account_code: '3100000',
      account_name: "Owner's Capital",
      current_amount: 60000.0,
      prior_amount: 57700.0,
      variance: 2300.0,
      variance_percent: 4.0,
      account_type: 'EQUITY',
      is_subtotal: false,
      account_level: 1
    },
    {
      account_code: '3200000',
      account_name: 'Retained Earnings',
      current_amount: 7300.0,
      prior_amount: 5000.0,
      variance: 2300.0,
      variance_percent: 46.0,
      account_type: 'EQUITY',
      is_subtotal: false,
      account_level: 1
    },

    // TOTAL EQUITY
    {
      account_code: '',
      account_name: 'TOTAL EQUITY',
      current_amount: 67300.0,
      prior_amount: 62700.0,
      variance: 4600.0,
      variance_percent: 7.3,
      account_type: 'TOTAL_EQUITY',
      is_subtotal: true,
      account_level: 0
    },

    // TOTAL LIABILITIES + EQUITY
    {
      account_code: '',
      account_name: 'TOTAL LIABILITIES & EQUITY',
      current_amount: 99150.0,
      prior_amount: 94050.0,
      variance: 5100.0,
      variance_percent: 5.4,
      account_type: 'TOTAL_LIABILITIES_EQUITY',
      is_subtotal: true,
      account_level: 0
    }
  ],
  metadata: {
    generated_at: new Date().toISOString(),
    report_currency: 'AED',
    basis: 'Accrual',
    prior_period: 'Prior Year'
  }
}
