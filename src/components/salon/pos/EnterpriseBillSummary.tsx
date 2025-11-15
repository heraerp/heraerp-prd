'use client'

import React from 'react'
import { User, MapPin, Scissors, Package, Sparkles, Receipt, Phone, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Luxe Salon Color Palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
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
  discount_percent?: number
  discount_amount?: number
}

interface BillSummaryProps {
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
    isWalkIn?: boolean
  }
  branch?: {
    id: string
    name: string
  }
  lineItems: LineItem[]
  totals: {
    subtotal: number
    discountAmount: number
    tipAmount: number
    taxAmount: number
    total: number
  }
  className?: string
}

export function EnterpriseBillSummary({
  customer,
  branch,
  lineItems,
  totals,
  className
}: BillSummaryProps) {
  const services = lineItems.filter(item => item.entity_type === 'service')
  const products = lineItems.filter(item => item.entity_type === 'product')

  return (
    <Card
      className={cn('border-0 shadow-2xl overflow-hidden animate-slideIn', className)}
      style={{
        backgroundColor: COLORS.charcoal,
        boxShadow: `0 20px 40px -12px ${COLORS.black}, 0 0 0 1px ${COLORS.gold}20`
      }}
    >
      {/* Animated gradient header */}
      <div
        className="relative h-24 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
        }}
      >
        <div
          className="absolute inset-0 opacity-20 animate-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent, ${COLORS.champagne}40, transparent)`,
            backgroundSize: '200% 100%'
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="p-3 rounded-full"
            style={{
              backgroundColor: `${COLORS.black}40`,
              boxShadow: `0 4px 12px ${COLORS.black}60`
            }}
          >
            <Receipt className="w-6 h-6" style={{ color: COLORS.champagne }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-wide" style={{ color: COLORS.black }}>
              BILL SUMMARY
            </h2>
            <p className="text-sm font-medium" style={{ color: `${COLORS.black}80` }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Customer & Branch Info */}
        <div className="grid grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          {/* Customer Card */}
          <Card
            className="border"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderColor: `${COLORS.gold}30`,
              boxShadow: `0 2px 8px ${COLORS.black}40`
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4" style={{ color: COLORS.gold }} />
                <h3 className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                  CUSTOMER
                </h3>
              </div>
              {customer ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: COLORS.lightText }}>
                      {customer.name}
                    </p>
                    {customer.isWalkIn && (
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${COLORS.bronze}20`,
                          borderColor: COLORS.bronze,
                          color: COLORS.bronze
                        }}
                      >
                        Walk-In
                      </Badge>
                    )}
                  </div>
                  {customer.email && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: COLORS.bronze }}
                    >
                      <Mail className="w-3 h-3" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: COLORS.bronze }}
                    >
                      <Phone className="w-3 h-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: COLORS.bronze }}>
                  No customer selected
                </p>
              )}
            </CardContent>
          </Card>

          {/* Branch Card */}
          <Card
            className="border"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderColor: `${COLORS.gold}30`,
              boxShadow: `0 2px 8px ${COLORS.black}40`
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" style={{ color: COLORS.gold }} />
                <h3 className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                  LOCATION
                </h3>
              </div>
              {branch ? (
                <p className="font-medium" style={{ color: COLORS.lightText }}>
                  {branch.name}
                </p>
              ) : (
                <p className="text-sm italic" style={{ color: COLORS.bronze }}>
                  No location selected
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator style={{ backgroundColor: `${COLORS.gold}20` }} />

        {/* Services Section */}
        {services.length > 0 && (
          <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="w-4 h-4" style={{ color: COLORS.gold }} />
              <h3 className="font-semibold" style={{ color: COLORS.champagne }}>
                SERVICES
              </h3>
              <Badge
                className="ml-auto text-xs"
                style={{
                  backgroundColor: `${COLORS.gold}20`,
                  borderColor: COLORS.gold,
                  color: COLORS.gold
                }}
              >
                {services.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {services.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-lg border animate-scaleIn"
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    borderColor: `${COLORS.gold}20`,
                    animationDelay: `${200 + index * 50}ms`
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1" style={{ color: COLORS.champagne }}>
                      {item.entity_name}
                    </p>
                    {item.stylist_name && (
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: COLORS.bronze }}
                      >
                        <User className="w-3 h-3" />
                        <span>{item.stylist_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-lg" style={{ color: COLORS.gold }}>
                      ${item.line_amount.toFixed(2)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs" style={{ color: COLORS.bronze }}>
                        ${item.unit_price.toFixed(2)} × {item.quantity}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {products.length > 0 && (
          <div className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
              <h3 className="font-semibold" style={{ color: COLORS.champagne }}>
                PRODUCTS
              </h3>
              <Badge
                className="ml-auto text-xs"
                style={{
                  backgroundColor: `${COLORS.gold}20`,
                  borderColor: COLORS.gold,
                  color: COLORS.gold
                }}
              >
                {products.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {products.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-lg border animate-scaleIn"
                  style={{
                    backgroundColor: COLORS.charcoalDark,
                    borderColor: `${COLORS.gold}20`,
                    animationDelay: `${300 + index * 50}ms`
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: COLORS.champagne }}>
                      {item.entity_name}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.bronze }}>
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-lg" style={{ color: COLORS.gold }}>
                      ${item.line_amount.toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.bronze }}>
                      ${item.unit_price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator style={{ backgroundColor: `${COLORS.gold}30` }} />

        {/* Totals Section */}
        <div className="space-y-3 animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <div className="flex justify-between">
            <span style={{ color: COLORS.lightText }}>Subtotal</span>
            <span className="font-medium" style={{ color: COLORS.champagne }}>
              ${totals.subtotal.toFixed(2)}
            </span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: COLORS.lightText }}>Discount</span>
              <span className="font-medium" style={{ color: COLORS.bronze }}>
                -${totals.discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          {totals.tipAmount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: COLORS.lightText }}>Tip</span>
              <span className="font-medium" style={{ color: COLORS.gold }}>
                ${totals.tipAmount.toFixed(2)}
              </span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: COLORS.lightText }}>Tax</span>
              <span className="font-medium" style={{ color: COLORS.champagne }}>
                ${totals.taxAmount.toFixed(2)}
              </span>
            </div>
          )}

          <Separator style={{ backgroundColor: `${COLORS.gold}40` }} />

          {/* Total */}
          <div
            className="flex justify-between items-center p-4 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.goldDark}10 100%)`,
              border: `2px solid ${COLORS.gold}`,
              boxShadow: `0 4px 16px ${COLORS.gold}30`
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: COLORS.gold }} />
              <span className="text-lg font-bold" style={{ color: COLORS.champagne }}>
                TOTAL
              </span>
            </div>
            <span className="text-3xl font-bold" style={{ color: COLORS.gold }}>
              ${totals.total.toFixed(2)}
            </span>
          </div>
        </div>
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
          }
          100% {
            background-position: 200% 0;
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
      `}</style>
    </Card>
  )
}
