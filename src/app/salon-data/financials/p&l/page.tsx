'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Salon Profit & Loss Statement (Dubai/UAE)
 * Smart Code: HERA.FINANCE.PNL.REPORT.v1
 *
 * VAT-aware P&L reporting with UAE compliance
 * Built on 6-table foundation with smart code intelligence
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RealPnLReport } from '@/components/finance/RealPnLReport'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { handleError } from '@/lib/salon/error-handler'
import type { BranchType, PeriodType, ExportFormat } from '@/types/salon.types'
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
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface PnLLine {
  section:
    | 'REVENUE'
    | 'COGS'
    | 'OPEX'
    | 'OTHER_INCOME'
    | 'OTHER_EXPENSE'
    | 'FINANCE_COST'
    | 'TAX'
    | 'KPI'
  label: string
  amount: number
  percentage?: number
  variance?: number
  variancePercent?: number
  isSubtotal?: boolean
  isTotal?: boolean
  indent?: number
  evidence?: Array<{
    transaction_id: string
    line_number: number
  }>
}

interface PnLReport {
  header: {
    organization_id: string
    organization_name: string
    period_start: string
    period_end: string
    currency: string
    report_date: string
    vat_compliant: boolean
    consolidation_type: 'BRANCH' | 'CONSOLIDATED'
  }
  lines: PnLLine[]
  kpis: {
    revenue_net: number
    cogs: number
    gross_profit: number
    gross_margin: number
    opex: number
    ebitda: number
    ebitda_margin: number
    operating_income: number
    profit_before_tax: number
    income_tax: number
    net_profit: number
    net_margin: number
  }
  vat_summary: {
    vat_on_sales: number
    vat_on_purchases: number
    net_vat_payable: number
  }
}

// ----------------------------- Mock Data Generation ------------------------------------

