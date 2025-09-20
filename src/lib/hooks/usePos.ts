// ================================================================================
// HERA POS HOOKS
// Smart Code: HERA.HOOKS.POS.v1
// React Query hooks for POS operations with state management
// ================================================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/lib/utils'
import { PosApi } from '@/lib/api/pos'
import {
  CartLine,
  CartState,
  Payment,
  calculateTotals,
  calculateCommission,
} from '@/lib/schemas/pos'

// Cart store with persistence
interface CartStore extends CartState {
  addService: (service: CartLine & { kind: 'service' }) => void
  addProduct: (product: CartLine & { kind: 'item' }) => void
  addDiscount: (discount: CartLine & { kind: 'discount' }) => void
  addTip: (tip: CartLine & { kind: 'tip' }) => void
  removeLine: (index: number) => void
  updateQuantity: (index: number, qty: number) => void
  clearCart: () => void
  loadFromAppointment: (state: CartState) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],
      totals: calculateTotals([]),
      appointment_id: undefined,
      customer_id: undefined,

      addService: (service) => set(state => {
        const lines = [...state.lines, service]
        return { lines, totals: calculateTotals(lines) }
      }),

      addProduct: (product) => set(state => {
        const lines = [...state.lines, product]
        return { lines, totals: calculateTotals(lines) }
      }),

      addDiscount: (discount) => set(state => {
        const lines = [...state.lines, discount]
        return { lines, totals: calculateTotals(lines) }
      }),

      addTip: (tip) => set(state => {
        // Remove existing tip if any
        const lines = state.lines.filter(line => line.kind !== 'tip')
        lines.push(tip)
        return { lines, totals: calculateTotals(lines) }
      }),

      removeLine: (index) => set(state => {
        const lines = state.lines.filter((_, i) => i !== index)
        return { lines, totals: calculateTotals(lines) }
      }),

      updateQuantity: (index, qty) => set(state => {
        const lines = [...state.lines]
        const line = lines[index]
        if (line && (line.kind === 'service' || line.kind === 'item')) {
          lines[index] = { ...line, qty }
        }
        return { lines, totals: calculateTotals(lines) }
      }),

      clearCart: () => set({
        lines: [],
        totals: calculateTotals([]),
        appointment_id: undefined,
        customer_id: undefined,
      }),

      loadFromAppointment: (state) => set(state),
    }),
    {
      name: 'hera-pos-cart',
      partialize: (state) => ({
        lines: state.lines,
        appointment_id: state.appointment_id,
        customer_id: state.customer_id,
      }),
    }
  )
)

// Price list hook
export function usePriceList(api: PosApi) {
  return useQuery({
    queryKey: ['pos-price-list'],
    queryFn: () => api.priceList(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// Checkout hook
export function useCheckout(api: PosApi) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const cart = useCartStore()

  return useMutation({
    mutationKey: ['pos-checkout'],
    mutationFn: ({ txnId }: { txnId: string }) => {
      const cartState: CartState = {
        lines: cart.lines,
        totals: cart.totals,
        appointment_id: cart.appointment_id,
        customer_id: cart.customer_id,
      }
      return api.checkout(cartState, txnId)
    },
    onSuccess: (data) => {
      toast.success('Invoice created successfully')
      router.push(`/pos/payment?invoice=${data.invoiceId}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create checkout')
    },
  })
}

// Payment hook
export function usePayment(api: PosApi) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const clearCart = useCartStore(state => state.clearCart)

  return useMutation({
    mutationKey: ['pos-payment'],
    mutationFn: ({ invoiceId, payment }: { invoiceId: string; payment: Payment }) => 
      api.pay(invoiceId, payment),
    onSuccess: (data, variables) => {
      toast.success('Payment processed successfully')
      
      // Clear cart after successful payment
      clearCart()
      
      // Show BOM consumption toast
      setTimeout(() => {
        toast.info('Inventory: BOM consumption posted')
      }, 1500)
      
      // Navigate to invoice
      router.push(`/pos/invoice/${variables.invoiceId}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process payment')
    },
  })
}

// Invoice hook
export function useInvoice(invoiceId: string, api: PosApi) {
  return useQuery({
    queryKey: ['pos-invoice', invoiceId],
    queryFn: () => api.invoice(invoiceId),
    enabled: !!invoiceId,
  })
}

// Load appointment hook
export function useLoadAppointment(api: PosApi) {
  const loadFromAppointment = useCartStore(state => state.loadFromAppointment)
  const searchParams = useSearchParams()
  const apptId = searchParams.get('apptId')

  return useQuery({
    queryKey: ['pos-appointment', apptId],
    queryFn: async () => {
      if (!apptId) return null
      const cartState = await api.loadAppointment(apptId)
      loadFromAppointment(cartState)
      return cartState
    },
    enabled: !!apptId,
  })
}

// Commission calculation hook
export function useCommission() {
  const totals = useCartStore(state => state.totals)
  return calculateCommission(totals)
}

// POS navigation hook
export function usePosNavigation() {
  const router = useRouter()

  return {
    goToSale: (apptId?: string) => {
      const url = apptId ? `/pos/sale?apptId=${apptId}` : '/pos/sale'
      router.push(url)
    },
    goToPayment: (invoiceId: string) => router.push(`/pos/payment?invoice=${invoiceId}`),
    goToInvoice: (invoiceId: string) => router.push(`/pos/invoice/${invoiceId}`),
    goToAppointment: (appointmentId: string) => router.push(`/appointments/${appointmentId}`),
    goToCustomer: (customerId: string) => router.push(`/customers/${customerId}`),
  }
}

// Cart summary hook
export function useCartSummary() {
  const cart = useCartStore()
  
  const serviceCount = cart.lines.filter(l => l.kind === 'service').length
  const itemCount = cart.lines.filter(l => l.kind === 'item').length
  const hasDiscount = cart.lines.some(l => l.kind === 'discount')
  const hasTip = cart.lines.some(l => l.kind === 'tip')
  
  return {
    serviceCount,
    itemCount,
    hasDiscount,
    hasTip,
    isEmpty: cart.lines.length === 0,
    canCheckout: cart.lines.length > 0 && (serviceCount > 0 || itemCount > 0),
  }
}

// Quick actions
export function useQuickActions() {
  const addDiscount = useCartStore(state => state.addDiscount)
  const addTip = useCartStore(state => state.addTip)

  return {
    applyPercentageDiscount: (percentage: number, reason?: string) => {
      const subtotal = useCartStore.getState().totals.subtotal_services + 
                      useCartStore.getState().totals.subtotal_items
      const amount = Math.round(subtotal * (percentage / 100))
      addDiscount({
        kind: 'discount',
        amount,
        percentage,
        reason: reason || `${percentage}% discount`,
      })
    },
    
    applyFixedDiscount: (amount: number, reason?: string) => {
      addDiscount({
        kind: 'discount',
        amount,
        reason: reason || 'Fixed discount',
      })
    },
    
    addQuickTip: (percentage: number) => {
      const subtotal = useCartStore.getState().totals.subtotal_services + 
                      useCartStore.getState().totals.subtotal_items
      const amount = Math.round(subtotal * (percentage / 100))
      addTip({
        kind: 'tip',
        amount,
      })
    },
  }
}