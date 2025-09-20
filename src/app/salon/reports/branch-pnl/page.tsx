'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BranchSelector, MultiBranchSelector } from '@/components/ui/BranchSelector'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useBranchFilter, useBranchComparison } from '@/hooks/useBranchFilter'
import { formatCurrency } from '@/lib/universal-helpers'
import { Loader2, Download, TrendingUp, TrendingDown, BarChart3, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BranchPnLData {
  branch_id: string
  branch_name?: string
  line_type: string
  amount: number
  transaction_count?: number
}

interface BranchComparison {
  branch_id: string
  branch_name: string
  revenue: number
  expenses: number
  net_income: number
  margin_percentage: number
}

export default function BranchPnLReportPage() {
  const { organization, isAuthenticated, isLoading: contextLoading } = useHERAAuth()
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BranchPnLData[] | null>(null)
  const [comparisonData, setComparisonData] = useState<BranchComparison[] | null>(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    to: new Date().toISOString().split('T')[0] // Today
  })

  // Hooks for branch selection
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId
  } = useBranchFilter(undefined, 'branch-pnl-report')

  const {
    branches: compBranches,
    selectedBranches,
    toggleBranch,
    selectAll,
    deselectAll,
    isSelected,
    loading: compBranchesLoading
  } = useBranchComparison()

  const organizationId = organization?.id

  // Load report data when branch or date changes
  useEffect(() => {
    if (organizationId && (viewMode === 'single' ? branchId : selectedBranches.length > 0)) {
      loadReportData()
    }
  }, [organizationId, branchId, selectedBranches, dateRange, viewMode])

  const loadReportData = async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        organization_id: organizationId,
        from: dateRange.from,
        to: dateRange.to,
        ...(viewMode === 'comparison' ? { comparison: 'true' } : { branch_id: branchId || '' })
      })

      const response = await fetch(`/api/reports/branch-pnl?${params}`)

      if (!response.ok) {
        throw new Error('Failed to load branch P&L data')
      }

      const result = await response.json()

      if (viewMode === 'single') {
        setData(result.data.rows || [])
      } else {
        setComparisonData(result.data.branches || [])
      }
    } catch (err) {
      console.error('Error loading report:', err)
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // TODO: Implement CSV export
    console.log('Export report')
  }

  // Calculate totals for single branch view
  const calculateTotals = () => {
    if (!data) return { revenue: 0, expenses: 0, netIncome: 0 }

    let revenue = 0
    let expenses = 0

    data.forEach(row => {
      if (['REVENUE', 'SALES', 'SERVICE_REVENUE'].includes(row.line_type)) {
        revenue += Math.abs(row.amount)
      } else if (['EXPENSE', 'COST', 'COGS', 'OPERATING_EXPENSE'].includes(row.line_type)) {
        expenses += Math.abs(row.amount)
      }
    })

    return {
      revenue,
      expenses,
      netIncome: revenue - expenses
    }
  }

  // Auth checks
  if (!isAuthenticated) {
    return <Alert>Please log in to access this page.</Alert>
  }

  if (contextLoading || branchesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!organizationId) {
    return <Alert>No organization context found.</Alert>
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Branch P&L Report</h1>
            <p className="text-gray-400 mt-1">Analyze financial performance by branch</p>
          </div>
          <Button
            onClick={exportReport}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Controls */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Report Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                onClick={() => setViewMode('single')}
                className={cn(
                  viewMode === 'single'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'border-white/20 text-white hover:bg-white/10'
                )}
              >
                Single Branch
              </Button>
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'outline'}
                onClick={() => setViewMode('comparison')}
                className={cn(
                  viewMode === 'comparison'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'border-white/20 text-white hover:bg-white/10'
                )}
              >
                Branch Comparison
              </Button>
            </div>

            {/* Branch Selection */}
            {viewMode === 'single' ? (
              <div className="w-full max-w-xs">
                <label className="text-sm text-gray-400 mb-1 block">Select Branch</label>
                <BranchSelector
                  value={branchId}
                  branches={branches}
                  onChange={setBranchId}
                  loading={branchesLoading}
                  showAllOption
                  allOptionLabel="All Branches"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            ) : (
              <div className="w-full max-w-md">
                <MultiBranchSelector
                  branches={compBranches}
                  selectedBranches={selectedBranches}
                  onToggle={toggleBranch}
                  onSelectAll={selectAll}
                  onDeselectAll={deselectAll}
                  loading={compBranchesLoading}
                />
              </div>
            )}

            {/* Date Range */}
            <div className="flex gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Single Branch View */}
        {viewMode === 'single' && !loading && data && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-white/10 bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(totals.revenue)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">
                    Total Expenses
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(totals.expenses)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">Net Income</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(totals.netIncome)}
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {totals.revenue > 0
                      ? ((totals.netIncome / totals.revenue) * 100).toFixed(1)
                      : '0'}
                    % margin
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detail Table */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-white">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3">Branch</th>
                        <th className="text-left py-3">Account Type</th>
                        <th className="text-right py-3">Amount</th>
                        <th className="text-right py-3">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3">{row.branch_name || row.branch_id}</td>
                          <td className="py-3">{row.line_type}</td>
                          <td className="py-3 text-right font-mono">
                            {formatCurrency(Math.abs(row.amount))}
                          </td>
                          <td className="py-3 text-right">{row.transaction_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Branch Comparison View */}
        {viewMode === 'comparison' && !loading && comparisonData && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Branch Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3">Branch</th>
                      <th className="text-right py-3">Revenue</th>
                      <th className="text-right py-3">Expenses</th>
                      <th className="text-right py-3">Net Income</th>
                      <th className="text-right py-3">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map(branch => (
                      <tr
                        key={branch.branch_id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {branch.branch_name}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-green-400">
                          {formatCurrency(branch.revenue)}
                        </td>
                        <td className="py-3 text-right font-mono text-red-400">
                          {formatCurrency(branch.expenses)}
                        </td>
                        <td className="py-3 text-right font-mono">
                          <span
                            className={cn(
                              branch.net_income >= 0 ? 'text-green-400' : 'text-red-400'
                            )}
                          >
                            {formatCurrency(branch.net_income)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={cn(
                              'font-medium',
                              branch.margin_percentage >= 20
                                ? 'text-green-400'
                                : branch.margin_percentage >= 10
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                            )}
                          >
                            {branch.margin_percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
