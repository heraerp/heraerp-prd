'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

// Smart Code: HERA.REST.REALTIME.ORDERS.HOOK.V1
// Real-time order tracking using Supabase subscriptions

interface Order {
  id: string
  order_number: string
  status: string
  kitchen_status: string
  total_amount: number
  customer_name?: string
  table_number?: string
  estimated_ready?: string
  created_at: string
  updated_at: string
}

interface UseRealtimeOrdersOptions {
  organizationId: string
  enabled?: boolean
  filters?: {
    status?: string
    kitchen_status?: string
    table_number?: string
  }
}

interface UseRealtimeOrdersReturn {
  orders: Order[]
  loading: boolean
  error: string | null
  updateOrderStatus: (orderId: string, updates: Partial<Order>) => Promise<void>
  refetch: () => Promise<void>
  stats: {
    total: number
    pending: number
    preparing: number
    ready: number
    completed: number
  }
}

export const useRealtimeOrders = ({
  organizationId,
  enabled = true,
  filters = {}
}: UseRealtimeOrdersOptions): UseRealtimeOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    if (!enabled || !organizationId) return

    try {
      setLoading(true)
      setError(null)

      // Get orders from universal_transactions
      let query = supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'order')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data: transactions, error: transactionError } = await query

      if (transactionError) throw transactionError

      // If we have transactions, fetch their dynamic data
      const transactionIds = (transactions || []).map(t => t.id)
      let dynamicDataMap = new Map()

      if (transactionIds.length > 0) {
        const { data: dynamicData, error: dynamicError } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .in('entity_id', transactionIds)
          .in('field_name', ['kitchen_status', 'customer_name', 'table_number', 'estimated_ready'])

        if (!dynamicError && dynamicData) {
          // Group dynamic data by entity_id
          dynamicData.forEach(item => {
            if (!dynamicDataMap.has(item.entity_id)) {
              dynamicDataMap.set(item.entity_id, [])
            }
            dynamicDataMap.get(item.entity_id).push(item)
          })
        }
      }

      // Transform data to include dynamic properties
      const transformedOrders: Order[] = (transactions || []).map(transaction => {
        const dynamicData = dynamicDataMap.get(transaction.id) || []

        const getFieldValue = (fieldName: string) => {
          const field = dynamicData.find(d => d.field_name === fieldName)
          return (
            field?.field_value_text || field?.field_value_number || field?.field_value_json || null
          )
        }

        return {
          id: transaction.id,
          order_number: transaction.transaction_code,
          status: transaction.status,
          kitchen_status: getFieldValue('kitchen_status') || 'pending',
          total_amount: transaction.total_amount || 0,
          customer_name: getFieldValue('customer_name'),
          table_number: getFieldValue('table_number'),
          estimated_ready: getFieldValue('estimated_ready'),
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        }
      })

      // Apply additional filters
      let filteredOrders = transformedOrders

      if (filters.kitchen_status) {
        filteredOrders = filteredOrders.filter(
          order => order.kitchen_status === filters.kitchen_status
        )
      }

      if (filters.table_number) {
        filteredOrders = filteredOrders.filter(order => order.table_number === filters.table_number)
      }

      setOrders(filteredOrders)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
      setLoading(false)
    }
  }, [organizationId, enabled, filters, supabase])

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, updates: Partial<Order>): Promise<void> => {
      try {
        // Update main transaction if status changed
        if (updates.status) {
          const { error: statusError } = await supabase
            .from('universal_transactions')
            .update({
              status: updates.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .eq('organization_id', organizationId)

          if (statusError) throw statusError
        }

        // Update dynamic fields
        const dynamicUpdates = []

        if (updates.kitchen_status) {
          dynamicUpdates.push({
            entity_id: orderId,
            field_name: 'kitchen_status',
            field_value_text: updates.kitchen_status,
            smart_code: 'HERA.REST.ORDER.KITCHEN.STATUS.V1'
          })
        }

        if (updates.estimated_ready) {
          dynamicUpdates.push({
            entity_id: orderId,
            field_name: 'estimated_ready',
            field_value_text: updates.estimated_ready,
            smart_code: 'HERA.REST.ORDER.ESTIMATED.READY.V1'
          })
        }

        if (updates.customer_name) {
          dynamicUpdates.push({
            entity_id: orderId,
            field_name: 'customer_name',
            field_value_text: updates.customer_name,
            smart_code: 'HERA.REST.ORDER.CUSTOMER.NAME.V1'
          })
        }

        if (updates.table_number) {
          dynamicUpdates.push({
            entity_id: orderId,
            field_name: 'table_number',
            field_value_text: updates.table_number,
            smart_code: 'HERA.REST.ORDER.TABLE.V1'
          })
        }

        // Upsert dynamic data
        for (const update of dynamicUpdates) {
          await supabase.from('core_dynamic_data').upsert(update)
        }

        // Update local state optimistically
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, ...updates, updated_at: new Date().toISOString() }
              : order
          )
        )
      } catch (err) {
        console.error('Error updating order:', err)
        throw err
      }
    },
    [organizationId, supabase]
  )

  // Calculate stats - memoized to prevent infinite loops
  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter(o => o.kitchen_status === 'pending').length,
      preparing: orders.filter(o => o.kitchen_status === 'preparing').length,
      ready: orders.filter(o => o.kitchen_status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length
    }),
    [orders]
  )

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enabled || !organizationId) return

    // Initial fetch
    fetchOrders()

    // Set up real-time subscription for transactions
    const transactionSubscription = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'universal_transactions',
          filter: `organization_id=eq.${organizationId}`
        },
        payload => {
          console.log('Order transaction change:', payload)

          if (payload.eventType === 'INSERT' && payload.new.transaction_type === 'order') {
            // New order - refetch to get complete data
            fetchOrders()
          } else if (payload.eventType === 'UPDATE' && payload.new.transaction_type === 'order') {
            // Order updated - update local state
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === payload.new.id
                  ? { ...order, status: payload.new.status, updated_at: payload.new.updated_at }
                  : order
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // Order deleted - remove from local state
            setOrders(prevOrders => prevOrders.filter(order => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // Set up real-time subscription for dynamic data changes
    const dynamicDataSubscription = supabase
      .channel('order-dynamic-data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'core_dynamic_data',
          filter: `field_name=in.(kitchen_status,customer_name,table_number,estimated_ready)`
        },
        payload => {
          console.log('Order dynamic data change:', payload)

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const {
              entity_id,
              field_name,
              field_value_text,
              field_value_number,
              field_value_json
            } = payload.new
            const value = field_value_text || field_value_number || field_value_json

            // Update local state
            setOrders(prevOrders =>
              prevOrders.map(order => {
                if (order.id === entity_id) {
                  return {
                    ...order,
                    [field_name]: value,
                    updated_at: new Date().toISOString()
                  }
                }
                return order
              })
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      transactionSubscription.unsubscribe()
      dynamicDataSubscription.unsubscribe()
    }
  }, [organizationId, enabled, fetchOrders, supabase])

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    refetch: fetchOrders,
    stats
  }
}

// Additional hook for kitchen display specific functionality
export const useKitchenDisplay = (organizationId: string) => {
  const {
    orders: allOrders,
    loading,
    error,
    updateOrderStatus,
    refetch,
    stats
  } = useRealtimeOrders({
    organizationId,
    enabled: true
  })

  // Group orders by kitchen status for KDS display
  const ordersByStatus = {
    pending: allOrders.filter(o => o.kitchen_status === 'pending'),
    preparing: allOrders.filter(o => o.kitchen_status === 'preparing'),
    ready: allOrders.filter(o => o.kitchen_status === 'ready')
  }

  // Kitchen-specific actions
  const startPreparation = useCallback(
    async (orderId: string) => {
      await updateOrderStatus(orderId, {
        kitchen_status: 'preparing'
        // Add prep start time
      })
    },
    [updateOrderStatus]
  )

  const markReady = useCallback(
    async (orderId: string) => {
      await updateOrderStatus(orderId, {
        kitchen_status: 'ready'
        // Add prep end time
      })
    },
    [updateOrderStatus]
  )

  const completeOrder = useCallback(
    async (orderId: string) => {
      await updateOrderStatus(orderId, {
        status: 'completed',
        kitchen_status: 'served'
      })
    },
    [updateOrderStatus]
  )

  return {
    ordersByStatus,
    loading,
    error,
    refetch,
    stats,
    actions: {
      startPreparation,
      markReady,
      completeOrder
    }
  }
}