const generateMockPnLData = (startDate: string, endDate: string, branch?: string): PnLReport => {
  // Generate realistic P&L data for a salon
  const isYTD = startDate.includes('-01-01')
  const monthCount = isYTD ? 8 : 1 // Assuming current month is September

  // Base monthly figures
  const baseServiceRevenue = 180000
  const baseProductRevenue = 45000
  const baseCOGS = 67500
  const baseStaffCost = 90000
  const baseRent = 25000

  // Scale by month count
  const serviceRevenue = baseServiceRevenue * monthCount
  const productRevenue = baseProductRevenue * monthCount
  const totalRevenue = serviceRevenue + productRevenue

  // VAT calculation (5% standard rate in UAE)
  const vatOnSales = totalRevenue * 0.05
  const revenueNetOfVAT = totalRevenue

  // COGS
  const productCost = baseCOGS * monthCount
  const suppliesCost = 22500 * monthCount
  const totalCOGS = productCost + suppliesCost

  // OPEX
  const staffCost = baseStaffCost * monthCount
  const rentExpense = baseRent * monthCount
  const utilities = 8000 * monthCount
  const marketing = 12000 * monthCount
  const insurance = 5000 * monthCount
  const otherOpex = 15000 * monthCount
  const totalOPEX = staffCost + rentExpense + utilities + marketing + insurance + otherOpex

  // Other items
  const interestIncome = 2000 * monthCount
  const miscExpense = 3000 * monthCount
  const financeCost = 4000 * monthCount

  // Calculate KPIs
  const grossProfit = revenueNetOfVAT - totalCOGS
  const grossMargin = (grossProfit / revenueNetOfVAT) * 100
  const ebitda = grossProfit - totalOPEX
  const ebitdaMargin = (ebitda / revenueNetOfVAT) * 100
  const operatingIncome = ebitda // Simplified - no D&A
  const profitBeforeTax = operatingIncome + interestIncome - miscExpense - financeCost
  const incomeTax = 0 // No corporate tax for small business in UAE
  const netProfit = profitBeforeTax - incomeTax
  const netMargin = (netProfit / revenueNetOfVAT) * 100

  // VAT on purchases (input VAT)
  const vatOnPurchases = (totalCOGS + totalOPEX) * 0.05 * 0.6 // Assuming 60% of expenses have VAT

  const report: PnLReport = {
    header: {
      organization_id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      organization_name: branch || 'Hair Talkz • Consolidated',
      period_start: startDate,
      period_end: endDate,
      currency: 'AED',
      report_date: new Date().toISOString(),
      vat_compliant: true,
      consolidation_type: branch ? 'BRANCH' : 'CONSOLIDATED'
    },
    lines: [
      // Revenue Section
      {
        section: 'REVENUE',
        label: 'REVENUE (Net of VAT)',
        amount: revenueNetOfVAT,
        isSubtotal: true
      },
      {
        section: 'REVENUE',
        label: 'Service Revenue',
        amount: serviceRevenue,
        percentage: (serviceRevenue / revenueNetOfVAT) * 100,
        indent: 1
      },
      {
        section: 'REVENUE',
        label: 'Product Sales',
        amount: productRevenue,
        percentage: (productRevenue / revenueNetOfVAT) * 100,
        indent: 1
      },

      // COGS Section
      {
        section: 'COGS',
        label: 'COST OF GOODS SOLD',
        amount: totalCOGS,
        isSubtotal: true
      },
      {
        section: 'COGS',
        label: 'Product Cost',
        amount: productCost,
        percentage: (productCost / totalCOGS) * 100,
        indent: 1
      },
      {
        section: 'COGS',
        label: 'Salon Supplies',
        amount: suppliesCost,
        percentage: (suppliesCost / totalCOGS) * 100,
        indent: 1
      },

      // Gross Profit
      {
        section: 'KPI',
        label: 'GROSS PROFIT',
        amount: grossProfit,
        percentage: grossMargin,
        isTotal: true
      },

      // OPEX Section
      {
        section: 'OPEX',
        label: 'OPERATING EXPENSES',
        amount: totalOPEX,
        isSubtotal: true
      },
      {
        section: 'OPEX',
        label: 'Staff Costs',
        amount: staffCost,
        percentage: (staffCost / totalOPEX) * 100,
        indent: 1
      },
      {
        section: 'OPEX',
        label: 'Rent Expense',
        amount: rentExpense,
        percentage: (rentExpense / totalOPEX) * 100,
        indent: 1
      },
      {
        section: 'OPEX',
        label: 'Utilities',
        amount: utilities,
        percentage: (utilities / totalOPEX) * 100,
        indent: 1
      },
      {
        section: 'OPEX',
        label: 'Marketing & Advertising',
        amount: marketing,
        percentage: (marketing / totalOPEX) * 100,
        indent: 1
      },
      {
        section: 'OPEX',
        label: 'Insurance',
        amount: insurance,
        percentage: (insurance / totalOPEX) * 100,
        indent: 1
      },
      {
        section: 'OPEX',
        label: 'Other Operating Expenses',
        amount: otherOpex,
        percentage: (otherOpex / totalOPEX) * 100,
        indent: 1
      },

      // EBITDA
      {
        section: 'KPI',
        label: 'EBITDA',
        amount: ebitda,
        percentage: ebitdaMargin,
        isTotal: true
      },

      // Operating Income
      {
        section: 'KPI',
        label: 'OPERATING INCOME',
        amount: operatingIncome,
        isTotal: true
      },

      // Other Income/Expense
      {
        section: 'OTHER_INCOME',
        label: 'Interest Income',
        amount: interestIncome,
        indent: 1
      },
      {
        section: 'OTHER_EXPENSE',
        label: 'Miscellaneous Expense',
        amount: miscExpense,
        indent: 1
      },
      {
        section: 'FINANCE_COST',
        label: 'Finance Costs',
        amount: financeCost,
        indent: 1
      },

      // Profit Before Tax
      {
        section: 'KPI',
        label: 'PROFIT BEFORE TAX',
        amount: profitBeforeTax,
        isTotal: true
      },

      // Tax
      {
        section: 'TAX',
        label: 'Income Tax Expense',
        amount: incomeTax,
        indent: 1
      },

      // Net Profit
      {
        section: 'KPI',
        label: 'NET PROFIT',
        amount: netProfit,
        percentage: netMargin,
        isTotal: true
      }
    ],
    kpis: {
      revenue_net: revenueNetOfVAT,
      cogs: totalCOGS,
      gross_profit: grossProfit,
      gross_margin: grossMargin,
      opex: totalOPEX,
      ebitda: ebitda,
      ebitda_margin: ebitdaMargin,
      operating_income: operatingIncome,
      profit_before_tax: profitBeforeTax,
      income_tax: incomeTax,
      net_profit: netProfit,
      net_margin: netMargin
    },
    vat_summary: {
      vat_on_sales: vatOnSales,
      vat_on_purchases: vatOnPurchases,
      net_vat_payable: vatOnSales - vatOnPurchases
    }
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

const getVarianceIcon = (variance: number) => {
  if (variance > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
  if (variance < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

const getSectionColor = (section: string) => {
  const colors = {
    REVENUE: 'text-emerald-600',
    COGS: 'text-orange-600',
    OPEX: 'text-primary',
    OTHER_INCOME: 'text-green-600',
    OTHER_EXPENSE: 'text-red-600',
    FINANCE_COST: 'text-purple-600',
    TAX: 'text-muted-foreground',
    KPI: 'text-indigo-600'
  }
  return colors[section as keyof typeof colors] || 'text-gray-100'
}

// ----------------------------- Main Component ------------------------------------

export default function SalonProfitLossPage() {
  const { currentOrganization, contextLoading  } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month')
  const [selectedBranch, setSelectedBranch] = useState<BranchType>('all')
  const [showComparison, setShowComparison] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['REVENUE', 'COGS', 'OPEX'])
  )

  // Default organization ID for salon - Hair Talkz Park Regis
  const organizationId = currentOrganization?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

  // Calculate date ranges
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const getPeriodDates = () => {
    switch (selectedPeriod) {
      case 'month':
        return {
          start: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`
        }
      case 'quarter':
        const quarterStart = Math.floor(currentMonth / 3) * 3
        return {
          start: `${currentYear}-${String(quarterStart + 1).padStart(2, '0')}-01`,
          end: `${currentYear}-${String(quarterStart + 3).padStart(2, '0')}-${new Date(currentYear, quarterStart + 3, 0).getDate()}`
        }
      case 'ytd':
        return {
          start: `${currentYear}-01-01`,
          end: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${today.getDate()}`
        }
      default:
        return {
          start: `${currentYear}-01-01`,
          end: `${currentYear}-12-31`
        }
    }
  }

  const { start: periodStart, end: periodEnd } = getPeriodDates()

  // Generate mock data
  const currentReport = generateMockPnLData(
    periodStart,
    periodEnd,
    selectedBranch === 'all'
      ? undefined
      : selectedBranch === 'branch1'
        ? 'Hair Talkz • Park Regis'
        : 'Hair Talkz • Mercure Gold'
  )

  // Generate comparison data (previous period)
  const comparisonReport = showComparison
    ? generateMockPnLData(
        '2025-07-01',
        '2025-07-31',
        selectedBranch === 'all'
          ? undefined
          : selectedBranch === 'branch1'
            ? 'Hair Talkz • Park Regis'
            : 'Hair Talkz • Mercure Gold'
      )
    : null

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
    handleError(new Error('Export functionality not yet implemented'), 'pnl-export', {
      showToast: true,
      fallbackMessage: `Export to ${format.toUpperCase()} will be available soon`
    })
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground">
            Loading financial data...
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
            <h1 className="text-3xl font-bold text-gray-100 dark:text-foreground">
              Profit & Loss Statement
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              VAT-compliant financial reporting for UAE entities
            </p>
          </div>
          <div className="flex gap-2">
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
              {/* Period Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Period
                </label>
                <div className="flex gap-1">
                  {(['month', 'quarter', 'ytd'] as const).map(period => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      className={cn(
                        'flex-1',
                        selectedPeriod === period
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground'
                          : ''
                      )}
                    >
                      {period.toUpperCase()}
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
                  onChange={e => setSelectedBranch(e.target.value as BranchType)}
                  className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-muted-foreground/10 text-gray-100 dark:text-foreground"
                >
                  <option value="all">All Branches (Consolidated)</option>
                  <option value="branch1">Park Regis Kris Kin</option>
                  <option value="branch2">Mercure Gold</option>
                </select>
              </div>

              {/* Date Range Display */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Date Range
                </label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(periodStart).toLocaleDateString('en-AE')} -{' '}
                    {new Date(periodEnd).toLocaleDateString('en-AE')}
                  </span>
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
                  {showComparison ? 'Hide' : 'Show'} Prior Period
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Source Tabs */}
        <Tabs defaultValue="mock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="mock">Mock Data (Demo)</TabsTrigger>
            <TabsTrigger value="real">Real Data (Live)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mock" className="space-y-6">
            {/* Mock Data View */}
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Net Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatCurrency(currentReport.kpis.revenue_net)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Gross Margin
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatPercent(currentReport.kpis.gross_margin)}
                  </p>
                </div>
                <Percent className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background dark:bg-muted border-border dark:border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">EBITDA</p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatCurrency(currentReport.kpis.ebitda)}
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
                    Net Profit
                  </p>
                  <p className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    {formatCurrency(currentReport.kpis.net_profit)}
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {formatPercent(currentReport.kpis.net_margin)} margin
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* P&L Statement Table */}
        <Card className="bg-background dark:bg-muted border-border dark:border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Income Statement
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Globe className="w-3 h-3 mr-1" />
                  {currentReport.header.currency}
                </Badge>
                {currentReport.header.vat_compliant && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    VAT Compliant
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
                      {new Date(periodEnd).toLocaleDateString('en-AE', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </th>
                    {showComparison && (
                      <>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Prior Period
                        </th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Variance
                        </th>
                      </>
                    )}
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      % of Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.lines.map((line, index) => {
                    const isSection = line.isSubtotal && !line.isTotal
                    const shouldShow = !line.indent || expandedSections.has(line.section)

                    if (!shouldShow && !isSection && !line.isTotal) return null

                    return (
                      <tr
                        key={index}
                        className={cn(
                          'border-b border-gray-100 dark:border-gray-800',
                          line.isTotal && 'bg-muted dark:bg-background font-semibold',
                          line.isSubtotal &&
                            'font-medium cursor-pointer hover:bg-muted dark:hover:bg-background',
                          line.indent && 'text-sm'
                        )}
                        onClick={() => isSection && toggleSection(line.section)}
                      >
                        <td
                          className={cn(
                            'px-6 py-3',
                            line.indent && `pl-${10 + line.indent * 4}`,
                            getSectionColor(line.section)
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSection &&
                              (expandedSections.has(line.section) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              ))}
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
                              {formatCurrency(Math.abs(line.amount * 0.9))}
                            </td>
                            <td className="text-right px-6 py-3">
                              <div className="flex items-center justify-end gap-1">
                                {getVarianceIcon(line.amount * 0.1)}
                                <span
                                  className={cn(
                                    line.amount * 0.1 > 0 ? 'text-green-600' : 'text-red-600'
                                  )}
                                >
                                  {formatPercent(10)}
                                </span>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="text-right px-6 py-3 text-muted-foreground dark:text-muted-foreground">
                          {line.percentage ? formatPercent(line.percentage) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* VAT Summary */}
        <Card className="bg-background dark:bg-muted border-border dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              VAT Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted dark:bg-background rounded-lg p-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Output VAT (Sales)
                </p>
                <p className="text-xl font-semibold text-gray-100 dark:text-foreground">
                  {formatCurrency(currentReport.vat_summary.vat_on_sales)}
                </p>
              </div>
              <div className="bg-muted dark:bg-background rounded-lg p-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Input VAT (Purchases)
                </p>
                <p className="text-xl font-semibold text-gray-100 dark:text-foreground">
                  {formatCurrency(currentReport.vat_summary.vat_on_purchases)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-700 dark:text-purple-300">Net VAT Payable</p>
                <p className="text-xl font-semibold text-purple-900 dark:text-purple-200">
                  {formatCurrency(currentReport.vat_summary.net_vat_payable)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Report Metadata */}
            <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {currentReport.header.organization_name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Dubai, UAE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Generated: {new Date(currentReport.header.report_date).toLocaleString('en-AE')}
            </span>
            <Badge variant="secondary" className="text-xs">
              {currentReport.header.consolidation_type}
            </Badge>
          </div>
        </div>
    </TabsContent>
    
    <TabsContent value="real" className="space-y-6">
            {/* Real Data View */}
            <RealPnLReport
              organizationId={organizationId}
              startDate={periodStart}
              endDate={periodEnd}
              branchId={selectedBranch === 'all' ? undefined : selectedBranch}
              currency="AED"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
