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
  Receipt,
  ChevronRight,
  Sparkles,
  Scissors,
  Package,
  Award,
  TrendingUp
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
  commissionsEnabled?: boolean
}

export function CartSidebar({
  ticket,
  totals,
  onUpdateItem,
  onRemoveItem,
  onPayment,
  commissionsEnabled = true
}: CartSidebarProps) {
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
        <div className="relative z-10 flex items-center gap-3">
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
                    className="group border transition-all duration-200 hover:shadow-lg animate-fadeIn overflow-hidden"
                    style={{
                      background: `${COLORS.charcoalLight}`,
                      borderColor: `${COLORS.gold}20`,
                      boxShadow: `0 1px 3px ${COLORS.black}20`,
                      animationDelay: `${index * 30}ms`
                    }}
                  >
                    <CardContent className="p-3.5">
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="p-1 rounded"
                              style={{
                                background: `${COLORS.gold}15`,
                                border: `1px solid ${COLORS.gold}30`
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
                                className="font-medium text-sm leading-tight"
                                style={{ color: COLORS.champagne }}
                              >
                                {truncateText(item.entity_name, 30)}
                              </h4>
                            </div>
                          </div>

                          {item.stylist_name && (
                            <div
                              className="flex items-center gap-1.5 px-2 py-1 rounded mt-1.5"
                              style={{
                                background: `${COLORS.gold}10`,
                                border: `1px solid ${COLORS.gold}25`
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
                        className="flex items-center justify-between pt-2.5 border-t"
                        style={{ borderColor: `${COLORS.gold}10` }}
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
                          className="mt-3 text-xs rounded-lg p-2.5"
                          style={{
                            backgroundColor: `${COLORS.charcoalDark}80`,
                            color: COLORS.bronze,
                            border: `1px solid ${COLORS.gold}20`
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

            {/* Totals Section */}
            <div
              className="px-6 py-5 space-y-4 animate-fadeIn flex-shrink-0"
              style={{
                borderTop: `2px solid ${COLORS.gold}30`,
                background: `linear-gradient(to bottom, ${COLORS.charcoalDark}E6 0%, ${COLORS.charcoal}E6 100%)`,
                boxShadow: `inset 0 2px 8px ${COLORS.black}40`
              }}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium" style={{ color: COLORS.lightText }}>
                    Subtotal
                  </span>
                  <span className="font-semibold text-base" style={{ color: COLORS.champagne }}>
                    AED {(totals?.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                {(totals?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium" style={{ color: COLORS.emerald }}>
                      Discount
                    </span>
                    <span className="font-semibold text-base" style={{ color: COLORS.emerald }}>
                      -AED {(totals?.discountAmount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {(totals?.tipAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium" style={{ color: COLORS.gold }}>
                      Gratuity
                    </span>
                    <span className="font-semibold text-base" style={{ color: COLORS.gold }}>
                      +AED {(totals?.tipAmount || 0).toFixed(2)}
                    </span>
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
                  className="flex justify-between items-center p-4 rounded-xl mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}25 0%, ${COLORS.goldDark}15 100%)`,
                    border: `2px solid ${COLORS.gold}`,
                    boxShadow: `0 8px 24px ${COLORS.gold}40, inset 0 2px 4px ${COLORS.gold}20`
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6" style={{ color: COLORS.gold }} />
                    <span
                      className="text-lg font-bold tracking-wide"
                      style={{ color: COLORS.champagne }}
                    >
                      TOTAL
                    </span>
                  </div>
                  <span className="text-3xl font-bold" style={{ color: COLORS.gold }}>
                    AED {(totals?.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <div
              className="p-6 pt-4 flex-shrink-0"
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderTop: `1px solid ${COLORS.gold}30`
              }}
            >
              <Button
                onClick={onPayment}
                disabled={(ticket?.lineItems?.length || 0) === 0}
                className="w-full h-16 font-bold text-lg transition-all transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  boxShadow: `0 12px 32px ${COLORS.gold}60, 0 0 0 2px ${COLORS.gold}`,
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
                <CreditCard className="w-6 h-6 mr-3 relative z-10" />
                <span className="relative z-10">COMPLETE PAYMENT</span>
                <div className="ml-auto flex items-center gap-2 relative z-10">
                  <span className="text-xl font-black">AED {(totals?.total || 0).toFixed(2)}</span>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Button>
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
