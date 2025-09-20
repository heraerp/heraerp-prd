import { ItemWithStock, StockLevel } from '@/schemas/inventory'

const BASE_URL = process.env.NEXT_PUBLIC_PLAYBOOK_BASE_URL
const API_KEY = process.env.NEXT_PUBLIC_PLAYBOOK_API_KEY
const hasEnv = Boolean(BASE_URL && API_KEY)

// In-memory store for mock data persistence
const mockDataStore: {
  items: Map<string, ItemWithStock[]> // organizationId -> items array
  stockLevels: Map<string, StockLevel[]> // organizationId -> stock levels
  dynamicData: Map<string, any> // entity_id:smart_code -> data
} = {
  items: new Map(),
  stockLevels: new Map(),
  dynamicData: new Map()
}

function withParams(path: string, params: Record<string, any>) {
  const url = new URL(path, BASE_URL || 'http://mock.local/')
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v))
    }
  })
  return url
}

// Mock data generator
function generateMockItems(count: number, organizationId: string): ItemWithStock[] {
  const categories = ['Hair Care', 'Color', 'Tools', 'Retail', 'Supplies', 'Equipment']
  const items = [
    { name: 'Professional Shampoo 1L', sku: 'SHMP-PRO-1L', category: 'Hair Care', uom: 'bottle', cost: 45, reorder: 5 },
    { name: 'Conditioner 1L', sku: 'COND-PRO-1L', category: 'Hair Care', uom: 'bottle', cost: 48, reorder: 5 },
    { name: 'Hair Color - Blonde', sku: 'CLR-BLND-60', category: 'Color', uom: 'ml', cost: 35, reorder: 10 },
    { name: 'Hair Color - Brown', sku: 'CLR-BRWN-60', category: 'Color', uom: 'ml', cost: 35, reorder: 10 },
    { name: 'Hair Color - Black', sku: 'CLR-BLCK-60', category: 'Color', uom: 'ml', cost: 35, reorder: 10 },
    { name: 'Developer 20 Vol', sku: 'DEV-20V-1L', category: 'Color', uom: 'bottle', cost: 25, reorder: 8 },
    { name: 'Hair Dryer Pro', sku: 'TOOL-DRYR-01', category: 'Tools', uom: 'unit', cost: 180, reorder: 2 },
    { name: 'Cutting Scissors', sku: 'TOOL-SCSR-01', category: 'Tools', uom: 'unit', cost: 120, reorder: 3 },
    { name: 'Hair Clipper', sku: 'TOOL-CLIP-01', category: 'Tools', uom: 'unit', cost: 95, reorder: 2 },
    { name: 'Styling Gel 500ml', sku: 'STYL-GEL-500', category: 'Retail', uom: 'bottle', cost: 28, reorder: 12 },
    { name: 'Hair Spray 400ml', sku: 'STYL-SPRY-400', category: 'Retail', uom: 'bottle', cost: 32, reorder: 10 },
    { name: 'Disposable Gloves (Box)', sku: 'SUPP-GLVS-100', category: 'Supplies', uom: 'box', cost: 15, reorder: 20 },
    { name: 'Towels (Pack of 12)', sku: 'SUPP-TOWL-12', category: 'Supplies', uom: 'box', cost: 45, reorder: 5 },
    { name: 'Foil Sheets (500)', sku: 'SUPP-FOIL-500', category: 'Supplies', uom: 'box', cost: 22, reorder: 10 },
    { name: 'Salon Chair Hydraulic', sku: 'EQPT-CHAIR-01', category: 'Equipment', uom: 'unit', cost: 850, reorder: 1 }
  ]

  return items.slice(0, count).map((item, i) => ({
    id: `ITM-${String(i + 1).padStart(3, '0')}`,
    organization_id: organizationId,
    smart_code: 'HERA.SALON.PRODUCT.V1',
    name: item.name,
    sku: item.sku,
    category: item.category,
    uom: item.uom,
    track_stock: true,
    status: i % 20 === 0 ? 'archived' : 'active',
    created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      tax_rate: 5,
      track_stock: true,
      reorder_level: item.reorder,
      reorder_qty: item.reorder * 2,
      cost: item.cost
    },
    // Mock stock data
    on_hand: Math.floor(Math.random() * 50) + 5,
    avg_cost: item.cost,
    value: 0, // Will be calculated
    low_stock: false // Will be calculated
  })) as ItemWithStock[]
}

