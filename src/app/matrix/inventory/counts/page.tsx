'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function InventoryCountsPage() {
  const { auth } = useHera()
  const emit = useEmitTxn()
  const [branchId, setBranchId] = React.useState('')
  const [items, setItems] = React.useState<{ entity_id: string; qty: number }[]>([])
  const [notice, setNotice] = React.useState<string | null>(null)

  async function submit() {
    setNotice(null)
    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.INV.COUNT.POST.V1',
        transaction_type: 'COUNT',
        header: { date: new Date().toISOString(), branch_id: branchId },
        lines: items.map((it, i) => ({ line_number: i + 1, line_type: 'INVENTORY', entity_id: it.entity_id, quantity: it.qty }))
      })
      setNotice(`Count posted: ${(res as any)?.transaction_id || 'ok'}`)
      setItems([])
    } catch (e: any) {
      setNotice(e?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="border rounded px-2 py-2" placeholder="Branch ID" value={branchId} onChange={e => setBranchId(e.target.value)} />
        <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={submit} disabled={emit.isLoading}>
          {emit.isLoading ? 'Posting…' : 'Post Count'}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Product ID" value={it.entity_id} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, entity_id: e.target.value } : r)))} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Qty" value={it.qty} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, qty: Number(e.target.value) } : r)))} />
            <button className="px-2 py-1 rounded bg-muted" onClick={() => setItems(arr => arr.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}
        <button className="px-3 py-1 rounded bg-secondary text-secondary-foreground" onClick={() => setItems(arr => [...arr, { entity_id: '', qty: 0 }])}>
          Add Line
        </button>
      </div>
      {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
    </div>
  )
}

