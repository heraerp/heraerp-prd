'use client'

import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { SimpleSalonGuard } from '@/components/salon/auth/SimpleSalonGuard'
import { usePosTicket } from '@/hooks/usePosTicket'
import { useAppointmentLookup } from '@/hooks/useAppointmentLookup'
import { useCustomerLookup } from '@/hooks/useCustomerLookup'
import { useHeraAppointments } from '@/hooks/useHeraAppointments'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { PremiumMobileHeader } from '@/components/salon/shared/PremiumMobileHeader'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Monitor, Sparkles, Receipt as ReceiptIcon, AlertCircle, Building2, UserX, Users } from 'lucide-react'
import Link from 'next/link'

// ✅ ENTERPRISE PATTERN: Lazy load heavy components for better performance
const CatalogPane = lazy(() => import('@/components/salon/pos/CatalogPane').then(m => ({ default: m.CatalogPane })))
const CartSidebar = lazy(() => import('@/components/salon/pos/CartSidebar').then(m => ({ default: m.CartSidebar })))
const PaymentDialog = lazy(() => import('@/components/salon/pos/PaymentDialog').then(m => ({ default: m.PaymentDialog })))
const Receipt = lazy(() => import('@/components/salon/pos/Receipt').then(m => ({ default: m.Receipt })))
const TicketDetailsModal = lazy(() => import('@/components/salon/pos/TicketDetailsModal').then(m => ({ default: m.TicketDetailsModal })))
const BillSetupModal = lazy(() => import('@/components/salon/pos/BillSetupModal').then(m => ({ default: m.BillSetupModal })))

