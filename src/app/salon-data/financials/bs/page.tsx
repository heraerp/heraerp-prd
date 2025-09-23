'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Salon Balance Sheet (Classified & Comparative)
 * Smart Code: HERA.FINANCE.BS.REPORT.v1
 *
 * Classified balance sheet with current/non-current breakdown
 * Built on 6-table foundation with smart code intelligence
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { handleError } from '@/lib/salon/error-handler'
import type { BranchType, DateSelectionType, ExportFormat } from '@/types/salon.types'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Download,
  Printer,
  RefreshCw,
  Filter,
  Building,
  Globe,
  DollarSign,
  Percent,
  BarChart3,
  PieChart,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Scale,
  Wallet,
  Landmark,
  BadgeDollarSign,
  Calculator,
  CircleDollarSign,
  Receipt,
  CreditCard,
  Banknote,
  PiggyBank,
  HandCoins
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface BalanceSheetLine {
  section: 'ASSET' | 'LIABILITY' | 'EQUITY'
  subsection: 'CURRENT' | 'NON_CURRENT' | 'N/A'
  label: string
  amount: number
  compareAmount?: number
  variance?: number
  variancePercent?: number
  isSubtotal?: boolean
  isTotal?: boolean
  isSectionTotal?: boolean
  indent?: number
  evidence?: Array<{
    transaction_id: string
    line_number: number
  }>
}

interface BalanceSheetReport {
  header: {
    organization_id: string
    organization_name: string
    as_of_date: string
    compare_to_date?: string
    currency: string
    report_date: string
    presentation: 'CLASSIFIED' | 'UNCLASSIFIED'
    consolidation_type: 'BRANCH' | 'CONSOLIDATED'
  }
  lines: BalanceSheetLine[]
  totals: {
    total_assets: number
    total_current_assets: number
    total_non_current_assets: number
    total_liabilities: number
    total_current_liabilities: number
    total_non_current_liabilities: number
    total_equity: number
    tie_check: boolean
  }
  kpis: {
    current_ratio: number
    quick_ratio: number
    debt_to_equity: number
    working_capital: number
    equity_ratio: number
  }
}

// ----------------------------- Mock Data Generation ------------------------------------

