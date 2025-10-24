'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

export default function SalesQuotesPage() {
  const { client, auth } = useHera()
  const emit = useEmitTxn()
  const [customerId, setCustomerId] = React.useState('')
  const [branchId, setBranchId] = React.useState('')
  const [items, setItems] = React.useState<{ entity_id: string; qty: number; price: number }[]>([])
  const [list, setList] = React.useState<any[]>([])

  async function refresh() {
    const res = await client.txnQuery({ organization_id: auth.organization_id, transaction_type: 'QUOTE', include_lines: false })
    setList(res?.transactions || [])
  }
  React.useEffect(() => { if (auth.organization_id) refresh() }, [auth.organization_id])

  async function createQuote() {
    await emit.mutateAsync({
      organization_id: auth.organization_id,
      smart_code: 'HERA.ITD.SALES.QUOTE.POST.V1',
      transaction_type: 'QUOTE',
      header: { date: new Date().toISOString(), branch_id: branchId, customer_id: customerId },
      lines: items.map((it, i) => ({ line_number: i + 1, line_type: 'ITEM', entity_id: it.entity_id, quantity: it.qty, unit_amount: it.price }))
    })
    setItems([])
    refresh()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sales Quotes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input className="border rounded px-2 py-2" placeholder="Branch ID" value={branchId} onChange={e => setBranchId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input className="border rounded px-2 py-1" placeholder="Product ID" value={it.entity_id} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, entity_id: e.target.value } : r)))} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Qty" value={it.qty} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, qty: Number(e.target.value) } : r)))} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Price" value={it.price} onChange={e => setItems(arr => arr.map((r, idx) => (idx === i ? { ...r, price: Number(e.target.value) } : r)))} />
          </div>
        ))}
        <button className="px-3 py-1 rounded bg-secondary text-secondary-foreground" onClick={() => setItems(a => [...a, { entity_id: '', qty: 1, price: 0 }])}>Add Line</button>
      </div>
      <button className="px-3 py-2 rounded bg-primary text-primary-foreground" onClick={createQuote}>Create Quote</button>
      <div className="border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t: any) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.id}</td>
                <td className="p-2">{t.transaction_type}</td>
                <td className="p-2">{t.transaction_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

