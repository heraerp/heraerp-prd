'use client'

import React from 'react'
import { useEntitiesList } from '@/lib/hooks/hera'

export default function InventorySerialsPage() {
  const [serial, setSerial] = React.useState('')
  const { data, isLoading, refetch } = useEntitiesList({
    entity_type: 'SERIAL',
    filters: serial ? { serial } : undefined,
    enabled: false
  })
  const items = (data as any)?.items || []

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="border rounded px-2 py-2 w-full" placeholder="Search by serial/IMEI" value={serial} onChange={e => setSerial(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Serial</th>
              <th className="text-left p-2 border-b">Product</th>
              <th className="text-left p-2 border-b">Branch</th>
              <th className="text-left p-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={it.id || it.entity_id} className="border-b">
                <td className="p-2">{it.attributes?.serial || it.serial}</td>
                <td className="p-2">{it.attributes?.product_code || it.product_code}</td>
                <td className="p-2">{it.attributes?.branch_id || it.branch_id}</td>
                <td className="p-2">{it.status || it.attributes?.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

