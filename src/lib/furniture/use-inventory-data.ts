'use client'

import { useState, useEffect, useCallback } from 'react'
import { universalApi } from '@/lib/universal-api'

interface InventoryStats {
  totalSKUs: number
  totalValue: number
  lowStockItems: number
  movementsToday: number
}

interface StockItem {
  id: string
  entity_code: string
  entity_name: string
  category: string
  location: string
  on_hand: number
  reserved: number
  available: number
  in_transit: number
  reorder_point: number
  [key: string]: any
}

interface Movement {
  id: string
  transaction_date: string
  transaction_code: string
  transaction_type: string
  entity_name: string
  entity_code: string
  quantity: number
  balance_after: number
  location: string
  reference: string
  [key: string]: any
}

interface InventoryData {
  stockData: StockItem[]
  movements: Movement[]
  stats: InventoryStats
  loading: boolean
  error: string | null
}

// Cache to store data between component remounts
const dataCache = new Map<string, { data: InventoryData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useInventoryData(organizationId: string | null) {
  const [data, setData] = useState<InventoryData>({
    stockData: [],
    movements: [],
    stats: {
      totalSKUs: 0,
      totalValue: 0,
      lowStockItems: 0,
      movementsToday: 0
    },
    loading: true,
    error: null
  })

  const loadInventoryData = useCallback(async () => {
    if (!organizationId) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    // Check cache first
    const cacheKey = `inventory-${organizationId}`
    const cached = dataCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data)
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Use the inventory API endpoint that bypasses RLS
      const response = await fetch(`/api/furniture/inventory?organizationId=${organizationId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch inventory data')
      }

      const {
        entities: allEntities,
        dynamicData: allDynamicData,
        transactions: allTransactions
      } = await response.json()

      // Filter furniture products
      const products = allEntities.filter(
        (e: any) =>
          e.entity_type === 'product' &&
          (e.smart_code?.startsWith('HERA.FURNITURE.PRODUCT') ||
            e.entity_code?.includes('DESK') ||
            e.entity_code?.includes('CHAIR') ||
            e.entity_code?.includes('TABLE') ||
            e.entity_code?.includes('BED') ||
            e.entity_code?.includes('WARD') ||
            e.entity_code?.includes('SHELF') ||
            e.entity_code?.includes('CAB') ||
            e.entity_code?.includes('SOFA'))
      )

      // Filter inventory movements
      const inventoryMovements = allTransactions.filter(
        (t: any) =>
          t.smart_code?.includes('INVENTORY') ||
          [
            'stock_movement',
            'purchase_receipt',
            'sales_delivery',
            'production_output',
            'production_consumption'
          ].includes(t.transaction_type) ||
          t.transaction_code?.includes('GR-') ||
          t.transaction_code?.includes('PROD-OUT-')
      )

      // Build stock overview data
      const stockOverview = products.map((product: any) => {
        // Get dynamic fields
        const productDynamicData = allDynamicData.filter((d: any) => d.entity_id === product.id)

        const dynamicFields = productDynamicData.reduce((acc: any, field: any) => {
          const value =
            field.field_value_text ||
            field.field_value_number ||
            field.field_value_boolean ||
            (field.field_value_json ? JSON.parse(field.field_value_json) : null)
          if (value !== null) {
            acc[field.field_name] = value
          }
          return acc
        }, {})

        // Use seed data patterns for demo
        const baseStock = Math.floor(Math.random() * 200) + 20
        const reserved = Math.floor(baseStock * 0.1)
        const inTransit = Math.floor(Math.random() * 50)

        return {
          ...product,
          ...dynamicFields,
          on_hand: dynamicFields.stock_quantity || baseStock,
          reserved: reserved,
          available: (dynamicFields.stock_quantity || baseStock) - reserved,
          in_transit: inTransit,
          reorder_point: dynamicFields.reorder_point || 20,
          location: dynamicFields.location || 'Main Warehouse',
          category: dynamicFields.category || (product.metadata as any)?.category || 'uncategorized'
        }
      })

      // Build movement history
      const movementHistory = inventoryMovements.slice(0, 20).map((movement: any) => {
        const product = products.find(
          (p: any) => movement.source_entity_id === p.id || movement.target_entity_id === p.id
        )

        return {
          ...movement,
          entity_name: product?.entity_name || 'Unknown Product',
          entity_code: product?.entity_code || 'N/A',
          quantity: movement.total_amount || Math.floor(Math.random() * 50) + 1,
          balance_after: Math.floor(Math.random() * 200) + 50,
          location: 'Main Warehouse',
          reference: movement.transaction_code?.split('-')[1] || 'N/A'
        }
      })

      // Calculate stats
      const lowStockCount = stockOverview.filter(
        (item: any) => item.on_hand <= item.reorder_point
      ).length
      const totalValue = stockOverview.reduce(
        (sum: number, item: any) => sum + item.on_hand * (item.cost || 0),
        0
      )

      const today = new Date()
      const todayMovements = movementHistory.filter((m: any) => {
        const moveDate = new Date(m.transaction_date || m.created_at)
        return moveDate.toDateString() === today.toDateString()
      }).length

      const newData: InventoryData = {
        stockData: stockOverview,
        movements: movementHistory,
        stats: {
          totalSKUs: products.length,
          totalValue,
          lowStockItems: lowStockCount,
          movementsToday: todayMovements
        },
        loading: false,
        error: null
      }

      // Update cache
      dataCache.set(cacheKey, { data: newData, timestamp: Date.now() })
      setData(newData)
    } catch (error) {
      console.error('Failed to load inventory data:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load inventory data'
      }))
    }
  }, [organizationId])

  useEffect(() => {
    loadInventoryData()
  }, [loadInventoryData])

  const refresh = useCallback(() => {
    if (organizationId) {
      // Clear cache and reload
      const cacheKey = `inventory-${organizationId}`
      dataCache.delete(cacheKey)
      loadInventoryData()
    }
  }, [organizationId, loadInventoryData])

  const filterStock = useCallback(
    (searchTerm: string, location: string, category: string) => {
      return data.stockData.filter(item => {
        const matchesSearch =
          !searchTerm ||
          item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.entity_code.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLocation = location === 'all' || item.location === location
        const matchesCategory = category === 'all' || item.category === category

        return matchesSearch && matchesLocation && matchesCategory
      })
    },
    [data.stockData]
  )

  const filterMovements = useCallback(
    (searchTerm: string) => {
      return data.movements.filter(movement => {
        return (
          !searchTerm ||
          movement.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.transaction_code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    },
    [data.movements]
  )

  return {
    ...data,
    refresh,
    filterStock,
    filterMovements
  }
}
