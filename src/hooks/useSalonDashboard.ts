/**
 * HERA Dashboard Hook
 * Smart Code: HERA.SALON.DASHBOARD.HOOK.V1
 *
 * Universal dashboard hook that uses RPC API v2 only (no direct Supabase calls)
 * Provides all KPIs and data needed for salon dashboard
 */

'use client'

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { useUniversalTransaction } from './useUniversalTransaction'

export interface SalonDashboardKPIs {
  totalCustomers: number
  vipCustomers: number
  totalRevenue: number
  activeServices: number
  totalProducts: number
  lowStockProducts: number
  inventoryValue: number
  activeStaff: number
}

export interface UseSalonDashboardConfig {
  organizationId: string
  currency?: string
}

/**
 * Universal hook for salon dashboard data
 * Uses useUniversalEntity and useUniversalTransaction with RPC API v2
 */
export function useSalonDashboard(config: UseSalonDashboardConfig) {
  const { organizationId, currency = 'AED' } = config

  // Fetch customers using Universal Entity hook
  const {
    entities: customers,
    isLoading: customersLoading,
    refetch: refetchCustomers
  } = useUniversalEntity({
    entity_type: 'CUSTOMER',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  // Fetch services using Universal Entity hook
  const {
    entities: services,
    isLoading: servicesLoading,
    refetch: refetchServices
  } = useUniversalEntity({
    entity_type: 'SERVICE',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  // Fetch products using Universal Entity hook
  const {
    entities: products,
    isLoading: productsLoading,
    refetch: refetchProducts
  } = useUniversalEntity({
    entity_type: 'PRODUCT',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  // Fetch staff using Universal Entity hook
  const {
    entities: staff,
    isLoading: staffLoading,
    refetch: refetchStaff
  } = useUniversalEntity({
    entity_type: 'STAFF',
    organizationId,
    filters: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  // Fetch transactions (tickets/sales) using Universal Transaction hook
  const {
    transactions: tickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets
  } = useUniversalTransaction({
    organizationId,
    filters: {
      transaction_type: 'SALE',
      limit: 1000
    }
  })

  // Calculate KPIs
  const kpis: SalonDashboardKPIs = useMemo(() => {
    // Filter active entities
    const activeCustomers = customers?.filter(c => c.status !== 'archived' && c.status !== 'deleted') || []
    const activeServices = services?.filter(s => s.status === 'active' || !s.status) || []
    const activeProducts = products?.filter(p => p.status !== 'archived' && p.status !== 'deleted') || []
    const activeStaff = staff?.filter(s => s.status === 'active' || !s.status) || []

    // VIP Customers count - check vip field in dynamic data
    const vipCustomers = activeCustomers.filter(c =>
      c.vip === true ||
      c.is_vip === true ||
      c.dynamic_fields?.vip?.value === true ||
      c.metadata?.vip === true
    ).length

    // Total revenue from tickets (filter completed only)
    const completedTickets = tickets?.filter(t =>
      t.transaction_status === 'completed' ||
      t.metadata?.status === 'completed'
    ) || []

    const totalRevenue = completedTickets.reduce((sum, ticket) => {
      return sum + (ticket.total_amount || 0)
    }, 0)

    // Low stock products - check stock_quantity against reorder_level
    const lowStockProducts = activeProducts.filter(p => {
      const stockQty = p.stock_quantity || p.stock_level || p.qty_on_hand || 0
      const reorderLevel = p.reorder_level || 0
      return stockQty > 0 && stockQty <= reorderLevel
    }).length

    // Total inventory value = sum(cost_price * stock_quantity)
    const inventoryValue = activeProducts.reduce((sum, product) => {
      const costPrice = product.price_cost || product.cost_price || product.price || 0
      const stockQty = product.stock_quantity || product.stock_level || product.qty_on_hand || 0
      const productValue = costPrice && stockQty ? costPrice * stockQty : 0
      return sum + productValue
    }, 0)

    return {
      totalCustomers: activeCustomers.length,
      vipCustomers,
      totalRevenue,
      activeServices: activeServices.length,
      totalProducts: activeProducts.length,
      lowStockProducts,
      inventoryValue,
      activeStaff: activeStaff.length
    }
  }, [customers, services, products, staff, tickets])

  // Loading state
  const isLoading =
    customersLoading ||
    servicesLoading ||
    productsLoading ||
    staffLoading ||
    ticketsLoading

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchServices(),
      refetchProducts(),
      refetchStaff(),
      refetchTickets()
    ])
  }

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency || 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return {
    // KPIs
    kpis,

    // Raw data
    customers,
    services,
    products,
    staff,
    tickets,

    // Loading state
    isLoading,

    // Actions
    refreshAll,
    formatCurrency,

    // Individual refetch functions
    refetchCustomers,
    refetchServices,
    refetchProducts,
    refetchStaff,
    refetchTickets
  }
}

/**
 * Example Usage:
 *
 * const dashboard = useSalonDashboard({
 *   organizationId: 'org-uuid',
 *   currency: 'AED'
 * })
 *
 * // Access KPIs
 * console.log('Total Revenue:', dashboard.formatCurrency(dashboard.kpis.totalRevenue))
 * console.log('VIP Customers:', dashboard.kpis.vipCustomers)
 *
 * // Refresh all data
 * await dashboard.refreshAll()
 */
