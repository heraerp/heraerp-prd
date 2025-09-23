'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRealPnLData } from '@/lib/api/financial-reports'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  AlertCircle,
  Globe,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface RealPnLReportProps {
  organizationId: string
  startDate: string
  endDate: string
  branchId?: string
  showComparison?: boolean
  currency?: string
}

interface PnLLine {
  section: 'REVENUE' | 'COGS' | 'OPEX' | 'OTHER_INCOME' | 'OTHER_EXPENSE' | 'FINANCE_COST' | 'TAX' | 'KPI'
  label: string
  amount: number
  percentage?: number
  isSubtotal?: boolean
  isTotal?: boolean
  indent?: number
}

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

export function RealPnLReport({
  organizationId,
  startDate,
  endDate,
  branchId,
  showComparison = false,
  currency = 'AED'
}: RealPnLReportProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['REVENUE', 'COGS', 'OPEX'])
  )
  
  // Fetch real P&L data
  const { data, isLoading, error } = useRealPnLData({
    organizationId,
    startDate,
    endDate,
    branchId
  })
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Loading P&L Table */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading financial data: {error.message}
        </AlertDescription>
      </Alert>
    )
  }
  
  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No financial data available for the selected period
        </AlertDescription>
      </Alert>
    )
  }
  
  const { revenue, expenses, kpis } = data
  
  // Build P&L lines from real data
  const pnlLines: PnLLine[] = [
    // Revenue Section
    {
      section: 'REVENUE',
      label: 'REVENUE',
      amount: revenue.totalRevenue,
      isSubtotal: true
    },
    {
      section: 'REVENUE',
      label: 'Service Revenue',
      amount: revenue.serviceRevenue,
      percentage: revenue.totalRevenue > 0 ? (revenue.serviceRevenue / revenue.totalRevenue) * 100 : 0,
      indent: 1
    },
    {
      section: 'REVENUE',
      label: 'Product Sales',
      amount: revenue.productRevenue,
      percentage: revenue.totalRevenue > 0 ? (revenue.productRevenue / revenue.totalRevenue) * 100 : 0,
      indent: 1
    },
    {
      section: 'REVENUE',
      label: 'Other Revenue',
      amount: revenue.otherRevenue,
      percentage: revenue.totalRevenue > 0 ? (revenue.otherRevenue / revenue.totalRevenue) * 100 : 0,
      indent: 1
    },
    
    // COGS Section
    {
      section: 'COGS',
      label: 'COST OF GOODS SOLD',
      amount: kpis.cogs,
      isSubtotal: true
    },
    {
      section: 'COGS',
      label: 'Product Cost',
      amount: expenses.productCost,
      percentage: kpis.cogs > 0 ? (expenses.productCost / kpis.cogs) * 100 : 0,
      indent: 1
    },
    
    // Gross Profit
    {
      section: 'KPI',
      label: 'GROSS PROFIT',
      amount: kpis.gross_profit,
      percentage: kpis.gross_margin,
      isTotal: true
    },
    
    // OPEX Section
    {
      section: 'OPEX',
      label: 'OPERATING EXPENSES',
      amount: kpis.opex,
      isSubtotal: true
    },
    {
      section: 'OPEX',
      label: 'Staff Costs',
      amount: expenses.staffCost,
      percentage: kpis.opex > 0 ? (expenses.staffCost / kpis.opex) * 100 : 0,
      indent: 1
    },
    {
      section: 'OPEX',
      label: 'Rent Expense',
      amount: expenses.rentExpense,
      percentage: kpis.opex > 0 ? (expenses.rentExpense / kpis.opex) * 100 : 0,
      indent: 1
    },
    {
      section: 'OPEX',
      label: 'Utilities',
      amount: expenses.utilities,
      percentage: kpis.opex > 0 ? (expenses.utilities / kpis.opex) * 100 : 0,
      indent: 1
    },
    {
      section: 'OPEX',
      label: 'Marketing & Advertising',
      amount: expenses.marketing,
      percentage: kpis.opex > 0 ? (expenses.marketing / kpis.opex) * 100 : 0,
      indent: 1
    },
    {
      section: 'OPEX',
      label: 'Other Operating Expenses',
      amount: expenses.otherExpense,
      percentage: kpis.opex > 0 ? (expenses.otherExpense / kpis.opex) * 100 : 0,
      indent: 1
    },
    
    // EBITDA
    {
      section: 'KPI',
      label: 'EBITDA',
      amount: kpis.ebitda,
      percentage: kpis.ebitda_margin,
      isTotal: true
    },
    
    // Net Profit
    {
      section: 'KPI',
      label: 'NET PROFIT',
      amount: kpis.net_profit,
      percentage: kpis.net_margin,
      isTotal: true
    }
  ]
  
  return (
    <div className="space-y-6">
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
                  {formatCurrency(kpis.revenue_net, currency)}
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
                  {formatPercent(kpis.gross_margin)}
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
                  {formatCurrency(kpis.ebitda, currency)}
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
                  {formatCurrency(kpis.net_profit, currency)}
                </p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {formatPercent(kpis.net_margin)} margin
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
              Income Statement (Real Data)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Globe className="w-3 h-3 mr-1" />
                {currency}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Live Data
              </Badge>
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
                    {format(new Date(endDate), 'MMM yyyy')}
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    % of Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {pnlLines.map((line, index) => {
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
                        {formatCurrency(Math.abs(line.amount), currency)}
                      </td>
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
      
      {/* Data Source Note */}
      <div className="text-sm text-muted-foreground text-center">
        <p>
          Data sourced from {data.transactions.revenue.length + data.transactions.expenses.length} transactions
          between {format(new Date(startDate), 'MMM d, yyyy')} and {format(new Date(endDate), 'MMM d, yyyy')}
        </p>
      </div>
    </div>
  )
}