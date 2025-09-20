// ================================================================================
// HERA POS SALE PAGE
// Smart Code: HERA.PAGE.POS.SALE.v1
// Point of sale page with cart management
// ================================================================================

'use client'

import { useEffect } from 'react'
import { ArrowLeft, ShoppingCart, Code } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CartDisplay } from '@/components/pos/CartDisplay'
import { ServiceSelector } from '@/components/pos/ServiceSelector'
import { ProductSelector } from '@/components/pos/ProductSelector'
import { QuickActions } from '@/components/pos/QuickActions'
import { CommissionSummary } from '@/components/analytics/CommissionSummary'
import { useSession } from '@/lib/auth/session'
import { PosApi } from '@/lib/api/pos'
import {
  usePriceList,
  useLoadAppointment,
  useCheckout,
  useCommission,
  useCartSummary,
  useCartStore,
  usePosNavigation
} from '@/lib/hooks/usePos'

const posApi = new PosApi()

export default function POSSalePage() {
  const router = useRouter()
  const { user } = useSession()
  const navigation = usePosNavigation()
  const cartStore = useCartStore()
  const commission = useCommission()
  const cartSummary = useCartSummary()

  // Load price list
  const { data: priceList, isLoading: isPriceListLoading } = usePriceList(posApi)

  // Load appointment if specified
  const { data: appointmentCart, isLoading: isAppointmentLoading } = useLoadAppointment(posApi)

  // Checkout mutation
  const checkout = useCheckout(posApi)

  // Generate transaction ID for idempotency
  const generateTxnId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    return `TXN-${timestamp}-${random}`
  }

  const handleCheckout = () => {
    if (!cartSummary.canCheckout) return

    const txnId = generateTxnId()
    checkout.mutate({ txnId })
  }

  const showSmartCode = () => {
    return cartStore.appointment_id
      ? 'HERA.SALON.POS.SALE.FROM_APPT.V1'
      : 'HERA.SALON.POS.SALE.WALKIN.V1'
  }

  if (isPriceListLoading || isAppointmentLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading POS...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
          <div className="flex items-center gap-2 mt-2">
            <Code className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-mono">{showSmartCode()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {cartStore.appointment_id && (
            <Button
              variant="outline"
              onClick={() => navigation.goToAppointment(cartStore.appointment_id!)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointment
            </Button>
          )}
          <Button
            onClick={handleCheckout}
            disabled={!cartSummary.canCheckout || checkout.isPending}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Checkout ({cartStore.lines.length})
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Service/Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
            <TabsContent value="services" className="mt-4">
              {priceList?.services && <ServiceSelector services={priceList.services} />}
            </TabsContent>
            <TabsContent value="products" className="mt-4">
              {priceList?.products && <ProductSelector products={priceList.products} />}
            </TabsContent>
          </Tabs>

          <QuickActions />

          {/* Commission Preview */}
          {commission.service_subtotal > 0 && (
            <CommissionSummary
              commission={commission}
              stylistName={cartStore.appointment_id ? 'Lisa Chen' : undefined}
            />
          )}
        </div>

        {/* Right: Cart */}
        <div>
          <CartDisplay />
        </div>
      </div>
    </div>
  )
}
