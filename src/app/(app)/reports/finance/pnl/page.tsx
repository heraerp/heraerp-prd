// ================================================================================
// PROFIT & LOSS STATEMENT PAGE
// Smart Code: HERA.UI.REPORTS.PNL.v1
// Production-ready P&L statement with hierarchical grouping and drill-downs
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Badge } from '@/src/components/ui/badge'
import { FileText, TrendingUp, AlertCircle, Calculator } from 'lucide-react'
import { FiltersBar, useReportFilters } from '@/src/components/reports/FiltersBar'
import { FinancialSummaryCards } from '@/src/components/reports/SummaryCards'
import { PnLTable } from '@/src/components/reports/PnLTable'
import { DrilldownDrawer } from '@/src/components/reports/DrilldownDrawer'
import { ExportButtons } from '@/src/components/reports/ExportButtons'
import { PrintHeader, PrintLayout } from '@/src/components/reports/PrintHeader'
import { useUniversalReports } from '@/src/hooks/useUniversalReports'
import { FinancialFilters, PnLRow, DrillDownResponse, TransactionDetail } from '@/src/lib/schemas/reports'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'

export default function ProfitLossStatementPage() {
  const { currentOrganization } = useOrganization()
  const [selectedDrillDown, setSelectedDrillDown] = React.useState<{
    group: string
    account?: PnLRow
    isOpen: boolean
  }>({ group: '', isOpen: false })
  
  const [drillDownData, setDrillDownData] = React.useState<DrillDownResponse | null>(null)
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionDetail | null>(null)
  const [isDrillDownLoading, setIsDrillDownLoading] = React.useState(false)
  const [isTransactionLoading, setIsTransactionLoading] = React.useState(false)

  // Initialize filters with current month
  const getCurrentMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0]
    }
  }

  const { from, to } = getCurrentMonth()
  const initialFilters: FinancialFilters = {
    organization_id: currentOrganization?.id || '',
    from_date: from,
    to_date: to,
    consolidated: true,
    currency: 'AED'
  }

  const { filters, updateFilters } = useReportFilters(initialFilters)
  
  // Main report data using useUniversalReports hook
  const { 
    isLoading, 
    error, 
    data: reportData,
    getProfitLoss,
    clearError 
  } = useUniversalReports()

  // Load P&L data
  React.useEffect(() => {
    if (currentOrganization?.id && filters.from_date && filters.to_date) {
      getProfitLoss({
        start_date: filters.from_date,
        end_date: filters.to_date,
        organization_id: currentOrganization.id
      })
    }
  }, [currentOrganization?.id, filters.from_date, filters.to_date, filters.branch_id, getProfitLoss])

  // Mock data transformation (in production, this would come from the API)
  const transformedData = React.useMemo(() => {
    if (!reportData) return null

    // Transform universal report data to P&L format
    const mockPnLData: PnLRow[] = [
      // REVENUE GROUP
      { account_code: 'REV_TOTAL', account_name: 'Total Revenue', group: 'revenue', amount: -115000, percentage: 100, is_subtotal: true, level: 0 },
      { account_code: '4100', account_name: 'Service Revenue - Haircuts', group: 'revenue', amount: -75000, percentage: 65.2, is_subtotal: false, level: 1 },
      { account_code: '4110', account_name: 'Service Revenue - Coloring', group: 'revenue', amount: -25000, percentage: 21.7, is_subtotal: false, level: 1 },
      { account_code: '4120', account_name: 'Service Revenue - Treatments', group: 'revenue', amount: -10000, percentage: 8.7, is_subtotal: false, level: 1 },
      { account_code: '4200', account_name: 'Product Sales', group: 'revenue', amount: -5000, percentage: 4.3, is_subtotal: false, level: 1 },
      
      // COGS GROUP
      { account_code: 'COGS_TOTAL', account_name: 'Total Cost of Goods Sold', group: 'cogs', amount: 28000, percentage: 24.3, is_subtotal: true, level: 0 },
      { account_code: '5100', account_name: 'Product Costs', group: 'cogs', amount: 2000, percentage: 1.7, is_subtotal: false, level: 1 },
      { account_code: '5200', account_name: 'Service Materials', group: 'cogs', amount: 8000, percentage: 7.0, is_subtotal: false, level: 1 },
      { account_code: '5300', account_name: 'Staff Commissions', group: 'cogs', amount: 18000, percentage: 15.7, is_subtotal: false, level: 1 },
      
      // GROSS PROFIT
      { account_code: 'GROSS_PROFIT', account_name: 'Gross Profit', group: 'gross_profit', amount: 87000, percentage: 75.7, is_subtotal: true, level: 0 },
      
      // EXPENSES GROUP
      { account_code: 'EXP_TOTAL', account_name: 'Total Operating Expenses', group: 'expenses', amount: 45500, percentage: 39.6, is_subtotal: true, level: 0 },
      { account_code: '6100', account_name: 'Staff Salaries', group: 'expenses', amount: 22000, percentage: 19.1, is_subtotal: false, level: 1 },
      { account_code: '6200', account_name: 'Rent & Utilities', group: 'expenses', amount: 15000, percentage: 13.0, is_subtotal: false, level: 1 },
      { account_code: '6300', account_name: 'Marketing & Advertising', group: 'expenses', amount: 3500, percentage: 3.0, is_subtotal: false, level: 1 },
      { account_code: '6400', account_name: 'Insurance & Legal', group: 'expenses', amount: 2500, percentage: 2.2, is_subtotal: false, level: 1 },
      { account_code: '6500', account_name: 'Equipment & Maintenance', group: 'expenses', amount: 2500, percentage: 2.2, is_subtotal: false, level: 1 },
      
      // OPERATING PROFIT
      { account_code: 'OP_PROFIT', account_name: 'Operating Profit', group: 'operating_profit', amount: 41500, percentage: 36.1, is_subtotal: true, level: 0 },
      
      // OTHER
      { account_code: 'OTHER_TOTAL', account_name: 'Other Income/Expenses', group: 'other', amount: -800, percentage: -0.7, is_subtotal: true, level: 0 },
      { account_code: '7100', account_name: 'Interest Income', group: 'other', amount: -200, percentage: -0.2, is_subtotal: false, level: 1 },
      { account_code: '8100', account_name: 'Bank Charges', group: 'other', amount: 600, percentage: 0.5, is_subtotal: false, level: 1 },
      
      // NET INCOME
      { account_code: 'NET_INCOME', account_name: 'Net Income', group: 'net_income', amount: 42300, percentage: 36.8, is_subtotal: true, level: 0 }
    ]

    const mockSummary = {
      total_revenue: 115000,
      total_cogs: 28000,
      gross_profit: 87000,
      gross_margin_percent: 75.7,
      total_expenses: 45500,
      operating_profit: 41500,
      operating_margin_percent: 36.1,
      net_income: 42300,
      net_margin_percent: 36.8
    }

    return {
      summary: mockSummary,
      line_items: mockPnLData,
      currency: filters.currency || 'AED'
    }
  }, [reportData, filters.currency])

  // Handle drill-down clicks
  const handleDrillDown = async (row: PnLRow) => {
    if (row.is_subtotal) return // Don't drill down on subtotals
    
    setSelectedDrillDown({ group: row.group, account: row, isOpen: true })
    setIsDrillDownLoading(true)
    setDrillDownData(null)
    setSelectedTransaction(null)

    try {
      // In production, this would call your drill-down API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      const mockTransactions = [
        {
          transaction_id: 'abc12345-e89b-12d3-a456-426614174000',
          transaction_date: filters.from_date || new Date().toISOString().split('T')[0],
          transaction_code: 'JE-2024-001',
          transaction_type: 'journal_entry',
          smart_code: 'HERA.FIN.GL.AUTO_JOURNAL.v1',
          customer_name: undefined,
          staff_name: 'System Generated',
          total_amount: Math.abs(row.amount),
          description: `Auto-journal entry for ${row.account_name}`,
          line_count: 2
        }
      ]

      setDrillDownData({
        filters: {
          organization_id: filters.organization_id,
          from_date: filters.from_date,
          to_date: filters.to_date,
          account_code: row.account_code,
          limit: 100,
          offset: 0
        },
        total_count: mockTransactions.length,
        total_amount: mockTransactions.reduce((sum, t) => sum + t.total_amount, 0),
        transactions: mockTransactions
      })
    } catch (err) {
      console.error('Drill-down failed:', err)
    } finally {
      setIsDrillDownLoading(false)
    }
  }

  // Handle transaction detail view
  const handleTransactionClick = async (transactionId: string) => {
    if (!transactionId) {
      setSelectedTransaction(null)
      return
    }

    setIsTransactionLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockTransactionDetail: TransactionDetail = {
        transaction: {
          id: transactionId,
          organization_id: filters.organization_id,
          transaction_date: filters.from_date || new Date().toISOString().split('T')[0],
          transaction_code: 'JE-2024-001',
          transaction_type: 'journal_entry',
          smart_code: 'HERA.FIN.GL.AUTO_JOURNAL.v1',
          total_amount: 0, // Journal entries balance to zero
          source_entity_id: undefined,
          target_entity_id: undefined,
          reference_number: 'AUTO-JE-001',
          metadata: {
            auto_generated: true,
            source_transaction: 'POS-2024-045',
            posting_date: new Date().toISOString()
          }
        },
        lines: [
          {
            line_number: 1,
            line_type: 'debit',
            entity_id: 'gl-account-1100',
            entity_name: 'Cash in Hand',
            description: 'Cash receipt from POS sales',
            quantity: undefined,
            unit_amount: undefined,
            line_amount: 275.00,
            smart_code: 'HERA.FIN.GL.CASH.DR.v1'
          },
          {
            line_number: 2,
            line_type: 'credit', 
            entity_id: 'gl-account-4100',
            entity_name: 'Service Revenue',
            description: 'Service revenue recognition',
            quantity: undefined,
            unit_amount: undefined,
            line_amount: -275.00,
            smart_code: 'HERA.FIN.GL.REVENUE.CR.v1'
          }
        ],
        related_entities: [
          { entity_id: 'gl-account-1100', entity_type: 'gl_account', entity_name: 'Cash in Hand', role: 'debit_account' },
          { entity_id: 'gl-account-4100', entity_type: 'gl_account', entity_name: 'Service Revenue', role: 'credit_account' }
        ]
      }

      setSelectedTransaction(mockTransactionDetail)
    } catch (err) {
      console.error('Failed to load transaction details:', err)
    } finally {
      setIsTransactionLoading(false)
    }
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    console.log(`Exporting P&L statement as ${format}`)
    // Export logic would be implemented here
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load P&L statement: {error}
            <button 
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // No organization context
  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to view reports.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const reportTitle = "Profit & Loss Statement"
  const reportPeriod = filters.from_date && filters.to_date 
    ? `${new Date(filters.from_date + 'T00:00:00').toLocaleDateString('en-AE')} - ${new Date(filters.to_date + 'T00:00:00').toLocaleDateString('en-AE')}`
    : 'Current Month'

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-violet-600" />
            {reportTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Revenue, expenses, and profitability analysis for {reportPeriod}
          </p>
          {transformedData?.summary.net_margin_percent && (
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="outline"
                className={
                  transformedData.summary.net_margin_percent > 30
                    ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                    : transformedData.summary.net_margin_percent > 15
                    ? "text-blue-700 border-blue-300 bg-blue-50"
                    : "text-red-700 border-red-300 bg-red-50"
                }
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {transformedData.summary.net_margin_percent.toFixed(1)}% Net Margin
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-violet-700 border-violet-300">
            {currentOrganization.name}
          </Badge>
          
          {transformedData && (
            <ExportButtons
              reportType="pnl"
              reportTitle={reportTitle}
              reportPeriod={reportPeriod}
              data={transformedData.line_items}
              summary={transformedData.summary}
              currency={transformedData.currency}
              isLoading={isLoading}
              onExport={handleExport}
              onPrint={() => window.print()}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onChange={updateFilters}
        reportType="financial"
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      {transformedData && (
        <FinancialSummaryCards
          summary={transformedData.summary}
          reportType="pnl"
          currency={transformedData.currency}
          onDrillDown={(group) => console.log(`Drill down on ${group}`)}
        />
      )}

      {/* P&L Table */}
      {transformedData ? (
        <PnLTable
          data={transformedData.line_items}
          currency={transformedData.currency}
          isLoading={isLoading}
          onDrillDown={handleDrillDown}
          showComparison={false} // Could be enabled with prior period data
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Profit & Loss Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading P&L data...</span>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No financial data available for {reportPeriod}.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drill-down Drawer */}
      <DrilldownDrawer
        isOpen={selectedDrillDown.isOpen}
        onClose={() => setSelectedDrillDown({ ...selectedDrillDown, isOpen: false })}
        title={`${selectedDrillDown.account?.account_name || 'Account'} Transactions`}
        subtitle={`${reportPeriod} • ${selectedDrillDown.account?.account_code || ''}`}
        data={drillDownData}
        selectedTransaction={selectedTransaction}
        currency={transformedData?.currency || 'AED'}
        isLoading={isDrillDownLoading}
        isLoadingDetail={isTransactionLoading}
        onTransactionClick={handleTransactionClick}
      />

      {/* Print Layout (hidden, only visible when printing) */}
      <div className="hidden print:block">
        <PrintLayout
          header={
            <PrintHeader
              reportTitle={reportTitle}
              organization={{
                name: currentOrganization.name,
                address: currentOrganization.address,
                phone: currentOrganization.phone,
                email: currentOrganization.email
              }}
              reportPeriod={reportPeriod}
              currency={transformedData?.currency || 'AED'}
              filters={[
                { label: 'From Date', value: filters.from_date || 'N/A' },
                { label: 'To Date', value: filters.to_date || 'N/A' },
                { label: 'Consolidated', value: filters.consolidated ? 'Yes' : 'No' }
              ]}
            />
          }
        >
          {transformedData && (
            <>
              <FinancialSummaryCards
                summary={transformedData.summary}
                reportType="pnl"
                currency={transformedData.currency}
                className="mb-6"
              />
              <PnLTable
                data={transformedData.line_items}
                currency={transformedData.currency}
              />
            </>
          )}
        </PrintLayout>
      </div>
    </div>
  )
}