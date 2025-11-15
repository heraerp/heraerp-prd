/**
 * HERA Jewelry - Price Breakdown Component
 */

'use client'

import React from 'react'
import { Separator } from '@/components/ui/separator'
import { IndianRupee, Scale, Sparkles } from 'lucide-react'

interface PriceBreakdownProps {
  ctx: any
}

export function PriceBreakdown({ ctx }: PriceBreakdownProps) {
  // Calculate components
  const purityFactor = (ctx.purityK || 22) / 24
  const pureWeight = (ctx.netWeight || 0) * purityFactor
  const metalValue = pureWeight * (ctx.goldRate || 0)

  let makingCharges = 0
  if (ctx.makingType === 'per_gram') {
    makingCharges = (ctx.makingRate || 0) * (ctx.netWeight || 0)
  } else if (ctx.makingType === 'fixed') {
    makingCharges = ctx.makingRate || 0
  } else if (ctx.makingType === 'percent') {
    makingCharges = metalValue * ((ctx.makingRate || 0) / 100)
  }

  const stoneValue = ctx.stoneValue || 0
  const subtotal = metalValue + makingCharges + stoneValue
  const gstAmount = subtotal * ((ctx.gstSlab || 3) / 100)
  const exchangeValue = ctx.exchangeEnabled ? ctx.exchangeValue || 0 : 0
  const total = subtotal + gstAmount - exchangeValue

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`

  return (
    <div className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      <h3 className="font-semibold text-lg mb-4 text-white">Price Breakdown</h3>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center rounded-lg px-3 py-2 bg-white/5 border border-white/10">
          <Scale className="h-4 w-4 mr-2 text-yellow-400" />
          <div className="text-xs text-white/70">Pure Weight</div>
          <div className="ml-auto text-white font-medium">{pureWeight.toFixed(3)}g</div>
        </div>
        <div className="flex items-center rounded-lg px-3 py-2 bg-white/5 border border-white/10">
          <IndianRupee className="h-4 w-4 mr-2 text-yellow-400" />
          <div className="text-xs text-white/70">Metal Value</div>
          <div className="ml-auto text-white font-medium">{formatCurrency(metalValue)}</div>
        </div>
        <div className="flex items-center rounded-lg px-3 py-2 bg-white/5 border border-white/10">
          <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
          <div className="text-xs text-white/70">Purity</div>
          <div className="ml-auto text-white font-medium">{ctx.purityK || 22}K</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-white/80">
          <span>
            Metal Value ({pureWeight.toFixed(3)}g × ₹{ctx.goldRate || 0}/g)
          </span>
          <span>{formatCurrency(metalValue)}</span>
        </div>

        <div className="flex justify-between text-sm text-white/80">
          <span>Making Charges ({ctx.makingType || 'per_gram'})</span>
          <span>{formatCurrency(makingCharges)}</span>
        </div>

        {stoneValue > 0 && (
          <div className="flex justify-between text-sm text-white/80">
            <span>Stone Value</span>
            <span>{formatCurrency(stoneValue)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-sm font-medium text-white">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm text-white/80">
          <span>GST ({ctx.gstSlab || 3}%)</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>

        {ctx.exchangeEnabled && exchangeValue > 0 && (
          <div className="flex justify-between text-sm text-emerald-400">
            <span>Old Gold Exchange</span>
            <span>-{formatCurrency(exchangeValue)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-lg font-bold text-white">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {ctx.netWeight > 0 && ctx.goldRate > 0 && (
        <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded text-sm">
          <div className="text-white/80">
            <span className="font-semibold text-white">Calculation Details:</span>
            <br />• Pure Weight: {ctx.netWeight}g × {(((ctx.purityK || 22) / 24) * 100).toFixed(1)}%
            = {pureWeight.toFixed(3)}g
            <br />• Rate: ₹{ctx.goldRate || 0}/gram for {ctx.purityK || 22}K gold
            <br />• GST Mode: {ctx.gstMode || 'CGST_SGST'}
          </div>
        </div>
      )}
    </div>
  )
}