const generateMockBalanceSheetData = (
  asOfDate: string,
  compareDate?: string,
  branch?: string
): BalanceSheetReport => {
  // Generate realistic balance sheet data for a salon
  const isComparative = !!compareDate

  // Assets - Current
  const cashAndEquivalents = 125000
  const accountsReceivable = 35000
  const inventory = 28000
  const prepaidExpenses = 12000
  const totalCurrentAssets = cashAndEquivalents + accountsReceivable + inventory + prepaidExpenses

  // Assets - Non-Current
  const furnitureFixtures = 180000
  const accumulatedDepFF = -45000
  const netFurnitureFixtures = furnitureFixtures + accumulatedDepFF
  const leaseholdImprovements = 95000
  const accumulatedDepLI = -25000
  const netLeaseholdImprovements = leaseholdImprovements + accumulatedDepLI
  const equipmentTools = 120000
  const accumulatedDepET = -30000
  const netEquipmentTools = equipmentTools + accumulatedDepET
  const rightOfUseAsset = 150000
  const securityDeposits = 15000
  const totalNonCurrentAssets =
    netFurnitureFixtures +
    netLeaseholdImprovements +
    netEquipmentTools +
    rightOfUseAsset +
    securityDeposits

  const totalAssets = totalCurrentAssets + totalNonCurrentAssets

  // Liabilities - Current
  const accountsPayable = 42000
  const accruedExpenses = 18000
  const unearnedRevenue = 12000
  const currentPortionLease = 36000
  const vatPayable = 8500
  const totalCurrentLiabilities =
    accountsPayable + accruedExpenses + unearnedRevenue + currentPortionLease + vatPayable

  // Liabilities - Non-Current
  const leaseObligations = 114000
  const longTermDebt = 50000
  const totalNonCurrentLiabilities = leaseObligations + longTermDebt

  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities

  // Equity
  const shareCapital = 100000
  const retainedEarnings = 283500
  const currentYearProfit = 89000
  const totalEquity = shareCapital + retainedEarnings + currentYearProfit

  // Generate comparison amounts (10% growth)
  const growthFactor = 0.9

  // Calculate KPIs
  const currentRatio = totalCurrentAssets / totalCurrentLiabilities
  const quickRatio = (totalCurrentAssets - inventory) / totalCurrentLiabilities
  const debtToEquity = totalLiabilities / totalEquity
  const workingCapital = totalCurrentAssets - totalCurrentLiabilities
  const equityRatio = totalEquity / totalAssets

  const report: BalanceSheetReport = {
    header: {
      organization_id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      organization_name: branch || 'Hair Talkz • Consolidated',
      as_of_date: asOfDate,
      compare_to_date: compareDate,
      currency: 'AED',
      report_date: new Date().toISOString(),
      presentation: 'CLASSIFIED',
      consolidation_type: branch ? 'BRANCH' : 'CONSOLIDATED'
    },
    lines: [
      // ASSETS Section
      {
        section: 'ASSET',
        subsection: 'N/A',
        label: 'ASSETS',
        amount: totalAssets,
        compareAmount: isComparative ? totalAssets * growthFactor : undefined,
        isSectionTotal: true
      },

      // Current Assets
      {
        section: 'ASSET',
        subsection: 'CURRENT',
        label: 'Current Assets',
        amount: totalCurrentAssets,
        compareAmount: isComparative ? totalCurrentAssets * growthFactor : undefined,
        isSubtotal: true
      },
      {
        section: 'ASSET',
        subsection: 'CURRENT',
        label: 'Cash and Cash Equivalents',
        amount: cashAndEquivalents,
        compareAmount: isComparative ? cashAndEquivalents * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'ASSET',
        subsection: 'CURRENT',
        label: 'Accounts Receivable',
        amount: accountsReceivable,
        compareAmount: isComparative ? accountsReceivable * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'ASSET',
        subsection: 'CURRENT',
        label: 'Inventory',
        amount: inventory,
        compareAmount: isComparative ? inventory * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'ASSET',
        subsection: 'CURRENT',
        label: 'Prepaid Expenses',
        amount: prepaidExpenses,
        compareAmount: isComparative ? prepaidExpenses * growthFactor : undefined,
        indent: 1
      },

      // Non-Current Assets
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: 'Non-Current Assets',
        amount: totalNonCurrentAssets,
        compareAmount: isComparative ? totalNonCurrentAssets * growthFactor : undefined,
        isSubtotal: true
      },
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: 'Property, Plant & Equipment (Net)',
        amount: netFurnitureFixtures + netLeaseholdImprovements + netEquipmentTools,
        compareAmount: isComparative
          ? (netFurnitureFixtures + netLeaseholdImprovements + netEquipmentTools) * growthFactor
          : undefined,
        indent: 1
      },
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: '  Furniture & Fixtures',
        amount: netFurnitureFixtures,
        compareAmount: isComparative ? netFurnitureFixtures * growthFactor : undefined,
        indent: 2
      },
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: '  Leasehold Improvements',
        amount: netLeaseholdImprovements,
        compareAmount: isComparative ? netLeaseholdImprovements * growthFactor : undefined,
        indent: 2
      },
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: '  Equipment & Tools',
        amount: netEquipmentTools,
        compareAmount: isComparative ? netEquipmentTools * growthFactor : undefined,
        indent: 2
      },
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: 'Right-of-Use Assets',
        amount: rightOfUseAsset,
        compareAmount: isComparative ? rightOfUseAsset * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'ASSET',
        subsection: 'NON_CURRENT',
        label: 'Security Deposits',
        amount: securityDeposits,
        compareAmount: isComparative ? securityDeposits * growthFactor : undefined,
        indent: 1
      },

      // Total Assets
      {
        section: 'ASSET',
        subsection: 'N/A',
        label: 'TOTAL ASSETS',
        amount: totalAssets,
        compareAmount: isComparative ? totalAssets * growthFactor : undefined,
        isTotal: true
      },

      // LIABILITIES Section
      {
        section: 'LIABILITY',
        subsection: 'N/A',
        label: 'LIABILITIES',
        amount: totalLiabilities,
        compareAmount: isComparative ? totalLiabilities * growthFactor : undefined,
        isSectionTotal: true
      },

      // Current Liabilities
      {
        section: 'LIABILITY',
        subsection: 'CURRENT',
        label: 'Current Liabilities',
        amount: totalCurrentLiabilities,
        compareAmount: isComparative ? totalCurrentLiabilities * growthFactor : undefined,
        isSubtotal: true
      },
      {
        section: 'LIABILITY',
        subsection: 'CURRENT',
        label: 'Accounts Payable',
        amount: accountsPayable,
        compareAmount: isComparative ? accountsPayable * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'LIABILITY',
        subsection: 'CURRENT',
        label: 'Accrued Expenses',
        amount: accruedExpenses,
        compareAmount: isComparative ? accruedExpenses * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'LIABILITY',
        subsection: 'CURRENT',
        label: 'Unearned Revenue',
        amount: unearnedRevenue,
        compareAmount: isComparative ? unearnedRevenue * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'LIABILITY',
        subsection: 'CURRENT',
        label: 'Current Portion of Lease Liability',
        amount: currentPortionLease,
        compareAmount: isComparative ? currentPortionLease * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'LIABILITY',
        subsection: 'CURRENT',
        label: 'VAT Payable',
        amount: vatPayable,
        compareAmount: isComparative ? vatPayable * growthFactor : undefined,
        indent: 1
      },

      // Non-Current Liabilities
      {
        section: 'LIABILITY',
        subsection: 'NON_CURRENT',
        label: 'Non-Current Liabilities',
        amount: totalNonCurrentLiabilities,
        compareAmount: isComparative ? totalNonCurrentLiabilities * growthFactor : undefined,
        isSubtotal: true
      },
      {
        section: 'LIABILITY',
        subsection: 'NON_CURRENT',
        label: 'Lease Obligations',
        amount: leaseObligations,
        compareAmount: isComparative ? leaseObligations * growthFactor : undefined,
        indent: 1
      },
      {
        section: 'LIABILITY',
        subsection: 'NON_CURRENT',
        label: 'Long-term Debt',
        amount: longTermDebt,
        compareAmount: isComparative ? longTermDebt * growthFactor : undefined,
        indent: 1
      },

      // Total Liabilities
      {
        section: 'LIABILITY',
        subsection: 'N/A',
        label: 'TOTAL LIABILITIES',
        amount: totalLiabilities,
        compareAmount: isComparative ? totalLiabilities * growthFactor : undefined,
        isTotal: true
      },

      // EQUITY Section
      {
        section: 'EQUITY',
        subsection: 'N/A',
        label: 'EQUITY',
        amount: totalEquity,
        compareAmount: isComparative ? totalEquity * growthFactor : undefined,
        isSectionTotal: true
      },
      {
        section: 'EQUITY',
        subsection: 'N/A',
        label: 'Share Capital',
        amount: shareCapital,
        compareAmount: isComparative ? shareCapital : undefined, // Share capital usually doesn't change
        indent: 1
      },
      {
        section: 'EQUITY',
        subsection: 'N/A',
        label: 'Retained Earnings',
        amount: retainedEarnings,
        compareAmount: isComparative ? retainedEarnings * 0.8 : undefined,
        indent: 1
      },
      {
        section: 'EQUITY',
        subsection: 'N/A',
        label: 'Current Year Profit',
        amount: currentYearProfit,
        compareAmount: isComparative ? currentYearProfit * 0.85 : undefined,
        indent: 1
      },

      // Total Equity
      {
        section: 'EQUITY',
        subsection: 'N/A',
        label: 'TOTAL EQUITY',
        amount: totalEquity,
        compareAmount: isComparative ? totalEquity * growthFactor : undefined,
        isTotal: true
      },

      // Total Liabilities & Equity
      {
        section: 'EQUITY',
        subsection: 'N/A',
        label: 'TOTAL LIABILITIES & EQUITY',
        amount: totalLiabilities + totalEquity,
        compareAmount: isComparative ? (totalLiabilities + totalEquity) * growthFactor : undefined,
        isTotal: true
      }
    ],
    totals: {
      total_assets: totalAssets,
      total_current_assets: totalCurrentAssets,
      total_non_current_assets: totalNonCurrentAssets,
      total_liabilities: totalLiabilities,
      total_current_liabilities: totalCurrentLiabilities,
      total_non_current_liabilities: totalNonCurrentLiabilities,
      total_equity: totalEquity,
      tie_check: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    },
    kpis: {
      current_ratio: currentRatio,
      quick_ratio: quickRatio,
      debt_to_equity: debtToEquity,
      working_capital: workingCapital,
      equity_ratio: equityRatio
    }
  }

  // Calculate variances if comparative
  if (isComparative) {
    report.lines.forEach(line => {
      if (line.compareAmount !== undefined) {
        line.variance = line.amount - line.compareAmount
        line.variancePercent =
          line.compareAmount !== 0
            ? ((line.amount - line.compareAmount) / line.compareAmount) * 100
            : 0
      }
    })
  }

  return report
}

