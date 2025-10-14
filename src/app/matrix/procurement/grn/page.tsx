'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function ProcurementGRNPage() {
  const { auth } = useHera()
  const emit = useEmitTxn()
  const [vendorId, setVendorId] = React.useState('')
  const [branchId, setBranchId] = React.useState('')
  const [poTxnId, setPoTxnId] = React.useState('')
  const [items, setItems] = React.useState<{ entity_id: string; qty: number; price: number }[]>([])
  const [notice, setNotice] = React.useState<string | null>(null)

  async function postGRN() {
    setNotice(null)
    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.PUR.GRN.POST.V1',
        transaction_type: 'GRN',
        header: {
          date: new Date().toISOString(),
          branch_id: branchId,
          vendor_id: vendorId,
          memo: 'GRN',
          po_txn_ref: poTxnId || undefined
        },
        lines: items.map((it, i) => ({
          line_number: i + 1,
          line_type: 'ITEM',
          entity_id: it.entity_id,
          quantity: it.qty,
          unit_amount: it.price
        }))
      })
      setNotice(`GRN posted: ${(res as any)?.transaction_id || 'ok'}`)
      setItems([])
    } catch (e: any) {
      setNotice(e?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border rounded px-2 py-2" placeholder="Branch ID" value={branchId} onChange={e => setBranchId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Vendor ID" value={vendorId} onChange={e => setVendorId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="PO Transaction Ref (optional)" value={poTxnId} onChange={e => setPoTxnId(e.target.value)} />
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Product ID" value={it.entity_id} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, entity_id: e.target.value } : r)))} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Qty" value={it.qty} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, qty: Number(e.target.value) } : r)))} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Price" value={it.price} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, price: Number(e.target.value) } : r)))} />
          </div>
        ))}
        <button className="px-3 py-1 rounded bg-secondary text-secondary-foreground" onClick={() => setItems(arr => [...arr, { entity_id: '', qty: 1, price: 0 }])}>
          Add Line
        </button>
      </div>
      <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={postGRN} disabled={emit.isLoading}>
        {emit.isLoading ? 'Posting…' : 'Post GRN'}
      </button>
      {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
    </div>
  )
}

