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

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  silver: '#B8B8B8',
  silverDark: '#999999',
  emerald: '#0F6F5C'
}

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
    <Card
      className="h-full backdrop-blur-sm shadow-lg"
      style={{
        backgroundColor: COLORS.charcoalLight,
        borderColor: COLORS.bronze + '33',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.2)',
        color: COLORS.lightText
      }}
    >
      <CardHeader className="pb-3" style={{ borderBottom: `1px solid ${COLORS.bronze}20` }}>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: COLORS.gold }} />
            <span style={{ color: COLORS.champagne }}>Cart</span>
          </div>
          <Badge
            className="text-xs"
            style={{
              backgroundColor: COLORS.bronze + '20',
              color: COLORS.champagne,
              borderColor: COLORS.bronze + '50'
            }}
          >
            {ticket.lineItems.length} item{ticket.lineItems.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
        {ticket.lineItems.length === 0 ? (
          /* Empty Cart State */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: COLORS.charcoalDark,
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                }}
              >
                <ShoppingCart className="w-8 h-8" style={{ color: COLORS.bronze }} />
              </div>
              <h3 className="font-medium mb-2" style={{ color: COLORS.champagne }}>
                Cart is empty
              </h3>
              <p className="text-sm mb-4" style={{ color: COLORS.bronze }}>
                Add services or products from the catalog to get started.
              </p>
              <div className="text-xs" style={{ color: COLORS.silverDark }}>
                💡 Tip: Use{' '}
                <kbd
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${COLORS.bronze}33`
                  }}
                >
                  /
                </kbd>{' '}
                to search quickly
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 pb-4">
                {ticket.lineItems.map(item => (
                  <div
                    key={item.id}
                    className="group p-3 rounded-lg border transition-all"
                    style={{
                      borderColor: COLORS.bronze + '20',
                      backgroundColor: COLORS.charcoalDark,
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-medium text-sm leading-tight"
                          style={{ color: COLORS.champagne }}
                        >
                          {truncateText(item.entity_name, 25)}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className="text-xs h-5"
                            style={{
                              backgroundColor:
                                item.entity_type === 'service'
                                  ? COLORS.gold + '20'
                                  : COLORS.silver + '20',
                              color: item.entity_type === 'service' ? COLORS.gold : COLORS.silver,
                              borderColor:
                                item.entity_type === 'service'
                                  ? COLORS.gold + '50'
                                  : COLORS.silver + '50'
                            }}
                          >
                            {item.entity_type}
                          </Badge>
                          {item.stylist_name && (
                            <div
                              className="flex items-center gap-1 text-xs"
                              style={{ color: COLORS.bronze }}
                            >
                              <User className="w-3 h-3" style={{ color: COLORS.bronze }} />
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
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        style={{
                          color: '#EF4444',
                          ':hover': {
                            backgroundColor: '#EF444420'
                          }
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center border rounded-md"
                        style={{
                          borderColor: COLORS.bronze + '33',
                          backgroundColor: COLORS.charcoal
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="h-6 w-6 p-0 hover:bg-transparent"
                          style={{ color: COLORS.bronze }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span
                          className="px-2 py-1 text-xs font-medium min-w-[1.5rem] text-center"
                          style={{ color: COLORS.champagne }}
                        >
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="h-6 w-6 p-0 hover:bg-transparent"
                          style={{ color: COLORS.bronze }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs" style={{ color: COLORS.bronze }}>
                          ${item.unit_price.toFixed(2)} each
                        </div>
                        <div className="font-bold text-sm" style={{ color: COLORS.gold }}>
                          ${item.line_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Notes Preview */}
                    {item.notes && (
                      <div
                        className="mt-2 text-xs rounded p-2"
                        style={{
                          backgroundColor: COLORS.charcoal,
                          color: COLORS.silverDark,
                          border: `1px solid ${COLORS.bronze}20`
                        }}
                      >
                        {truncateText(item.notes, 50)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Discounts and Tips */}
            {(ticket.discounts.length > 0 || ticket.tips.length > 0) && (
              <div className="px-6 py-3" style={{ borderTop: `1px solid ${COLORS.bronze}20` }}>
                {ticket.discounts.map(discount => (
                  <div key={discount.id} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2" style={{ color: COLORS.emerald }}>
                      <Tag className="w-3 h-3" />
                      <span className="truncate">{truncateText(discount.description, 20)}</span>
                    </div>
                    <span className="font-medium" style={{ color: COLORS.emerald }}>
                      -
                      {discount.type === 'percentage'
                        ? `${discount.value}%`
                        : `$${discount.value.toFixed(2)}`}
                    </span>
                  </div>
                ))}

                {ticket.tips.map(tip => (
                  <div key={tip.id} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2" style={{ color: COLORS.gold }}>
                      <DollarSign className="w-3 h-3" />
                      <span className="truncate">
                        {tip.stylist_name
                          ? `Tip for ${tip.stylist_name.split(' ')[0]}`
                          : 'General Tip'}{' '}
                        ({tip.method})
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: COLORS.gold }}>
                      +${tip.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div
              className="px-6 py-4"
              style={{
                borderTop: `1px solid ${COLORS.bronze}20`,
                backgroundColor: COLORS.charcoalDark,
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: COLORS.bronze }}>Subtotal:</span>
                  <span style={{ color: COLORS.lightText }}>${totals.subtotal.toFixed(2)}</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: COLORS.emerald }}>Discount:</span>
                    <span style={{ color: COLORS.emerald }}>
                      -${totals.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {totals.tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: COLORS.gold }}>Tips:</span>
                    <span style={{ color: COLORS.gold }}>+${totals.tipAmount.toFixed(2)}</span>
                  </div>
                )}

                {totals.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: COLORS.bronze }}>Tax:</span>
                    <span style={{ color: COLORS.lightText }}>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <Separator style={{ backgroundColor: COLORS.bronze + '33' }} />

                <div className="flex justify-between font-bold text-lg pt-1">
                  <span style={{ color: COLORS.champagne }}>Total:</span>
                  <span style={{ color: COLORS.gold }}>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div
              className="p-6 pt-4"
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderTop: `1px solid ${COLORS.bronze}20`
              }}
            >
              <Button
                onClick={onPayment}
                disabled={ticket.lineItems.length === 0}
                className="w-full font-medium transition-all transform hover:scale-105"
                size="lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  ':hover': {
                    background: `linear-gradient(135deg, ${COLORS.goldDark} 0%, ${COLORS.gold} 100%)`
                  }
                }}
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
