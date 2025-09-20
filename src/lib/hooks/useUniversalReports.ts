'use client'

import { useQuery } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'

interface UseUniversalReportsParams {
  organizationId: string
  reportType: 'daily_sales' | 'monthly_sales' | 'inventory_value' | 'staff_performance'
  dateRange: {
    start: string
    end: string
  }
}

export function useUniversalReports({ organizationId, reportType, dateRange }: UseUniversalReportsParams) {
  return useQuery({
    queryKey: ['reports', reportType, organizationId, dateRange],
    queryFn: async () => {
      // For daily sales report
      if (reportType === 'daily_sales') {
        // Set organization ID once before the query
        if (organizationId) {
          universalApi.setOrganizationId(organizationId)
        }
        
        const transactionsResult = await universalApi.getTransactions({
          organizationId: organizationId,
          filters: {
            transaction_type: 'sale'
            // Note: Supabase date filtering will be done in JavaScript below
          },
          orderBy: 'transaction_date',
          orderDirection: 'desc'
        })

        if (!transactionsResult.success || !transactionsResult.data) {
          console.log('No transactions found or error:', transactionsResult.error)
          return { summary: { total_gross: 0, transaction_count: 0, average_daily: 0 }, daily_breakdown: [] }
        }

        const transactions = transactionsResult.data.filter(txn => {
          const txnDate = txn.transaction_date?.split('T')[0]
          return txnDate >= dateRange.start && txnDate <= dateRange.end
        })

        // Calculate daily breakdown
        const dailyMap = new Map<string, { gross_sales: number; transaction_count: number }>()
        
        transactions.forEach(txn => {
          const date = txn.transaction_date.split('T')[0]
          const current = dailyMap.get(date) || { gross_sales: 0, transaction_count: 0 }
          current.gross_sales += txn.total_amount || 0
          current.transaction_count += 1
          dailyMap.set(date, current)
        })

        // Fill in missing dates with zero values
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)
        const daily_breakdown = []
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          const data = dailyMap.get(dateStr) || { gross_sales: 0, transaction_count: 0 }
          daily_breakdown.push({
            date: dateStr,
            ...data
          })
        }

        // Calculate summary
        const summary = {
          total_gross: daily_breakdown.reduce((sum, day) => sum + day.gross_sales, 0),
          transaction_count: daily_breakdown.reduce((sum, day) => sum + day.transaction_count, 0),
          average_daily: daily_breakdown.length > 0 
            ? daily_breakdown.reduce((sum, day) => sum + day.gross_sales, 0) / daily_breakdown.length 
            : 0
        }

        return {
          summary,
          daily_breakdown
        }
      }

      // Other report types would be implemented similarly
      return null
    },
    enabled: !!organizationId
  })
}