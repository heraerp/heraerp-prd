/**
 * HERA POS Inventory Hook
 * Smart Code: HERA.RETAIL.POS.HOOK.INVENTORY.v1
 * 
 * React hook for managing inventory entities with batch tracking and real Supabase data
 */

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { createUniversalPOSService, POS_SMART_CODES, POSServiceResponse, POSEntity } from '../universal-pos-service'

// ==================== Types ====================

export interface InventoryItem {
  id?: string
  name: string
  productId?: string
  quantity: number
  minStock: number
  maxStock: number
  location: string
  batchNumber?: string
  expiryDate?: string
  lastUpdated?: string
  status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired'
  createdAt?: string
  updatedAt?: string
}

export interface InventoryFilters {
  search?: string
  status?: string
  location?: string
  lowStock?: boolean
  expired?: boolean
  productId?: string
}

export interface StockMovement {
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  batchNumber?: string
  expiryDate?: string
}

// ==================== Hook ====================

export function useInventory() {
  const { organization } = useHERAAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create service instance
  const posService = organization ? createUniversalPOSService(organization.id) : null

  // ============ Load Inventory ============

  const loadInventory = async (filters?: InventoryFilters) => {
    if (!posService) {
      setError('Organization context required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await posService.searchEntities('INVENTORY', {
        search: filters?.search,
        limit: 200,
        offset: 0
      })

      if (response.success && response.data) {
        let formattedInventory = response.data.map(item => {
          const formatted = posService.convertToUIFormat(item)
          
          // Determine status based on stock levels and expiry
          let status: InventoryItem['status'] = 'in_stock'
          
          if (formatted.quantity <= 0) {
            status = 'out_of_stock'
          } else if (formatted.quantity <= formatted.minStock) {
            status = 'low_stock'
          }
          
          // Check expiry
          if (formatted.expiryDate && new Date(formatted.expiryDate) <= new Date()) {
            status = 'expired'
          }

          return {
            ...formatted,
            status
          }
        })
        
        // Apply client-side filters
        if (filters?.status && filters.status !== 'all') {
          formattedInventory = formattedInventory.filter(item => item.status === filters.status)
        }

        if (filters?.location && filters.location !== 'all') {
          formattedInventory = formattedInventory.filter(item => item.location === filters.location)
        }

        if (filters?.lowStock) {
          formattedInventory = formattedInventory.filter(item => 
            item.status === 'low_stock' || item.status === 'out_of_stock'
          )
        }

        if (filters?.expired) {
          formattedInventory = formattedInventory.filter(item => item.status === 'expired')
        }

        if (filters?.productId) {
          formattedInventory = formattedInventory.filter(item => item.productId === filters.productId)
        }

        setInventory(formattedInventory)
      } else {
        setError(response.error || 'Failed to load inventory')
        setInventory([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  // ============ Create Inventory Item ============

  const createInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const dynamicFields = [
      {
        field_name: 'quantity',
        field_type: 'number' as const,
        field_value_number: itemData.quantity,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.QUANTITY
      },
      {
        field_name: 'min_stock',
        field_type: 'number' as const,
        field_value_number: itemData.minStock,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.MIN_STOCK
      },
      {
        field_name: 'max_stock',
        field_type: 'number' as const,
        field_value_number: itemData.maxStock,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.MAX_STOCK
      },
      {
        field_name: 'location',
        field_type: 'text' as const,
        field_value_text: itemData.location,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.LOCATION
      }
    ]

    if (itemData.batchNumber) {
      dynamicFields.push({
        field_name: 'batch_number',
        field_type: 'text' as const,
        field_value_text: itemData.batchNumber,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.BATCH_NUMBER
      })
    }

    if (itemData.expiryDate) {
      dynamicFields.push({
        field_name: 'expiry_date',
        field_type: 'date' as const,
        field_value_text: itemData.expiryDate,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.EXPIRY_DATE
      })
    }

    const relationships = []
    if (itemData.productId) {
      relationships.push({
        from_entity_id: '', // Will be filled by API
        to_entity_id: itemData.productId,
        relationship_type: 'INVENTORY_FOR_PRODUCT',
        smart_code: POS_SMART_CODES.RELATIONSHIPS.INVENTORY_FOR_PRODUCT
      })
    }

    const result = await posService.createEntity({
      entity_type: 'INVENTORY',
      entity_name: itemData.name,
      smart_code: POS_SMART_CODES.INVENTORY,
      organization_id: organization!.id,
      dynamic_fields: dynamicFields,
      relationships: relationships
    })

    // Refresh inventory list if successful
    if (result.success) {
      loadInventory()
    }

    return result
  }

  // ============ Update Inventory Item ============

  const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const dynamicFields = []

    if (updates.quantity !== undefined) {
      dynamicFields.push({
        field_name: 'quantity',
        field_type: 'number' as const,
        field_value_number: updates.quantity,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.QUANTITY
      })
    }

    if (updates.minStock !== undefined) {
      dynamicFields.push({
        field_name: 'min_stock',
        field_type: 'number' as const,
        field_value_number: updates.minStock,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.MIN_STOCK
      })
    }

    if (updates.maxStock !== undefined) {
      dynamicFields.push({
        field_name: 'max_stock',
        field_type: 'number' as const,
        field_value_number: updates.maxStock,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.MAX_STOCK
      })
    }

    if (updates.location !== undefined) {
      dynamicFields.push({
        field_name: 'location',
        field_type: 'text' as const,
        field_value_text: updates.location,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.LOCATION
      })
    }

    if (updates.batchNumber !== undefined) {
      dynamicFields.push({
        field_name: 'batch_number',
        field_type: 'text' as const,
        field_value_text: updates.batchNumber,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.BATCH_NUMBER
      })
    }

    if (updates.expiryDate !== undefined) {
      dynamicFields.push({
        field_name: 'expiry_date',
        field_type: 'date' as const,
        field_value_text: updates.expiryDate,
        smart_code: POS_SMART_CODES.FIELDS.INVENTORY.EXPIRY_DATE
      })
    }

    const result = await posService.updateEntity(itemId, {
      entity_name: updates.name,
      dynamic_fields: dynamicFields
    })

    // Refresh inventory list if successful
    if (result.success) {
      loadInventory()
    }

    return result
  }

  // ============ Stock Movement ============

  const processStockMovement = async (itemId: string, movement: StockMovement): Promise<POSServiceResponse<POSEntity>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    // Get current inventory item
    const currentItem = inventory.find(item => item.id === itemId)
    if (!currentItem) {
      return { success: false, error: 'Inventory item not found' }
    }

    // Calculate new quantity
    let newQuantity = currentItem.quantity
    switch (movement.type) {
      case 'in':
        newQuantity += movement.quantity
        break
      case 'out':
        newQuantity -= movement.quantity
        break
      case 'adjustment':
        newQuantity = movement.quantity
        break
    }

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      return { success: false, error: 'Insufficient stock for this operation' }
    }

    // Update the inventory item
    const updates: Partial<InventoryItem> = {
      quantity: newQuantity
    }

    // Update batch info if provided
    if (movement.batchNumber) {
      updates.batchNumber = movement.batchNumber
    }
    if (movement.expiryDate) {
      updates.expiryDate = movement.expiryDate
    }

    return await updateInventoryItem(itemId, updates)
  }

  // ============ Delete Inventory Item ============

  const deleteInventoryItem = async (itemId: string): Promise<POSServiceResponse<boolean>> => {
    if (!posService) {
      return { success: false, error: 'Organization context required' }
    }

    const result = await posService.deleteEntity(itemId)

    // Refresh inventory list if successful
    if (result.success) {
      loadInventory()
    }

    return result
  }

  // ============ Get Inventory Item by ID ============

  const getInventoryItem = async (itemId: string): Promise<InventoryItem | null> => {
    if (!posService) {
      return null
    }

    const response = await posService.getEntity(itemId)
    
    if (response.success && response.data) {
      return posService.convertToUIFormat(response.data)
    }

    return null
  }

  // ============ Analytics Methods ============

  const getInventoryStats = () => {
    const totalItems = inventory.length
    const lowStockItems = inventory.filter(item => item.status === 'low_stock' || item.status === 'out_of_stock').length
    const expiredItems = inventory.filter(item => item.status === 'expired').length
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)

    return {
      totalItems,
      lowStockItems,
      expiredItems,
      totalValue,
      lowStockPercentage: totalItems > 0 ? Math.round((lowStockItems / totalItems) * 100) : 0
    }
  }

  // ============ Auto-load on mount ============

  useEffect(() => {
    if (organization) {
      loadInventory()
    }
  }, [organization])

  // ============ Return Hook Interface ============

  return {
    // Data
    inventory,
    loading,
    error,

    // Actions
    loadInventory,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryItem,
    processStockMovement,

    // Analytics
    getInventoryStats,

    // Utilities
    refresh: () => loadInventory()
  }
}