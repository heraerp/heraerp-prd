'use client'

import React from 'react'
import { useLedgerReport } from '@/lib/hooks/hera'

export default function TrialBalancePage() {
  const [from, setFrom] = React.useState<string>(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
  const [to, setTo] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const { data, isLoading, refetch } = useLedgerReport({ report: 'TB', from, to })
  const series = (data as any)?.series || []
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-2" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input className="border rounded px-2 py-2" type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Run'}
        </button>
      </div>
      <ul className="space-y-2">
        {series.map((s: any) => (
          <li key={s.label} className="border rounded p-3 flex justify-between">
            <span>{s.label}</span>
            <span>{Number(s.value).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

