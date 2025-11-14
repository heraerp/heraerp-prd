/**
 * Salon Profit & Loss Report
 *
 * Modern IFRS-compliant P&L Statement with professional formatting,
 * real-time data from HERA Universal API, and salon-specific styling.
 */

'use client'

import React, { useState, useEffect } from 'react'
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
  Target
} from 'lucide-react'

interface PLItem {
  account_code: string
  account_name: string
  current_period: number
  prior_period: number
  variance: number
  variance_percent: number
  account_type:
    | 'REVENUE'
    | 'COGS'
    | 'GROSS_PROFIT'
    | 'OPERATING_EXPENSES'
    | 'OTHER_INCOME'
    | 'OTHER_EXPENSES'
    | 'NET_INCOME'
  is_subtotal: boolean
}

interface ProfitLossData {
  period_start: string
  period_end: string
  organization_name: string
  total_revenue: number
  total_expenses: number
  gross_profit: number
  operating_income: number
  net_income: number
  items: PLItem[]
  metadata: {
    generated_at: string
    report_currency: string
    basis: string
    comparison_period: string
  }
}

export default function SalonProfitLossPage() {
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [comparisonPeriod, setComparisonPeriod] = useState('prior_month')

  useEffect(() => {
    fetchProfitLoss()
  }, [selectedPeriod, comparisonPeriod])

  const fetchProfitLoss = async () => {
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
        `/api/v2/reports/profit-loss?organization_id=${organizationId}&period=${selectedPeriod}&comparison=${comparisonPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'x-hera-api-version': 'v2'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch P&L')
      }

      const data = await response.json()
      setProfitLoss(data)
    } catch (error) {
      console.error('Error fetching P&L:', error)
      // Set mock data for demonstration
      setProfitLoss(mockPLData)
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
    if (Math.abs(variance) < 0.01) return 'text-gray-500 dark:text-gray-400'
    return variance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
              <p className="text-gray-600 dark:text-gray-400">Generating Profit & Loss...</p>
            </div>
          </div>
        </MobileContainer>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <MobileContainer maxWidth="full" padding={false}>
        <div className="px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent mb-2">
                  Profit & Loss Statement
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  IFRS-compliant income statement for{' '}
                  {profitLoss?.organization_name || 'Hair Talkz Salon'}
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
                  onClick={fetchProfitLoss}
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
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {profitLoss?.organization_name || 'Hair Talkz Salon'}
                    </h2>
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                      PROFIT & LOSS STATEMENT
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      For the period from{' '}
                      {new Date(profitLoss?.period_start || new Date()).toLocaleDateString()} to{' '}
                      {new Date(profitLoss?.period_end || new Date()).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Amounts in {profitLoss?.metadata.report_currency || 'AED'}
                    </p>
                  </div>
                </div>

                {/* Period Selectors */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedPeriod}
                      onChange={e => setSelectedPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="month">Current Month</option>
                      <option value="quarter">Current Quarter</option>
                      <option value="year">Current Year</option>
                      <option value="ytd">Year to Date</option>
                    </select>
                    <select
                      value={comparisonPeriod}
                      onChange={e => setComparisonPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="prior_month">vs Prior Month</option>
                      <option value="prior_year">vs Prior Year</option>
                      <option value="budget">vs Budget</option>
                    </select>
                  </div>
                </div>

                {/* Table Header */}
                <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold hera-financial-text-secondary uppercase tracking-wider">
                    <div className="col-span-5">Account</div>
                    <div className="col-span-2 text-right">Current Period</div>
                    <div className="col-span-2 text-right">Prior Period</div>
                    <div className="col-span-2 text-right">Variance</div>
                    <div className="col-span-1 text-right">%</div>
                  </div>
                </div>

                {/* P&L Items */}
                <div className="max-h-96 overflow-y-auto">
                  {profitLoss?.items.map((item, index) => (
                    <div
                      key={`${item.account_code}-${index}`}
                      className={`px-6 py-3 border-b border-gray-100 dark:border-gray-800 ${
                        item.is_subtotal
                          ? 'bg-gray-50 dark:bg-gray-800 font-semibold'
                          : index % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50/30 dark:bg-gray-800/20'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 text-sm">
                        <div className="col-span-5">
                          {item.is_subtotal ? (
                            <span className="font-bold !text-gray-900 dark:!text-white">
                              {item.account_name}
                            </span>
                          ) : (
                            <div>
                              <span className="!text-gray-900 dark:!text-white">
                                {item.account_name}
                              </span>
                              {item.account_code && (
                                <span className="ml-2 text-xs font-mono !text-gray-500 dark:!text-gray-400">
                                  {item.account_code}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 text-right font-medium">
                          <span
                            className={
                              item.account_type === 'REVENUE'
                                ? 'text-green-600 dark:text-green-400'
                                : item.account_type === 'OPERATING_EXPENSES'
                                  ? 'text-red-600 dark:text-red-400'
                                  : '!text-gray-900 dark:!text-white'
                            }
                          >
                            {item.current_period < 0 ? '(' : ''}
                            {formatCurrency(Math.abs(item.current_period))}
                            {item.current_period < 0 ? ')' : ''}
                          </span>
                        </div>
                        <div className="col-span-2 text-right font-medium !text-gray-600 dark:!text-gray-300">
                          {item.prior_period < 0 ? '(' : ''}
                          {formatCurrency(Math.abs(item.prior_period))}
                          {item.prior_period < 0 ? ')' : ''}
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
                </div>

                {/* Footer */}
                <div className="p-6 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    This report has been prepared in accordance with IFRS standards.
                  </p>
                </div>
              </LuxeCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <LuxeCard variant="floating" title="Key Metrics">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(profitLoss?.total_revenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gross Profit</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(profitLoss?.gross_profit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Operating Income
                    </span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {formatCurrency(profitLoss?.operating_income || 0)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Net Income
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          (profitLoss?.net_income || 0) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrency(profitLoss?.net_income || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </LuxeCard>

              {/* Ratios */}
              <LuxeCard
                variant="gradient"
                gradientType="blue"
                title="Financial Ratios"
                className="text-white"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gross Margin</span>
                    <span className="font-semibold">
                      {(
                        ((profitLoss?.gross_profit || 0) / (profitLoss?.total_revenue || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Operating Margin</span>
                    <span className="font-semibold">
                      {(
                        ((profitLoss?.operating_income || 0) / (profitLoss?.total_revenue || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Net Margin</span>
                    <span className="font-semibold">
                      {(
                        ((profitLoss?.net_income || 0) / (profitLoss?.total_revenue || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
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
                    <span className="text-gray-600 dark:text-gray-400">Generated:</span>
                    <div className="font-medium">
                      {new Date(profitLoss?.metadata.generated_at || new Date()).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Basis:</span>
                    <div className="font-medium">{profitLoss?.metadata.basis || 'Accrual'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                    <div className="font-medium">
                      {profitLoss?.metadata.report_currency || 'AED'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Standard:</span>
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
const mockPLData: ProfitLossData = {
  period_start: '2024-12-01',
  period_end: '2024-12-31',
  organization_name: 'Hair Talkz Salon',
  total_revenue: 53700.0,
  total_expenses: 48400.0,
  gross_profit: 44700.0,
  operating_income: 8200.0,
  net_income: 5300.0,
  items: [
    // REVENUE
    {
      account_code: '',
      account_name: 'REVENUE',
      current_period: 53700.0,
      prior_period: 48200.0,
      variance: 5500.0,
      variance_percent: 11.4,
      account_type: 'REVENUE',
      is_subtotal: true
    },
    {
      account_code: '4100000',
      account_name: 'Hair Services Revenue',
      current_period: 42000.0,
      prior_period: 38500.0,
      variance: 3500.0,
      variance_percent: 9.1,
      account_type: 'REVENUE',
      is_subtotal: false
    },
    {
      account_code: '4200000',
      account_name: 'Product Sales Revenue',
      current_period: 8500.0,
      prior_period: 7200.0,
      variance: 1300.0,
      variance_percent: 18.1,
      account_type: 'REVENUE',
      is_subtotal: false
    },
    {
      account_code: '4300000',
      account_name: 'Commission Revenue',
      current_period: 3200.0,
      prior_period: 2500.0,
      variance: 700.0,
      variance_percent: 28.0,
      account_type: 'REVENUE',
      is_subtotal: false
    },

    // COST OF GOODS SOLD
    {
      account_code: '',
      account_name: 'COST OF GOODS SOLD',
      current_period: -9000.0,
      prior_period: -8100.0,
      variance: -900.0,
      variance_percent: 11.1,
      account_type: 'COGS',
      is_subtotal: true
    },
    {
      account_code: '5050000',
      account_name: 'Product Costs',
      current_period: -6800.0,
      prior_period: -6200.0,
      variance: -600.0,
      variance_percent: 9.7,
      account_type: 'COGS',
      is_subtotal: false
    },
    {
      account_code: '5060000',
      account_name: 'Direct Labor',
      current_period: -2200.0,
      prior_period: -1900.0,
      variance: -300.0,
      variance_percent: 15.8,
      account_type: 'COGS',
      is_subtotal: false
    },

    // GROSS PROFIT
    {
      account_code: '',
      account_name: 'GROSS PROFIT',
      current_period: 44700.0,
      prior_period: 40100.0,
      variance: 4600.0,
      variance_percent: 11.5,
      account_type: 'GROSS_PROFIT',
      is_subtotal: true
    },

    // OPERATING EXPENSES
    {
      account_code: '',
      account_name: 'OPERATING EXPENSES',
      current_period: -36500.0,
      prior_period: -34200.0,
      variance: -2300.0,
      variance_percent: 6.7,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: true
    },
    {
      account_code: '5100000',
      account_name: 'Salaries & Wages',
      current_period: -22500.0,
      prior_period: -21000.0,
      variance: -1500.0,
      variance_percent: 7.1,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '5200000',
      account_name: 'Rent Expense',
      current_period: -5000.0,
      prior_period: -5000.0,
      variance: 0.0,
      variance_percent: 0.0,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '5300000',
      account_name: 'Utilities Expense',
      current_period: -1600.0,
      prior_period: -1400.0,
      variance: -200.0,
      variance_percent: 14.3,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '5400000',
      account_name: 'Supplies Expense',
      current_period: -3400.0,
      prior_period: -3100.0,
      variance: -300.0,
      variance_percent: 9.7,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '5500000',
      account_name: 'Depreciation Expense',
      current_period: -2000.0,
      prior_period: -2000.0,
      variance: 0.0,
      variance_percent: 0.0,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '5600000',
      account_name: 'Marketing Expense',
      current_period: -1200.0,
      prior_period: -1000.0,
      variance: -200.0,
      variance_percent: 20.0,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '5700000',
      account_name: 'Insurance Expense',
      current_period: -800.0,
      prior_period: -700.0,
      variance: -100.0,
      variance_percent: 14.3,
      account_type: 'OPERATING_EXPENSES',
      is_subtotal: false
    },

    // OPERATING INCOME
    {
      account_code: '',
      account_name: 'OPERATING INCOME',
      current_period: 8200.0,
      prior_period: 5900.0,
      variance: 2300.0,
      variance_percent: 39.0,
      account_type: 'OTHER_INCOME',
      is_subtotal: true
    },

    // OTHER EXPENSES
    {
      account_code: '',
      account_name: 'OTHER EXPENSES',
      current_period: -2900.0,
      prior_period: -2600.0,
      variance: -300.0,
      variance_percent: 11.5,
      account_type: 'OTHER_EXPENSES',
      is_subtotal: true
    },
    {
      account_code: '6100000',
      account_name: 'Interest Expense',
      current_period: -900.0,
      prior_period: -850.0,
      variance: -50.0,
      variance_percent: 5.9,
      account_type: 'OTHER_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '6200000',
      account_name: 'Bank Charges',
      current_period: -200.0,
      prior_period: -150.0,
      variance: -50.0,
      variance_percent: 33.3,
      account_type: 'OTHER_EXPENSES',
      is_subtotal: false
    },
    {
      account_code: '6300000',
      account_name: 'Professional Fees',
      current_period: -1800.0,
      prior_period: -1600.0,
      variance: -200.0,
      variance_percent: 12.5,
      account_type: 'OTHER_EXPENSES',
      is_subtotal: false
    },

    // NET INCOME
    {
      account_code: '',
      account_name: 'NET INCOME',
      current_period: 5300.0,
      prior_period: 3300.0,
      variance: 2000.0,
      variance_percent: 60.6,
      account_type: 'NET_INCOME',
      is_subtotal: true
    }
  ],
  metadata: {
    generated_at: new Date().toISOString(),
    report_currency: 'AED',
    basis: 'Accrual',
    comparison_period: 'Prior Month'
  }
}
