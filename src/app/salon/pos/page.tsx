'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { universalApi } from '@/lib/universal-api-v2'
import { flags } from '@/config/flags'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import { CatalogPane } from '@/components/salon/pos/CatalogPane'
import { CartSidebar } from '@/components/salon/pos/CartSidebar'
import { PaymentDialog } from '@/components/salon/pos/PaymentDialog'
import { Receipt } from '@/components/salon/pos/Receipt'
import { TicketDetailsModal } from '@/components/salon/pos/TicketDetailsModal'
import { usePosTicket } from '@/hooks/usePosTicket'
import { useAppointmentLookup } from '@/hooks/useAppointmentLookup'
import { useCustomerLookup } from '@/hooks/useCustomerLookup'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, CreditCard, Monitor, Sparkles, Receipt as ReceiptIcon, AlertCircle, Building2, UserX, Users } from 'lucide-react'
import Link from 'next/link'

// Luxe salon color palette for enterprise-grade aesthetics - Extended for visual balance
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
  // Extended palette for balanced aesthetics
  plum: '#B794F4',
  plumDark: '#9333EA',
  plumLight: '#D8B4FE',
  emerald: '#10B981',
  emeraldDark: '#0F6F5C',
  emeraldLight: '#6EE7B7',
  rose: '#E8B4B8',
  roseDark: '#F43F5E',
  roseLight: '#FDA4AF'
}