// ✅ ENTERPRISE PATTERN: Skeleton loaders for perceived performance
function CatalogPaneSkeleton() {
  return (
    <div className="h-full p-6 animate-pulse">
      <div className="h-10 bg-charcoal-light rounded-lg mb-4 w-1/2" />
      <div className="h-12 bg-charcoal-light rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-32 bg-charcoal-light rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function CartSidebarSkeleton() {
  return (
    <div className="h-full p-6 animate-pulse">
      <div className="h-8 bg-charcoal-light rounded-lg mb-4 w-3/4" />
      <div className="space-y-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-charcoal-light rounded-lg" />
        ))}
      </div>
      <div className="h-16 bg-gold/20 rounded-lg" />
    </div>
  )
}

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
  const { toast } = useToast()
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false)
  const appointmentLoadAttempted = useRef(false) // 🛡️ Prevent duplicate loads
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
  const [validationError, setValidationError] = useState<{
    type: 'branch' | 'customer' | 'stylist'
    message: string
  } | null>(null)
  const [isBillSetupOpen, setIsBillSetupOpen] = useState(false)
  const [pendingItem, setPendingItem] = useState<{
    item: any
    staffId?: string
    staffName?: string
  } | null>(null)

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
    calculateTotals,
    updateTicketInfo
  } = posTicketResult

  const appointmentLookupResult = useAppointmentLookup(effectiveOrgId || 'demo-org')
  const { loadAppointment } = appointmentLookupResult

  useCustomerLookup(effectiveOrgId || 'demo-org')

  // Get appointment update function for status updates after payment
  const { updateAppointmentStatus } = useHeraAppointments({ organizationId: effectiveOrgId || 'demo-org' })

  // 🎯 ENTERPRISE: Auto-load appointment from URL parameter
  useEffect(() => {
    // 🛡️ CRITICAL: Prevent infinite loops - only attempt load once
    if (appointmentLoadAttempted.current) {
      return
    }

    // Only run if we have organization ID
    if (!effectiveOrgId) {
      return
    }

    // Don't load if ticket already has items
    if (ticket.lineItems.length > 0) {
      appointmentLoadAttempted.current = true
      return
    }

    // 🎯 ENTERPRISE: Check sessionStorage FIRST for kanban-passed data
    const storedAppointment = sessionStorage.getItem('pos_appointment')
    if (storedAppointment) {
      try {
        const appointmentData = JSON.parse(storedAppointment)

        // 🛡️ Mark as attempted to prevent re-runs
        appointmentLoadAttempted.current = true
        setIsLoadingAppointment(true)

        // Show loading toast
        toast({
          title: '📋 Loading Appointment',
          description: `Loading appointment for ${appointmentData.customer_name}...`,
          duration: 1500
        })

        // 🎯 ENTERPRISE: Use data directly from kanban - NO DATABASE CALL NEEDED!
        // Add customer info
        if (appointmentData.customer_id && appointmentData.customer_name) {
          addCustomerToTicket({
            customer_id: appointmentData.customer_id,
            customer_name: appointmentData.customer_name
          })
          setSelectedCustomer({
            id: appointmentData.customer_id,
            entity_name: appointmentData.customer_name
          })
        }

        // Add stylist as default
        if (appointmentData.stylist_id && appointmentData.stylist_name) {
          setDefaultStylistId(appointmentData.stylist_id)
          setDefaultStylistName(appointmentData.stylist_name)
        }

        // Set branch if available
        if (appointmentData.branch_id) {
          setSelectedBranchId(appointmentData.branch_id)
        }

        // 🎯 ENTERPRISE PATTERN: Read service data from TOP LEVEL (same as customer_name/stylist_name)
        // This matches the pattern: appointmentData.customer_name, appointmentData.stylist_name, appointmentData.service_names
        const services = []

        // Read service arrays from top level (not nested in metadata)
        if (appointmentData.service_ids && appointmentData.service_ids.length > 0) {
          const serviceIds = Array.isArray(appointmentData.service_ids)
            ? appointmentData.service_ids
            : [appointmentData.service_ids]

          serviceIds.forEach((serviceId: string, index: number) => {
            if (serviceId) {
              services.push({
                id: serviceId,
                name: appointmentData.service_names?.[index] || `Service ${index + 1}`,
                price: appointmentData.service_prices?.[index] || 0,
                ...(appointmentData.stylist_id ? { stylist_id: appointmentData.stylist_id } : {}),
                ...(appointmentData.stylist_name ? { stylist_name: appointmentData.stylist_name } : {})
              })
            }
          })
        }

        // Add services to appointment
        if (services.length > 0) {
          addItemsFromAppointment({
            appointment_id: appointmentData.id,
            customer_id: appointmentData.customer_id || '',
            customer_name: appointmentData.customer_name || 'Walk-in',
            services
          })
        }

        // Clear sessionStorage after successful load to prevent stale data
        sessionStorage.removeItem('pos_appointment')

        // Remove appointment param from URL for clean state
        const url = new URL(window.location.href)
        url.searchParams.delete('appointment')
        window.history.replaceState({}, '', url.pathname + url.search)

        // Show success toast
        toast({
          title: '✅ Appointment Loaded',
          description: `Ready to process payment for ${appointmentData.customer_name}`,
          duration: 3000
        })

        setIsLoadingAppointment(false)
      } catch (error) {
        // ✅ ENTERPRISE ERROR LOGGING: Structured error with context
        const errorDetails = {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          context: 'POS appointment load from sessionStorage',
          organizationId: effectiveOrgId,
          timestamp: new Date().toISOString()
        }
        console.error('[POSPage] ❌ Failed to parse appointment data:', errorDetails)

        setIsLoadingAppointment(false)
        toast({
          title: '❌ Loading Failed',
          description: 'Failed to load appointment data. Please try again from kanban.',
          variant: 'destructive',
          duration: 5000
        })
      }
      return
    }

    // Check for appointment parameter in URL (fallback method)
    const urlParams = new URLSearchParams(window.location.search)
    const appointmentId = urlParams.get('appointment')

    if (!appointmentId) {
      return
    }

    // 🛡️ Mark as attempted to prevent re-runs
    appointmentLoadAttempted.current = true
    setIsLoadingAppointment(true)

    // Show loading toast
    toast({
      title: '📋 Loading Appointment',
      description: 'Fetching appointment details...',
      duration: 2000
    })

    loadAppointment(appointmentId).then(fullAppointment => {
      if (fullAppointment) {

        // Add customer info
        if (fullAppointment.customer_id && fullAppointment.customer_name) {
          addCustomerToTicket({
            customer_id: fullAppointment.customer_id,
            customer_name: fullAppointment.customer_name
          })
          setSelectedCustomer({
            id: fullAppointment.customer_id,
            entity_name: fullAppointment.customer_name
          })
        }

        // Add stylist as default
        if (fullAppointment.stylist_id && fullAppointment.stylist_name) {
          setDefaultStylistId(fullAppointment.stylist_id)
          setDefaultStylistName(fullAppointment.stylist_name)
        }

        // Add services from appointment
        addItemsFromAppointment({
          appointment_id: fullAppointment.id,
          customer_id: fullAppointment.customer_id || '',
          customer_name: fullAppointment.customer_name || 'Walk-in',
          services: fullAppointment.service_ids?.map((serviceId: string, index: number) => ({
            id: serviceId,
            name: fullAppointment.service_names?.[index] || `Service ${index + 1}`,
            price: fullAppointment.service_prices?.[index] || 0,
            ...(fullAppointment.stylist_id ? { stylist_id: fullAppointment.stylist_id } : {}),
            ...(fullAppointment.stylist_name ? { stylist_name: fullAppointment.stylist_name } : {})
          })) || []
        })

        // Remove appointment param from URL for clean state
        const url = new URL(window.location.href)
        url.searchParams.delete('appointment')
        window.history.replaceState({}, '', url.pathname + url.search)

        // Show success toast
        toast({
          title: '✅ Appointment Loaded',
          description: `Appointment for ${fullAppointment.customer_name} is ready for payment`,
          duration: 3000
        })

        setIsLoadingAppointment(false)
      } else {
        // ✅ ENTERPRISE ERROR LOGGING: Structured error with context
        const errorDetails = {
          error: 'Appointment not found',
          context: 'POS appointment load from URL',
          appointmentId,
          organizationId: effectiveOrgId,
          timestamp: new Date().toISOString()
        }
        console.error('[POSPage] ❌ Appointment not found:', errorDetails)

        setIsLoadingAppointment(false)
        toast({
          title: '❌ Appointment Not Found',
          description: 'The appointment could not be loaded. Please check the appointment ID.',
          variant: 'destructive',
          duration: 5000
        })
      }
    }).catch(error => {
      // ✅ ENTERPRISE ERROR LOGGING: Structured error with context
      const errorDetails = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'POS appointment load from URL',
        appointmentId,
        organizationId: effectiveOrgId,
        timestamp: new Date().toISOString()
      }
      console.error('[POSPage] ❌ Failed to load appointment:', errorDetails)

      setIsLoadingAppointment(false)
      toast({
        title: '❌ Loading Failed',
        description: `Failed to load appointment: ${error.message}`,
        variant: 'destructive',
        duration: 5000
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOrgId]) // 🛡️ CRITICAL: Only run when org ID changes, ref + guard prevents duplicates

  // Enterprise-grade validation: Auto-clear errors when conditions are met
  useEffect(() => {
    if (!validationError) return

    // Check if the validation error condition has been resolved
    let shouldClear = false

    switch (validationError.type) {
      case 'branch':
        // Clear error when branch is selected
        if (selectedBranchId) {
          shouldClear = true
        }
        break

      case 'customer':
        // Clear error when customer is selected
        if (ticket.customer_id) {
          shouldClear = true
        }
        break

      case 'stylist':
        // Clear error when all services have stylists assigned
        const servicesWithoutStylist = ticket.lineItems.filter(
          item => item.entity_type === 'service' && !item.stylist_id
        )
        if (servicesWithoutStylist.length === 0) {
          shouldClear = true
        }
        break
    }

    if (shouldClear) {
      setValidationError(null)
    }
  }, [validationError, selectedBranchId, ticket.customer_id, ticket.lineItems])

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
      // Check if we need to show setup modal for first item or missing required data
      const isFirstItem = !ticket.lineItems || ticket.lineItems.length === 0
      const needsBranch = !selectedBranchId
      const isService = item.__kind === 'SERVICE'
      const needsStylist = isService && !staffId && !defaultStylistId

      // Show setup modal if it's first item OR missing required info
      if (isFirstItem || needsBranch || needsStylist) {
        setPendingItem({ item, staffId, staffName })
        setIsBillSetupOpen(true)
        return
      }

      // For services: use provided stylist OR default stylist
      let finalStylistId = staffId
      let finalStylistName = staffName

      if (isService) {
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
        entity_type: isService ? 'service' : 'product',
        entity_name: item.title || item.entity_name || item.raw?.entity_name || 'Unknown Item',
        quantity: 1,
        unit_price: Number(item.price || item.unit_price || item.raw?.price || 0),
        ...(finalStylistId ? { stylist_id: finalStylistId } : {}),
        ...(finalStylistName ? { stylist_name: finalStylistName } : {})
      })
    },
    [ticket.lineItems, selectedBranchId, defaultStylistId, defaultStylistName, addLineItem]
  )

  const handlePayment = useCallback(() => {
    if (!ticket?.lineItems || ticket.lineItems.length === 0) return

    // Check if any validation is needed
    const needsBranch = !selectedBranchId
    const needsCustomer = !ticket.customer_id
    const servicesWithoutStylist = ticket.lineItems.filter(
      item => item.entity_type === 'service' && !item.stylist_id
    )
    const needsStylist = servicesWithoutStylist.length > 0

    // If any validation needed, show the setup modal
    if (needsBranch || needsCustomer || needsStylist) {
      setIsBillSetupOpen(true)
      return
    }

    setIsPaymentOpen(true)
  }, [ticket, selectedBranchId])

  const handleBillSetupComplete = useCallback(
    (data: {
      branchId: string
      branchName: string
      customerId: string
      customerName: string
      stylistId?: string // ✅ Optional for product-only sales
      stylistName?: string // ✅ Optional for product-only sales
    }) => {
      // Update branch
      setSelectedBranchId(data.branchId)

      // Update customer (always provided now)
      addCustomerToTicket({
        customer_id: data.customerId,
        customer_name: data.customerName
      })
      setSelectedCustomer({ id: data.customerId, entity_name: data.customerName })

      // ✅ FIX: Only update stylist if provided (optional for products)
      if (data.stylistId && data.stylistName) {
        setDefaultStylistId(data.stylistId)
        setDefaultStylistName(data.stylistName)
      }

      // If there's a pending item, add it now
      if (pendingItem) {
        const { item } = pendingItem

        addLineItem({
          entity_id: item.id || item.entity_id || item.raw?.id,
          entity_type: item.__kind === 'SERVICE' ? 'service' : 'product',
          entity_name: item.title || item.entity_name || item.raw?.entity_name || 'Unknown Item',
          quantity: 1,
          unit_price: Number(item.price || item.unit_price || item.raw?.price || 0),
          // ✅ FIX: Only include stylist if provided (services require it, products don't)
          ...(data.stylistId ? { stylist_id: data.stylistId } : {}),
          ...(data.stylistName ? { stylist_name: data.stylistName } : {})
        })

        setPendingItem(null)
      }
    },
    [pendingItem, setSelectedBranchId, addCustomerToTicket, addLineItem]
  )

  const handleClearAll = useCallback(() => {
    clearTicket()
    setDefaultStylistId(undefined)
    setDefaultStylistName(undefined)
    setSelectedBranchId(undefined)
    setSelectedCustomer(null)
    // 🛡️ Reset appointment load flag so user can load another appointment
    appointmentLoadAttempted.current = false
  }, [clearTicket, setSelectedBranchId])

  // Memoized branch change handler to prevent infinite loops
  const handleBranchChange = useCallback((branchId: string) => {
    setSelectedBranchId(branchId)
  }, [setSelectedBranchId])

  // Handle transaction date changes for old bill entry
  const handleTransactionDateChange = useCallback((date: string | undefined) => {
    updateTicketInfo({ transaction_date: date })
  }, [updateTicketInfo])

  const handlePaymentComplete = useCallback(
    async (saleData: any) => {
      setCompletedSale(saleData)
      setIsPaymentOpen(false)
      setIsReceiptOpen(true)

      // Update appointment status to completed if payment was for an appointment
      if (ticket.appointment_id) {
        try {
          await updateAppointmentStatus({
            id: ticket.appointment_id,
            status: 'completed'
          })

          toast({
            title: '✅ Appointment Completed',
            description: 'Appointment status has been updated to completed.',
            duration: 2000
          })
        } catch (error) {
          console.error('[POSPage] ❌ Failed to update appointment status:', error)

          // Don't block the payment flow, just show a warning
          toast({
            title: '⚠️ Status Update Failed',
            description: 'Payment was successful but appointment status could not be updated.',
            variant: 'destructive',
            duration: 5000
          })
        }
      }

      clearTicket()
      // Clear default stylist and customer for next bill
      setDefaultStylistId(undefined)
      setDefaultStylistName(undefined)
      setSelectedCustomer(null)
    },
    [clearTicket, ticket.appointment_id, updateAppointmentStatus, toast]
  )

  // Get totals from the hook's memoized calculation
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
      {/* ✅ MOBILE: iOS-style status bar spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* ✅ MOBILE: Premium Mobile Header */}
      <div className="md:hidden">
        <PremiumMobileHeader
          title="Point of Sale"
          subtitle={`${ticket.lineItems.length} items in cart`}
          icon={<Monitor className="w-5 h-5" />}
          actions={
            <Link href="/salon/pos/payments">
              <button className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95 transition-transform">
                <ReceiptIcon className="w-5 h-5 text-gold" />
              </button>
            </Link>
          }
        />
      </div>

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
        {/* Compact Enterprise Header - Desktop Only */}
        <div
          className="hidden md:block sticky top-0 z-40 px-6 py-3 backdrop-blur-xl transition-all duration-500 ease-out animate-slideDown"
          style={{
            backgroundColor: `${COLORS.charcoal}F0`,
            borderBottom: `1px solid ${COLORS.gold}25`,
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.08)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}30`,
                  boxShadow: `0 0 12px ${COLORS.gold}12`
                }}
              >
                <Monitor className="w-5 h-5" style={{ color: COLORS.gold }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 60%, ${COLORS.plumLight} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Point of Sale
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    className="px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emeraldDark}20 0%, ${COLORS.emerald}15 100%)`,
                      color: COLORS.emerald,
                      border: `1px solid ${COLORS.emerald}50`,
                      boxShadow: `0 0 12px ${COLORS.emerald}20`
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
                      style={{
                        backgroundColor: COLORS.emerald,
                        boxShadow: `0 0 6px ${COLORS.emerald}80`
                      }}
                    />
                    Live
                  </Badge>
                </div>
              </div>
            </div>

            {/* Payment History Link - Compact */}
            <Link href="/salon/pos/payments">
              <SalonLuxeButton
                variant="outline"
                size="sm"
                icon={<ReceiptIcon className="w-3.5 h-3.5" />}
                className="transition-all duration-300 hover:scale-105"
              >
                Payment History
              </SalonLuxeButton>
            </Link>
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        {/* Desktop: Two pane side-by-side | Mobile: Stacked vertically (catalog above, cart below) */}
        <div className="flex flex-col md:flex-row md:h-[calc(100vh-62px)]">
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
            <Suspense fallback={<CatalogPaneSkeleton />}>
              <CatalogPane
                organizationId={effectiveOrgId!}
                onAddItem={handleAddItem}
                {...(ticket.customer_id ? { currentCustomerId: ticket.customer_id } : {})}
                {...(ticket.appointment_id ? { currentAppointmentId: ticket.appointment_id } : {})}
                {...(defaultStylistId ? { defaultStylistId } : {})}
                {...(defaultStylistName ? { defaultStylistName } : {})}
                onBranchChange={handleBranchChange}
                contextBranchId={selectedBranchId}
              />
            </Suspense>
          </div>

          {/* Right Pane - Cart Sidebar */}
          {/* Desktop: Fixed right sidebar | Mobile: Below catalog, full width */}
          <div
            className="w-full md:w-[420px] shrink-0 flex flex-col animate-fadeIn"
            style={{
              background: `linear-gradient(to bottom, ${COLORS.charcoalLight} 0%, ${COLORS.charcoal} 100%)`,
              animationDelay: '0.2s'
            }}
          >
            <Suspense fallback={<CartSidebarSkeleton />}>
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
                onAddItem={handleAddItem}
                onUpdateTransactionDate={handleTransactionDateChange}
              />
            </Suspense>
          </div>
        </div>

        {/* Modals */}
        <Suspense fallback={null}>
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
        </Suspense>

        <Suspense fallback={null}>
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
        </Suspense>

        <Suspense fallback={null}>
          <Receipt
            open={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            saleData={completedSale}
          />
        </Suspense>

        {/* Bill Setup Modal - Unified Branch, Customer, Stylist Selection */}
        <Suspense fallback={null}>
          <BillSetupModal
            open={isBillSetupOpen}
            onClose={() => {
              setIsBillSetupOpen(false)
              setPendingItem(null)
            }}
            onComplete={handleBillSetupComplete}
            organizationId={effectiveOrgId!}
            currentBranchId={selectedBranchId}
            currentCustomerId={ticket.customer_id}
            currentStylistId={defaultStylistId}
            lineItems={ticket.lineItems} // ✅ Pass line items to check for services
            pendingItem={pendingItem} // ✅ Pass pending item to check type (service vs product)
            title="Bill Setup"
            description="All three fields are required for every sale"
          />
        </Suspense>

        {/* Validation Error Modal */}
        <SalonLuxeModal
          open={!!validationError}
          onClose={() => setValidationError(null)}
          title={
            validationError?.type === 'branch'
              ? 'Branch Required'
              : validationError?.type === 'customer'
                ? 'Customer Required'
                : 'Stylist Required'
          }
          description={validationError?.message}
          icon={
            validationError?.type === 'branch' ? (
              <Building2 className="w-6 h-6" />
            ) : validationError?.type === 'customer' ? (
              <UserX className="w-6 h-6" />
            ) : (
              <Users className="w-6 h-6" />
            )
          }
          size="sm"
          footer={
            <div className="flex justify-end w-full">
              <SalonLuxeButton variant="primary" onClick={() => setValidationError(null)}>
                Got it
              </SalonLuxeButton>
            </div>
          }
        >
          <div className="py-4">
            <div
              className="p-4 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.rose}15 0%, ${COLORS.roseDark}10 100%)`,
                border: `1px solid ${COLORS.rose}40`
              }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.roseDark }} />
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: COLORS.champagne }}>
                    Action Required:
                  </p>
                  <ul className="text-sm space-y-1.5" style={{ color: COLORS.lightText }}>
                    {validationError?.type === 'branch' && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                          Select a branch from the catalog section
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                          All items must be from a specific location
                        </li>
                      </>
                    )}
                    {validationError?.type === 'customer' && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                          Use the customer search in the cart
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                          Or press "/" to quickly search customers
                        </li>
                      </>
                    )}
                    {validationError?.type === 'stylist' && (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                          Each service needs a stylist assigned
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                          First item selection will prompt for stylist
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </SalonLuxeModal>

        {/* Bottom spacing for mobile comfortable scrolling */}
        <div className="h-24 md:h-0" />
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
