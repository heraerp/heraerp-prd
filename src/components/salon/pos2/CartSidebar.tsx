'use client'

import { useState } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  User,
  Tag,
  DollarSign,
  Receipt,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface LineItem {
  id: string
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number
  stylist_id?: string
  stylist_name?: string
  appointment_id?: string
  notes?: string
  discount_percent?: number
  discount_amount?: number
}

interface Discount {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  applied_to: 'subtotal' | 'item'
  item_id?: string
}

interface Tip {
  id: string
  amount: number
  method: 'cash' | 'card'
  stylist_id?: string
  stylist_name?: string
}

interface PosTicket {
  lineItems: LineItem[]
  discounts: Discount[]
  tips: Tip[]
  notes?: string
  customer_id?: string
  customer_name?: string
  appointment_id?: string
}

interface Totals {
  subtotal: number
  discountAmount: number
  tipAmount: number
  taxAmount: number
  total: number
}

interface CartSidebarProps {
  ticket: PosTicket
  totals: Totals
  onUpdateItem: (id: string, updates: Partial<LineItem>) => void
  onRemoveItem: (id: string) => void
  onPayment: () => void
}

export function CartSidebar({
  ticket,
  totals,
  onUpdateItem,
  onRemoveItem,
  onPayment
}: CartSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    const newQuantity = Math.max(0, item.quantity + change)
    if (newQuantity === 0) {
      onRemoveItem(itemId)
    } else {
      onUpdateItem(itemId, { 
        quantity: newQuantity,
        line_amount: newQuantity * item.unit_price
      })
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <Card className="h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg text-slate-900 dark:text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Cart
          </div>
          <Badge variant="secondary" className="text-xs">
            {ticket.lineItems.length} item{ticket.lineItems.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
        {ticket.lineItems.length === 0 ? (
          /* Empty Cart State */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Cart is empty</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add services or products from the catalog to get started.
              </p>
              <div className="text-xs text-muted-foreground">
                💡 Tip: Use <kbd>/</kbd> to search quickly
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 pb-4">
                {ticket.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="group p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-100">
                          {truncateText(item.entity_name, 25)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={item.entity_type === 'service' ? 'default' : 'secondary'}
                            className="text-xs h-5"
                          >
                            {item.entity_type}
                          </Badge>
                          {item.stylist_name && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                              <User className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                              <span className="truncate max-w-[80px]">
                                {item.stylist_name.split(' ')[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="px-2 py-1 text-xs font-medium min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          ${item.unit_price.toFixed(2)} each
                        </div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          ${item.line_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Notes Preview */}
                    {item.notes && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded p-2">
                        {truncateText(item.notes, 50)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Discounts and Tips */}
            {(ticket.discounts.length > 0 || ticket.tips.length > 0) && (
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700">
                {ticket.discounts.map((discount) => (
                  <div key={discount.id} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <Tag className="w-3 h-3" />
                      <span className="truncate">
                        {truncateText(discount.description, 20)}
                      </span>
                    </div>
                    <span className="font-medium text-green-600">
                      -{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                    </span>
                  </div>
                ))}

                {ticket.tips.map((tip) => (
                  <div key={tip.id} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2 text-blue-600">
                      <DollarSign className="w-3 h-3" />
                      <span className="truncate">
                        {tip.stylist_name ? `Tip for ${tip.stylist_name.split(' ')[0]}` : 'General Tip'} ({tip.method})
                      </span>
                    </div>
                    <span className="font-medium text-blue-600">
                      +${tip.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {totals.tipAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Tips:</span>
                    <span>+${totals.tipAmount.toFixed(2)}</span>
                  </div>
                )}

                {totals.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div className="p-6 pt-4">
              <Button
                onClick={onPayment}
                disabled={ticket.lineItems.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pay ${totals.total.toFixed(2)}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
