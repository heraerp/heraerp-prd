// ================================================================================
// HERA REPORTS API HOOKS
// Smart Code: HERA.API.REPORTS.v1
// React Query hooks for financial reports
// ================================================================================

import { useQuery, useMutation } from '@tanstack/react-query'
import { universalApi } from '@/src/lib/universal-api'

export interface FinancialReport {
  id: string
  name: string
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'tax_report'
  date: string
  status: 'ready' | 'generating' | 'error'
  url?: string
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  reportType?: string
  includeDetails?: boolean
}

/**
 * Fetch available financial reports
 */
export function useFinancialReports(organizationId: string, filters?: ReportFilters) {
  return useQuery({
    queryKey: ['financial-reports', organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return []
      
      // Mock reports for now
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      return [
        {
          id: '1',
          name: 'Profit & Loss Statement',
          type: 'profit_loss',
          date: `${currentMonth}-01`,
          status: 'ready',
          url: '/api/reports/profit-loss.pdf'
        },
        {
          id: '2',
          name: 'Balance Sheet',
          type: 'balance_sheet',
          date: `${currentMonth}-01`,
          status: 'ready',
          url: '/api/reports/balance-sheet.pdf'
        },
        {
          id: '3',
          name: 'Cash Flow Statement',
          type: 'cash_flow',
          date: `${currentMonth}-01`,
          status: 'generating'
        },
        {
          id: '4',
          name: 'Trial Balance',
          type: 'trial_balance',
          date: `${currentMonth}-01`,
          status: 'ready',
          url: '/api/reports/trial-balance.pdf'
        },
        {
          id: '5',
          name: 'Tax Report',
          type: 'tax_report',
          date: `${currentMonth}-01`,
          status: 'ready',
          url: '/api/reports/tax-report.pdf'
        }
      ] as FinancialReport[]
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Generate a new financial report
 */
export function useGenerateReport() {
  return useMutation({
    mutationFn: async (params: {
      organizationId: string
      reportType: string
      startDate: string
      endDate: string
      options?: Record<string, any>
    }) => {
      const { organizationId, reportType, startDate, endDate, options } = params
      
      // Create a report generation transaction
      const report = await universalApi.createTransaction({
        organization_id: organizationId,
        transaction_type: 'report_generation',
        transaction_date: new Date().toISOString(),
        smart_code: `HERA.REPORT.GENERATE.${reportType.toUpperCase()}.v1`,
        metadata: {
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
          options
        }
      })
      
      return report
    }
  })
}

/**
 * Download a report
 */
export async function downloadReport(reportId: string, reportName: string) {
  try {
    // In a real implementation, this would fetch the report from the API
    const response = await fetch(`/api/reports/${reportId}/download`)
    
    if (!response.ok) {
      throw new Error('Failed to download report')
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportName}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading report:', error)
    throw error
  }
}