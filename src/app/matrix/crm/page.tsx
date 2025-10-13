'use client'

import React from 'react'
import { useEntitiesList } from '@/lib/hooks/hera'

export default function CRMPage() {
  const { data, isLoading } = useEntitiesList({ entity_type: 'CUSTOMER', page: 1, page_size: 25 })
  const items = (data as any)?.items || []
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Customers</h2>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="space-y-1">
          {items.map((c: any) => (
            <li key={c.id || c.entity_id} className="border rounded p-2">
              <div className="font-medium">{c.entity_name}</div>
              <div className="text-xs text-muted-foreground">{c.entity_code}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

