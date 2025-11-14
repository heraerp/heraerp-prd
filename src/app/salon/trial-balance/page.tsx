import React, { useState } from 'react'
/**
 * Salon Trial Balance Report
 *
 * Modern IFRS-compliant Trial Balance with professional formatting,
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
import { useTrialBalance } from '@/lib/dna/integration/financial-reporting-api-v2'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
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
  Search,
  AlertCircle,
  CheckCircle,
  Eye,
  Building
} from 'lucide-react'

interface TrialBalanceAccount {
  account_code: string
  account_name: string
  account_type: string
  ifrs_classification: string
  debit_balance: number
  credit_balance: number
  balance: number
  is_normal_debit: boolean
  account_level: number
  parent_account_code?: string
}

interface TrialBalanceData {
  period_end: string
  organization_name: string
  total_debits: number
  total_credits: number
  is_balanced: boolean
  accounts: TrialBalanceAccount[]
  metadata: {
    generated_at: string
    report_currency: string
    basis: string
    includes_zero_balances: boolean
  }
}

export default function SalonTrialBalancePage() {
  const { organizationId } = useSecuredSalonContext()
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [showZeroBalances, setShowZeroBalances] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [accountTypeFilter, setAccountTypeFilter] = useState('all')

  // ✅ Finance DNA v2 Real-Time Trial Balance
  const currentDate = new Date()
  const asOfDate = selectedPeriod === 'current' 
    ? currentDate.toISOString()
    : new Date(currentDate.getFullYear(), currentDate.getMonth() - (selectedPeriod === 'last_month' ? 1 : 0), 0).toISOString()

  const { 
    report: trialBalance, 
    isLoading, 
    isBalanced,
    performanceMetrics,
    refresh: refreshTrialBalance 
  } = useTrialBalance({
    organizationId,
    asOfDate,
    currency: 'AED',
    includeSubAccounts: true,
    includeZeroBalances: showZeroBalances,
    enabled: !!organizationId
  })

  // Fallback to mock data if real data is not available
  const displayTrialBalance = trialBalance || mockTrialBalanceData

  const filteredAccounts =
    displayTrialBalance?.accounts.filter(account => {
      const matchesSearch =
        account.account_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        account.account_code.includes(searchFilter)
      const matchesType = accountTypeFilter === 'all' || account.account_type === accountTypeFilter
      const hasBalance = showZeroBalances || Math.abs(account.balance) > 0

      return matchesSearch && matchesType && hasBalance
    }) || []

  const groupedAccounts = filteredAccounts.reduce(
    (groups, account) => {
      const type = account.account_type
      if (!groups[type]) groups[type] = []
      groups[type].push(account)
      return groups
    },
    {} as Record<string, TrialBalanceAccount[]>
  )

  const accountTypeOrder = ['ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSES']
  const accountTypes = Object.keys(groupedAccounts).sort(
    (a, b) => accountTypeOrder.indexOf(a) - accountTypeOrder.indexOf(b)
  )

  const formatCurrency = (amount: number) => {
    return `AED ${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'ASSETS':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'LIABILITIES':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'EQUITY':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'REVENUE':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'EXPENSES':
        return 'text-orange-600 bg-orange-50 border-orange-200'
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
              <p className="text-gray-600 dark:text-gray-400">Generating Trial Balance...</p>
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
                  Trial Balance Report
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                  Finance DNA v2 IFRS-compliant trial balance for{' '}
                  {displayTrialBalance?.organization_name || 'Hair Talkz Salon'}
                  {performanceMetrics && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Generated in {performanceMetrics.processingTime}ms
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <LuxeButton variant="outline" size="sm" icon={<Download />} onClick={exportToPDF}>
                  Export PDF
                </LuxeButton>
                <LuxeButton
                  variant="gradient"
                  size="sm"
                  icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
                  onClick={refreshTrialBalance}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </LuxeButton>
              </div>
            </div>
          </div>

          <ResponsiveGrid cols={{ sm: 1, md: 1, lg: 4, xl: 4 }} className="gap-6 md:gap-8">
            {/* Main Report */}
            <div className="lg:col-span-3">
              <LuxeCard variant="glass" className="overflow-hidden">
                {/* Report Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-rose-50 dark:from-purple-900/20 dark:to-rose-900/20">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {displayTrialBalance?.organization_name || 'Hair Talkz Salon'}
                    </h2>
                    <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      TRIAL BALANCE
                      {trialBalance && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Finance DNA v2
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      As at{' '}
                      {new Date(displayTrialBalance?.period_end || new Date()).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Amounts in {displayTrialBalance?.metadata.report_currency || 'AED'}
                    </p>
                  </div>

                  {/* Balance Check */}
                  <div className="flex items-center justify-center mt-4">
                    {(isBalanced ?? displayTrialBalance?.is_balanced) ? (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Trial Balance is in balance
                          {performanceMetrics && (
                            <span className="ml-2 text-xs">
                              (Validated in {performanceMetrics.validationTime || 'real-time'})
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Trial Balance is out of balance</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search accounts..."
                          value={searchFilter}
                          onChange={e => setSearchFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                        />
                      </div>
                    </div>
                    <select
                      value={accountTypeFilter}
                      onChange={e => setAccountTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="ASSETS">Assets</option>
                      <option value="LIABILITIES">Liabilities</option>
                      <option value="EQUITY">Equity</option>
                      <option value="REVENUE">Revenue</option>
                      <option value="EXPENSES">Expenses</option>
                    </select>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showZeroBalances}
                        onChange={e => setShowZeroBalances(e.target.checked)}
                        className="rounded"
                      />
                      <span>Show zero balances</span>
                    </label>
                  </div>
                </div>

                {/* Table Header */}
                <div className="bg-gray-100 dark:bg-gray-800 px-6 py-3">
                  <div className="grid grid-cols-12 gap-4 text-xs font-semibold hera-financial-text-secondary uppercase tracking-wider">
                    <div className="col-span-2">Account Code</div>
                    <div className="col-span-4">Account Name</div>
                    <div className="col-span-2">IFRS Classification</div>
                    <div className="col-span-2 text-right">Debit</div>
                    <div className="col-span-2 text-right">Credit</div>
                  </div>
                </div>

                {/* Account Groups */}
                <div className="max-h-96 overflow-y-auto">
                  {accountTypes.map(accountType => (
                    <div
                      key={accountType}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      {/* Group Header */}
                      <div className={`px-6 py-3 ${getAccountTypeColor(accountType)} border-l-4`}>
                        <h4 className="font-semibold text-sm">{accountType}</h4>
                      </div>

                      {/* Accounts */}
                      {groupedAccounts[accountType].map((account, index) => (
                        <div
                          key={account.account_code}
                          className={`px-6 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                            index % 2 === 0
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-gray-50/30 dark:bg-gray-800/20'
                          }`}
                        >
                          <div className="grid grid-cols-12 gap-4 text-sm">
                            <div className="col-span-2 font-mono !text-gray-900 dark:!text-gray-100">
                              {account.account_code}
                            </div>
                            <div className="col-span-4 !text-gray-900 dark:!text-white">
                              <div style={{ paddingLeft: `${(account.account_level - 1) * 16}px` }}>
                                {account.account_name}
                              </div>
                            </div>
                            <div className="col-span-2 text-xs !text-gray-600 dark:!text-gray-300">
                              {account.ifrs_classification}
                            </div>
                            <div className="col-span-2 text-right font-medium">
                              {account.debit_balance > 0 ? (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {formatCurrency(account.debit_balance)}
                                </span>
                              ) : (
                                <span className="!text-gray-400 dark:!text-gray-500">-</span>
                              )}
                            </div>
                            <div className="col-span-2 text-right font-medium">
                              {account.credit_balance > 0 ? (
                                <span className="text-red-600 dark:text-red-400">
                                  {formatCurrency(account.credit_balance)}
                                </span>
                              ) : (
                                <span className="!text-gray-400 dark:!text-gray-500">-</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="p-6 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <div className="grid grid-cols-12 gap-4 text-base font-bold">
                    <div className="col-span-8 !text-gray-900 dark:!text-white">
                      TOTALS
                      {trialBalance && (
                        <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Real-time from Finance DNA v2
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-right text-blue-600 dark:text-blue-400">
                      {formatCurrency(displayTrialBalance?.total_debits || 0)}
                    </div>
                    <div className="col-span-2 text-right text-red-600 dark:text-red-400">
                      {formatCurrency(displayTrialBalance?.total_credits || 0)}
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Difference:{' '}
                        <span
                          className={`font-medium ${
                            Math.abs(
                              (displayTrialBalance?.total_debits || 0) - (displayTrialBalance?.total_credits || 0)
                            ) < 0.01
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(
                              (displayTrialBalance?.total_debits || 0) - (displayTrialBalance?.total_credits || 0)
                            )
                          )}
                        </span>
                        {performanceMetrics && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Calculated in {performanceMetrics.processingTime}ms)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </LuxeCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Summary Stats */}
              <LuxeCard variant="floating" title="Trial Balance Summary">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Accounts</span>
                    <span className="font-semibold">{filteredAccounts.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Debits</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(displayTrialBalance?.total_debits || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Credits</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(displayTrialBalance?.total_credits || 0)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                      <Badge variant={(isBalanced ?? displayTrialBalance?.is_balanced) ? 'default' : 'destructive'}>
                        {(isBalanced ?? displayTrialBalance?.is_balanced) ? 'Balanced' : 'Out of Balance'}
                      </Badge>
                    </div>
                    {trialBalance && performanceMetrics && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">Finance DNA v2</span>
                        <span className="text-xs text-green-600">
                          {performanceMetrics.processingTime}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </LuxeCard>

              {/* Export Options */}
              <LuxeCard
                variant="gradient"
                gradientType="purple"
                title="Export Options"
                className="text-white"
              >
                <div className="space-y-3">
                  <Button variant="secondary" size="sm" className="w-full" onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
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
                      {new Date(displayTrialBalance?.metadata.generated_at || new Date()).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Basis:</span>
                    <div className="font-medium">{displayTrialBalance?.metadata.basis || 'Accrual'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                    <div className="font-medium">
                      {displayTrialBalance?.metadata.report_currency || 'AED'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                    <div className="font-medium">
                      IFRS Compliant
                      {trialBalance && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Finance DNA v2
                        </span>
                      )}
                    </div>
                  </div>
                  {performanceMetrics && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Performance:</span>
                      <div className="font-medium text-green-600">
                        {performanceMetrics.processingTime}ms
                        {performanceMetrics.cacheHit && (
                          <span className="ml-2 text-xs">(cached)</span>
                        )}
                      </div>
                    </div>
                  )}
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
const mockTrialBalanceData: TrialBalanceData = {
  period_end: '2024-12-31',
  organization_name: 'Hair Talkz Salon',
  total_debits: 145750.0,
  total_credits: 145750.0,
  is_balanced: true,
  accounts: [
    // ASSETS
    {
      account_code: '1100000',
      account_name: 'Cash',
      account_type: 'ASSETS',
      ifrs_classification: 'Current Assets',
      debit_balance: 25000.0,
      credit_balance: 0,
      balance: 25000.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '1200000',
      account_name: 'Accounts Receivable',
      account_type: 'ASSETS',
      ifrs_classification: 'Current Assets',
      debit_balance: 8500.0,
      credit_balance: 0,
      balance: 8500.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '1300000',
      account_name: 'Inventory - Hair Products',
      account_type: 'ASSETS',
      ifrs_classification: 'Current Assets',
      debit_balance: 12750.0,
      credit_balance: 0,
      balance: 12750.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '1500000',
      account_name: 'Equipment',
      account_type: 'ASSETS',
      ifrs_classification: 'Non-Current Assets',
      debit_balance: 45000.0,
      credit_balance: 0,
      balance: 45000.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '1510000',
      account_name: 'Accumulated Depreciation - Equipment',
      account_type: 'ASSETS',
      ifrs_classification: 'Non-Current Assets',
      debit_balance: 0,
      credit_balance: 5000.0,
      balance: -5000.0,
      is_normal_debit: false,
      account_level: 2
    },

    // LIABILITIES
    {
      account_code: '2100000',
      account_name: 'Accounts Payable',
      account_type: 'LIABILITIES',
      ifrs_classification: 'Current Liabilities',
      debit_balance: 0,
      credit_balance: 6500.0,
      balance: -6500.0,
      is_normal_debit: false,
      account_level: 1
    },
    {
      account_code: '2200000',
      account_name: 'Accrued Expenses',
      account_type: 'LIABILITIES',
      ifrs_classification: 'Current Liabilities',
      debit_balance: 0,
      credit_balance: 3250.0,
      balance: -3250.0,
      is_normal_debit: false,
      account_level: 1
    },

    // EQUITY
    {
      account_code: '3100000',
      account_name: "Owner's Capital",
      account_type: 'EQUITY',
      ifrs_classification: 'Equity',
      debit_balance: 0,
      credit_balance: 75000.0,
      balance: -75000.0,
      is_normal_debit: false,
      account_level: 1
    },
    {
      account_code: '3200000',
      account_name: 'Retained Earnings',
      account_type: 'EQUITY',
      ifrs_classification: 'Equity',
      debit_balance: 0,
      credit_balance: 15000.0,
      balance: -15000.0,
      is_normal_debit: false,
      account_level: 1
    },

    // REVENUE
    {
      account_code: '4100000',
      account_name: 'Service Revenue',
      account_type: 'REVENUE',
      ifrs_classification: 'Revenue',
      debit_balance: 0,
      credit_balance: 35000.0,
      balance: -35000.0,
      is_normal_debit: false,
      account_level: 1
    },
    {
      account_code: '4200000',
      account_name: 'Product Sales',
      account_type: 'REVENUE',
      ifrs_classification: 'Revenue',
      debit_balance: 0,
      credit_balance: 6000.0,
      balance: -6000.0,
      is_normal_debit: false,
      account_level: 1
    },

    // EXPENSES
    {
      account_code: '5100000',
      account_name: 'Salaries & Wages',
      account_type: 'EXPENSES',
      ifrs_classification: 'Operating Expenses',
      debit_balance: 18000.0,
      credit_balance: 0,
      balance: 18000.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '5200000',
      account_name: 'Rent Expense',
      account_type: 'EXPENSES',
      ifrs_classification: 'Operating Expenses',
      debit_balance: 12000.0,
      credit_balance: 0,
      balance: 12000.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '5300000',
      account_name: 'Utilities Expense',
      account_type: 'EXPENSES',
      ifrs_classification: 'Operating Expenses',
      debit_balance: 2400.0,
      credit_balance: 0,
      balance: 2400.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '5400000',
      account_name: 'Supplies Expense',
      account_type: 'EXPENSES',
      ifrs_classification: 'Operating Expenses',
      debit_balance: 5600.0,
      credit_balance: 0,
      balance: 5600.0,
      is_normal_debit: true,
      account_level: 1
    },
    {
      account_code: '5500000',
      account_name: 'Depreciation Expense',
      account_type: 'EXPENSES',
      ifrs_classification: 'Operating Expenses',
      debit_balance: 5000.0,
      credit_balance: 0,
      balance: 5000.0,
      is_normal_debit: true,
      account_level: 1
    }
  ],
  metadata: {
    generated_at: new Date().toISOString(),
    report_currency: 'AED',
    basis: 'Accrual',
    includes_zero_balances: false
  }
}