export async function listItems(params: {
  organization_id: string
  branch_id?: string
  q?: string
  status?: 'active' | 'archived' | 'all'
  sort?: string
  limit?: number
  offset?: number
}) {
  if (!hasEnv) {
    console.log('📦 Inventory: Using mock data (no Playbook env)')
    
    // Initialize mock data for this org if not exists
    if (!mockDataStore.items.has(params.organization_id)) {
      const initialItems = generateMockItems(15, params.organization_id)
      mockDataStore.items.set(params.organization_id, initialItems)
    }
    
    let allItems = mockDataStore.items.get(params.organization_id) || []

    // Filter by status
    let filtered = allItems
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(i => i.status === params.status)
    }

    // Search
    if (params.q) {
      const query = params.q.toLowerCase()
      filtered = filtered.filter(
        i =>
          i.name.toLowerCase().includes(query) ||
          i.sku?.toLowerCase().includes(query) ||
          i.category?.toLowerCase().includes(query)
      )
    }

    // Calculate value and low stock
    filtered = filtered.map(item => ({
      ...item,
      value: (item.on_hand || 0) * (item.avg_cost || 0),
      low_stock: (item.on_hand || 0) < (item.metadata?.reorder_level || 0)
    }))

    // Sort
    if (params.sort) {
      const [field, order] = params.sort.split(':')
      filtered.sort((a, b) => {
        const aVal = a[field as keyof ItemWithStock]
        const bVal = b[field as keyof ItemWithStock]
        if (order === 'desc') return bVal > aVal ? 1 : -1
        return aVal > bVal ? 1 : -1
      })
    }

    // Paginate
    const offset = params.offset || 0
    const limit = params.limit || 25
    const items = filtered.slice(offset, offset + limit)

    return { items, total: filtered.length }
  }

  try {
    const url = withParams('/entities', {
      type: 'HERA.SALON.PRODUCT.V1',
      organization_id: params.organization_id,
      branch_id: params.branch_id,
      q: params.q,
      status: params.status === 'all' ? undefined : params.status,
      sort: params.sort || 'updated_at:desc',
      limit: params.limit || 25,
      offset: params.offset || 0
    })

    console.log('📦 Inventory: GET', url.toString())
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error(`Failed to list items: ${res.status}`)
    const data = await res.json()

    return {
      items: data.items || data.rows || [],
      total: data.total || data.count || 0
    }
  } catch (error) {
    console.error('Failed to list items:', error)
    throw error
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
  if (!hasEnv) {
    console.log('✏️ CreateItem: Mock mode', payload)
    
    // Create the new item
    const newItem: ItemWithStock = {
      id: `ITM-${Date.now()}`,
      ...payload,
      smart_code: 'HERA.SALON.PRODUCT.V1',
      track_stock: payload.track_stock ?? true,
      status: payload.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      on_hand: 0,
      avg_cost: payload.metadata?.cost || 0,
      value: 0,
      low_stock: true
    }
    
    // Add to persisted store
    const orgItems = mockDataStore.items.get(payload.organization_id) || []
    orgItems.unshift(newItem)
    mockDataStore.items.set(payload.organization_id, orgItems)
    
    console.log('✏️ CreateItem: Added to mock store, total items:', orgItems.length)
    
    return newItem
  }

  try {
    const body = {
      ...payload,
      smart_code: 'HERA.SALON.PRODUCT.V1',
      status: payload.status || 'active'
    }

    console.log('✏️ CreateItem:', body)
    const res = await fetch(`${BASE_URL}/entities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error(`Failed to create item: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to create item:', error)
    throw error
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
  if (!hasEnv) {
    console.log('✏️ UpdateItem: Mock mode', id, patch)
    
    // Find and update in all orgs
    for (const [orgId, items] of mockDataStore.items.entries()) {
      const itemIndex = items.findIndex(i => i.id === id)
      if (itemIndex !== -1) {
        const updatedItem = {
          ...items[itemIndex],
          ...patch,
          updated_at: new Date().toISOString()
        }
        items[itemIndex] = updatedItem as ItemWithStock
        mockDataStore.items.set(orgId, items)
        console.log('✏️ UpdateItem: Updated in mock store')
        return updatedItem
      }
    }
    
    return { id, ...patch, updated_at: new Date().toISOString() }
  }

  try {
    console.log('✏️ UpdateItem:', id, patch)
    const res = await fetch(`${BASE_URL}/entities/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patch)
    })

    if (!res.ok) throw new Error(`Failed to update item: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to update item:', error)
    throw error
  }
}

export async function archiveItem(id: string, archived = true) {
  return updateItem(id, { status: archived ? 'archived' : 'active' })
}

export async function getStockLevel(params: {
  organization_id: string
  branch_id: string
  item_ids: string[]
}): Promise<Record<string, StockLevel>> {
  if (!hasEnv) {
    console.log('📦 GetStockLevel: Mock mode', params)
    
    const stockLevels: Record<string, StockLevel> = {}
    params.item_ids.forEach(itemId => {
      const key = `${itemId}:HERA.INVENTORY.STOCKLEVEL.V1`
      const stockData = mockDataStore.dynamicData.get(key)
      
      if (stockData) {
        stockLevels[itemId] = stockData
      } else {
        // Generate mock stock data
        const onHand = Math.floor(Math.random() * 50) + 5
        stockLevels[itemId] = {
          item_id: itemId,
          branch_id: params.branch_id,
          on_hand: onHand,
          available: onHand,
          allocated: 0,
          last_updated: new Date().toISOString()
        }
      }
    })
    
    return stockLevels
  }

  try {
    console.log('📦 GetStockLevel:', params)
    const res = await fetch(`${BASE_URL}/dynamic_data/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_ids: params.item_ids,
        smart_code: 'HERA.INVENTORY.STOCKLEVEL.V1',
        filters: { branch_id: params.branch_id }
      })
    })

    if (!res.ok) throw new Error(`Failed to get stock levels: ${res.status}`)
    const data = await res.json()
    
    // Transform to Record format
    const stockLevels: Record<string, StockLevel> = {}
    Object.entries(data).forEach(([itemId, stockData]: [string, any]) => {
      stockLevels[itemId] = stockData
    })
    
    return stockLevels
  } catch (error) {
    console.error('Failed to get stock levels:', error)
    throw error
  }
}

export async function upsertDynamicData(entity_id: string, smart_code: string, data: any) {
  if (!hasEnv) {
    console.log('✏️ UpsertDynamicData: Mock mode', { entity_id, smart_code, data })
    const key = `${entity_id}:${smart_code}`
    mockDataStore.dynamicData.set(key, data)
    return { success: true }
  }

  try {
    console.log('✏️ UpsertDynamicData:', { entity_id, smart_code, data })
    const res = await fetch(`${BASE_URL}/dynamic_data/upsert`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id,
        smart_code,
        data
      })
    })

    if (!res.ok) throw new Error(`Failed to upsert dynamic data: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to upsert dynamic data:', error)
    throw error
  }
}

export async function getValuationConfig(params: {
  organization_id: string
  item_ids?: string[]
}): Promise<{ method: 'WAC' | 'FIFO', item_overrides?: Record<string, 'WAC' | 'FIFO'> }> {
  if (!hasEnv) {
    console.log('📦 GetValuationConfig: Mock mode', params)
    return { method: 'WAC', item_overrides: {} }
  }

  try {
    console.log('📦 GetValuationConfig:', params)
    const res = await fetch(`${BASE_URL}/dynamic_data/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_ids: [params.organization_id, ...(params.item_ids || [])],
        smart_code: 'HERA.INVENTORY.VALUATION_METHOD.V1'
      })
    })

    if (!res.ok) throw new Error(`Failed to get valuation config: ${res.status}`)
    const data = await res.json()
    
    const orgMethod = data[params.organization_id]?.method || 'WAC'
    const item_overrides: Record<string, 'WAC' | 'FIFO'> = {}
    
    params.item_ids?.forEach(itemId => {
      if (data[itemId]?.method && data[itemId].method !== orgMethod) {
        item_overrides[itemId] = data[itemId].method
      }
    })
    
    return { method: orgMethod, item_overrides }
  } catch (error) {
    console.error('Failed to get valuation config:', error)
    return { method: 'WAC' }
  }
}