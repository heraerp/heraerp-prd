'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'
import { ShoppingCart, Plus, Trash2, CreditCard, Calculator } from 'lucide-react'

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card glass-warm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-gradient-to-br from-[#BB8D3F]/30 to-[#8B4729]/20">
            <ShoppingCart className="w-6 h-6 text-[#8B4729]" />
          </div>
          <h1 className="text-2xl font-bold text-[#45492D]">Point of Sale</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#818865]">Branch ID</label>
            <input 
              className="glass-input w-full" 
              placeholder="Enter branch ID" 
              value={branchId} 
              onChange={e => setBranchId(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#818865]">Customer ID</label>
            <input 
              className="glass-input w-full" 
              placeholder="Enter customer ID" 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#818865]">Discount</label>
            <input 
              className="glass-input w-full" 
              placeholder="0" 
              type="number" 
              value={discount} 
              onChange={e => setDiscount(Number(e.target.value))} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#818865]">Tax</label>
            <input 
              className="glass-input w-full" 
              placeholder="0" 
              type="number" 
              value={tax} 
              onChange={e => setTax(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="glass-card glass-sage">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#45492D]">Shopping Cart</h2>
          <button 
            className="glass-btn-primary flex items-center gap-2" 
            onClick={addLine}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-[#818865]">
              No items in cart. Click "Add Item" to start.
            </div>
          ) : (
            items.map((it, i) => (
              <div key={i} className="glass p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-[#818865]">Product ID</label>
                    <input 
                      className="glass-input w-full text-sm" 
                      placeholder="Enter product ID" 
                      value={it.product_id} 
                      onChange={e => setLine(i, { product_id: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#818865]">Quantity</label>
                    <input 
                      className="glass-input w-full text-sm" 
                      type="number" 
                      placeholder="1" 
                      value={it.qty} 
                      onChange={e => setLine(i, { qty: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#818865]">Price</label>
                    <input 
                      className="glass-input w-full text-sm" 
                      type="number" 
                      placeholder="0.00" 
                      value={it.price} 
                      onChange={e => setLine(i, { price: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="glass-btn-secondary text-xs px-3 py-2" 
                      onClick={() => setLine(i, { serials: [] })}
                      title="Manage Serials"
                    >
                      Serials
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors" 
                      onClick={() => setItems(arr => arr.filter((_, idx) => idx !== i))}
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm text-[#818865]">Line Total: </span>
                  <span className="font-semibold text-[#45492D]">₹{(it.qty * it.price).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="glass-card glass-neutral">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-[#BB8D3F]" />
          <h2 className="text-xl font-semibold text-[#45492D]">Payment Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#818865]">Subtotal:</span>
                <span className="font-medium text-[#45492D]">₹{(items.reduce((s, it) => s + it.qty * it.price, 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#818865]">Discount:</span>
                <span className="font-medium text-red-600">-₹{Math.abs(discount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#818865]">Tax:</span>
                <span className="font-medium text-[#45492D]">₹{tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-[#818865]/20 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#45492D]">Total:</span>
                  <span className="text-[#8B4729]">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#818865]">Amount Paid</label>
            <input 
              className="glass-input w-full" 
              placeholder="Enter amount" 
              type="number" 
              value={paid} 
              onChange={e => setPaid(Number(e.target.value))} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#818865]">Payment Method</label>
            <select 
              className="glass-input w-full" 
              value={payMethod} 
              onChange={e => setPayMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions & Status */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3">
          <button 
            className="glass-btn-primary flex items-center gap-2 px-6 py-3 text-lg" 
            onClick={checkout} 
            disabled={emit.isLoading || items.length === 0}
          >
            <CreditCard className="w-5 h-5" />
            {emit.isLoading ? 'Processing...' : 'Complete Sale'}
          </button>
          {items.length > 0 && (
            <button 
              className="glass-btn-secondary px-4 py-3" 
              onClick={() => {
                setItems([])
                setDiscount(0)
                setTax(0)
                setPaid(0)
                setNotice(null)
              }}
            >
              Clear Cart
            </button>
          )}
        </div>
        
        {notice && (
          <div className={`glass px-4 py-2 rounded-lg ${
            notice.includes('posted') ? 'status-success text-green-700' : 'status-error text-red-700'
          }`}>
            {notice}
          </div>
        )}
      </div>
    </div>
  )
}