function POSContent() {
  const { user, organization, selectedBranchId, availableBranches, setSelectedBranchId } =
    useSecuredSalonContext()
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)
  const organizationId = organization?.id

  // Get organization ID from localStorage for demo mode
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  const effectiveOrgId = organizationId || localOrgId

  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false)
  const [defaultStylistId, setDefaultStylistId] = useState<string | undefined>(undefined)
  const [defaultStylistName, setDefaultStylistName] = useState<string | undefined>(undefined)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const { toast } = useToast()

  // Always call hooks - pass empty string if no org ID to satisfy hooks rules
  const posTicketResult = usePosTicket(effectiveOrgId || 'demo-org')
  const {
    ticket,
    addLineItem,
    updateLineItem,
    removeLineItem,
    addDiscount,
    removeDiscount,
    addTip,
    removeTip,
    clearTicket,
    addCustomerToTicket,
    addItemsFromAppointment,
    calculateTotals
  } = posTicketResult

  const appointmentLookupResult = useAppointmentLookup(effectiveOrgId || 'demo-org')
  const { loadAppointment } = appointmentLookupResult

  useCustomerLookup(effectiveOrgId || 'demo-org')

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' && (e.ctrlKey || e.metaKey)) {
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

  // Memoized handlers for performance
  const handleCustomerSelect = useCallback(
    async (customer: any | null) => {
      if (customer) {
        setSelectedCustomer(customer)
        addCustomerToTicket({
          customer_id: customer.id,
          customer_name: customer.entity_name,
          customer_email: customer.email,
          customer_phone: customer.phone
        })
      } else {
        setSelectedCustomer(null)
        addCustomerToTicket({
          customer_id: undefined,
          customer_name: undefined,
          customer_email: undefined,
          customer_phone: undefined
        })
      }
    },
    [addCustomerToTicket]
  )

  const handleAppointmentSelect = useCallback(
    async (appointment: any) => {
      const fullAppointment = await loadAppointment(appointment.id)
      if (fullAppointment) {
        addItemsFromAppointment({
          appointment_id: fullAppointment.id,
          customer_id: fullAppointment.customer_id || '',
          customer_name: fullAppointment.customer_name || 'Walk-in',
          services:
            fullAppointment.service_ids?.map((serviceId: string, index: number) => ({
              id: serviceId,
              name: fullAppointment.service_names?.[index] || `Service ${index + 1}`,
              price: 0,
              ...(fullAppointment.stylist_id ? { stylist_id: fullAppointment.stylist_id } : {}),
              ...(fullAppointment.stylist_name
                ? { stylist_name: fullAppointment.stylist_name }
                : {})
            })) || []
        })
      }
    },
    [loadAppointment, addItemsFromAppointment]
  )

  const handleAddItem = useCallback(
    (item: any, staffId?: string, staffName?: string) => {
      // For services: use provided stylist OR default stylist
      let finalStylistId = staffId
      let finalStylistName = staffName

      if (item.__kind === 'SERVICE') {
        // If stylist provided, set as default for the bill
        if (staffId && staffName) {
          setDefaultStylistId(staffId)
          setDefaultStylistName(staffName)
        }
        // If no stylist provided but we have a default, use it
        else if (!staffId && defaultStylistId && defaultStylistName) {
          finalStylistId = defaultStylistId
          finalStylistName = defaultStylistName
        }
      }

      // Transform PosItem to LineItem format
      addLineItem({
        entity_id: item.id || item.entity_id || item.raw?.id,
        entity_type: item.__kind === 'SERVICE' ? 'service' : 'product',
        entity_name: item.title || item.entity_name || item.raw?.entity_name || 'Unknown Item',
        quantity: 1,
        unit_price: Number(item.price || item.unit_price || item.raw?.price || 0),
        ...(finalStylistId ? { stylist_id: finalStylistId } : {}),
        ...(finalStylistName ? { stylist_name: finalStylistName } : {})
      })
    },
    [defaultStylistId, defaultStylistName, addLineItem]
  )

  const handlePayment = useCallback(() => {
    if (!ticket?.lineItems || ticket.lineItems.length === 0) return

    // Validate branch is selected
    if (!selectedBranchId) {
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" style={{ color: COLORS.roseDark }} />
            <span>Branch Required</span>
          </div>
        ),
        description: 'Please select a branch to continue with payment',
        className: 'border-0',
        style: {
          background: `linear-gradient(135deg, ${COLORS.rose}25 0%, ${COLORS.roseDark}15 50%, ${COLORS.charcoal} 100%)`,
          borderLeft: `4px solid ${COLORS.roseDark}`,
          boxShadow: `0 4px 16px ${COLORS.rose}20`
        }
      })
      return
    }

    // Validate customer is selected
    if (!ticket.customer_id) {
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <UserX className="w-4 h-4" style={{ color: COLORS.roseDark }} />
            <span>Customer Required</span>
          </div>
        ),
        description: 'Press "/" to search or create a walk-in customer',
        className: 'border-0',
        style: {
          background: `linear-gradient(135deg, ${COLORS.rose}25 0%, ${COLORS.roseDark}15 50%, ${COLORS.charcoal} 100%)`,
          borderLeft: `4px solid ${COLORS.roseDark}`,
          boxShadow: `0 4px 16px ${COLORS.rose}20`
        }
      })
      return
    }

    // Validate at least one service has a stylist assigned
    const servicesWithoutStylist = ticket.lineItems.filter(
      item => item.entity_type === 'service' && !item.stylist_id
    )
    if (servicesWithoutStylist.length > 0) {
      toast({
        variant: 'destructive',
        title: (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: COLORS.roseDark }} />
            <span>Stylist Required</span>
          </div>
        ),
        description: 'All services must have a stylist assigned',
        className: 'border-0',
        style: {
          background: `linear-gradient(135deg, ${COLORS.rose}25 0%, ${COLORS.roseDark}15 50%, ${COLORS.charcoal} 100%)`,
          borderLeft: `4px solid ${COLORS.roseDark}`,
          boxShadow: `0 4px 16px ${COLORS.rose}20`
        }
      })
      return
    }

    setIsPaymentOpen(true)
  }, [ticket, selectedBranchId, toast])

  const handleClearAll = useCallback(() => {
    clearTicket()
    setDefaultStylistId(undefined)
    setDefaultStylistName(undefined)
    setSelectedBranchId(undefined)
    setSelectedCustomer(null)
  }, [clearTicket, setSelectedBranchId])

  const handlePaymentComplete = useCallback(
    (saleData: any) => {
      setCompletedSale(saleData)
      setIsPaymentOpen(false)
      setIsReceiptOpen(true)
      clearTicket()
      // Clear default stylist and customer for next bill
      setDefaultStylistId(undefined)
      setDefaultStylistName(undefined)
      setSelectedCustomer(null)
    },
    [clearTicket]
  )

  // Memoize totals calculation for performance
  const totals = useMemo(() => calculateTotals(), [calculateTotals])

  if (!effectiveOrgId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div
          className="text-center p-10 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.charcoalLight} 100%)`,
            boxShadow: `0 8px 32px ${COLORS.plum}15, 0 0 0 1px ${COLORS.plum}20`,
            border: `1px solid ${COLORS.plum}30`
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.plum}15 100%)`
            }}
          >
            <Sparkles className="w-8 h-8" style={{ color: COLORS.gold }} />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.plumLight} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Initializing Point of Sale
          </h2>
          <p className="text-sm" style={{ color: COLORS.plumLight }}>
            Setting up your luxury salon experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" data-salon-page style={{ backgroundColor: COLORS.black }}>
      {/* Enhanced gradient background overlay with balanced color spectrum */}
      <div
        className="fixed inset-0 pointer-events-none animate-gradient"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, ${COLORS.gold}10 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 90% 80%, ${COLORS.plum}10 0%, transparent 50%),
            radial-gradient(ellipse 90% 70% at 50% 50%, ${COLORS.emerald}08 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 75% 25%, ${COLORS.rose}06 0%, transparent 45%),
            linear-gradient(135deg, ${COLORS.charcoal}20 0%, transparent 100%)
          `,
          opacity: 0.7,
          transition: 'opacity 0.6s ease-in-out'
        }}
      />

      {/* Soft animated grain overlay for texture (simplified to avoid SVG inline parsing issues) */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          background:
            `radial-gradient(circle at 25% 25%, ${COLORS.charcoalLight}20 0, transparent 50%),` +
            `radial-gradient(circle at 75% 75%, ${COLORS.charcoalLight}15 0, transparent 50%)`,
          mixBlendMode: 'overlay' as any,
          animation: 'grain 8s steps(10) infinite'
        }}
      />

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.85;
          }
        }
        @keyframes grain {
          0%,
          100% {
            transform: translate(0, 0);
          }
          10% {
            transform: translate(-5%, -10%);
          }
          30% {
            transform: translate(3%, -15%);
          }
          50% {
            transform: translate(12%, 9%);
          }
          70% {
            transform: translate(9%, 4%);
          }
          90% {
            transform: translate(-1%, 7%);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>

      {/* Main content wrapper */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Enhanced Header */}
        <div
          className="sticky top-0 z-40 px-8 py-5 backdrop-blur-xl transition-all duration-500 ease-out animate-slideDown"
          style={{
            backgroundColor: `${COLORS.charcoal}E6`,
            borderBottom: `1px solid ${COLORS.gold}20`,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.1)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
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
                    background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 60%, ${COLORS.plumLight} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Point of Sale
                </h1>
              </div>

              <Badge
                className="px-4 py-1.5 font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.emeraldDark}20 0%, ${COLORS.emerald}15 100%)`,
                  color: COLORS.emerald,
                  border: `1px solid ${COLORS.emerald}60`,
                  boxShadow: `0 0 20px ${COLORS.emerald}30, 0 4px 12px ${COLORS.emerald}20`
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2.5 animate-pulse"
                  style={{
                    backgroundColor: COLORS.emerald,
                    boxShadow: `0 0 8px ${COLORS.emerald}80`
                  }}
                />
                Live
              </Badge>
            </div>

            {/* Payment History Link - Plum accent for secondary action */}
            <Link href="/salon/pos/payments">
              <Button
                variant="outline"
                className="px-6 py-2.5 font-semibold transition-all duration-300 hover:scale-105 group"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
                  border: `1px solid ${COLORS.plum}40`,
                  color: COLORS.champagne,
                  boxShadow: `0 2px 12px ${COLORS.plum}15`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${COLORS.plum}80`
                  e.currentTarget.style.boxShadow = `0 4px 20px ${COLORS.plum}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${COLORS.plum}40`
                  e.currentTarget.style.boxShadow = `0 2px 12px ${COLORS.plum}15`
                }}
              >
                <ReceiptIcon className="w-4 h-4 mr-2 transition-colors" style={{ color: COLORS.plum }} />
                Payment History
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content - Two Pane Layout */}
        <div className="flex h-[calc(100vh-92px)]">
          {/* Left Pane - Catalog */}
          <div
            className="flex-1 min-w-0 animate-fadeIn"
            style={{
              borderRight: `1px solid ${COLORS.emerald}12`,
              background: `linear-gradient(to bottom, ${COLORS.charcoal}00 0%, ${COLORS.charcoal}40 100%)`,
              boxShadow: `inset -1px 0 20px ${COLORS.emerald}08`,
              animationDelay: '0.1s'
            }}
          >
            <CatalogPane
              organizationId={effectiveOrgId!}
              onAddItem={handleAddItem}
              {...(ticket.customer_id ? { currentCustomerId: ticket.customer_id } : {})}
              {...(ticket.appointment_id ? { currentAppointmentId: ticket.appointment_id } : {})}
              {...(defaultStylistId ? { defaultStylistId } : {})}
              {...(defaultStylistName ? { defaultStylistName } : {})}
            />
          </div>

          {/* Right Pane - Cart Sidebar */}
          <div
            className="w-[420px] shrink-0 flex flex-col animate-fadeIn"
            style={{
              background: `linear-gradient(to bottom, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
              animationDelay: '0.2s'
            }}
          >
            <CartSidebar
              ticket={ticket}
              totals={totals}
              onUpdateItem={updateLineItem}
              onRemoveItem={removeLineItem}
              onAddDiscount={addDiscount}
              onRemoveDiscount={removeDiscount}
              onAddTip={addTip}
              onRemoveTip={removeTip}
              onPayment={handlePayment}
              onClearTicket={handleClearAll}
              organizationId={effectiveOrgId!}
              selectedCustomer={selectedCustomer}
              onCustomerSelect={handleCustomerSelect}
            />
          </div>
        </div>

        {/* Modals */}
        <TicketDetailsModal
          open={isTicketDetailsOpen}
          onClose={() => setIsTicketDetailsOpen(false)}
          ticket={ticket}
          totals={totals}
          onUpdateItem={updateLineItem}
          onRemoveItem={removeLineItem}
          onAddDiscount={addDiscount}
          onAddTip={addTip}
          onPayment={() => {
            setIsTicketDetailsOpen(false)
            setIsPaymentOpen(true)
          }}
          organizationId={effectiveOrgId!}
          {...(selectedBranchId ? { branchId: selectedBranchId } : {})}
          {...(availableBranches?.find(b => b.id === selectedBranchId)?.entity_name
            ? { branchName: availableBranches.find(b => b.id === selectedBranchId)!.entity_name }
            : {})}
          onCustomerSelect={handleCustomerSelect}
          availableBranches={availableBranches || []}
          onBranchChange={branchId => setSelectedBranchId(branchId)}
        />

        <PaymentDialog
          open={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          ticket={ticket}
          totals={totals}
          organizationId={effectiveOrgId!}
          organizationName={organization?.name}
          branchId={selectedBranchId}
          branchName={availableBranches?.find(b => b.id === selectedBranchId)?.entity_name}
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
              color: COLORS.charcoal,
              boxShadow: `0 8px 32px ${COLORS.gold}50`,
              border: `1px solid ${COLORS.gold}80`
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
