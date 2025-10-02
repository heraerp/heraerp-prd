// src/ui/components/LinesTable.tsx
import React from 'react'
import { DataTable } from './DataTable'

export function LinesTable({ rows }: { rows: any[] }) {
  return (
    <DataTable
      rows={rows}
      columns={[
        { header: '#', key: 'line_number', width: '60px' },
        { header: 'Type', key: 'line_type' },
        { header: 'Description', key: 'description' },
        { header: 'Qty', key: 'quantity', width: '100px' },
        { header: 'Unit', key: 'unit_amount', width: '120px' },
        { header: 'Amount', key: 'line_amount', width: '140px' }
      ]}
    />
  )
}
