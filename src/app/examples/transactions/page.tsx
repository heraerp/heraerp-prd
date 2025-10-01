// app/examples/transactions/page.tsx - Transaction worklist with filters
'use client'
import React from 'react'
import { FilterBar, DataTable, useTransactions } from '@/ui'
import { useRouter } from 'next/navigation'

export default function TransactionWorklist() {
  const router = useRouter()
  const [filters, setFilters] = React.useState<Record<string, any>>({})
  const { data, isLoading } = useTransactions(filters)

  // Format currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <p className="text-gray-600 mt-1">View and manage all transactions</p>
      </div>

      <FilterBar
        value={filters}
        onChange={setFilters}
        fields={['q', 'status', 'date_from', 'date_to']}
      />

      <DataTable
        rows={data ?? []}
        loading={isLoading}
        onRowClick={(row: any) => router.push(`/examples/transactions/${row.id}`)}
        columns={[
          {
            header: 'Reference',
            key: 'reference_number',
            render: row => row.reference_number || row.id.slice(0, 8)
          },
          { header: 'Type', key: 'transaction_type' },
          {
            header: 'Date',
            key: 'transaction_date',
            render: row => formatDate(row.transaction_date)
          },
          {
            header: 'Amount',
            key: 'total_amount',
            render: row => formatAmount(row.total_amount, row.transaction_currency_code)
          },
          {
            header: 'Status',
            key: 'status',
            render: row => (
              <span
                className={`
                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${row.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                ${row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${row.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                ${row.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
              `}
              >
                {row.status}
              </span>
            )
          }
        ]}
      />
    </div>
  )
}
