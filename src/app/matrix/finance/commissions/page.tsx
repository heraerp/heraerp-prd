'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function CommissionsPage() {
  const { auth } = useHera()
  const emit = useEmitTxn()
  const [from, setFrom] = React.useState<string>(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10))
  const [to, setTo] = React.useState<string>(() => new Date().toISOString().slice(0, 10))
  const [notice, setNotice] = React.useState<string | null>(null)

  async function runCalc() {
    setNotice(null)
    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.FIN.COMMISSION.CALC.POST.V1',
        transaction_type: 'COMMISSION',
        header: { date: new Date().toISOString(), memo: 'Commission Calc' },
        lines: [
          { line_number: 1, line_type: 'SERVICE', metadata: { from, to } }
        ]
      })
      setNotice(`Commission calc triggered: ${(res as any)?.transaction_id || 'ok'}`)
    } catch (e: any) {
      setNotice(e?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Commissions</h2>
      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-2" type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input className="border rounded px-2 py-2" type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={runCalc} disabled={emit.isLoading}>
          {emit.isLoading ? 'Running…' : 'Run Commission Calc'}
        </button>
      </div>
      {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
    </div>
  )
}

