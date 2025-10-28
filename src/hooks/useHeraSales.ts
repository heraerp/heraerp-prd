/**
 * HERA Sales Hook - Enterprise-Grade POS CRUD
 *
 * 🎯 ENTERPRISE FEATURES:
 * - Complete CRUD operations (Create, Read, Update, Delete, Refund)
 * - Payment workflow: pending → completed → refunded
 * - Multi-payment method support (cash, card, voucher, mixed)
 * - Validation and business rules
 * - Audit trail via smart codes
 * - Optimistic updates with rollback
 *
 * ARCHITECTURE:
 * - Sales are TRANSACTIONS (not entities)
 * - Transaction type: 'SALE'
 * - Customer ID: source_entity_id
 * - Branch ID: target_entity_id
 * - Metadata contains: payment_methods, line_items, discounts, tips, etc.
 * - ✅ MIGRATED: Uses useUniversalTransactionV1 and useUniversalEntityV1 hooks
 * - ✅ NO DIRECT SUPABASE CALLS: All operations through RPC and API v2
 */

import { useMemo } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'

// 🎯 ENTERPRISE: Sale Status Workflow
export type SaleStatus =
  | 'pending' // Payment being processed
  | 'completed' // Payment successful
  | 'refunded' // Refunded
  | 'cancelled' // Cancelled before completion

// 🎯 ENTERPRISE: Payment method types
export type PaymentMethodType = 'cash' | 'card' | 'voucher' | 'mixed'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  amount: number
  reference?: string
  cardType?: string
  voucherCode?: string
}

export interface SaleLineItem {
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number
  stylist_id?: string
  stylist_name?: string
  commission_rate?: number
  commission_amount?: number
}

export interface Sale {
  id: string
  transaction_code: string
  transaction_date: string
  customer_id: string | null
  customer_name: string
  branch_id: string | null
  branch_name: string
  status: SaleStatus
  subtotal: number
  discount_amount: number
  tip_amount: number
  tax_amount: number
  total_amount: number
  line_items: SaleLineItem[]
  payment_methods: PaymentMethod[]
  discounts: any[]
  tips: any[]
  notes: string | null
  cashier_id: string
  cashier_name: string
  created_at: string
  updated_at: string
}

export interface CreateSaleData {
  customer_id?: string | null
  branch_id?: string
  line_items: SaleLineItem[]
  payment_methods: PaymentMethod[]
  discounts?: any[]
  tips?: any[]
  subtotal: number
  discount_amount: number
  tip_amount: number
  tax_amount: number
  total_amount: number
  notes?: string
  cashier_id?: string
}

export interface UpdateSaleData {
  status?: SaleStatus
  notes?: string
  refund_amount?: number
  refund_reason?: string
}

export interface UseHeraSalesOptions {
  organizationId?: string
  filters?: {
    status?: SaleStatus
    branch_id?: string
    customer_id?: string
    date_from?: string
    date_to?: string
    cashier_id?: string
    limit?: number
    offset?: number
  }
}

// 🎯 ENTERPRISE: Status display configuration
export const SALE_STATUS_CONFIG: Record<
  SaleStatus,
  { label: string; color: string; icon: string }
> = {
  pending: { label: 'Pending', color: '#F59E0B', icon: 'Clock' },
  completed: { label: 'Completed', color: '#10B981', icon: 'CheckCircle' },
  refunded: { label: 'Refunded', color: '#6B7280', icon: 'RefreshCw' },
  cancelled: { label: 'Cancelled', color: '#EF4444', icon: 'XCircle' }
}

