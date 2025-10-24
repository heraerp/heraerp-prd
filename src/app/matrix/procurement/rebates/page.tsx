'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function ProcurementRebatesPage() {
  const { auth } = useHera()
  const emit = useEmitTxn()
  const [vendorId, setVendorId] = React.useState('')
  const [amount, setAmount] = React.useState<number>(0)
  const [notice, setNotice] = React.useState<string | null>(null)

  async function submit() {
    setNotice(null)
    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.PUR.REBATE.POST.V1',
        transaction_type: 'REBATE',
        header: { date: new Date().toISOString(), vendor_id: vendorId },
        lines: [{ line_number: 1, line_type: 'AP', line_amount: -Math.abs(amount) }]
      })
      setNotice(`Rebate posted: ${(res as any)?.transaction_id || 'ok'}`)
      setAmount(0)
    } catch (e: any) {
      setNotice(e?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-3 max-w-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
        <input className="border rounded px-2 py-2" placeholder="Vendor ID" value={vendorId} onChange={e => setVendorId(e.target.value)} />
        <input className="border rounded px-2 py-2" type="number" placeholder="Amount" value={amount} onChange={e => setAmount(Number(e.target.value))} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={submit} disabled={emit.isLoading}>
          {emit.isLoading ? 'Posting…' : 'Post Rebate'}
        </button>
      </div>
      {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
    </div>
  )
}

