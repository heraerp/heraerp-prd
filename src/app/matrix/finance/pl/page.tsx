'use client'

import React from 'react'
import { useLedgerReport, useHera } from '@/lib/hooks/hera'

export default function ProfitAndLossPage() {
  const { auth } = useHera()
  const [from, setFrom] = React.useState<string>(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
  const [to, setTo] = React.useState<string>(() => new Date().toISOString().slice(0, 10))

  const { data, isLoading, refetch } = useLedgerReport({ report: 'PL', from, to })
  const series = (data as any)?.series || []

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-2" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input className="border rounded px-2 py-2" type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Run'}
        </button>
      </div>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {series.map((s: any) => (
          <div key={s.label} className="rounded border p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold">{Number(s.value).toLocaleString()}</div>
          </div>
        ))}
        {!isLoading && series.length === 0 && (
          <div className="text-sm text-muted-foreground">No data</div>
        )}
      </div>
    </div>
  )
}

