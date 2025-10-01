// ================================================================================
// DAILY SALES REPORT PAGE
// Smart Code: HERA.UI.REPORTS.DAILY_SALES.v1
// Production-ready daily sales analysis with drill-down capabilities
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { FiltersBar, useReportFilters } from '@/components/reports/FiltersBar'
import { SalesSummaryCards } from '@/components/reports/SummaryCards'
import { SalesTable } from '@/components/reports/SalesTable'
import { DrilldownDrawer } from '@/components/reports/DrilldownDrawer'
import { ExportButtons } from '@/components/reports/ExportButtons'
import { PrintHeader, PrintLayout } from '@/components/reports/PrintHeader'
import { useUniversalReports } from '@/hooks/useUniversalReports'
import { SalesFilters, SalesRow, DrillDownResponse, TransactionDetail } from '@/lib/schemas/reports'
import { useOrganization } from '@/components/organization/OrganizationProvider'

export default function DailySalesReportPage() {
  const { currentOrganization } = useOrganization()
  const [selectedDrillDown, setSelectedDrillDown] = React.useState<{
    type: 'service' | 'product' | 'vat' | 'tips' | 'total'
    row?: SalesRow
    isOpen: boolean
  }>({ type: 'service', isOpen: false })

  const [drillDownData, setDrillDownData] = React.useState<DrillDownResponse | null>(null)
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionDetail | null>(
    null
  )
  const [isDrillDownLoading, setIsDrillDownLoading] = React.useState(false)
  const [isTransactionLoading, setIsTransactionLoading] = React.useState(false)

  // Initialize filters with today's date
  const initialFilters: SalesFilters = {
    organization_id: currentOrganization?.id || '',
    date: new Date().toISOString().split('T')[0],
    include_tips: true,
    service_only: false,
    product_only: false,
    currency: 'AED'
  }

  const { filters, updateFilters } = useReportFilters(initialFilters)

  // Main report data using useUniversalReports hook
  const { isLoading, error, data: reportData, getTodayMetrics, clearError } = useUniversalReports()

  // Load daily sales data
  React.useEffect(() => {
    if (currentOrganization?.id && filters.date) {
      getTodayMetrics()
    }
  }, [currentOrganization?.id, filters.date, filters.branch_id, getTodayMetrics])

  // Mock data transformation (in production, this would come from the API)
  const transformedData = React.useMemo(() => {
    if (!reportData) return null

    // Transform universal report data to daily sales format
    // This is where you'd map the useUniversalReports data to the expected format
    const mockSummary = {
      total_gross: 4147.5,
      total_net: 3950,
      total_vat: 197.5,
      total_tips: 340,
      total_service: 3375,
      total_product: 575,
      transaction_count: 22,
      average_ticket: 188.52,
      service_mix_percent: 85.44,
      product_mix_percent: 14.56
    }

    const mockHourlyData: SalesRow[] = [
      {
        hour: '09:00',
        service_net: 450,
        product_net: 75,
        tips: 45,
        vat: 26.25,
        gross: 551.25,
        txn_count: 3,
        avg_ticket: 183.75
      },
      {
        hour: '10:00',
        service_net: 600,
        product_net: 100,
        tips: 60,
        vat: 35,
        gross: 735,
        txn_count: 4,
        avg_ticket: 183.75
      },
      {
        hour: '11:00',
        service_net: 750,
        product_net: 125,
        tips: 75,
        vat: 43.75,
        gross: 918.75,
        txn_count: 5,
        avg_ticket: 183.75
      },
      {
        hour: '14:00',
        service_net: 900,
        product_net: 150,
        tips: 90,
        vat: 52.5,
        gross: 1102.5,
        txn_count: 6,
        avg_ticket: 183.75
      },
      {
        hour: '15:00',
        service_net: 675,
        product_net: 125,
        tips: 70,
        vat: 40,
        gross: 840,
        txn_count: 4,
        avg_ticket: 210
      }
    ]

    return {
      summary: mockSummary,
      hourly_breakdown: mockHourlyData,
      currency: filters.currency || 'AED'
    }
  }, [reportData, filters.currency])

  // Handle drill-down clicks
  const handleDrillDown = async (
    type: 'service' | 'product' | 'vat' | 'tips' | 'total',
    row?: SalesRow
  ) => {
    setSelectedDrillDown({ type, row, isOpen: true })
    setIsDrillDownLoading(true)
    setDrillDownData(null)
    setSelectedTransaction(null)

    try {
      // In production, this would call your drill-down API
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      const mockTransactions = [
        {
          transaction_id: '123e4567-e89b-12d3-a456-426614174000',
          transaction_date: filters.date || new Date().toISOString().split('T')[0],
          transaction_code: 'POS-2024-001',
          transaction_type: 'pos_sale',
          smart_code: 'HERA.SALON.POS.SALE.TXN.V1',
          customer_name: 'Sarah Johnson',
          staff_name: 'Maria Rodriguez',
          total_amount: 275.0,
          description: 'Hair Cut & Color Service',
          line_count: 3
        },
        {
          transaction_id: '456e7890-e89b-12d3-a456-426614174001',
          transaction_date: filters.date || new Date().toISOString().split('T')[0],
          transaction_code: 'POS-2024-002',
          transaction_type: 'pos_sale',
          smart_code: 'HERA.SALON.POS.SALE.TXN.V1',
          customer_name: 'Emily Chen',
          staff_name: 'Lisa Thompson',
          total_amount: 185.0,
          description: 'Deep Conditioning Treatment',
          line_count: 2
        }
      ]

      setDrillDownData({
        filters: {
          organization_id: filters.organization_id,
          from_date: filters.date,
          to_date: filters.date,
          service_only: type === 'service',
          product_only: type === 'product',
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
      // In production, fetch transaction details
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockTransactionDetail: TransactionDetail = {
        transaction: {
          id: transactionId,
          organization_id: filters.organization_id,
          transaction_date: filters.date || new Date().toISOString().split('T')[0],
          transaction_code: 'POS-2024-001',
          transaction_type: 'pos_sale',
          smart_code: 'HERA.SALON.POS.SALE.TXN.V1',
          total_amount: 275.0,
          source_entity_id: 'customer-123',
          target_entity_id: 'salon-location-1',
          reference_number: 'APT-2024-045',
          metadata: {
            pos_terminal: 'TERMINAL_01',
            staff_id: 'staff-456',
            customer_id: 'customer-123'
          }
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            entity_id: 'service-haircut',
            entity_name: 'Premium Hair Cut',
            description: 'Hair Cut & Styling - Premium',
            quantity: 1,
            unit_amount: 150.0,
            line_amount: 150.0,
            smart_code: 'HERA.SALON.SERVICE.HAIRCUT.V1'
          },
          {
            line_number: 2,
            line_type: 'service',
            entity_id: 'service-color',
            entity_name: 'Hair Coloring',
            description: 'Full Hair Color Treatment',
            quantity: 1,
            unit_amount: 100.0,
            line_amount: 100.0,
            smart_code: 'HERA.SALON.SERVICE.COLOR.V1'
          },
          {
            line_number: 3,
            line_type: 'tax',
            entity_id: 'tax-vat',
            entity_name: 'VAT 5%',
            description: 'VAT on Services (5%)',
            quantity: 1,
            unit_amount: 12.5,
            line_amount: 12.5,
            smart_code: 'HERA.SALON.TAX.VAT.V1'
          }
        ],
        related_entities: [
          {
            entity_id: 'customer-123',
            entity_type: 'customer',
            entity_name: 'Sarah Johnson',
            role: 'customer'
          },
          {
            entity_id: 'staff-456',
            entity_type: 'employee',
            entity_name: 'Maria Rodriguez',
            role: 'stylist'
          },
          {
            entity_id: 'salon-location-1',
            entity_type: 'location',
            entity_name: 'Main Salon',
            role: 'location'
          }
        ],
        auto_journal_entries: [
          {
            account_code: '1100',
            account_name: 'Cash in Hand',
            debit_amount: 275.0,
            smart_code: 'HERA.FIN.GL.CASH.RECEIPT.V1'
          },
          {
            account_code: '4100',
            account_name: 'Service Revenue',
            credit_amount: 250.0,
            smart_code: 'HERA.FIN.GL.REVENUE.SERVICE.V1'
          },
          {
            account_code: '2100',
            account_name: 'VAT Payable',
            credit_amount: 12.5,
            smart_code: 'HERA.FIN.GL.VAT.PAYABLE.V1'
          },
          {
            account_code: '6500',
            account_name: 'Staff Commission',
            debit_amount: 100.0,
            smart_code: 'HERA.FIN.GL.COMMISSION.V1'
          },
          {
            account_code: '2200',
            account_name: 'Commission Payable',
            credit_amount: 100.0,
            smart_code: 'HERA.FIN.GL.COMMISSION.PAYABLE.V1'
          }
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
    console.log(`Exporting daily sales report as ${format}`)
    // Export logic would be implemented here
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load daily sales report: {error}
            <button onClick={clearError} className="ml-2 underline hover:no-underline">
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
          <AlertDescription>Please select an organization to view reports.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const reportTitle = 'Daily Sales Report'
  const reportPeriod = filters.date
    ? new Date(filters.date + 'T00:00:00').toLocaleDateString('en-AE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Today'

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-violet-600" />
            {reportTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Hourly revenue analysis for {reportPeriod}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-violet-700 border-violet-300">
            {currentOrganization.name}
          </Badge>

          {transformedData && (
            <ExportButtons
              reportType="daily_sales"
              reportTitle={reportTitle}
              reportPeriod={reportPeriod}
              data={transformedData.hourly_breakdown}
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
        reportType="sales"
        isLoading={isLoading}
      />

      {/* Summary Cards */}
      {transformedData && (
        <SalesSummaryCards
          summary={transformedData.summary}
          currency={transformedData.currency}
          onDrillDown={type => handleDrillDown(type)}
        />
      )}

      {/* Sales Table */}
      {transformedData ? (
        <SalesTable
          data={transformedData.hourly_breakdown}
          reportType="daily"
          currency={transformedData.currency}
          isLoading={isLoading}
          onDrillDown={handleDrillDown}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Sales Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading sales data...</span>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sales data available for {reportPeriod}.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Drill-down Drawer */}
      <DrilldownDrawer
        isOpen={selectedDrillDown.isOpen}
        onClose={() => setSelectedDrillDown({ ...selectedDrillDown, isOpen: false })}
        title={`${selectedDrillDown.type.charAt(0).toUpperCase() + selectedDrillDown.type.slice(1)} Transactions`}
        subtitle={`${reportPeriod}${selectedDrillDown.row?.hour ? ` • ${selectedDrillDown.row.hour}` : ''}`}
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
                { label: 'Date', value: reportPeriod },
                { label: 'Include Tips', value: filters.include_tips ? 'Yes' : 'No' }
              ]}
            />
          }
        >
          {transformedData && (
            <>
              <SalesSummaryCards
                summary={transformedData.summary}
                currency={transformedData.currency}
                className="mb-6"
              />
              <SalesTable
                data={transformedData.hourly_breakdown}
                reportType="daily"
                currency={transformedData.currency}
              />
            </>
          )}
        </PrintLayout>
      </div>
    </div>
  )
}
