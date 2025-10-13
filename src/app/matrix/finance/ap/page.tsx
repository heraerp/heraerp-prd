'use client'

import React from 'react'
import { useEntitiesList } from '@/lib/hooks/hera'

export default function AccountsPayablePage() {
  const { data, isLoading } = useEntitiesList({ entity_type: 'AP', page: 1, page_size: 50 })
  const items = (data as any)?.items || []
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Accounts Payable</h2>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <table className="min-w-full text-sm border">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 border-b">Vendor</th>
              <th className="text-left p-2 border-b">Code</th>
              <th className="text-left p-2 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any) => (
              <tr key={it.id || it.entity_id} className="border-b">
                <td className="p-2">{it.entity_name}</td>
                <td className="p-2">{it.entity_code}</td>
                <td className="p-2">{it.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

