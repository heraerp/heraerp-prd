'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'

type CartItem = { product_id: string; qty: number; price: number; serials?: string[] }

export default function SalesPOSPage() {
  const { auth } = useHera()
  const emit = useEmitTxn()

  const [branchId, setBranchId] = React.useState('')
  const [customerId, setCustomerId] = React.useState('')
  const [discount, setDiscount] = React.useState<number>(0)
  const [tax, setTax] = React.useState<number>(0)
  const [paid, setPaid] = React.useState<number>(0)
  const [payMethod, setPayMethod] = React.useState('CASH')
  const [items, setItems] = React.useState<CartItem[]>([])
  const [notice, setNotice] = React.useState<string | null>(null)

  function addLine() {
    setItems(arr => [...arr, { product_id: '', qty: 1, price: 0 }])
  }

  function setLine(i: number, patch: Partial<CartItem>) {
    setItems(arr => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  const total = items.reduce((s, it) => s + it.qty * it.price, 0) - Math.abs(discount) + tax

  async function checkout() {
    setNotice(null)
    const header = {
      date: new Date().toISOString(),
      branch_id: branchId,
      customer_id: customerId,
      memo: 'POS Sale',
      currency: 'INR'
    }
    const lines = [
      ...items.map((it, i) => ({
        line_number: i + 1,
        line_type: 'ITEM',
        entity_id: it.product_id,
        quantity: it.qty,
        unit_amount: it.price,
        metadata: it.serials ? { serials: it.serials } : undefined
      })),
      ...(discount
        ? [
            {
              line_number: 900,
              line_type: 'DISCOUNT',
              line_amount: -Math.abs(discount)
            }
          ]
        : []),
      ...(tax ? [{ line_number: 990, line_type: 'TAX', line_amount: tax }] : []),
      {
        line_number: 1000,
        line_type: 'PAYMENT',
        line_amount: paid || total,
        metadata: { method: payMethod }
      }
    ] as any[]

    try {
      const res = await emit.mutateAsync({
        organization_id: auth.organization_id,
        smart_code: 'HERA.ITD.SALES.POS.POST.V1',
        transaction_type: 'SALE',
        header,
        lines
      })
      setNotice(`Sale posted. Transaction ID: ${(res as any)?.transaction_id || 'ok'}`)
      // Reset cart
      setItems([])
      setDiscount(0)
      setTax(0)
      setPaid(0)
    } catch (e: any) {
      setNotice(e?.message || 'Failed to post sale')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border rounded px-2 py-2" placeholder="Branch ID" value={branchId} onChange={e => setBranchId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Discount" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
        <input className="border rounded px-2 py-2" placeholder="Tax" type="number" value={tax} onChange={e => setTax(Number(e.target.value))} />
      </div>

      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 items-center">
            <input className="border rounded px-2 py-1 col-span-2" placeholder="Product ID" value={it.product_id} onChange={e => setLine(i, { product_id: e.target.value })} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Qty" value={it.qty} onChange={e => setLine(i, { qty: Number(e.target.value) })} />
            <input className="border rounded px-2 py-1" type="number" placeholder="Price" value={it.price} onChange={e => setLine(i, { price: Number(e.target.value) })} />
            <button className="px-3 py-1 rounded bg-muted" onClick={() => setLine(i, { serials: [] })}>Ser</button>
            <button className="px-3 py-1 rounded bg-destructive text-destructive-foreground" onClick={() => setItems(arr => arr.filter((_, idx) => idx !== i))}>Del</button>
          </div>
        ))}
        <button className="px-3 py-2 rounded bg-secondary text-secondary-foreground" onClick={addLine}>
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="text-lg">Total: {total.toLocaleString()}</div>
        <input className="border rounded px-2 py-2" placeholder="Paid" type="number" value={paid} onChange={e => setPaid(Number(e.target.value))} />
        <input className="border rounded px-2 py-2" placeholder="Method" value={payMethod} onChange={e => setPayMethod(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={checkout} disabled={emit.isLoading}>
          {emit.isLoading ? 'Posting…' : 'Checkout'}
        </button>
        {notice && <div className="text-sm text-muted-foreground">{notice}</div>}
      </div>
    </div>
  )
}

