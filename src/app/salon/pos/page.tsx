'use client'

import { useState, useEffect } from 'react'
import { useSalonContext } from '@/app/salon/SalonProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { flags } from '@/config/flags'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { CatalogPane } from '@/components/salon/pos/CatalogPane'
import { CartSidebar } from '@/components/salon/pos/CartSidebar'
import { PaymentDialog } from '@/components/salon/pos/PaymentDialog'
import { Receipt } from '@/components/salon/pos/Receipt'
import { CustomerSearchModal } from '@/components/salon/pos/CustomerSearchModal'
import { TicketDetailsModal } from '@/components/salon/pos/TicketDetailsModal'
import { PosCommissionBadge } from '@/components/salon/pos/PosCommissionBadge'
import { usePosTicket } from '@/hooks/usePosTicket'
import { useAppointmentLookup } from '@/hooks/useAppointmentLookup'
import { useCustomerLookup } from '@/hooks/useCustomerLookup'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  ChevronRight,
  Search,
  ShoppingCart,
  CreditCard,
  Receipt as ReceiptIcon,
  Settings,
  Monitor,
  Users,
  FileText,
  User,
  Building2,
  MapPin,
  Sparkles,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Luxe salon color palette for enterprise-grade aesthetics
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
  plum: '#B794F4',
  emerald: '#0F6F5C',
  rose: '#E8B4B8'
}