export function useHeraSales(options?: UseHeraSalesOptions) {
  const queryClient = useQueryClient()

  // ✅ MIGRATED: Use useUniversalTransactionV1 hook instead of direct API calls
  // Benefits: RPC-first, API v2 compliance, no direct Supabase calls
  const {
    transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
    create: createTransaction,
    update: updateTransaction,
    delete: deleteTransaction,
    isCreating: isCreatingTransaction,
    isUpdating: isUpdatingTransaction,
    isDeleting: isDeletingTransaction
  } = useUniversalTransactionV1({
    organizationId: options?.organizationId,
    filters: {
      transaction_type: 'SALE',
      date_from: options?.filters?.date_from,
      date_to: options?.filters?.date_to,
      include_lines: true, // ✅ FIX: Sales DO use universal_transaction_lines pattern
      limit: options?.filters?.limit || 100,
      offset: options?.filters?.offset || 0
    }
  })

  // ✅ MIGRATED: Use useUniversalEntityV1 hook for customers instead of getEntities
  const {
    entities: customers,
    isLoading: isLoadingCustomers
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER',
    organizationId: options?.organizationId,
    filters: {
      status: 'active',
      include_dynamic: false,
      include_relationships: false,
      list_mode: 'HEADERS' // ✅ PERFORMANCE: Only fetch core fields (id, entity_name)
    }
  })

  // ✅ MIGRATED: Use useUniversalEntityV1 hook for branches instead of getEntities
  const {
    entities: branches,
    isLoading: isLoadingBranches
  } = useUniversalEntityV1({
    entity_type: 'BRANCH',
    organizationId: options?.organizationId,
    filters: {
      status: 'active',
      include_dynamic: false,
      include_relationships: false,
      list_mode: 'HEADERS' // ✅ PERFORMANCE: Only fetch core fields (id, entity_name)
    }
  })

  // ✅ PERFORMANCE: Combine loading states
  const isLoading = isLoadingTransactions || isLoadingCustomers || isLoadingBranches

  // ✅ CLIENT-SIDE ENRICHMENT: Join transactions with customer/branch names
  const enrichedSales = useMemo(() => {
    console.log('[useHeraSales] 🔍 Enriching sales with customer/branch names:', {
      transactionsCount: transactions.length,
      customersCount: customers.length,
      branchesCount: branches.length
    })

    // Create lookup maps for efficient joins
    const customerMap = new Map<string, string>()
    customers.forEach(c => customerMap.set(c.id, c.entity_name))

    const branchMap = new Map<string, string>()
    branches.forEach(b => branchMap.set(b.id, b.entity_name))

    // ✅ Transform transactions to enriched sales
    const sales: Sale[] = transactions.map((txn: any) => {
      const metadata = txn.metadata || {}

      // ✅ FIX: Calculate total from metadata (subtotal + tax - discount + tips)
      // Don't use txn.total_amount as it includes payment lines
      const subtotal = metadata.subtotal || 0
      const discountAmount = metadata.discount_total || metadata.discount_amount || 0
      const tipAmount = metadata.tip_total || metadata.tip_amount || 0
      const taxAmount = metadata.tax_amount || 0
      const calculatedTotal = subtotal - discountAmount + taxAmount + tipAmount

      // ✅ FIX: Extract line items from universal_transaction_lines (txn.lines)
      // Map database lines to SaleLineItem format for UI consumption
      const lineItems: SaleLineItem[] = (txn.lines || [])
        .filter((line: any) => ['service', 'product'].includes(line.line_type))
        .map((line: any) => ({
          entity_id: line.entity_id || '',
          entity_type: line.line_type as 'service' | 'product',
          entity_name: line.description || '',
          quantity: line.quantity || 1,
          unit_price: line.unit_amount || 0,
          line_amount: line.line_amount || 0,
          stylist_id: line.metadata?.staff_id,
          stylist_name: line.metadata?.staff_name,
          commission_rate: line.metadata?.commission_rate,
          commission_amount: line.metadata?.commission_amount
        }))

      return {
        id: txn.id,
        transaction_code: txn.transaction_code,
        transaction_date: txn.transaction_date,
        customer_id: txn.source_entity_id,
        customer_name: txn.source_entity_id
          ? customerMap.get(txn.source_entity_id) || 'Walk-in Customer'
          : 'Walk-in Customer',
        branch_id: metadata.branch_id || txn.target_entity_id, // ✅ FIX: Get branch from metadata
        branch_name: metadata.branch_id
          ? branchMap.get(metadata.branch_id) || 'Main Branch'
          : 'Main Branch',
        status: (txn.transaction_status || metadata.status || 'completed') as SaleStatus,
        subtotal,
        discount_amount: discountAmount,
        tip_amount: tipAmount,
        tax_amount: taxAmount,
        total_amount: calculatedTotal,
        line_items: lineItems, // ✅ FIX: Use extracted lines from database
        payment_methods: metadata.payment_methods || [],
        discounts: metadata.discounts || [],
        tips: metadata.tips || [],
        notes: metadata.notes,
        cashier_id: metadata.cashier_id || '',
        cashier_name: metadata.cashier_name || 'System',
        created_at: txn.created_at,
        updated_at: txn.updated_at
      }
    })

    console.log('[useHeraSales] ✅ Enrichment complete:', {
      salesCount: sales.length,
      sampleSale: sales[0]
        ? {
            id: sales[0].id?.substring(0, 8),
            customer: sales[0].customer_name,
            amount: sales[0].total_amount,
            status: sales[0].status
          }
        : null
    })

    return sales
  }, [transactions, customers, branches])

  // 🎯 ENTERPRISE: Filter sales (client-side filters for UI interactivity)
  const filteredSales = useMemo(() => {
    console.log('[useHeraSales] 🔍 Filtering sales:', {
      totalCount: enrichedSales.length,
      statusFilter: options?.filters?.status,
      branchFilter: options?.filters?.branch_id
    })

    let filtered = enrichedSales

    // Status filter (client-side for UI responsiveness)
    if (options?.filters?.status) {
      const beforeFilter = filtered.length
      filtered = filtered.filter(sale => sale.status === options.filters!.status)
      console.log('[useHeraSales] 🔍 Status filter applied:', {
        beforeCount: beforeFilter,
        afterCount: filtered.length,
        status: options.filters.status
      })
    }

    // Branch filter (client-side for UI responsiveness)
    if (options?.filters?.branch_id) {
      const beforeBranchFilter = filtered.length
      filtered = filtered.filter(sale => sale.branch_id === options.filters!.branch_id)
      console.log('[useHeraSales] 🔍 Branch filter applied:', {
        beforeCount: beforeBranchFilter,
        afterCount: filtered.length,
        branchId: options.filters.branch_id
      })
    }

    // Customer filter (client-side for UI responsiveness)
    if (options?.filters?.customer_id) {
      const beforeCustomerFilter = filtered.length
      filtered = filtered.filter(sale => sale.customer_id === options.filters!.customer_id)
      console.log('[useHeraSales] 🔍 Customer filter applied:', {
        beforeCount: beforeCustomerFilter,
        afterCount: filtered.length,
        customerId: options.filters.customer_id
      })
    }

    console.log('[useHeraSales] ✅ Final filtered sales:', {
      count: filtered.length
    })

    return filtered
  }, [enrichedSales, options?.filters])

  // ✅ REMOVED: Redundant customer/branch queries
  // Customers and branches are now fetched once via useUniversalEntityV1 hooks above
  // Same data used for both enrichment AND dropdowns/forms (single source of truth)

  // ✅ MIGRATED: Create Sale using universal transaction hook
  // No need for separate mutation - the hook handles optimistic updates automatically
  const createSale = async (data: CreateSaleData) => {
    if (!options?.organizationId) throw new Error('Organization ID required')

    console.log('[useHeraSales] 🚀 Creating sale via useUniversalTransactionV1:', {
      customerId: data.customer_id,
      branchId: data.branch_id,
      totalAmount: data.total_amount,
      lineItemsCount: data.line_items.length
    })

    return createTransaction({
      transaction_type: 'SALE', // ✅ UPPERCASE - hook normalizes automatically
      smart_code: 'HERA.SALON.TXN.SALE.CREATE.v1', // ✅ HERA DNA pattern
      transaction_date: new Date().toISOString(),
      source_entity_id: data.customer_id || null,
      target_entity_id: data.branch_id || null,
      total_amount: data.total_amount,
      transaction_status: 'completed',
      metadata: {
        status: 'completed',
        line_items: data.line_items,
        payment_methods: data.payment_methods,
        discounts: data.discounts || [],
        tips: data.tips || [],
        subtotal: data.subtotal,
        discount_amount: data.discount_amount,
        tip_amount: data.tip_amount,
        tax_amount: data.tax_amount,
        notes: data.notes || null,
        cashier_id: data.cashier_id || 'system',
        cashier_name: 'POS System'
      }
    })
  }

  // ✅ MIGRATED: Update Sale using universal transaction hook
  const updateSale = async ({ id, data }: { id: string; data: UpdateSaleData }) => {
    console.log('[useHeraSales] 🔄 Updating sale via useUniversalTransactionV1:', { id, data })

    if (!options?.organizationId) {
      throw new Error('Organization ID required')
    }

    const sale = enrichedSales.find(s => s.id === id)
    if (!sale) {
      throw new Error('Sale not found')
    }

    // ✅ FIX: Reconstruct metadata from Sale object (enriched format doesn't have raw metadata)
    const existingMetadata = {
      status: sale.status,
      line_items: sale.line_items,
      payment_methods: sale.payment_methods,
      discounts: sale.discounts,
      tips: sale.tips,
      subtotal: sale.subtotal,
      discount_amount: sale.discount_amount,
      discount_total: sale.discount_amount,
      tip_amount: sale.tip_amount,
      tip_total: sale.tip_amount,
      tax_amount: sale.tax_amount,
      notes: sale.notes,
      cashier_id: sale.cashier_id,
      cashier_name: sale.cashier_name
    }

    // Build updated metadata by merging existing with changes
    const updatedMetadata = {
      ...existingMetadata,
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.refund_amount && { refund_amount: data.refund_amount }),
      ...(data.refund_reason && { refund_reason: data.refund_reason })
    }

    return updateTransaction({
      transaction_id: id,
      ...(data.status && { transaction_status: data.status }),
      metadata: updatedMetadata
    })
  }

  // ✅ MIGRATED: Refund Sale using update
  const refundSale = async ({ id, amount, reason }: { id: string; amount: number; reason: string }) => {
    return updateSale({
      id,
      data: {
        status: 'refunded',
        refund_amount: amount,
        refund_reason: reason
      }
    })
  }

  // ✅ MIGRATED: Cancel Sale using update
  const cancelSale = async (id: string) => {
    return updateSale({
      id,
      data: {
        status: 'cancelled'
      }
    })
  }

  // ✅ MIGRATED: Delete Sale using universal transaction hook
  const deleteSale = async (id: string) => {
    if (!options?.organizationId) throw new Error('Organization ID required')

    console.log('[useHeraSales] 🗑️ Deleting sale via useUniversalTransactionV1:', id)

    return deleteTransaction({
      transaction_id: id,
      hard_delete: true // ✅ Force hard delete (use with caution)
    })
  }

  return {
    sales: filteredSales,
    isLoading, // ✅ Combined loading state from all 3 hooks
    error: transactionsError?.message,
    refetch: refetchTransactions,

    // ✅ MIGRATED: Full CRUD operations via universal hooks
    createSale,
    updateSale,
    refundSale,
    cancelSale,
    deleteSale,

    // ✅ MIGRATED: Loading states from universal transaction hook
    isCreating: isCreatingTransaction,
    isUpdating: isUpdatingTransaction,
    isDeleting: isDeletingTransaction,

    // ✅ MIGRATED: Data from universal entity hooks (single source of truth)
    customers,
    branches,

    // Status configuration
    SALE_STATUS_CONFIG
  }
}
