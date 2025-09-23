import { ItemWithStock, StockLevel } from '@/schemas/inventory'
import { heraCode } from '@/lib/smart-codes'
import { pb, extractList, getDD, withBranch, pbLog } from './client'

export async function listItems(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  q?: string
  status?: 'active' | 'archived' | 'all'
  sort?: string
  limit?: number
  offset?: number
}) {
  try {
    const query = withBranch(
      {
        type: 'HERA.SALON.PRODUCT.v1',
        organization_id: params.organization_id,
        q: params.q,
        sort: params.sort || 'updated_at:desc',
        limit: params.limit ?? 25,
        offset: params.offset ?? 0,
        ...(params.status && params.status !== 'all' ? { status: params.status } : {})
      },
      params.branch_id
    )

    pbLog('listItems request:', query)

    const json = await pb('/entities', { query })
    const result = extractList(json)

    // Enrich items with stock data if needed
    const itemsWithStock = result.items.map(item => ({
      ...item,
      // These fields would come from stock level queries if needed
      on_hand: item.metadata?.on_hand ?? 0,
      avg_cost: item.metadata?.avg_cost ?? item.metadata?.cost ?? 0,
      value: 0, // Will be calculated
      low_stock: false // Will be calculated
    }))

    // Calculate value and low stock
    const enrichedItems = itemsWithStock.map(item => ({
      ...item,
      value: (item.on_hand || 0) * (item.avg_cost || 0),
      low_stock: (item.on_hand || 0) < (item.metadata?.reorder_level || 0)
    }))

    pbLog('listItems success:', {
      count: enrichedItems.length,
      total: result.total
    })

    return { ok: true, data: { items: enrichedItems, total: result.total } } as const
  } catch (error) {
    pbLog('listItems error:', error)
    return {
      ok: false,
      data: { items: [], total: 0 },
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function createItem(payload: {
  organization_id: string
  name: string
  sku?: string
  barcode?: string
  category?: string
  uom?: string
  track_stock?: boolean
  status?: 'active' | 'archived'
  metadata?: any
}) {
  try {
    const body = {
      ...payload,
      smart_code: heraCode('HERA.SALON.PRODUCT.v1'),
      status: payload.status || 'active'
    }

    pbLog('createItem request:', body)

    const json = await pb('/entities', {
      method: 'POST',
      body
    })

    pbLog('createItem success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('createItem error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function updateItem(
  id: string,
  patch: Partial<{
    name: string
    sku: string
    barcode: string
    category: string
    uom: string
    track_stock: boolean
    status: 'active' | 'archived'
    metadata: any
  }>
) {
  try {
    pbLog('updateItem request:', { id, patch })

    const json = await pb(`/entities/${id}`, {
      method: 'PATCH',
      body: patch
    })

    pbLog('updateItem success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('updateItem error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function archiveItem(id: string, archived = true) {
  return updateItem(id, { status: archived ? 'archived' : 'active' })
}

export async function getStockLevel(params: {
  organization_id: string
  branch_id: string
  item_ids: string[]
}) {
  try {
    pbLog('getStockLevel request:', params)

    const body = {
      entity_ids: params.item_ids,
      smart_code: heraCode('HERA.INVENTORY.STOCKLEVEL.v1'),
      filters: { branch_id: params.branch_id }
    }

    const json = await pb('/dynamic_data/query', {
      method: 'POST',
      body
    })

    // Transform to Record format
    const stockLevels: Record<string, StockLevel> = {}

    if (json.data) {
      if (Array.isArray(json.data)) {
        // Handle array format
        json.data.forEach((item: any) => {
          if (item.entity_id && item.data) {
            stockLevels[item.entity_id] = item.data
          }
        })
      } else if (typeof json.data === 'object') {
        // Already in expected format
        Object.entries(json.data).forEach(([itemId, stockData]: [string, any]) => {
          stockLevels[itemId] = stockData
        })
      }
    }

    pbLog('getStockLevel success:', {
      items: Object.keys(stockLevels).length
    })

    return { ok: true, data: stockLevels } as const
  } catch (error) {
    pbLog('getStockLevel error:', error)
    return {
      ok: false,
      data: {},
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function upsertDynamicData(entity_id: string, smart_code: string, data: any) {
  try {
    const body = {
      entity_id,
      smart_code,
      data
    }

    pbLog('upsertDynamicData request:', body)

    const json = await pb('/dynamic_data/upsert', {
      method: 'POST',
      body
    })

    pbLog('upsertDynamicData success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('upsertDynamicData error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}

export async function getValuationConfig(params: { organization_id: string; item_ids?: string[] }) {
  try {
    const body = {
      entity_ids: [params.organization_id, ...(params.item_ids || [])],
      smart_code: heraCode('HERA.INVENTORY.VALUATION_METHOD.v1')
    }

    pbLog('getValuationConfig request:', body)

    const json = await pb('/dynamic_data/query', {
      method: 'POST',
      body
    })

    const data = json.data || {}

    const orgMethod = data[params.organization_id]?.method || 'WAC'
    const item_overrides: Record<string, 'WAC' | 'FIFO'> = {}

    params.item_ids?.forEach(itemId => {
      if (data[itemId]?.method && data[itemId].method !== orgMethod) {
        item_overrides[itemId] = data[itemId].method
      }
    })

    const result = { method: orgMethod, item_overrides }

    pbLog('getValuationConfig success:', result)

    return { ok: true, data: result } as const
  } catch (error) {
    pbLog('getValuationConfig error:', error)
    return {
      ok: false,
      data: { method: 'WAC' as const, item_overrides: {} },
      error: error instanceof Error ? error.message : String(error)
    } as const
  }
}
