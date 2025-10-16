'use client'

import React from 'react'
import { useEmitTxn, useHera } from '@/lib/hooks/hera'
import { 
  ShoppingCart, Plus, Trash2, CreditCard, Calculator, 
  Scan, User, Building, Percent, Receipt, Save
} from 'lucide-react'

type CartItem = { product_id: string; qty: number; price: number; serials?: string[] }

export default function RetailPOSPage() {
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

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
  const total = subtotal - Math.abs(discount) + tax

  async function checkout() {
    setNotice(null)
    const header = {
      date: new Date().toISOString(),
      branch_id: branchId,
      customer_id: customerId,
      memo: 'Modern Retail POS Sale',
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
      setNotice(`Sale completed successfully! Transaction ID: ${(res as any)?.transaction_id || 'Generated'}`)
      // Reset cart
      setItems([])
      setDiscount(0)
      setTax(0)
      setPaid(0)
    } catch (e: any) {
      setNotice(e?.message || 'Failed to complete sale')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="modern-card modern-primary">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-gradient-to-br from-[#1E88E5]/30 to-[#1565C0]/20">
            <ShoppingCart className="w-7 h-7 text-[#1565C0]" />
          </div>
          <div>
            <h1 className="modern-heading text-2xl text-[#1E1E20]">Point of Sale</h1>
            <p className="modern-subheading">Process customer transactions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="modern-caption flex items-center gap-2">
              <Building className="w-3 h-3" />
              Branch ID
            </label>
            <input 
              className="modern-input w-full" 
              placeholder="Enter branch identifier" 
              value={branchId} 
              onChange={e => setBranchId(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="modern-caption flex items-center gap-2">
              <User className="w-3 h-3" />
              Customer ID
            </label>
            <input 
              className="modern-input w-full" 
              placeholder="Enter customer ID" 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="modern-caption flex items-center gap-2">
              <Percent className="w-3 h-3" />
              Discount Amount
            </label>
            <input 
              className="modern-input w-full" 
              placeholder="0.00" 
              type="number" 
              value={discount} 
              onChange={e => setDiscount(Number(e.target.value))} 
            />
          </div>
          <div className="space-y-2">
            <label className="modern-caption">Tax Amount</label>
            <input 
              className="modern-input w-full" 
              placeholder="0.00" 
              type="number" 
              value={tax} 
              onChange={e => setTax(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="modern-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="modern-heading text-xl text-[#1E1E20] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
          </h2>
          <button 
            className="modern-btn-primary flex items-center gap-2" 
            onClick={addLine}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
        
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="modern-surface p-8 text-center rounded-2xl">
              <ShoppingCart className="w-12 h-12 text-[#4B5563] mx-auto mb-3" />
              <p className="modern-subheading mb-2">Cart is empty</p>
              <p className="modern-caption">Add items to start building your sale</p>
            </div>
          ) : (
            items.map((it, i) => (
              <div key={i} className="modern-elevated p-4 rounded-xl border border-[#E5E7EB]">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2 space-y-2">
                    <label className="modern-caption">Product ID</label>
                    <div className="relative">
                      <input 
                        className="modern-input w-full pl-10" 
                        placeholder="Scan or enter product ID" 
                        value={it.product_id} 
                        onChange={e => setLine(i, { product_id: e.target.value })} 
                      />
                      <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="modern-caption">Quantity</label>
                    <input 
                      className="modern-input w-full text-center font-medium" 
                      type="number" 
                      min="1"
                      value={it.qty} 
                      onChange={e => setLine(i, { qty: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="modern-caption">Unit Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]">₹</span>
                      <input 
                        className="modern-input w-full pl-8" 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        value={it.price} 
                        onChange={e => setLine(i, { price: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button 
                      className="modern-btn-secondary text-sm px-3 py-2" 
                      onClick={() => setLine(i, { serials: [] })}
                      title="Manage Serial Numbers"
                    >
                      Serials
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors" 
                      onClick={() => setItems(arr => arr.filter((_, idx) => idx !== i))}
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                  <div className="flex justify-between items-center">
                    <span className="modern-caption">Line Total</span>
                    <span className="modern-heading text-lg text-[#1E88E5]">
                      ₹{(it.qty * it.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="modern-card modern-elevated">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-6 h-6 text-[#1E88E5]" />
          <h2 className="modern-heading text-xl text-[#1E1E20]">Payment Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculation Breakdown */}
          <div className="lg:col-span-2 space-y-4">
            <div className="modern-surface p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="modern-body text-[#4B5563]">Subtotal ({items.length} items)</span>
                <span className="modern-heading text-[#1E1E20]">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="modern-body text-[#4B5563]">Discount</span>
                <span className="modern-heading text-red-600">
                  -₹{Math.abs(discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="modern-body text-[#4B5563]">Tax</span>
                <span className="modern-heading text-[#1E1E20]">
                  ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-[#E5E7EB] pt-3">
                <div className="flex justify-between items-center">
                  <span className="modern-heading text-lg text-[#1E1E20]">Total Amount</span>
                  <span className="modern-heading text-2xl text-[#1E88E5]">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="modern-caption">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]">₹</span>
                  <input 
                    className="modern-input w-full pl-8 text-lg font-semibold" 
                    type="number" 
                    step="0.01"
                    placeholder={total.toFixed(2)}
                    value={paid || ''} 
                    onChange={e => setPaid(Number(e.target.value))} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="modern-caption">Payment Method</label>
                <select 
                  className="modern-input w-full" 
                  value={payMethod} 
                  onChange={e => setPayMethod(e.target.value)}
                >
                  <option value="CASH">💵 Cash</option>
                  <option value="CARD">💳 Card</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                  <option value="WALLET">👛 Digital Wallet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Change & Actions */}
          <div className="space-y-4">
            {paid > 0 && paid > total && (
              <div className="modern-status-success p-4 rounded-xl text-center">
                <div className="modern-caption mb-1">Change Due</div>
                <div className="modern-heading text-xl text-[#2E7D32]">
                  ₹{(paid - total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
            
            <button 
              className="modern-btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg" 
              onClick={checkout} 
              disabled={emit.isLoading || items.length === 0}
            >
              <CreditCard className="w-5 h-5" />
              {emit.isLoading ? 'Processing...' : 'Complete Sale'}
            </button>
            
            {items.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button 
                  className="modern-btn-secondary flex items-center justify-center gap-2 py-2" 
                  onClick={() => {
                    // Save as draft logic
                    console.log('Save as draft')
                  }}
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button 
                  className="modern-btn-secondary flex items-center justify-center gap-2 py-2" 
                  onClick={() => window.print()}
                >
                  <Receipt className="w-4 h-4" />
                  Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {notice && (
        <div className={`modern-card ${
          notice.includes('successfully') 
            ? 'modern-status-success' 
            : notice.includes('Failed') 
            ? 'modern-status-error' 
            : 'modern-status-info'
        } text-center`}>
          <div className="font-medium">{notice}</div>
        </div>
      )}
    </div>
  )
}