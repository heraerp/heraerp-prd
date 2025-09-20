'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider' // Not needed - using default salon org
import { useToast } from '@/components/ui/use-toast'
import {
  ChevronLeft,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2,
  Hash,
  Calculator,
  DollarSign,
  Eye,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Settings,
  Filter,
  Globe
} from 'lucide-react'

// Default organization ID for development
const DEFAULT_ORG_ID =
  process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface GLAccount {
  id: string
  account_code: string
  account_name: string
  account_type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses' | 'cost_of_sales'
  account_level: number
  parent_account_code?: string
  normal_balance: 'debit' | 'credit'
  is_control_account: boolean
  ifrs_classification?: string
  statement_type?: string
}

interface TrialBalanceEntry {
  account: GLAccount
  opening_balance_debit: number
  opening_balance_credit: number
  period_debit: number
  period_credit: number
  closing_balance_debit: number
  closing_balance_credit: number
  ytd_debit: number
  ytd_credit: number
  children?: TrialBalanceEntry[]
}

interface TrialBalanceData {
  organization: {
    id: string
    name: string
    currency: string
    fiscal_year_start: string
  }
  period: {
    from: string
    to: string
    fiscal_year: number
    fiscal_period: number
  }
  entries: TrialBalanceEntry[]
  totals: {
    opening_debit: number
    opening_credit: number
    period_debit: number
    period_credit: number
    closing_debit: number
    closing_credit: number
    ytd_debit: number
    ytd_credit: number
  }
  generated_at: string
  report_currency: string
}

