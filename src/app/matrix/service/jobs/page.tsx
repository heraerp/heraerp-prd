'use client'

import React from 'react'
import { useEntitiesList } from '@/lib/hooks/hera'

export default function ServiceJobsPage() {
  const { data, isLoading } = useEntitiesList({ entity_type: 'SERVICE_JOB', page: 1, page_size: 50 })
  const items = (data as any)?.items || []
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Service Jobs</h2>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="space-y-1">
          {items.map((j: any) => (
            <li key={j.id || j.entity_id} className="border rounded p-2">
              <div className="font-medium">{j.entity_name}</div>
              <div className="text-xs text-muted-foreground">{j.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