// ----------------------------- Helper Functions ------------------------------------

const formatCurrency = (amount: number, currency: string = 'AED'): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatRatio = (value: number): string => {
  return value.toFixed(2)
}

const getVarianceIcon = (variance: number) => {
  if (variance > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
  if (variance < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

const getSectionIcon = (section: string) => {
  switch (section) {
    case 'ASSET':
      return <Wallet className="w-5 h-5 text-emerald-600" />
    case 'LIABILITY':
      return <CreditCard className="w-5 h-5 text-orange-600" />
    case 'EQUITY':
      return <PiggyBank className="w-5 h-5 text-primary" />
    default:
      return <CircleDollarSign className="w-5 h-5 text-muted-foreground" />
  }
}

const getSectionColor = (section: string) => {
  const colors = {
    ASSET: 'text-emerald-600',
    LIABILITY: 'text-orange-600',
    EQUITY: 'text-primary'
  }
  return colors[section as keyof typeof colors] || 'text-gray-100'
}

// ----------------------------- Main Component ------------------------------------

export default function SalonBalanceSheetPage() {
  const { currentOrganization, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<
    'current' | 'prior_month' | 'prior_year' | 'custom'
  >('current')
  const [showComparison, setShowComparison] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'branch1' | 'branch2'>('all')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['ASSET', 'LIABILITY', 'EQUITY'])
  )
  const [presentation, setPresentation] = useState<'CLASSIFIED' | 'UNCLASSIFIED'>('CLASSIFIED')

  // Default organization ID for salon - Hair Talkz Park Regis
  const organizationId = currentOrganization?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

  // Calculate dates
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const getAsOfDate = () => {
    switch (selectedDate) {
      case 'current':
        return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      case 'prior_month':
        const priorMonth = new Date(currentYear, currentMonth, 0)
        return `${priorMonth.getFullYear()}-${String(priorMonth.getMonth() + 1).padStart(2, '0')}-${String(priorMonth.getDate()).padStart(2, '0')}`
      case 'prior_year':
        return `${currentYear - 1}-12-31`
      default:
        return `${currentYear}-12-31`
    }
  }

  const asOfDate = getAsOfDate()
  const compareDate = showComparison ? `${currentYear - 1}-${asOfDate.substring(5)}` : undefined

  // Generate mock data
  const balanceSheet = generateMockBalanceSheetData(
    asOfDate,
    compareDate,
    selectedBranch === 'all'
      ? undefined
      : selectedBranch === 'branch1'
        ? 'Hair Talkz • Park Regis'
        : 'Hair Talkz • Mercure Gold'
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const exportReport = async (format: ExportFormat) => {
    // In production, this would generate actual PDF/CSV
    handleError(new Error('Export functionality not yet implemented'), 'bs-export', {
      showToast: true,
      fallbackMessage: `Export to ${format.toUpperCase()} will be available soon`
    })
  }

  const runBalanceCheck = () => {
    // Check if Assets = Liabilities + Equity
    const isBalanced = balanceSheet.totals.tie_check
    handleError(
      new Error(
        isBalanced
          ? '✓ Balance Sheet is balanced! Assets = Liabilities + Equity'
          : '⚠ Balance Sheet is NOT balanced! Please review entries.'
      ),
      'bs-balance-check',
      {
        showToast: true,
        fallbackMessage: isBalanced
          ? '✓ Balance Sheet is balanced!'
          : '⚠ Balance Sheet is NOT balanced!'
      }
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground">
            Loading balance sheet data...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground flex items-center gap-2">
              <Scale className="w-8 h-8 text-purple-600" />
              Balance Sheet
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Statement of Financial Position (Classified)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={runBalanceCheck}
              className="bg-background dark:bg-muted"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Check Balance
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('pdf')}
              className="bg-background dark:bg-muted"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={() => exportReport('csv')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="bg-background dark:bg-muted border-border dark:border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  As of Date
                </label>
                <div className="flex gap-1">
                  {(['current', 'prior_month', 'prior_year'] as const).map(date => (
                    <Button
                      key={date}
                      variant={selectedDate === date ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'flex-1 text-xs',
                        selectedDate === date
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground'
                          : ''
                      )}
                    >
                      {date === 'current'
                        ? 'Current'
                        : date === 'prior_month'
                          ? 'Prior Mo'
                          : 'Prior Yr'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-muted-foreground/10 text-gray-100 dark:text-foreground"
                >
                  <option value="all">All Branches (Consolidated)</option>
                  <option value="branch1">Park Regis Kris Kin</option>
                  <option value="branch2">Mercure Gold</option>
                </select>
              </div>

              {/* Presentation */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Presentation
                </label>
                <div className="flex gap-1">
                  <Button
                    variant={presentation === 'CLASSIFIED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPresentation('CLASSIFIED')}
                    className={cn(
                      'flex-1',
                      presentation === 'CLASSIFIED'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground'
                        : ''
                    )}
                  >
                    Classified
                  </Button>
                  <Button
                    variant={presentation === 'UNCLASSIFIED' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPresentation('UNCLASSIFIED')}
                    className={cn(
                      'flex-1',
                      presentation === 'UNCLASSIFIED'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground'
                        : ''
                    )}
                  >
                    Simple
                  </Button>
                </div>
              </div>

              {/* Comparison Toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Comparison
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {showComparison ? 'Hide' : 'Show'} Prior Year
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Total Assets
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatCurrency(balanceSheet.totals.total_assets)}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Working Capital
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatCurrency(balanceSheet.kpis.working_capital)}
                  </p>
                </div>
                <Banknote className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Current Ratio
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatRatio(balanceSheet.kpis.current_ratio)}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {balanceSheet.kpis.current_ratio >= 1.5 ? 'Healthy' : 'Monitor'}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Debt to Equity
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatRatio(balanceSheet.kpis.debt_to_equity)}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {balanceSheet.kpis.debt_to_equity <= 1 ? 'Low Risk' : 'Moderate'}
                  </p>
                </div>
                <Scale className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Equity Ratio
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatPercent(balanceSheet.kpis.equity_ratio * 100)}
                  </p>
                </div>
                <PiggyBank className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance Sheet Table */}
        <Card className="bg-background dark:bg-muted border-border dark:border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Statement of Financial Position
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Globe className="w-3 h-3 mr-1" />
                  {balanceSheet.header.currency}
                </Badge>
                <Badge variant="secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  As of {new Date(asOfDate).toLocaleDateString('en-AE')}
                </Badge>
                {balanceSheet.totals.tie_check ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Balanced
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unbalanced
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted dark:bg-background border-y border-border dark:border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Account
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(asOfDate).toLocaleDateString('en-AE', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </th>
                    {showComparison && (
                      <>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {compareDate &&
                            new Date(compareDate).toLocaleDateString('en-AE', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                        </th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Variance
                        </th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          %
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {balanceSheet.lines.map((line, index) => {
                    const isSection = line.isSectionTotal
                    const shouldShow =
                      presentation === 'UNCLASSIFIED'
                        ? !line.indent ||
                          line.indent === 1 ||
                          line.isTotal ||
                          line.isSubtotal ||
                          line.isSectionTotal
                        : true

                    if (!shouldShow) return null

                    return (
                      <tr
                        key={index}
                        className={cn(
                          'border-b border-gray-100 dark:border-gray-800',
                          line.isTotal && 'bg-muted dark:bg-background font-bold',
                          line.isSectionTotal && 'bg-muted dark:bg-background font-semibold',
                          line.isSubtotal && 'font-medium',
                          (line.isSubtotal || line.isSectionTotal) &&
                            'cursor-pointer hover:bg-muted dark:hover:bg-background'
                        )}
                        onClick={() =>
                          (line.isSubtotal || line.isSectionTotal) && toggleSection(line.section)
                        }
                      >
                        <td className={cn('px-6 py-3', line.indent && `pl-${6 + line.indent * 4}`)}>
                          <div
                            className={cn('flex items-center gap-2', getSectionColor(line.section))}
                          >
                            {isSection && getSectionIcon(line.section)}
                            {(line.isSubtotal || line.isSectionTotal) &&
                              expandedSections.has(line.section) && (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            {(line.isSubtotal || line.isSectionTotal) &&
                              !expandedSections.has(line.section) && (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            {line.label}
                          </div>
                        </td>
                        <td
                          className={cn(
                            'text-right px-6 py-3',
                            line.amount < 0 && 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {formatCurrency(Math.abs(line.amount))}
                        </td>
                        {showComparison && (
                          <>
                            <td className="text-right px-6 py-3 text-muted-foreground dark:text-muted-foreground">
                              {line.compareAmount !== undefined
                                ? formatCurrency(Math.abs(line.compareAmount))
                                : '-'}
                            </td>
                            <td
                              className={cn(
                                'text-right px-6 py-3',
                                line.variance && line.variance > 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              )}
                            >
                              {line.variance !== undefined
                                ? formatCurrency(Math.abs(line.variance))
                                : '-'}
                            </td>
                            <td className="text-right px-6 py-3">
                              {line.variancePercent !== undefined ? (
                                <div className="flex items-center justify-end gap-1">
                                  {getVarianceIcon(line.variance || 0)}
                                  <span
                                    className={cn(
                                      line.variance && line.variance > 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    )}
                                  >
                                    {formatPercent(Math.abs(line.variancePercent))}
                                  </span>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Financial Health Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Liquidity Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground dark:text-muted-foreground">
                    Current Assets
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheet.totals.total_current_assets)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground dark:text-muted-foreground">
                    Current Liabilities
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheet.totals.total_current_liabilities)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Working Capital</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(balanceSheet.kpis.working_capital)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Current Ratio</span>
                    <span
                      className={cn(
                        'font-bold',
                        balanceSheet.kpis.current_ratio >= 1.5
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      )}
                    >
                      {formatRatio(balanceSheet.kpis.current_ratio)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Quick Ratio</span>
                    <span
                      className={cn(
                        'font-bold',
                        balanceSheet.kpis.quick_ratio >= 1 ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {formatRatio(balanceSheet.kpis.quick_ratio)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Capital Structure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground dark:text-muted-foreground">
                    Total Debt
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheet.totals.total_liabilities)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground dark:text-muted-foreground">
                    Total Equity
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheet.totals.total_equity)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Debt-to-Equity</span>
                    <span
                      className={cn(
                        'font-bold',
                        balanceSheet.kpis.debt_to_equity <= 1 ? 'text-green-600' : 'text-yellow-600'
                      )}
                    >
                      {formatRatio(balanceSheet.kpis.debt_to_equity)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Equity Ratio</span>
                    <span className="font-bold text-primary">
                      {formatPercent(balanceSheet.kpis.equity_ratio * 100)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {balanceSheet.header.organization_name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Dubai, UAE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Generated: {new Date(balanceSheet.header.report_date).toLocaleString('en-AE')}
            </span>
            <Badge variant="secondary" className="text-xs">
              {balanceSheet.header.consolidation_type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {balanceSheet.header.presentation}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