export default function TrialBalancePage() {
  const router = useRouter()
  const { toast } = useToast()

  // Use default salon organization - no auth required
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  const [loading, setLoading] = useState(true)
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedView, setSelectedView] = useState<'ytd' | 'ptd'>('ytd')
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [showZeroBalances, setShowZeroBalances] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('AED')

  useEffect(() => {
    fetchTrialBalance()
  }, [organizationId, selectedPeriod, selectedCurrency])

  const fetchTrialBalance = async () => {
    try {
      setLoading(true)
      const { start, end } = getPeriodDates(selectedPeriod)

      const response = await fetch(
        `/api/v1/reports/trial-balance?organization_id=${organizationId}&start_date=${start}&end_date=${end}&currency=${selectedCurrency}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch trial balance')
      }

      const data = await response.json()
      setTrialBalanceData(data.data)
    } catch (error) {
      console.error('Error fetching trial balance:', error)
      toast({
        title: 'Error',
        description: 'Failed to load trial balance report',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPeriodDates = (period: string) => {
    const now = new Date()
    let start: Date, end: Date

    switch (period) {
      case 'current_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        break
      case 'current_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
        break
      case 'last_year':
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const toggleAccountExpansion = (accountCode: string) => {
    const newExpanded = new Set(expandedAccounts)
    if (newExpanded.has(accountCode)) {
      newExpanded.delete(accountCode)
    } else {
      newExpanded.add(accountCode)
    }
    setExpandedAccounts(newExpanded)
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const { start, end } = getPeriodDates(selectedPeriod)
      const response = await fetch(
        `/api/v1/reports/trial-balance/export?organization_id=${organizationId}&start_date=${start}&end_date=${end}&format=${format}&currency=${selectedCurrency}`,
        { method: 'POST' }
      )

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trial-balance-${new Date().toISOString().split('T')[0]}.${format}`
      a.click()

      toast({
        title: 'Export Successful',
        description: `Trial balance exported as ${format.toUpperCase()}`
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Could not export the report',
        variant: 'destructive'
      })
    }
  }

  const renderAccountRow = (entry: TrialBalanceEntry, level: number = 0) => {
    const hasChildren = entry.children && entry.children.length > 0
    const isExpanded = expandedAccounts.has(entry.account.account_code)
    const indent = level * 24

    // Hide zero balance accounts if setting is enabled
    if (showZeroBalances === false) {
      const hasBalance = entry.closing_balance_debit !== 0 || entry.closing_balance_credit !== 0
      if (!hasBalance && !hasChildren) return null
    }

    const values =
      selectedView === 'ytd'
        ? {
            debit: entry.ytd_debit,
            credit: entry.ytd_credit,
            closingDebit: entry.closing_balance_debit,
            closingCredit: entry.closing_balance_credit
          }
        : {
            debit: entry.period_debit,
            credit: entry.period_credit,
            closingDebit: entry.closing_balance_debit,
            closingCredit: entry.closing_balance_credit
          }

    return (
      <React.Fragment key={entry.account.id}>
        <tr
          className={`border-b hover:bg-muted ${entry.account.is_control_account ? 'font-semibold bg-muted' : ''}`}
        >
          <td className="py-2 px-4" style={{ paddingLeft: `${indent + 16}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-5 w-5"
                  onClick={() => toggleAccountExpansion(entry.account.account_code)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              )}
              <span className="text-sm">{entry.account.account_code}</span>
              <span className="text-sm">{entry.account.account_name}</span>
              {entry.account.ifrs_classification && (
                <Badge variant="outline" className="text-xs">
                  {entry.account.ifrs_classification}
                </Badge>
              )}
            </div>
          </td>
          <td className="py-2 px-4 text-right">
            {entry.opening_balance_debit !== 0 ? formatNumber(entry.opening_balance_debit) : ''}
          </td>
          <td className="py-2 px-4 text-right">
            {entry.opening_balance_credit !== 0 ? formatNumber(entry.opening_balance_credit) : ''}
          </td>
          <td className="py-2 px-4 text-right">
            {values.debit !== 0 ? formatNumber(values.debit) : ''}
          </td>
          <td className="py-2 px-4 text-right">
            {values.credit !== 0 ? formatNumber(values.credit) : ''}
          </td>
          <td className="py-2 px-4 text-right font-medium">
            {values.closingDebit !== 0 ? formatNumber(values.closingDebit) : ''}
          </td>
          <td className="py-2 px-4 text-right font-medium">
            {values.closingCredit !== 0 ? formatNumber(values.closingCredit) : ''}
          </td>
          <td className="py-2 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/general-ledger/${entry.account.id}?period=${selectedPeriod}`)
              }
            >
              <Eye className="w-4 h-4" />
            </Button>
          </td>
        </tr>
        {hasChildren &&
          isExpanded &&
          entry.children!.map(child => renderAccountRow(child, level + 1))}
      </React.Fragment>
    )
  }

  const renderAccountTypeSection = (type: string, entries: TrialBalanceEntry[]) => {
    const typeMapping = {
      assets: 'Assets',
      liabilities: 'Liabilities',
      equity: 'Equity',
      revenue: 'Revenue',
      expenses: 'Expenses',
      cost_of_sales: 'Cost of Sales'
    }

    const filteredEntries = entries.filter(e => e.account.account_type === type)
    if (filteredEntries.length === 0) return null

    return (
      <div key={type} className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-200 uppercase tracking-wide">
          {typeMapping[type as keyof typeof typeMapping]}
        </h3>
        {filteredEntries.map(entry => renderAccountRow(entry))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Generating trial balance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/financial')}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Financial
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Trial Balance Report</h1>
              <p className="text-muted-foreground text-lg">
                Enterprise financial position statement
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => fetchTrialBalance()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowZeroBalances(!showZeroBalances)} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {showZeroBalances ? 'Hide' : 'Show'} Zero Balances
              </Button>
            </div>
          </div>

          {/* Organization Info */}
          {trialBalanceData && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="w-4 h-4" />
                      Organization
                    </div>
                    <p className="font-medium">{trialBalanceData.organization.name}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      Period
                    </div>
                    <p className="font-medium">
                      {new Date(trialBalanceData.period.from).toLocaleDateString()} -
                      {new Date(trialBalanceData.period.to).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Globe className="w-4 h-4" />
                      Currency
                    </div>
                    <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Hash className="w-4 h-4" />
                      Fiscal Period
                    </div>
                    <p className="font-medium">
                      FY{trialBalanceData.period.fiscal_year} P
                      {trialBalanceData.period.fiscal_period}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Tabs value={selectedView} onValueChange={v => setSelectedView(v as 'ytd' | 'ptd')}>
                <TabsList>
                  <TabsTrigger value="ytd">Year to Date</TabsTrigger>
                  <TabsTrigger value="ptd">Period to Date</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button onClick={() => handleExport('excel')} variant="outline" size="sm">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button onClick={() => window.print()} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Main Report */}
        {trialBalanceData && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b-2 border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        Account Code & Name
                      </th>
                      <th
                        className="text-right py-3 px-4 font-semibold text-sm text-gray-700"
                        colSpan={2}
                      >
                        Opening Balance
                      </th>
                      <th
                        className="text-right py-3 px-4 font-semibold text-sm text-gray-700"
                        colSpan={2}
                      >
                        {selectedView === 'ytd' ? 'Year to Date' : 'Period Activity'}
                      </th>
                      <th
                        className="text-right py-3 px-4 font-semibold text-sm text-gray-700"
                        colSpan={2}
                      >
                        Closing Balance
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700 w-16">
                        Actions
                      </th>
                    </tr>
                    <tr className="bg-muted">
                      <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground"></th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">
                        Debit
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">
                        Credit
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">
                        Debit
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">
                        Credit
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">
                        Debit
                      </th>
                      <th className="text-right py-2 px-4 font-medium text-xs text-muted-foreground">
                        Credit
                      </th>
                      <th className="text-center py-2 px-4 font-medium text-xs text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render accounts by type */}
                    {renderAccountTypeSection('assets', trialBalanceData.entries)}
                    {renderAccountTypeSection('liabilities', trialBalanceData.entries)}
                    {renderAccountTypeSection('equity', trialBalanceData.entries)}
                    {renderAccountTypeSection('revenue', trialBalanceData.entries)}
                    {renderAccountTypeSection('cost_of_sales', trialBalanceData.entries)}
                    {renderAccountTypeSection('expenses', trialBalanceData.entries)}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted font-bold">
                      <td className="py-3 px-4">TOTAL</td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(trialBalanceData.totals.opening_debit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(trialBalanceData.totals.opening_credit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(
                          selectedView === 'ytd'
                            ? trialBalanceData.totals.ytd_debit
                            : trialBalanceData.totals.period_debit
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(
                          selectedView === 'ytd'
                            ? trialBalanceData.totals.ytd_credit
                            : trialBalanceData.totals.period_credit
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(trialBalanceData.totals.closing_debit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(trialBalanceData.totals.closing_credit)}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                    {/* Balance check row */}
                    <tr
                      className={`font-medium ${
                        Math.abs(
                          trialBalanceData.totals.closing_debit -
                            trialBalanceData.totals.closing_credit
                        ) < 0.01
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      <td className="py-2 px-4" colSpan={5}>
                        Balance Check
                      </td>
                      <td className="py-2 px-4 text-right" colSpan={2}>
                        {Math.abs(
                          trialBalanceData.totals.closing_debit -
                            trialBalanceData.totals.closing_credit
                        ) < 0.01
                          ? 'BALANCED'
                          : `UNBALANCED: ${formatCurrency(Math.abs(trialBalanceData.totals.closing_debit - trialBalanceData.totals.closing_credit))}`}
                      </td>
                      <td className="py-2 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Generated on {new Date().toLocaleString()} |{' '}
          {trialBalanceData?.organization?.name || 'Beauty Salon'} | Report Currency:{' '}
          {selectedCurrency}
        </div>
      </div>
    </div>
  )
}
