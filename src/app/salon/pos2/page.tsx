'use client'

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { CatalogPane } from '@/components/salon/pos2/CatalogPane'
import { CartSidebar } from '@/components/salon/pos2/CartSidebar'
import { PaymentDialog } from '@/components/salon/pos2/PaymentDialog'
import { Receipt } from '@/components/salon/pos2/Receipt'
import { CustomerSearchModal } from '@/components/salon/pos2/CustomerSearchModal'
import { TicketDetailsModal } from '@/components/salon/pos2/TicketDetailsModal'
import { usePosTicket } from '@/hooks/usePosTicket'
import { useAppointmentLookup } from '@/hooks/useAppointmentLookup'
import { useCustomerLookup } from '@/hooks/useCustomerLookup'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',  // Darker shade for depth
  charcoalLight: '#232323',  // Lighter shade for elements
  plum: '#5A2A40',  // Added for gradient accent
  emerald: '#0F6F5C'  // Added for accent
}

export default function SalonPOS2Page() {
  const { user, organization } = useHERAAuth()
  const organizationId = organization?.id
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false)
  const [isTicketDetailsOpen, setIsTicketDetailsOpen] = useState(false)

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
  } = usePosTicket(organizationId!)

  const { loadAppointment } = useAppointmentLookup(organizationId!)
  const { searchCustomers } = useCustomerLookup(organizationId!)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        e.preventDefault()
        setIsCustomerSearchOpen(true)
      } else if (e.key === '+' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        // Focus on catalog to add new line
        document.getElementById('catalog-search')?.focus()
      } else if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setIsTicketDetailsOpen(true)
      } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        // Open command palette (could be implemented later)
        console.log('Command palette shortcut')
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
        services: fullAppointment.service_ids?.map((serviceId: string, index: number) => ({
          id: serviceId,
          name: fullAppointment.service_names?.[index] || `Service ${index + 1}`,
          price: 0, // Will be loaded from pricing
          stylist_id: fullAppointment.stylist_id,
          stylist_name: fullAppointment.stylist_name
        })) || []
      })
    }
  }

  const handlePayment = () => {
    if (ticket.lineItems.length === 0) return
    setIsPaymentOpen(true)
  }

  const handlePaymentComplete = (saleData: any) => {
    setCompletedSale(saleData)
    setIsPaymentOpen(false)
    setIsReceiptOpen(true)
    clearTicket()
  }

  const totals = calculateTotals()

  if (!user || !organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--hera-black)' }}>
        <div className="text-center p-8 rounded-xl" 
             style={{ 
               backgroundColor: COLORS.charcoal,
               boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
             }}>
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Authentication Required
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
            Please log in to access the POS system.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               background: `radial-gradient(circle at 20% 80%, ${COLORS.gold}08 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${COLORS.bronze}05 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, ${COLORS.plum}03 0%, transparent 50%)`,
             }} />
        
        {/* Content container */}
        <div className="relative" 
             style={{ 
               backgroundColor: COLORS.charcoal,
               minHeight: '100vh',
               boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
             }}>
          
          {/* Header */}
          <div className="p-6 border-b" 
               style={{ 
                 backgroundColor: COLORS.charcoalLight,
                 borderColor: COLORS.bronze + '20',
                 boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
               }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: COLORS.bronze }}>HERA</span>
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
                  <span style={{ color: COLORS.bronze }}>SALON OS</span>
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
                  <span style={{ color: COLORS.champagne }}>POS 2.0</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Monitor className="w-6 h-6" style={{ color: COLORS.gold }} />
                  <h1 className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                    Salon POS 2.0
                  </h1>
                </div>
                <Badge className="ml-2"
                       style={{ 
                         backgroundColor: COLORS.emerald + '20',
                         color: COLORS.emerald,
                         borderColor: COLORS.emerald + '50'
                       }}>
                  Live
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Branch Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: COLORS.bronze }}>Branch:</span>
                  <div className="px-3 py-1 rounded-lg border text-sm"
                       style={{ 
                         borderColor: COLORS.bronze + '33',
                         backgroundColor: COLORS.charcoalDark,
                         color: COLORS.lightText,
                         boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                       }}>
                    Main Salon
                  </div>
                </div>
                
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: COLORS.bronze }}>Cashier:</span>
                  <div className="px-3 py-1 rounded-lg border text-sm"
                       style={{ 
                         borderColor: COLORS.bronze + '33',
                         backgroundColor: COLORS.charcoalDark,
                         color: COLORS.lightText,
                         boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                       }}>
                    {user.email}
                  </div>
                </div>
                
                <Button variant="outline" size="sm"
                        style={{
                          borderColor: COLORS.bronze,
                          color: COLORS.champagne
                        }}>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Two Pane Layout */}
          <div className="flex h-[calc(100vh-140px)]">
            {/* Left Pane - Catalog */}
            <div className="flex-1 min-w-0 border-r" 
                 style={{ borderColor: COLORS.bronze + '20' }}>
              <CatalogPane 
                organizationId={organizationId}
                onAddItem={addLineItem}
                currentCustomerId={ticket.customer_id}
                currentAppointmentId={ticket.appointment_id}
              />
            </div>

            {/* Right Pane - Cart with Action Buttons */}
            <div className="w-96 shrink-0 flex flex-col">
              {/* Action Buttons Bar */}
              <div className="p-4 border-b" 
                   style={{ 
                     borderColor: COLORS.bronze + '20',
                     backgroundColor: COLORS.charcoalLight,
                     boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                   }}>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsCustomerSearchOpen(true)}
                    className="flex items-center gap-2"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                  >
                    <Search className="w-4 h-4" />
                    Find Customer
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsTicketDetailsOpen(true)}
                    disabled={ticket.lineItems.length === 0}
                    className="flex items-center gap-2"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Ticket Details
                  </Button>
                </div>
                
                {/* Customer Info */}
                {ticket.customer_name && (
                  <div className="mt-3 p-3 rounded-lg" 
                       style={{ backgroundColor: COLORS.charcoalDark }}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: COLORS.gold }} />
                      <div>
                        <div className="font-medium text-sm" style={{ color: COLORS.champagne }}>
                          {ticket.customer_name}
                        </div>
                        <div className="text-xs" style={{ color: COLORS.bronze }}>
                          {ticket.customer_phone}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Quick Stats */}
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span style={{ color: COLORS.bronze }}>
                    {ticket.lineItems.length} item{ticket.lineItems.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold" style={{ color: COLORS.gold }}>
                    ${(totals?.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Cart Sidebar */}
              <div className="flex-1 overflow-hidden">
                <CartSidebar
                  ticket={ticket}
                  totals={totals}
                  onUpdateItem={updateLineItem}
                  onRemoveItem={removeLineItem}
                  onPayment={handlePayment}
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="p-4 border-t" 
                   style={{ 
                     borderColor: COLORS.bronze + '20',
                     backgroundColor: COLORS.charcoalLight,
                     boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.2)'
                   }}>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={clearTicket}
                    disabled={ticket.lineItems.length === 0}
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                  >
                    Clear
                  </Button>
                  <Button 
                    onClick={handlePayment}
                    disabled={ticket.lineItems.length === 0}
                    className="flex-1"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      color: COLORS.black
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay ${(totals?.total || 0).toFixed(2)}
                  </Button>
                </div>
              </div>
            </div>
          </div>

      {/* Customer Search Modal */}
      <CustomerSearchModal
        open={isCustomerSearchOpen}
        onClose={() => setIsCustomerSearchOpen(false)}
        organizationId={organizationId || ''}
        onCustomerSelect={handleCustomerSelect}
        onAppointmentSelect={handleAppointmentSelect}
      />

      {/* Ticket Details Modal */}
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

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        ticket={ticket}
        totals={totals}
        organizationId={organizationId}
        onComplete={handlePaymentComplete}
      />

      {/* Receipt Dialog */}
      <Receipt
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={completedSale}
      />

          {/* Mobile Cart Drawer - Only show on mobile */}
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <Button
              size="lg"
              className="rounded-full shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {ticket.lineItems.length}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