function POSContent() {
  const { user, organizationId } = useSalonContext()
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)
  const [commissionsEnabled, setCommissionsEnabled] = useState(true)

  // Get organization ID from localStorage for demo mode
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  const effectiveOrgId = organizationId || localOrgId

  // Branch filter hook
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(effectiveOrgId, 'salon-pos')

  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false)
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false)

  // Load commission settings
  useEffect(() => {
    const loadCommissionSettings = async () => {
      if (!effectiveOrgId) return

      try {
        universalApi.setOrganizationId(effectiveOrgId)
        const orgResponse = await universalApi.getEntity(effectiveOrgId)

        if (orgResponse.success && orgResponse.data) {
          const orgData = orgResponse.data as any
          const settings = orgData.settings || {}
          const enabled =
            flags.ENABLE_COMMISSIONS && (settings?.salon?.commissions?.enabled ?? true)
          setCommissionsEnabled(enabled)
        }
      } catch (error) {
        console.error('Error loading commission settings:', error)
      }
    }

    loadCommissionSettings()
  }, [effectiveOrgId])

  // Always call hooks - pass empty string if no org ID to satisfy hooks rules
  const posTicketResult = usePosTicket(effectiveOrgId || 'demo-org')
  const {
    ticket,
    addLineItem,
    updateLineItem,
    removeLineItem,
    addDiscount,
    addTip,
    clearTicket,
    addCustomerToTicket,
    addItemsFromAppointment,
    calculateTotals
  } = posTicketResult

  const appointmentLookupResult = useAppointmentLookup(effectiveOrgId || 'demo-org')
  const { loadAppointment } = appointmentLookupResult

  const customerLookupResult = useCustomerLookup(effectiveOrgId || 'demo-org')
  const { searchCustomers } = customerLookupResult

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        e.preventDefault()
        setIsCustomerSearchOpen(true)
      } else if (e.key === '+' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        document.getElementById('catalog-search')?.focus()
      } else if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsTicketDetailsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCustomerSelect = async (customer: any) => {
    addCustomerToTicket({
      customer_id: customer.id,
      customer_name: customer.entity_name,
      customer_email: customer.email,
      customer_phone: customer.phone
    })
  }

  const handleAppointmentSelect = async (appointment: any) => {
    const fullAppointment = await loadAppointment(appointment.id)
    if (fullAppointment) {
      addItemsFromAppointment({
        appointment_id: fullAppointment.id,
        customer_id: fullAppointment.customer_id,
        customer_name: fullAppointment.customer_name || 'Walk-in',
        services:
          fullAppointment.service_ids?.map((serviceId: string, index: number) => ({
            id: serviceId,
            name: fullAppointment.service_names?.[index] || `Service ${index + 1}`,
            price: 0,
            stylist_id: fullAppointment.stylist_id,
            stylist_name: fullAppointment.stylist_name
          })) || []
      })
    }
  }

  const handlePayment = () => {
    if (!ticket?.lineItems || ticket.lineItems.length === 0) return
    setIsPaymentOpen(true)
  }

  const handlePaymentComplete = (saleData: any) => {
    setCompletedSale(saleData)
    setIsPaymentOpen(false)
    setIsReceiptOpen(true)
    clearTicket()
  }

  const totals = calculateTotals()

  if (!effectiveOrgId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div
          className="text-center p-10 rounded-2xl"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.1), 0 0 0 1px rgba(212, 175, 55, 0.1)',
            border: `1px solid ${COLORS.gold}20`
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`
            }}
          >
            <Sparkles className="w-8 h-8" style={{ color: COLORS.gold }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.champagne }}>
            Initializing Point of Sale
          </h2>
          <p className="text-sm" style={{ color: COLORS.bronze }}>
            Setting up your luxury salon experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.black }}>
      {/* Elegant gradient background overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, ${COLORS.gold}08 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, ${COLORS.plum}06 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, ${COLORS.emerald}04 0%, transparent 50%)
          `,
          opacity: 0.6
        }}
      />

      {/* Main content wrapper */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Enhanced Header with Glassmorphism */}
        <div
          className="sticky top-0 z-40 px-8 py-5 backdrop-blur-xl"
          style={{
            backgroundColor: `${COLORS.charcoal}E6`,
            borderBottom: `1px solid ${COLORS.gold}20`,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left Section - Branding & Title */}
            <div className="flex items-center space-x-6">
              {/* Title with Icon */}
              <div className="flex items-center space-x-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                    border: `1px solid ${COLORS.gold}30`,
                    boxShadow: `0 0 20px ${COLORS.gold}15`
                  }}
                >
                  <Monitor className="w-7 h-7" style={{ color: COLORS.gold }} />
                </div>
                <h1
                  className="text-4xl font-bold tracking-tight"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Point of Sale
                </h1>
              </div>

              {/* Live Status Badge */}
              <Badge
                className="px-4 py-1.5 font-semibold"
                style={{
                  backgroundColor: `${COLORS.emerald}15`,
                  color: COLORS.emerald,
                  border: `1px solid ${COLORS.emerald}40`,
                  boxShadow: `0 0 16px ${COLORS.emerald}25`
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2.5 animate-pulse"
                  style={{ backgroundColor: COLORS.emerald }}
                />
                Live
              </Badge>

              {/* Commission Badge */}
              <PosCommissionBadge commissionsEnabled={commissionsEnabled} />
            </div>

            {/* Right Section - Controls */}
            <div className="flex items-center space-x-4">
              {/* Branch Selector */}
              <div className="flex items-center space-x-2.5">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}15 0%, ${COLORS.gold}08 100%)`,
                    border: `1px solid ${COLORS.gold}30`
                  }}
                >
                  <Building2 className="w-4 h-4" style={{ color: COLORS.gold }} />
                </div>
                <Select
                  value={branchId || '__ALL__'}
                  onValueChange={value => setBranchId(value === '__ALL__' ? '' : value)}
                >
                  <SelectTrigger
                    className="w-52 border-0 font-medium"
                    style={{
                      backgroundColor: `${COLORS.charcoalDark}CC`,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.champagne,
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <SelectValue
                      placeholder="Select location"
                      style={{ color: COLORS.champagne }}
                    />
                  </SelectTrigger>
                  <SelectContent
                    className="hera-select-content"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      border: `1px solid ${COLORS.gold}30`,
                      color: COLORS.champagne
                    }}
                  >
                    <SelectItem value="__ALL__" style={{ color: COLORS.champagne }}>
                      All locations
                    </SelectItem>
                    {branchesLoading ? (
                      <SelectItem value="__LOADING__" disabled style={{ color: COLORS.bronze }}>
                        Loading branches...
                      </SelectItem>
                    ) : branches.length === 0 ? (
                      <SelectItem value="__NONE__" disabled style={{ color: COLORS.bronze }}>
                        No branches configured
                      </SelectItem>
                    ) : (
                      branches.map(branch => (
                        <SelectItem
                          key={branch.id}
                          value={branch.id}
                          style={{ color: COLORS.champagne }}
                        >
                          {branch.entity_name || 'Unnamed Branch'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Cashier Info */}
              <div className="flex items-center space-x-2.5">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.bronze}15 0%, ${COLORS.bronze}08 100%)`,
                    border: `1px solid ${COLORS.bronze}30`
                  }}
                >
                  <User className="w-4 h-4" style={{ color: COLORS.bronze }} />
                </div>
                <div
                  className="px-4 py-2 rounded-lg font-medium text-sm"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark}CC`,
                    border: `1px solid ${COLORS.bronze}30`,
                    color: COLORS.champagne,
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {user?.email || localStorage.getItem('salonUserName') || 'Staff Member'}
                </div>
              </div>

              {/* Settings Button */}
              <Button
                variant="outline"
                size="sm"
                className="p-2.5 transition-all hover:scale-105"
                style={{
                  backgroundColor: `${COLORS.charcoalDark}CC`,
                  border: `1px solid ${COLORS.bronze}30`,
                  color: COLORS.bronze,
                  boxShadow: `0 0 0 1px ${COLORS.bronze}10`
                }}
              >
                <Settings className="w-4 h-4" style={{ color: COLORS.bronze }} />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Enhanced Two Pane Layout */}
        <div className="flex h-[calc(100vh-92px)]">
          {/* Left Pane - Catalog with Enhanced Border */}
          <div
            className="flex-1 min-w-0"
            style={{
              borderRight: `1px solid ${COLORS.gold}15`,
              background: `linear-gradient(to bottom, ${COLORS.charcoal}00 0%, ${COLORS.charcoal}40 100%)`
            }}
          >
            <CatalogPane
              organizationId={effectiveOrgId}
              onAddItem={addLineItem}
              currentCustomerId={ticket.customer_id}
              currentAppointmentId={ticket.appointment_id}
            />
          </div>

          {/* Right Pane - Enhanced Cart Sidebar */}
          <div
            className="w-[420px] shrink-0 flex flex-col"
            style={{
              background: `linear-gradient(to bottom, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`
            }}
          >
            {/* Enhanced Action Buttons Bar */}
            <div
              className="p-6"
              style={{
                borderBottom: `1px solid ${COLORS.gold}15`,
                background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoalDark} 100%)`,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomerSearchOpen(true)}
                  className="flex items-center justify-center gap-2 py-6 font-medium transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark}80`,
                    border: `1px solid ${COLORS.gold}40`,
                    color: COLORS.champagne,
                    boxShadow: `0 0 0 1px ${COLORS.gold}10`
                  }}
                >
                  <Search className="w-4 h-4" style={{ color: COLORS.gold }} />
                  Find Customer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsTicketDetailsOpen(true)}
                  disabled={ticket.lineItems.length === 0}
                  className="flex items-center justify-center gap-2 py-6 font-medium transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark}80`,
                    border: `1px solid ${COLORS.bronze}40`,
                    color: COLORS.champagne,
                    boxShadow: `0 0 0 1px ${COLORS.bronze}10`,
                    opacity: ticket.lineItems.length === 0 ? 0.5 : 1
                  }}
                >
                  <FileText className="w-4 h-4" style={{ color: COLORS.bronze }} />
                  Details
                </Button>
              </div>

              {/* Enhanced Customer Info Card */}
              {ticket.customer_name && (
                <div
                  className="p-4 rounded-xl mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}12 0%, ${COLORS.gold}06 100%)`,
                    border: `1px solid ${COLORS.gold}30`,
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                      }}
                    >
                      <User className="w-5 h-5" style={{ color: COLORS.black }} />
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-semibold text-sm mb-0.5"
                        style={{ color: COLORS.champagne }}
                      >
                        {ticket.customer_name}
                      </div>
                      <div
                        className="text-xs flex items-center gap-1.5"
                        style={{ color: COLORS.bronze }}
                      >
                        <Clock className="w-3 h-3" />
                        {ticket.customer_phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Quick Stats */}
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalDark} 0%, ${COLORS.black} 100%)`,
                  border: `1px solid ${COLORS.bronze}20`
                }}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" style={{ color: COLORS.bronze }} />
                  <span className="font-medium" style={{ color: COLORS.bronze }}>
                    {ticket.lineItems.length} item{ticket.lineItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="font-bold text-lg" style={{ color: COLORS.gold }}>
                  AED {(totals?.total || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Cart Items Scrollable Area */}
            <div className="flex-1 overflow-hidden">
              <CartSidebar
                ticket={ticket}
                totals={totals}
                onUpdateItem={updateLineItem}
                onRemoveItem={removeLineItem}
                onPayment={handlePayment}
                commissionsEnabled={commissionsEnabled}
              />
            </div>

            {/* Enhanced Bottom Action Bar */}
            <div
              className="p-6"
              style={{
                borderTop: `1px solid ${COLORS.gold}15`,
                background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoalDark} 100%)`,
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={clearTicket}
                  disabled={ticket.lineItems.length === 0}
                  className="px-6 py-6 font-medium"
                  style={{
                    backgroundColor: `${COLORS.charcoalDark}80`,
                    border: `1px solid ${COLORS.rose}40`,
                    color: COLORS.rose,
                    opacity: ticket.lineItems.length === 0 ? 0.5 : 1
                  }}
                >
                  Clear Ticket
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={ticket.lineItems.length === 0}
                  className="flex-1 py-6 font-bold text-base transition-all hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color: COLORS.black,
                    boxShadow: `0 4px 12px ${COLORS.gold}40, 0 0 0 1px ${COLORS.gold}`,
                    opacity: ticket.lineItems.length === 0 ? 0.5 : 1
                  }}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay AED {(totals?.total || 0).toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <CustomerSearchModal
          open={isCustomerSearchOpen}
          onClose={() => setIsCustomerSearchOpen(false)}
          organizationId={effectiveOrgId || ''}
          onCustomerSelect={handleCustomerSelect}
          onAppointmentSelect={handleAppointmentSelect}
        />

        <TicketDetailsModal
          open={isTicketDetailsOpen}
          onClose={() => setIsTicketDetailsOpen(false)}
          ticket={ticket}
          totals={totals}
          onUpdateItem={updateLineItem}
          onRemoveItem={removeLineItem}
          onAddDiscount={addDiscount}
          onAddTip={addTip}
        />

        <PaymentDialog
          open={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          ticket={ticket}
          totals={totals}
          organizationId={effectiveOrgId}
          onComplete={handlePaymentComplete}
        />

        <Receipt
          open={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          saleData={completedSale}
        />

        {/* Mobile Cart Floating Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-2xl py-7 px-8 font-bold transition-all hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
              color: COLORS.black,
              boxShadow: `0 8px 24px ${COLORS.gold}60, 0 0 0 1px ${COLORS.gold}`
            }}
          >
            <ShoppingCart className="w-6 h-6 mr-2" />
            {ticket.lineItems.length}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SalonPOSPage() {
  return (
    <SimpleSalonGuard requiredRoles={['owner', 'receptionist', 'admin']}>
      <POSContent />
    </SimpleSalonGuard>
  )
}
