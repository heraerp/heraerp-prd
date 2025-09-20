import { useState, useEffect, useCallback, useMemo } from 'react'
import { ItemWithStock, ItemForm } from '@/schemas/inventory'
import { listItems, createItem, updateItem, archiveItem, getStockLevel, upsertDynamicData } from '@/lib/playbook/inventory'
import { toast } from 'sonner'
import { debounce } from 'lodash'

interface UseInventoryPlaybookProps {
  organizationId: string
  branchId?: string
  query?: string
  status?: 'active' | 'archived' | 'all'
  page?: number
  pageSize?: number
  sort?: string
}

export function useInventoryPlaybook({
  organizationId,
  branchId = 'BRN-001',
  query = '',
  status = 'active',
  page = 1,
  pageSize = 25,
  sort = 'updated_at:desc'
}: UseInventoryPlaybookProps) {
  const [items, setItems] = useState<ItemWithStock[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounced fetch
  const fetchItems = useCallback(
    async (searchQuery: string) => {
      if (!organizationId) return

      setLoading(true)
      setError(null)

      try {
        const offset = (page - 1) * pageSize
        const result = await listItems({
          organization_id: organizationId,
          branch_id: branchId,
          q: searchQuery,
          status,
          sort,
          limit: pageSize,
          offset
        })

        // Get stock levels for items
        if (result.items.length > 0) {
          const itemIds = result.items.map(item => item.id)
          const stockLevels = await getStockLevel({
            organization_id: organizationId,
            branch_id: branchId,
            item_ids: itemIds
          })

          // Enhance items with stock data
          const enhancedItems = result.items.map(item => {
            const stock = stockLevels[item.id]
            const onHand = stock?.on_hand || 0
            const reorderLevel = item.metadata?.reorder_level || 0
            
            return {
              ...item,
              on_hand: onHand,
              avg_cost: item.metadata?.cost || 0,
              value: onHand * (item.metadata?.cost || 0),
              low_stock: onHand < reorderLevel
            }
          })

          setItems(enhancedItems)
        } else {
          setItems(result.items)
        }

        setTotal(result.total)
      } catch (err) {
        console.error('Failed to fetch items:', err)
        setError(err instanceof Error ? err.message : 'Failed to load items')
        toast.error('Failed to load inventory items')
      } finally {
        setLoading(false)
      }
    },
    [organizationId, branchId, status, page, pageSize, sort]
  )

  // Debounce search
  const debouncedFetch = useMemo(
    () => debounce((searchQuery: string) => fetchItems(searchQuery), 300),
    [fetchItems]
  )

  useEffect(() => {
    debouncedFetch(query)
    return () => {
      debouncedFetch.cancel()
    }
  }, [query, debouncedFetch])

  // Save item (create or update)
  const saveItem = useCallback(
    async (data: ItemForm, itemId?: string) => {
      try {
        const payload = {
          organization_id: organizationId,
          name: data.name,
          sku: data.sku,
          barcode: data.barcode,
          category: data.category,
          uom: data.uom,
          track_stock: data.track_stock,
          status: data.status,
          metadata: {
            tax_rate: data.tax_rate,
            track_stock: data.track_stock,
            reorder_level: data.reorder_level,
            reorder_qty: data.reorder_qty,
            cost: data.cost
          }
        }

        let result
        if (itemId) {
          result = await updateItem(itemId, payload)
          toast.success('Item updated successfully')
        } else {
          result = await createItem(payload)
          toast.success('Item created successfully')
        }

        // Initialize stock level for new items
        if (!itemId && result.id) {
          await upsertDynamicData(
            result.id,
            'HERA.INVENTORY.STOCKLEVEL.V1',
            {
              item_id: result.id,
              branch_id: branchId,
              on_hand: 0,
              available: 0,
              allocated: 0,
              last_updated: new Date().toISOString()
            }
          )
        }

        // Refresh list
        fetchItems(query)
        return result
      } catch (err) {
        console.error('Failed to save item:', err)
        const message = err instanceof Error ? err.message : 'Failed to save item'
        toast.error(message)
        throw err
      }
    },
    [organizationId, branchId, fetchItems, query]
  )

  // Archive multiple items
  const archiveMany = useCallback(
    async (itemIds: string[]) => {
      try {
        await Promise.all(itemIds.map(id => archiveItem(id, true)))
        toast.success(`Archived ${itemIds.length} item${itemIds.length > 1 ? 's' : ''}`)
        fetchItems(query)
      } catch (err) {
        console.error('Failed to archive items:', err)
        toast.error('Failed to archive items')
        throw err
      }
    },
    [fetchItems, query]
  )

  // Restore multiple items
  const restoreMany = useCallback(
    async (itemIds: string[]) => {
      try {
        await Promise.all(itemIds.map(id => archiveItem(id, false)))
        toast.success(`Restored ${itemIds.length} item${itemIds.length > 1 ? 's' : ''}`)
        fetchItems(query)
      } catch (err) {
        console.error('Failed to restore items:', err)
        toast.error('Failed to restore items')
        throw err
      }
    },
    [fetchItems, query]
  )

  // Export to CSV
  const exportCSV = useCallback(() => {
    const headers = ['Name', 'SKU', 'Category', 'On Hand', 'Reorder Level', 'Avg Cost', 'Value', 'Status']
    const rows = items.map(item => [
      item.name,
      item.sku || '',
      item.category || '',
      item.on_hand?.toString() || '0',
      item.metadata?.reorder_level?.toString() || '',
      item.avg_cost?.toFixed(2) || '0.00',
      item.value?.toFixed(2) || '0.00',
      item.status
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Inventory exported')
  }, [items])

  // Calculate stats
  const lowStockItems = useMemo(
    () => items.filter(item => item.low_stock).length,
    [items]
  )

  return {
    items,
    total,
    loading,
    error,
    lowStockItems,
    saveItem,
    archiveMany,
    restoreMany,
    exportCSV,
    refresh: () => fetchItems(query)
  }
}