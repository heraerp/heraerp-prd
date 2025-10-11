'use client'

import { useState, useCallback } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  User,
  Tag,
  Receipt,
  ChevronRight,
  Sparkles,
  Scissors,
  Package,
  Award,
  TrendingUp,
  Percent,
  DollarSign,
  Trash2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { salonButtonThemes } from '@/styles/salon-button-themes'
import { CustomerSearchInline } from '@/components/salon/pos/CustomerSearchModal'

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
  onAddDiscount: (discount: Omit<Discount, 'id'>) => void
  onRemoveDiscount: (id: string) => void
  onAddTip: (tip: Omit<Tip, 'id'>) => void
  onRemoveTip: (id: string) => void
  onPayment: () => void
  onClearTicket: () => void
  organizationId: string
  selectedCustomer: any | null
  onCustomerSelect: (customer: any | null) => void
}

export function CartSidebar({
  ticket,
  totals,
  onUpdateItem,
  onRemoveItem,
  onAddDiscount,
  onRemoveDiscount,
  onAddTip,
  onRemoveTip,
  onPayment,
  onClearTicket,
  organizationId,
  selectedCustomer,
  onCustomerSelect
}: CartSidebarProps) {
  const [showDiscountSection, setShowDiscountSection] = useState(false)
  const [showTipSection, setShowTipSection] = useState(false)
  const [customDiscountPercent, setCustomDiscountPercent] = useState('')
  const [customTipAmount, setCustomTipAmount] = useState('')

  // Handle discount application
  const applyQuickDiscount = useCallback(
    (percent: number) => {
      onAddDiscount({
        type: 'percentage',
        value: percent,
        description: `${percent}% discount`,
        applied_to: 'subtotal'
      })
      setShowDiscountSection(false)
    },
    [onAddDiscount]
  )

  const applyCustomDiscount = useCallback(() => {
    const percent = parseFloat(customDiscountPercent)
    if (percent > 0 && percent <= 100) {
      onAddDiscount({
        type: 'percentage',
        value: percent,
        description: `${percent}% discount`,
        applied_to: 'subtotal'
      })
      setCustomDiscountPercent('')
      setShowDiscountSection(false)
    }
  }, [customDiscountPercent, onAddDiscount])

  // Handle tip application
  const applyQuickTip = useCallback(
    (percent: number) => {
      const tipAmount = (totals.subtotal * percent) / 100
      onAddTip({
        amount: tipAmount,
        method: 'card'
      })
      setShowTipSection(false)
    },
    [totals.subtotal, onAddTip]
  )

  const applyCustomTip = useCallback(() => {
    const amount = parseFloat(customTipAmount)
    if (amount > 0) {
      onAddTip({
        amount: amount,
        method: 'card'
      })
      setCustomTipAmount('')
      setShowTipSection(false)
    }
  }, [customTipAmount, onAddTip])

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

  const truncateText = (text: string | undefined | null, maxLength: number) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className="h-full border-0 shadow-2xl overflow-hidden flex flex-col relative"
      style={{
        backgroundColor: COLORS.charcoal,
        boxShadow: `0 25px 50px -12px ${COLORS.black}, 0 0 0 1px ${COLORS.gold}20`
      }}
    >
      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 animate-gradient"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 20%, ${COLORS.gold}40 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 70% 80%, ${COLORS.gold}20 0%, transparent 50%)
          `
        }}
      />

      {/* Refined gradient header */}
      <div
        className="relative h-20 flex items-center justify-between px-6 overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(to right, ${COLORS.charcoalDark} 0%, ${COLORS.charcoal} 100%)`,
          borderBottom: `1px solid ${COLORS.gold}30`
        }}
      >
        <div
          className="absolute inset-0 opacity-5 animate-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}40, transparent)`,
            backgroundSize: '200% 100%'
          }}
        />
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${COLORS.gold}20`,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <ShoppingCart className="w-5 h-5" style={{ color: COLORS.gold }} />
            </div>
            <div>
              <h2
                className="text-base font-semibold tracking-wide"
                style={{ color: COLORS.champagne }}
              >
                Shopping Cart
              </h2>
              <p className="text-xs font-normal" style={{ color: COLORS.bronze }}>
                {ticket.lineItems.length} {ticket.lineItems.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
        </div>
        {ticket.lineItems.length > 0 && (
          <div
            className="text-right"
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: `${COLORS.gold}10`,
              border: `1px solid ${COLORS.gold}30`
            }}
          >
            <p className="text-xs" style={{ color: COLORS.bronze }}>
              Subtotal
            </p>
            <p className="text-sm font-semibold" style={{ color: COLORS.gold }}>
              AED {(totals?.subtotal || 0).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Customer Selection - Inline */}
      <div
        className="px-6 pb-4 pt-3 border-b"
        style={{ borderColor: `${COLORS.gold}20`, background: `${COLORS.charcoalDark}40` }}
      >
        <CustomerSearchInline
          selectedCustomer={selectedCustomer}
          onCustomerSelect={onCustomerSelect}
          organizationId={organizationId}
        />
      </div>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0 relative z-10">
        {ticket.lineItems.length === 0 ? (
          /* Empty Cart State */
          <div className="flex-1 flex items-center justify-center p-8 animate-fadeIn">
            <div className="text-center">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.bronze}15 100%)`,
                  border: `2px solid ${COLORS.gold}30`,
                  boxShadow: `0 8px 24px ${COLORS.gold}20, inset 0 2px 4px ${COLORS.gold}10`
                }}
              >
                <ShoppingCart className="w-12 h-12 relative z-10" style={{ color: COLORS.gold }} />
                <div
                  className="absolute inset-0 opacity-30 animate-pulse"
                  style={{
                    background: `radial-gradient(circle at center, ${COLORS.gold}40 0%, transparent 70%)`
                  }}
                />
              </div>
              <h3 className="font-bold text-xl mb-3" style={{ color: COLORS.champagne }}>
                Your Cart is Empty
              </h3>
              <p className="text-sm mb-2" style={{ color: COLORS.bronze }}>
                Select services or products to begin
              </p>
              <p className="text-xs" style={{ color: COLORS.silverDark }}>
                Luxurious treatments await your selection
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 px-4 py-4 custom-scrollbar min-h-0">
              <div className="space-y-3">
                {ticket.lineItems.map((item, index) => (
                  <Card
                    key={item.id}
                    className="group border-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.01] animate-fadeIn overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.charcoalLight}DD 0%, ${COLORS.charcoalDark}DD 100%)`,
                      borderColor: `${COLORS.gold}80`,
                      boxShadow: `0 6px 16px ${COLORS.black}50, 0 0 0 1px ${COLORS.gold}50, inset 0 1px 3px ${COLORS.gold}15`,
                      animationDelay: `${index * 30}ms`
                    }}
                  >
                    <CardContent className="p-4">
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="p-1.5 rounded-lg"
                              style={{
                                background: `${COLORS.gold}20`,
                                border: `1px solid ${COLORS.gold}40`
                              }}
                            >
                              {item.entity_type === 'service' ? (
                                <Scissors className="w-3.5 h-3.5" style={{ color: COLORS.gold }} />
                              ) : (
                                <Package className="w-3.5 h-3.5" style={{ color: COLORS.silver }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="font-semibold text-base leading-tight"
                                style={{ color: COLORS.champagne }}
                              >
                                {truncateText(item.entity_name, 30)}
                              </h4>
                            </div>
                          </div>

                          {item.stylist_name && (
                            <div
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mt-2"
                              style={{
                                background: `linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.gold}05 100%)`,
                                border: `1px solid ${COLORS.gold}40`,
                                boxShadow: `0 1px 3px ${COLORS.gold}20`
                              }}
                            >
                              <div
                                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold"
                                style={{
                                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                                  color: COLORS.black
                                }}
                              >
                                {getInitials(item.stylist_name)}
                              </div>
                              <p
                                className="text-[11px] font-medium truncate flex-1"
                                style={{ color: COLORS.gold }}
                              >
                                {item.stylist_name}
                              </p>
                              <Award
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: COLORS.gold }}
                              />
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="opacity-60 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 ml-2"
                          style={{
                            color: '#EF4444'
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Quantity and Price */}
                      <div
                        className="flex items-center justify-between pt-3 mt-3 border-t"
                        style={{ borderColor: `${COLORS.gold}30` }}
                      >
                        <div
                          className="flex items-center border rounded-lg overflow-hidden"
                          style={{
                            borderColor: `${COLORS.gold}30`,
                            backgroundColor: COLORS.charcoalDark
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="h-7 w-7 p-0 hover:bg-transparent transition-colors"
                            style={{ color: COLORS.gold }}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span
                            className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center"
                            style={{ color: COLORS.champagne }}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="h-7 w-7 p-0 hover:bg-transparent transition-colors"
                            style={{ color: COLORS.gold }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] mb-0.5" style={{ color: COLORS.bronze }}>
                            AED {(item?.unit_price || 0).toFixed(2)} each
                          </div>
                          <div className="font-semibold text-sm" style={{ color: COLORS.gold }}>
                            AED {(item?.line_amount || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Notes Preview */}
                      {item.notes && (
                        <div
                          className="mt-3 text-xs rounded-lg p-3"
                          style={{
                            backgroundColor: `${COLORS.charcoalDark}`,
                            color: COLORS.bronze,
                            border: `1px solid ${COLORS.gold}30`,
                            boxShadow: `inset 0 1px 2px ${COLORS.black}30`
                          }}
                        >
                          <span className="font-medium" style={{ color: COLORS.champagne }}>
                            Note:{' '}
                          </span>
                          {truncateText(item.notes, 60)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Discount and Tip Section - Side by Side */}
            <div
              className="px-4 py-2.5 border-t flex-shrink-0"
              style={{ borderColor: `${COLORS.gold}20` }}
            >
              <div className="grid grid-cols-2 gap-2">
                {/* Discount */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscountSection(!showDiscountSection)}
                  className="text-xs py-2"
                  style={{
                    ...salonButtonThemes.subtleAction.style,
                    fontSize: '0.75rem',
                    backgroundColor: showDiscountSection ? `${COLORS.emerald}20` : undefined,
                    borderColor: showDiscountSection ? COLORS.emerald : undefined
                  }}
                >
                  <Percent className="w-3.5 h-3.5 mr-1.5" />
                  Discount
                </Button>

                {/* Tip */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTipSection(!showTipSection)}
                  className="text-xs py-2"
                  style={{
                    ...salonButtonThemes.subtleAction.style,
                    borderColor: showTipSection ? COLORS.gold : `${COLORS.gold}40`,
                    color: COLORS.gold,
                    fontSize: '0.75rem',
                    backgroundColor: showTipSection ? `${COLORS.gold}20` : undefined
                  }}
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                  Tip
                </Button>
              </div>

              {/* Discount Section */}
              {showDiscountSection && (
                <div
                  className="mt-3 p-3 rounded-lg animate-fadeIn"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.emerald}15 0%, ${COLORS.charcoalDark} 100%)`,
                    border: `1px solid ${COLORS.emerald}40`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold" style={{ color: COLORS.champagne }}>
                      Quick Discount
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDiscountSection(false)}
                      className="h-5 w-5 p-0"
                      style={{ color: COLORS.bronze }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[5, 10, 15].map(percent => (
                      <Button
                        key={percent}
                        size="sm"
                        onClick={() => applyQuickDiscount(percent)}
                        className="text-xs py-1.5"
                        style={{
                          background: `${COLORS.emerald}30`,
                          color: COLORS.champagne,
                          borderColor: `${COLORS.emerald}60`,
                          border: '1px solid'
                        }}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Custom %"
                      value={customDiscountPercent}
                      onChange={e => setCustomDiscountPercent(e.target.value)}
                      className="text-xs h-8"
                      style={{
                        backgroundColor: COLORS.charcoalDark,
                        borderColor: `${COLORS.emerald}40`,
                        color: COLORS.champagne
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={applyCustomDiscount}
                      className="text-xs px-3 h-8"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.emerald} 0%, ${COLORS.emerald}80 100%)`,
                        color: COLORS.black
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}

              {/* Tip Section */}
              {showTipSection && (
                <div
                  className="mt-3 p-3 rounded-lg animate-fadeIn"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.charcoalDark} 100%)`,
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold" style={{ color: COLORS.champagne }}>
                      Add Gratuity
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTipSection(false)}
                      className="h-5 w-5 p-0"
                      style={{ color: COLORS.bronze }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[10, 15, 20].map(percent => (
                      <Button
                        key={percent}
                        size="sm"
                        onClick={() => applyQuickTip(percent)}
                        className="text-xs py-1.5"
                        style={{
                          background: `${COLORS.gold}30`,
                          color: COLORS.champagne,
                          borderColor: `${COLORS.gold}60`,
                          border: '1px solid'
                        }}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Custom AED"
                      value={customTipAmount}
                      onChange={e => setCustomTipAmount(e.target.value)}
                      className="text-xs h-8"
                      style={{
                        backgroundColor: COLORS.charcoalDark,
                        borderColor: `${COLORS.gold}40`,
                        color: COLORS.champagne
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={applyCustomTip}
                      className="text-xs px-3 h-8"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                        color: COLORS.black
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div
              className="px-4 py-3 space-y-2 animate-fadeIn flex-shrink-0"
              style={{
                borderTop: `2px solid ${COLORS.gold}30`,
                background: `linear-gradient(to bottom, ${COLORS.charcoalDark}E6 0%, ${COLORS.charcoal}E6 100%)`,
                boxShadow: `inset 0 2px 8px ${COLORS.black}40`
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium" style={{ color: COLORS.lightText }}>
                    Subtotal
                  </span>
                  <span className="font-semibold text-base" style={{ color: COLORS.champagne }}>
                    AED {(totals?.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                {(totals?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm group">
                    <span className="font-medium" style={{ color: COLORS.emerald }}>
                      Discount
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base" style={{ color: COLORS.emerald }}>
                        -AED {(totals?.discountAmount || 0).toFixed(2)}
                      </span>
                      {ticket.discounts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => ticket.discounts.forEach(d => onRemoveDiscount(d.id))}
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                          style={{ color: COLORS.emerald }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {(totals?.tipAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm group">
                    <span className="font-medium" style={{ color: COLORS.gold }}>
                      Gratuity
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base" style={{ color: COLORS.gold }}>
                        +AED {(totals?.tipAmount || 0).toFixed(2)}
                      </span>
                      {ticket.tips.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => ticket.tips.forEach(t => onRemoveTip(t.id))}
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                          style={{ color: COLORS.gold }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {(totals?.taxAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium" style={{ color: COLORS.lightText }}>
                      Tax
                    </span>
                    <span className="font-semibold text-base" style={{ color: COLORS.champagne }}>
                      AED {(totals?.taxAmount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator style={{ backgroundColor: `${COLORS.gold}50`, height: '2px' }} />

                {/* Total */}
                <div
                  className="flex justify-between items-center p-2 rounded-lg mt-1"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}25 0%, ${COLORS.goldDark}15 100%)`,
                    border: `1.5px solid ${COLORS.gold}`,
                    boxShadow: `0 4px 16px ${COLORS.gold}35, inset 0 1px 2px ${COLORS.gold}15`
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" style={{ color: COLORS.gold }} />
                    <span
                      className="text-sm font-bold tracking-wide"
                      style={{ color: COLORS.champagne }}
                    >
                      TOTAL
                    </span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: COLORS.gold }}>
                    AED {(totals?.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Side by Side */}
            <div
              className="p-4 flex-shrink-0"
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderTop: `1px solid ${COLORS.gold}30`
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {/* Clear Ticket Button */}
                <Button
                  variant="outline"
                  onClick={onClearTicket}
                  disabled={ticket.lineItems.length === 0}
                  className="h-10 px-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-40"
                  style={{
                    color: COLORS.champagne,
                    borderColor: `${COLORS.gold}40`,
                    background: `${COLORS.charcoalDark}80`,
                    boxShadow: `0 2px 12px ${COLORS.black}30`
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Clear
                </Button>

                {/* Complete Payment Button */}
                <Button
                  onClick={onPayment}
                  disabled={(ticket?.lineItems?.length || 0) === 0}
                  className="h-10 px-3 text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color: COLORS.black,
                    boxShadow: `0 8px 24px ${COLORS.gold}50, 0 0 0 2px ${COLORS.gold}`,
                    border: 'none'
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${COLORS.champagne}30, transparent)`,
                      transform: 'translateX(-100%)',
                      animation: 'shimmer 2s infinite'
                    }}
                  />
                  <CreditCard className="w-4 h-4 mr-1.5 relative z-10" />
                  <span className="relative z-10">Payment</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
            transform: translateX(-100%);
          }
          100% {
            background-position: 200% 0;
            transform: translateX(100%);
          }
        }
        @keyframes gradient {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.15;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out backwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out backwards;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${COLORS.charcoalDark};
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%);
          border-radius: 6px;
          border: 2px solid ${COLORS.charcoalDark};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%);
        }
      `}</style>
    </Card>
  )
}
