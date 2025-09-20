// ================================================================================
// HERA POS CART DISPLAY
// Smart Code: HERA.UI.POS.CART.v1
// Cart display with line management and totals
// ================================================================================

'use client'

import { Trash2, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/lib/hooks/usePos'
import { CartLine } from '@/lib/schemas/pos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CartDisplay() {
  const { lines, totals, removeLine, updateQuantity } = useCartStore()

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`
  }

  const renderLine = (line: CartLine, index: number) => {
    switch (line.kind) {
      case 'service':
        return (
          <div key={index} className="flex items-center justify-between p-3 border-b last:border-0">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{line.service_name}</p>
              <p className="text-sm text-gray-500">
                {line.duration_min} min • {formatCurrency(line.unit_price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(index, Math.max(1, line.qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm">{line.qty}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(index, line.qty + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="w-20 text-right font-medium">
                {formatCurrency(line.qty * line.unit_price)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case 'item':
        return (
          <div key={index} className="flex items-center justify-between p-3 border-b last:border-0">
            <div className="flex-1">
              <p className="font-medium text-gray-800">{line.product_name}</p>
              <p className="text-sm text-gray-500">
                SKU: {line.product_sku} • {formatCurrency(line.unit_price)}
                {line.on_hand !== undefined && (
                  <span className="ml-2 text-xs text-gray-400">({line.on_hand} in stock)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(index, Math.max(1, line.qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm">{line.qty}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(index, line.qty + 1)}
                  disabled={line.on_hand !== undefined && line.qty >= line.on_hand}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="w-20 text-right font-medium">
                {formatCurrency(line.qty * line.unit_price)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case 'discount':
        return (
          <div
            key={index}
            className="flex items-center justify-between p-3 border-b last:border-0 bg-green-50"
          >
            <div className="flex-1">
              <p className="font-medium text-green-700">Discount</p>
              {line.reason && <p className="text-sm text-gray-500">{line.reason}</p>}
              {line.percentage && <p className="text-sm text-gray-500">{line.percentage}% off</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-right font-medium text-green-700">
                -{formatCurrency(line.amount)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case 'tip':
        return (
          <div
            key={index}
            className="flex items-center justify-between p-3 border-b last:border-0 bg-blue-50"
          >
            <div className="flex-1">
              <p className="font-medium text-blue-700">Gratuity</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-right font-medium text-blue-700">
                +{formatCurrency(line.amount)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <Card className="flex-1">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Shopping Cart</h3>
      </div>

      {lines.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Your cart is empty</p>
          <p className="text-sm mt-2">Add services or products to get started</p>
        </div>
      ) : (
        <>
          <div className="max-h-[400px] overflow-y-auto">{lines.map(renderLine)}</div>

          <div className="p-4 border-t space-y-2">
            {totals.subtotal_services > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Services Subtotal</span>
                <span>{formatCurrency(totals.subtotal_services)}</span>
              </div>
            )}
            {totals.subtotal_items > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Products Subtotal</span>
                <span>{formatCurrency(totals.subtotal_items)}</span>
              </div>
            )}
            {totals.discount_total > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discount_total)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-gray-600">Taxable Subtotal</span>
              <span>{formatCurrency(totals.taxable_subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT ({(totals.tax_rate * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(totals.tax_total)}</span>
            </div>

            {totals.tip_total > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Tip</span>
                <span>+{formatCurrency(totals.tip_total)}</span>
              </div>
            )}

            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totals.grand_total)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
