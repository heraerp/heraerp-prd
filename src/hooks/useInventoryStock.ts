import { useState, useEffect } from 'react'

interface UseInventoryStockOptions {
  organizationId: string
  productIds: string[]
  branchId?: string
}

interface StockLevels {
  [productId: string]: number
}

export function useInventoryStock({
  organizationId,
  productIds,
  branchId
}: UseInventoryStockOptions) {
  const [stockLevels, setStockLevels] = useState<StockLevels>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || productIds.length === 0) {
      setStockLevels({})
      return
    }

    const fetchStock = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/playbook/inventory/stock/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organization_id: organizationId,
            product_ids: productIds,
            branch_id: branchId
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stock levels')
        }

        const data = await response.json()

        // Convert array response to object keyed by product_id
        const stockMap: StockLevels = {}
        if (data.stock_levels && Array.isArray(data.stock_levels)) {
          data.stock_levels.forEach(
            (item: {
              product_id: string
              stock_on_hand: number
              entity_name?: string
              attributes?: any
            }) => {
              stockMap[item.product_id] = item.stock_on_hand
            }
          )
        }

        setStockLevels(stockMap)
      } catch (err) {
        console.error('Failed to fetch stock levels:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stock levels')
        setStockLevels({})
      } finally {
        setIsLoading(false)
      }
    }

    fetchStock()
  }, [organizationId, productIds.join(','), branchId])

  return {
    stockLevels,
    isLoading,
    error
  }
}
