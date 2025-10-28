'use client'

import { useState, useCallback, useMemo } from 'react'
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
  Trash2,
  UserPlus,
  UserMinus,
  Users,
  Edit3,
  Check,
  FileText,
  Calendar as CalendarIcon,
  History
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DatePicker } from '@/components/ui/date-picker'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { salonButtonThemes } from '@/styles/salon-button-themes'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { format, isFuture, startOfDay } from 'date-fns'

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
  // Multiple staff support
  stylist_ids?: string[]
  stylist_names?: string[]
  // Keep old fields for backward compatibility
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
  transaction_date?: string
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
  onAddItem?: (item: any, staffId?: string, staffName?: string) => void
  onUpdateTransactionDate?: (date: string | undefined) => void
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
  onCustomerSelect,
  onAddItem,
  onUpdateTransactionDate
}: CartSidebarProps) {
  const [showDiscountSection, setShowDiscountSection] = useState(false)
  const [showTipSection, setShowTipSection] = useState(false)
  const [customDiscountPercent, setCustomDiscountPercent] = useState('')
  const [customTipAmount, setCustomTipAmount] = useState('')
  const [showStaffSelector, setShowStaffSelector] = useState<string | null>(null)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')

  // State for custom "Other" items - Unified approach
  const [showOtherItemModal, setShowOtherItemModal] = useState(false)
  const [otherItemType, setOtherItemType] = useState<'service' | 'product'>('service')
  const [otherItemPrice, setOtherItemPrice] = useState('')

  // State for discount mode toggle
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent')
  const [customDiscountAmount, setCustomDiscountAmount] = useState('')

  // State for transaction date - defaults to current date
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(() => new Date())
  const [dateValidationError, setDateValidationError] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Memoize date comparisons to prevent infinite loops
  const isToday = useMemo(() => {
    const selected = startOfDay(transactionDate || new Date()).getTime()
    const today = startOfDay(new Date()).getTime()
    return selected === today
  }, [transactionDate])

  // Handle transaction date changes
  const handleDateChange = useCallback((date: Date | undefined) => {
    if (!date) {
      setTransactionDate(new Date())
      setDateValidationError(null)
      onUpdateTransactionDate?.(undefined)
      return
    }

    const selectedDate = startOfDay(date)
    const today = startOfDay(new Date())

    // Validate: No future dates
    if (isFuture(selectedDate)) {
      setDateValidationError('Cannot enter bills dated in the future')
      return
    }

    setTransactionDate(date)
    setDateValidationError(null)
    onUpdateTransactionDate?.(date.toISOString())
    setShowDatePicker(false) // Auto-close after selection
  }, [onUpdateTransactionDate])

  // Load staff members using proper hook
  const { staff, isLoading: staffLoading } = useHeraStaff({
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      limit: 100
    }
  })

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
    if (discountMode === 'percent') {
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
    } else {
      // Amount mode
      const amount = parseFloat(customDiscountAmount)
      if (amount > 0 && amount <= totals.subtotal) {
        onAddDiscount({
          type: 'fixed',
          value: amount,
          description: `AED ${amount.toFixed(2)} discount`,
          applied_to: 'subtotal'
        })
        setCustomDiscountAmount('')
        setShowDiscountSection(false)
      }
    }
  }, [discountMode, customDiscountPercent, customDiscountAmount, totals.subtotal, onAddDiscount])

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

  // Helper to get current staff list for an item
  const getCurrentStaffList = (item: LineItem): { ids: string[]; names: string[] } => {
    // Check if using new array format
    if (item.stylist_ids && item.stylist_names) {
      return { ids: item.stylist_ids, names: item.stylist_names }
    }
    // Migrate from old single format to array format
    if (item.stylist_id && item.stylist_name) {
      return { ids: [item.stylist_id], names: [item.stylist_name] }
    }
    return { ids: [], names: [] }
  }

  // Add staff to service item
  const handleAddStaff = (itemId: string, staffId: string, staffName: string) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    const current = getCurrentStaffList(item)

    // Don't add if already assigned
    if (current.ids.includes(staffId)) {
      setShowStaffSelector(null)
      return
    }

    onUpdateItem(itemId, {
      stylist_ids: [...current.ids, staffId],
      stylist_names: [...current.names, staffName]
    })
    setShowStaffSelector(null)
  }

  // Remove specific staff from service item
  const handleRemoveStaff = (itemId: string, staffId: string) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    const current = getCurrentStaffList(item)
    const staffIndex = current.ids.indexOf(staffId)

    if (staffIndex === -1) return

    const newIds = current.ids.filter((_, i) => i !== staffIndex)
    const newNames = current.names.filter((_, i) => i !== staffIndex)

    onUpdateItem(itemId, {
      stylist_ids: newIds.length > 0 ? newIds : undefined,
      stylist_names: newNames.length > 0 ? newNames : undefined
    })
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

  // Handle price edit for services
  const handleStartEditPrice = (item: LineItem) => {
    setEditingPriceId(item.id)
    setEditPrice(item.unit_price.toFixed(2))
  }

  const handleSavePrice = (itemId: string) => {
    const item = ticket.lineItems.find(i => i.id === itemId)
    if (!item) return

    const newPrice = parseFloat(editPrice)
    if (isNaN(newPrice) || newPrice < 0) {
      setEditingPriceId(null)
      return
    }

    onUpdateItem(itemId, {
      unit_price: newPrice,
      line_amount: newPrice * item.quantity
    })
    setEditingPriceId(null)
    setEditPrice('')
  }

  const handleCancelEditPrice = () => {
    setEditingPriceId(null)
    setEditPrice('')
  }

  // Handle custom "Other" item creation - Unified approach
  const handleOpenOtherItem = () => {
    // Start with service as default, user can toggle
    setOtherItemType('service')
    setOtherItemPrice('')
    setShowOtherItemModal(true)
  }

  const handleAddOtherItem = () => {
    if (!onAddItem) return

    const price = parseFloat(otherItemPrice)
    if (isNaN(price) || price < 0) {
      return
    }

    // Use standardized names for consistency and reporting
    const itemName = otherItemType === 'service' ? 'Other Service' : 'Other Product'

    // Create a custom item with temporary ID
    const customItem = {
      __kind: otherItemType.toUpperCase() as 'SERVICE' | 'PRODUCT',
      id: `custom-${otherItemType}-${Date.now()}`,
      title: itemName,
      price: price,
      entity_id: `custom-${otherItemType}-${Date.now()}`,
      entity_name: itemName,
      unit_price: price
    }

    onAddItem(customItem)

    // Reset and close modal
    setOtherItemPrice('')
    setShowOtherItemModal(false)
  }

  const handleCancelOtherItem = () => {
    setOtherItemPrice('')
    setShowOtherItemModal(false)
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

      {/* Compact Cart Header */}
      <div
        className="relative h-14 flex items-center justify-between px-4 overflow-hidden flex-shrink-0"
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
        <div className="relative z-10 flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg"
            style={{
              backgroundColor: `${COLORS.gold}20`,
              border: `1px solid ${COLORS.gold}40`
            }}
          >
            <ShoppingCart className="w-4 h-4" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: COLORS.champagne }}
            >
              Cart
            </h2>
            <p className="text-[10px]" style={{ color: COLORS.bronze }}>
              {ticket.lineItems.length} {ticket.lineItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        {ticket.lineItems.length > 0 && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: COLORS.bronze }}>
              Subtotal
            </p>
            <p className="text-sm font-semibold" style={{ color: COLORS.gold }}>
              AED {(totals?.subtotal || 0).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Customer Info - Display Only */}
      <div
        className="px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: `${COLORS.gold}20`, background: `${COLORS.charcoalDark}40` }}
      >
        {ticket.customer_name ? (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `${COLORS.gold}20`,
                border: `1px solid ${COLORS.gold}40`
              }}
            >
              <User className="w-4 h-4" style={{ color: COLORS.gold }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: COLORS.champagne }}>
                {ticket.customer_name}
              </p>
              <p className="text-[10px]" style={{ color: COLORS.bronze }}>
                Customer
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{
              background: `${COLORS.charcoalLight}`,
              border: `1px dashed ${COLORS.gold}40`
            }}
          >
            <User className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.gold }} />
            <p className="text-[10px] flex-1" style={{ color: COLORS.champagne }}>
              Customer will be selected in Bill Setup
            </p>
          </div>
        )}
      </div>

      {/* Bill Date Selector - Compact Design */}
      <div
        className="px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: `${COLORS.gold}20`, background: `${COLORS.charcoalDark}40` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: isToday
                  ? `${COLORS.gold}20`
                  : `${COLORS.bronze}20`,
                border: `1px solid ${
                  isToday
                    ? COLORS.gold
                    : COLORS.bronze
                }40`
              }}
            >
              {isToday ? (
                <CalendarIcon className="w-4 h-4" style={{ color: COLORS.gold }} />
              ) : (
                <History className="w-4 h-4" style={{ color: COLORS.bronze }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px]" style={{ color: COLORS.bronze }}>
                Bill Date
              </p>
              <p className="text-xs font-medium truncate" style={{ color: COLORS.champagne }}>
                {transactionDate ? format(transactionDate, 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="h-8 px-2 text-xs"
            style={{
              background: showDatePicker ? `${COLORS.gold}20` : 'transparent',
              borderColor: `${COLORS.gold}40`,
              color: COLORS.gold,
              border: '1px solid'
            }}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
            Change
          </Button>
        </div>

        {/* Date Picker Dropdown */}
        {showDatePicker && (
          <div
            className="mt-3 p-3 rounded-lg animate-fadeIn"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.charcoalDark} 100%)`,
              border: `1px solid ${COLORS.gold}40`,
              boxShadow: `0 4px 12px ${COLORS.black}50`
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Label className="text-xs font-semibold" style={{ color: COLORS.champagne }}>
                Select Bill Date
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDatePicker(false)}
                className="h-5 w-5 p-0"
                style={{ color: COLORS.bronze }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Custom Calendar with Salon Colors */}
            <Calendar
              mode="single"
              selected={transactionDate}
              onSelect={handleDateChange}
              disabled={(date) => isFuture(date)}
              className="salon-calendar"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-champagne',
                nav: 'space-x-1 flex items-center',
                nav_button: cn(
                  'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gold/30 hover:border-gold/60 rounded'
                ),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'rounded-md w-9 font-normal text-[0.8rem] text-bronze',
                row: 'flex w-full mt-2',
                cell: 'h-9 w-9 text-center text-sm p-0 relative',
                day: cn(
                  'h-9 w-9 p-0 font-normal rounded hover:bg-gold/10 text-champagne transition-colors'
                ),
                day_selected:
                  'bg-gold/30 text-champagne hover:bg-gold/40 border border-gold',
                day_today: 'bg-gold/20 text-gold font-bold border border-gold/50',
                day_outside: 'text-bronze/30 opacity-30',
                day_disabled: 'text-bronze/20 opacity-20 hover:bg-transparent cursor-not-allowed',
                day_range_middle: 'aria-selected:bg-gold/20',
                day_hidden: 'invisible'
              }}
              style={{
                backgroundColor: COLORS.charcoalDark,
                color: COLORS.champagne
              }}
            />

            {dateValidationError && (
              <div
                className="mt-2 p-2 rounded text-xs"
                style={{
                  background: `#EF444420`,
                  border: `1px solid #EF4444`,
                  color: '#EF4444'
                }}
              >
                {dateValidationError}
              </div>
            )}

            {/* Old Bill Indicator */}
            {transactionDate && !isToday && (
                <div
                  className="mt-2 flex items-start gap-2 p-2 rounded text-xs"
                  style={{
                    background: `${COLORS.bronze}15`,
                    border: `1px solid ${COLORS.bronze}40`,
                    color: COLORS.bronze
                  }}
                >
                  <History className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <p>
                    Bill dated <span className="font-medium" style={{ color: COLORS.champagne }}>{format(transactionDate, 'dd MMM yyyy')}</span>. Entry timestamp will be today for audit.
                  </p>
                </div>
              )}

            {/* Quick Date Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => {
                  const today = new Date()
                  setTransactionDate(today)
                  handleDateChange(today)
                  setShowDatePicker(false)
                }}
                className="text-xs py-2"
                style={{
                  background: `${COLORS.gold}30`,
                  color: COLORS.champagne,
                  borderColor: `${COLORS.gold}60`,
                  border: '1px solid'
                }}
              >
                Today
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setTransactionDate(yesterday)
                  handleDateChange(yesterday)
                  setShowDatePicker(false)
                }}
                className="text-xs py-2"
                style={{
                  background: `${COLORS.bronze}30`,
                  color: COLORS.champagne,
                  borderColor: `${COLORS.bronze}60`,
                  border: '1px solid'
                }}
              >
                Yesterday
              </Button>
            </div>
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

                          {/* Staff Assignment Section - Only for Services */}
                          {item.entity_type === 'service' && (() => {
                            const currentStaff = getCurrentStaffList(item)
                            const hasStaff = currentStaff.ids.length > 0

                            return (
                              <div className="mt-2 space-y-2">
                                {/* Staff Badges - Show all assigned staff */}
                                {hasStaff && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {currentStaff.ids.map((staffId, index) => {
                                      const staffName = currentStaff.names[index]
                                      return (
                                        <div
                                          key={staffId}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg group/staff"
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
                                            {getInitials(staffName)}
                                          </div>
                                          <p
                                            className="text-[11px] font-medium truncate"
                                            style={{ color: COLORS.gold, maxWidth: '100px' }}
                                          >
                                            {staffName}
                                          </p>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveStaff(item.id, staffId)}
                                            className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                                            style={{ color: '#EF4444' }}
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Add Staff Button - Always Visible */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowStaffSelector(showStaffSelector === item.id ? null : item.id)}
                                  className="w-full text-xs py-1.5 h-auto"
                                  style={{
                                    background: `${COLORS.charcoalDark}`,
                                    borderColor: `${COLORS.gold}40`,
                                    color: COLORS.gold,
                                    borderStyle: hasStaff ? 'solid' : 'dashed'
                                  }}
                                >
                                  <UserPlus className="w-3 h-3 mr-1.5" />
                                  {hasStaff ? 'Add Another Staff' : 'Assign Staff'}
                                </Button>

                                {/* Staff Selector Dropdown */}
                                {showStaffSelector === item.id && (
                                  <div
                                    className="p-2 rounded-lg animate-fadeIn"
                                    style={{
                                      background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoalDark} 100%)`,
                                      border: `1px solid ${COLORS.gold}40`,
                                      boxShadow: `0 4px 12px ${COLORS.black}50`
                                    }}
                                  >
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                      {staffLoading ? (
                                        <div className="text-center py-3" style={{ color: COLORS.lightText }}>
                                          <p className="text-xs">Loading staff...</p>
                                        </div>
                                      ) : !staff || staff.length === 0 ? (
                                        <div className="text-center py-3" style={{ color: COLORS.lightText }}>
                                          <p className="text-xs">No staff found</p>
                                        </div>
                                      ) : (
                                        staff.map(s => {
                                          const isAssigned = currentStaff.ids.includes(s.id)
                                          return (
                                            <Button
                                              key={s.id}
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleAddStaff(item.id, s.id, s.entity_name)}
                                              disabled={isAssigned}
                                              className="w-full justify-start text-xs py-1.5 h-auto disabled:opacity-40"
                                              style={{
                                                color: COLORS.champagne,
                                                background: isAssigned ? `${COLORS.gold}20` : 'transparent'
                                              }}
                                            >
                                              <div
                                                className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold mr-2"
                                                style={{
                                                  background: isAssigned
                                                    ? `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                                                    : `${COLORS.gold}30`,
                                                  color: isAssigned ? COLORS.black : COLORS.gold
                                                }}
                                              >
                                                {getInitials(s.entity_name)}
                                              </div>
                                              {s.entity_name}
                                              {isAssigned && (
                                                <span className="ml-auto text-[10px]" style={{ color: COLORS.gold }}>
                                                  ✓ Assigned
                                                </span>
                                              )}
                                            </Button>
                                          )
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })()}
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
                          {/* Price Edit for Services Only */}
                          {item.entity_type === 'service' && editingPriceId === item.id ? (
                            <div className="flex items-center gap-2 animate-fadeIn">
                              <Input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSavePrice(item.id)
                                  if (e.key === 'Escape') handleCancelEditPrice()
                                }}
                                className="h-7 w-24 text-xs text-right"
                                style={{
                                  backgroundColor: COLORS.charcoalDark,
                                  borderColor: COLORS.gold,
                                  color: COLORS.champagne
                                }}
                                autoFocus
                                step="0.01"
                                min="0"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSavePrice(item.id)}
                                className="h-7 w-7 p-0"
                                style={{ color: COLORS.emerald }}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditPrice}
                                className="h-7 w-7 p-0"
                                style={{ color: '#EF4444' }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                <span className="text-[10px]" style={{ color: COLORS.bronze }}>
                                  AED {(item?.unit_price || 0).toFixed(2)} each
                                </span>
                                {item.entity_type === 'service' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditPrice(item)}
                                    className="h-4 w-4 p-0 opacity-60 hover:opacity-100 transition-opacity"
                                    style={{ color: COLORS.gold }}
                                    title="Edit service price"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                              <div className="font-semibold text-sm" style={{ color: COLORS.gold }}>
                                AED {(item?.line_amount || 0).toFixed(2)}
                              </div>
                            </>
                          )}
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

            {/* Discount, Tip, and Other Item Section - Three Columns */}
            <div
              className="px-4 py-2.5 border-t flex-shrink-0"
              style={{ borderColor: `${COLORS.gold}20` }}
            >
              <div className="grid grid-cols-3 gap-2">
                {/* Discount */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscountSection(!showDiscountSection)}
                  className="text-xs py-2 hover:scale-[1.02] transition-all duration-200"
                  style={{
                    background: showDiscountSection
                      ? `${COLORS.emerald}20`
                      : `${COLORS.charcoalDark}80`,
                    borderColor: showDiscountSection ? COLORS.emerald : `${COLORS.emerald}40`,
                    color: COLORS.emerald,
                    fontSize: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.emerald}25`
                    e.currentTarget.style.borderColor = `${COLORS.emerald}60`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = showDiscountSection
                      ? `${COLORS.emerald}20`
                      : `${COLORS.charcoalDark}80`
                    e.currentTarget.style.borderColor = showDiscountSection
                      ? COLORS.emerald
                      : `${COLORS.emerald}40`
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
                  className="text-xs py-2 hover:scale-[1.02] transition-all duration-200"
                  style={{
                    background: showTipSection
                      ? `${COLORS.gold}20`
                      : `${COLORS.charcoalDark}80`,
                    borderColor: showTipSection ? COLORS.gold : `${COLORS.gold}40`,
                    color: COLORS.gold,
                    fontSize: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.gold}25`
                    e.currentTarget.style.borderColor = `${COLORS.gold}60`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = showTipSection
                      ? `${COLORS.gold}20`
                      : `${COLORS.charcoalDark}80`
                    e.currentTarget.style.borderColor = showTipSection
                      ? COLORS.gold
                      : `${COLORS.gold}40`
                  }}
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                  Tip
                </Button>

                {/* Unified Other Item Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenOtherItem}
                  disabled={!onAddItem}
                  className="text-xs py-2 hover:scale-[1.02] transition-all duration-200"
                  style={{
                    background: `${COLORS.charcoalDark}80`,
                    borderColor: `${COLORS.bronze}40`,
                    color: COLORS.champagne,
                    fontSize: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.bronze}25`
                    e.currentTarget.style.borderColor = `${COLORS.bronze}60`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${COLORS.charcoalDark}80`
                    e.currentTarget.style.borderColor = `${COLORS.bronze}40`
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Other Item
                </Button>
              </div>

              {/* Discount Section - Enhanced with Mode Toggle */}
              {showDiscountSection && (
                <div
                  className="mt-3 p-3 rounded-lg animate-fadeIn"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.emerald}15 0%, ${COLORS.charcoalDark} 100%)`,
                    border: `1px solid ${COLORS.emerald}40`
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
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

                  {/* Mode Toggle - Percent vs Amount */}
                  <div className="flex gap-1.5 mb-3 p-1 rounded-lg" style={{ background: COLORS.charcoalDark }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDiscountMode('percent')}
                      className="flex-1 text-xs py-1.5 transition-all"
                      style={{
                        background: discountMode === 'percent' ? `${COLORS.emerald}40` : 'transparent',
                        color: discountMode === 'percent' ? COLORS.black : COLORS.emerald,
                        fontWeight: discountMode === 'percent' ? '600' : '400'
                      }}
                    >
                      <Percent className="w-3 h-3 mr-1" />
                      Percent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDiscountMode('amount')}
                      className="flex-1 text-xs py-1.5 transition-all"
                      style={{
                        background: discountMode === 'amount' ? `${COLORS.emerald}40` : 'transparent',
                        color: discountMode === 'amount' ? COLORS.black : COLORS.emerald,
                        fontWeight: discountMode === 'amount' ? '600' : '400'
                      }}
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Amount
                    </Button>
                  </div>

                  {/* Quick Discount Buttons - Percent Only */}
                  {discountMode === 'percent' && (
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
                  )}

                  {/* Custom Input - Changes based on mode */}
                  <div className="flex gap-2">
                    {discountMode === 'percent' ? (
                      <Input
                        type="number"
                        placeholder="Custom %"
                        value={customDiscountPercent}
                        onChange={e => setCustomDiscountPercent(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyCustomDiscount()}
                        className="text-xs h-8"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: `${COLORS.emerald}40`,
                          color: COLORS.champagne
                        }}
                        min="0"
                        max="100"
                        step="1"
                      />
                    ) : (
                      <Input
                        type="number"
                        placeholder="Custom AED"
                        value={customDiscountAmount}
                        onChange={e => setCustomDiscountAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyCustomDiscount()}
                        className="text-xs h-8"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: `${COLORS.emerald}40`,
                          color: COLORS.champagne
                        }}
                        min="0"
                        max={totals.subtotal.toString()}
                        step="0.01"
                      />
                    )}
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

              {/* Unified "Other Item" Modal - Enterprise Grade */}
              {showOtherItemModal && (
                <div
                  className="mt-3 p-4 rounded-lg animate-fadeIn"
                  style={{
                    background: `linear-gradient(135deg, ${
                      otherItemType === 'service' ? COLORS.gold : COLORS.silver
                    }15 0%, ${COLORS.charcoalDark} 100%)`,
                    border: `1px solid ${
                      otherItemType === 'service' ? COLORS.gold : COLORS.silver
                    }40`,
                    boxShadow: `0 4px 12px ${COLORS.black}50`
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" style={{ color: COLORS.champagne }} />
                      <Label className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                        Add Other Item
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelOtherItem}
                      className="h-6 w-6 p-0"
                      style={{ color: COLORS.bronze }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {/* Type Selector - Service or Product */}
                    <div>
                      <Label className="text-xs mb-2 block" style={{ color: COLORS.bronze }}>
                        Item Type
                      </Label>
                      <div className="flex gap-2 p-1 rounded-lg" style={{ background: COLORS.charcoalDark }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOtherItemType('service')}
                          className="flex-1 text-xs py-2 transition-all"
                          style={{
                            background: otherItemType === 'service' ? `${COLORS.gold}40` : 'transparent',
                            color: otherItemType === 'service' ? COLORS.black : COLORS.gold,
                            fontWeight: otherItemType === 'service' ? '600' : '400'
                          }}
                        >
                          <Scissors className="w-3.5 h-3.5 mr-1.5" />
                          Service
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOtherItemType('product')}
                          className="flex-1 text-xs py-2 transition-all"
                          style={{
                            background: otherItemType === 'product' ? `${COLORS.silver}40` : 'transparent',
                            color: otherItemType === 'product' ? COLORS.black : COLORS.silver,
                            fontWeight: otherItemType === 'product' ? '600' : '400'
                          }}
                        >
                          <Package className="w-3.5 h-3.5 mr-1.5" />
                          Product
                        </Button>
                      </div>
                    </div>

                    {/* Fixed Name Display */}
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        background: `${COLORS.charcoalDark}`,
                        border: `1px solid ${
                          otherItemType === 'service' ? COLORS.gold : COLORS.silver
                        }30`
                      }}
                    >
                      <Label className="text-xs mb-1 block" style={{ color: COLORS.bronze }}>
                        Will be added as
                      </Label>
                      <div className="flex items-center gap-2">
                        {otherItemType === 'service' ? (
                          <Scissors className="w-3.5 h-3.5" style={{ color: COLORS.gold }} />
                        ) : (
                          <Package className="w-3.5 h-3.5" style={{ color: COLORS.silver }} />
                        )}
                        <p className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                          {otherItemType === 'service' ? 'Other Service' : 'Other Product'}
                        </p>
                      </div>
                    </div>

                    {/* Price Input Only */}
                    <div>
                      <Label className="text-xs mb-1.5 block" style={{ color: COLORS.bronze }}>
                        Price (AED) *
                      </Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={otherItemPrice}
                        onChange={e => setOtherItemPrice(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddOtherItem()
                          if (e.key === 'Escape') handleCancelOtherItem()
                        }}
                        className="text-sm h-10"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: `${
                            otherItemType === 'service' ? COLORS.gold : COLORS.silver
                          }40`,
                          color: COLORS.champagne
                        }}
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelOtherItem}
                        className="text-xs h-9"
                        style={{
                          background: `${COLORS.charcoalDark}`,
                          borderColor: `${COLORS.bronze}40`,
                          color: COLORS.bronze
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddOtherItem}
                        disabled={!otherItemPrice || parseFloat(otherItemPrice) <= 0}
                        className="text-xs h-9"
                        style={{
                          background: `linear-gradient(135deg, ${
                            otherItemType === 'service' ? COLORS.gold : COLORS.silver
                          } 0%, ${
                            otherItemType === 'service' ? COLORS.goldDark : COLORS.silverDark
                          } 100%)`,
                          color: COLORS.black
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add to Cart
                      </Button>
                    </div>
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
