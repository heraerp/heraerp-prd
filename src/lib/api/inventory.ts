// ================================================================================
// INVENTORY API HELPERS
// Smart Code: HERA.API.INVENTORY.v1
// Thin wrappers around useUniversalApi for inventory operations
// ================================================================================

import { useQuery } from '@tanstack/react-query'
import { useUniversalApi } from '@/src/hooks/useUniversalApi'
import { 
  Product, 
  ProductWithInventory, 
  ProductPolicy, 
  InventoryMovement,
  ListProductsRequest,
  CreateProductRequest,
  UpdateProductRequest,
  UsageAnalysisRequest,
  ProductUsage,
  INVENTORY_SMART_CODES,
  calculateOnHand,
  isLowStock,
  calculateUsageMetrics
} from '@/src/lib/schemas/inventory'

// ================================================================================
// INVENTORY API CLASS
// ================================================================================

export class InventoryApi {
  constructor(private universalApi: ReturnType<typeof useUniversalApi>) {}

  // List products with inventory data
  async listProducts(orgId: string, filters: Partial<ListProductsRequest> = {}): Promise<ProductWithInventory[]> {
    // Get products from core_entities
    const productsResult = await this.universalApi.execute({
      table: 'core_entities',
      method: 'GET',
      filters: {
        organization_id: orgId,
        entity_type: 'product'
      }
    })

    if (!productsResult.success || !productsResult.data) {
      throw new Error('Failed to load products')
    }

    const products = productsResult.data as any[]
    const enrichedProducts: ProductWithInventory[] = []

    // Enrich each product with inventory data
    for (const product of products) {
      // Apply filters
      if (filters.search && !product.entity_name.toLowerCase().includes(filters.search.toLowerCase())) {
        continue
      }
      if (filters.category && product.metadata?.category !== filters.category) {
        continue
      }
      if (filters.status && filters.status !== 'all' && product.status !== filters.status) {
        continue
      }

      // Get dynamic data (policies)
      const policyResult = await this.universalApi.execute({
        table: 'core_dynamic_data',
        method: 'GET',
        filters: {
          organization_id: orgId,
          entity_id: product.id
        }
      })

      // Get inventory movements
      const movementsResult = await this.universalApi.execute({
        table: 'universal_transaction_lines',
        method: 'GET',
        filters: {
          organization_id: orgId,
          entity_id: product.id
        }
      })

      // Calculate current inventory
      const movements = (movementsResult.data as any[]) || []
      const inventoryMovements: InventoryMovement[] = movements
        .filter(line => ['receipt', 'issue', 'adjustment', 'transfer'].includes(line.line_type))
        .map(line => ({
          transaction_id: line.transaction_id,
          transaction_date: line.created_at,
          line_number: line.line_number,
          entity_id: line.entity_id,
          line_type: line.line_type as any,
          description: line.description,
          quantity: line.quantity || 0,
          unit_amount: line.unit_amount,
          line_amount: line.line_amount,
          smart_code: line.smart_code,
          metadata: line.metadata
        }))

      const qty_on_hand = calculateOnHand(inventoryMovements)
      
      // Get policy data
      const policies = policyResult.data as any[] || []
      const reorderLevelPolicy = policies.find(p => p.field_name === 'reorder_level')
      const reorder_level = reorderLevelPolicy?.field_value_number || 0

      const lastMovement = inventoryMovements.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )[0]

      const enrichedProduct: ProductWithInventory = {
        organization_id: product.organization_id,
        entity_type: product.entity_type,
        entity_code: product.entity_code,
        entity_name: product.entity_name,
        unit: product.metadata?.unit || 'ea',
        category: product.metadata?.category,
        smart_code: product.smart_code,
        status: product.status || 'active',
        metadata: product.metadata,
        qty_on_hand,
        reorder_level,
        is_low_stock: isLowStock(qty_on_hand, reorder_level),
        last_movement_date: lastMovement?.transaction_date,
        last_movement_type: lastMovement?.line_type,
        costing_method: policies.find(p => p.field_name === 'costing_method')?.field_value_text || 'FIFO'
      }

      enrichedProducts.push(enrichedProduct)
    }

    // Apply low stock filter
    let filteredProducts = enrichedProducts
    if (filters.low_stock_only) {
      filteredProducts = enrichedProducts.filter(p => p.is_low_stock)
    }

    // Apply pagination
    const offset = filters.offset || 0
    const limit = filters.limit || 100
    
    return filteredProducts.slice(offset, offset + limit)
  }

  // Get single product with full details
  async getProduct(orgId: string, productCode: string): Promise<ProductWithInventory | null> {
    const products = await this.listProducts(orgId, { 
      search: productCode,
      limit: 1 
    })
    
    return products.find(p => p.entity_code === productCode) || null
  }

  // Create or update product
  async upsertProduct(orgId: string, data: CreateProductRequest | UpdateProductRequest): Promise<ProductWithInventory> {
    const isUpdate = 'entity_id' in data

    if (isUpdate) {
      // Update existing product
      const updateData = data as UpdateProductRequest
      
      // Update core entity
      await this.universalApi.execute({
        table: 'core_entities',
        method: 'PUT',
        data: {
          id: updateData.entity_id,
          entity_code: updateData.entity_code,
          entity_name: updateData.entity_name,
          smart_code: INVENTORY_SMART_CODES.PRODUCT_ENTITY,
          metadata: {
            unit: updateData.unit,
            category: updateData.category
          }
        }
      })

      // Update dynamic data (policies)
      if (updateData.reorder_level !== undefined) {
        await this.universalApi.execute({
          table: 'core_dynamic_data',
          method: 'POST',
          data: {
            organization_id: orgId,
            entity_id: updateData.entity_id,
            field_name: 'reorder_level',
            field_value_number: updateData.reorder_level,
            smart_code: 'HERA.SALON.INVENTORY.POLICY.REORDER.v1'
          }
        })
      }

      // Return updated product
      const updated = await this.getProduct(orgId, updateData.entity_code!)
      if (!updated) throw new Error('Failed to retrieve updated product')
      return updated

    } else {
      // Create new product
      const createData = data as CreateProductRequest

      // Create core entity
      const entityResult = await this.universalApi.execute({
        table: 'core_entities',
        method: 'POST',
        data: {
          organization_id: orgId,
          entity_type: 'product',
          entity_code: createData.entity_code,
          entity_name: createData.entity_name,
          smart_code: INVENTORY_SMART_CODES.PRODUCT_ENTITY,
          metadata: {
            unit: createData.unit,
            category: createData.category
          }
        }
      })

      if (!entityResult.success || !entityResult.data) {
        throw new Error('Failed to create product entity')
      }

      const entityId = entityResult.data.id

      // Set reorder level policy
      if (createData.reorder_level) {
        await this.universalApi.execute({
          table: 'core_dynamic_data',
          method: 'POST',
          data: {
            organization_id: orgId,
            entity_id: entityId,
            field_name: 'reorder_level',
            field_value_number: createData.reorder_level,
            smart_code: 'HERA.SALON.INVENTORY.POLICY.REORDER.v1'
          }
        })
      }

      // Set costing method
      if (createData.costing_method) {
        await this.universalApi.execute({
          table: 'core_dynamic_data',
          method: 'POST',
          data: {
            organization_id: orgId,
            entity_id: entityId,
            field_name: 'costing_method',
            field_value_text: createData.costing_method,
            smart_code: 'HERA.SALON.INVENTORY.POLICY.COSTING.v1'
          }
        })
      }

      // Create opening stock transaction if quantity > 0
      if (createData.opening_qty > 0) {
        await this.universalApi.execute({
          table: 'universal_transactions',
          method: 'POST',
          data: {
            organization_id: orgId,
            transaction_type: 'inventory_adjustment',
            transaction_code: `ADJ-${Date.now()}`,
            smart_code: INVENTORY_SMART_CODES.PRODUCT_ADJUSTMENT,
            total_amount: (createData.opening_qty * (createData.standard_cost || 0)),
            metadata: {
              adjustment_type: 'opening_balance',
              reason: 'Initial stock setup'
            },
            lines: [{
              line_number: 1,
              line_type: 'adjustment',
              entity_id: entityId,
              description: `Opening Balance - ${createData.entity_name}`,
              quantity: createData.opening_qty,
              unit_amount: createData.standard_cost || 0,
              line_amount: (createData.opening_qty * (createData.standard_cost || 0)),
              smart_code: INVENTORY_SMART_CODES.PRODUCT_ADJUSTMENT
            }]
          }
        })
      }

      // Return created product
      const created = await this.getProduct(orgId, createData.entity_code)
      if (!created) throw new Error('Failed to retrieve created product')
      return created
    }
  }

  // Get low stock products
  async listLowStock(orgId: string): Promise<ProductWithInventory[]> {
    return this.listProducts(orgId, { 
      low_stock_only: true,
      limit: 1000 
    })
  }

  // Get product usage analytics
  async getUsage(orgId: string, params: UsageAnalysisRequest): Promise<ProductUsage[]> {
    // Get transaction lines for the period
    const movementsResult = await this.universalApi.execute({
      table: 'universal_transaction_lines',
      method: 'GET',
      filters: {
        organization_id: orgId,
        // Note: Universal API filtering by date range would be done at the API level
        // For now, we'll get all movements and filter in memory
      }
    })

    if (!movementsResult.success || !movementsResult.data) {
      return []
    }

    const allMovements = movementsResult.data as any[]
    
    // Filter by date range and convert to InventoryMovement
    const startDate = new Date(params.start_date)
    const endDate = new Date(params.end_date)
    
    const periodMovements: InventoryMovement[] = allMovements
      .filter(line => {
        const lineDate = new Date(line.created_at)
        return lineDate >= startDate && lineDate <= endDate &&
               ['receipt', 'issue', 'adjustment', 'transfer'].includes(line.line_type)
      })
      .map(line => ({
        transaction_id: line.transaction_id,
        transaction_date: line.created_at,
        line_number: line.line_number,
        entity_id: line.entity_id,
        line_type: line.line_type as any,
        description: line.description,
        quantity: line.quantity || 0,
        unit_amount: line.unit_amount,
        line_amount: line.line_amount,
        smart_code: line.smart_code,
        metadata: line.metadata
      }))

    // Group by entity_id (product)
    const movementsByProduct = new Map<string, InventoryMovement[]>()
    for (const movement of periodMovements) {
      if (!movementsByProduct.has(movement.entity_id)) {
        movementsByProduct.set(movement.entity_id, [])
      }
      movementsByProduct.get(movement.entity_id)!.push(movement)
    }

    // Get product details
    const productIds = Array.from(movementsByProduct.keys())
    if (productIds.length === 0) return []

    const productsResult = await this.universalApi.execute({
      table: 'core_entities',
      method: 'GET',
      filters: {
        organization_id: orgId,
        entity_type: 'product'
        // Filter by IDs would be done at API level
      }
    })

    const products = (productsResult.data as any[]) || []
    const productMap = new Map(products.map(p => [p.id, p]))

    // Calculate usage for each product
    const usageResults: ProductUsage[] = []
    
    for (const [productId, movements] of movementsByProduct) {
      const product = productMap.get(productId)
      if (!product) continue

      // Apply product code filter if specified
      if (params.product_codes && !params.product_codes.includes(product.entity_code)) {
        continue
      }

      // Apply category filter if specified
      if (params.category && product.metadata?.category !== params.category) {
        continue
      }

      const metrics = calculateUsageMetrics(movements, startDate, endDate)
      
      usageResults.push({
        product_code: product.entity_code,
        product_name: product.entity_name,
        ...metrics
      })
    }

    // Sort by total issues (descending) and limit to top N
    return usageResults
      .sort((a, b) => b.total_issues - a.total_issues)
      .slice(0, params.top_n || 10)
  }

  // Create inventory movement transaction
  async createMovement(
    orgId: string, 
    productId: string, 
    movementType: 'receipt' | 'issue' | 'adjustment' | 'transfer',
    quantity: number,
    unitCost: number = 0,
    reason: string = '',
    referenceDoc: string = ''
  ): Promise<any> {
    const transactionCode = `${movementType.toUpperCase()}-${Date.now()}`
    const lineAmount = quantity * unitCost

    const smartCodeMap = {
      receipt: INVENTORY_SMART_CODES.PRODUCT_RECEIPT,
      issue: INVENTORY_SMART_CODES.PRODUCT_ISSUE,
      adjustment: INVENTORY_SMART_CODES.PRODUCT_ADJUSTMENT,
      transfer: INVENTORY_SMART_CODES.PRODUCT_TRANSFER
    }

    return this.universalApi.execute({
      table: 'universal_transactions',
      method: 'POST',
      data: {
        organization_id: orgId,
        transaction_type: `inventory_${movementType}`,
        transaction_code: transactionCode,
        smart_code: smartCodeMap[movementType],
        total_amount: Math.abs(lineAmount),
        metadata: {
          movement_type: movementType,
          reason,
          reference_doc: referenceDoc
        },
        lines: [{
          line_number: 1,
          line_type: movementType,
          entity_id: productId,
          description: `${movementType.charAt(0).toUpperCase() + movementType.slice(1)} - ${reason || 'Inventory movement'}`,
          quantity: movementType === 'issue' ? -Math.abs(quantity) : Math.abs(quantity),
          unit_amount: unitCost,
          line_amount: movementType === 'issue' ? -Math.abs(lineAmount) : Math.abs(lineAmount),
          smart_code: smartCodeMap[movementType],
          metadata: {
            movement_type: movementType,
            reference_doc: referenceDoc
          }
        }]
      }
    })
  }
}

// ================================================================================
// REACT HOOK WRAPPER
// ================================================================================

export function useInventoryApi() {
  const universalApi = useUniversalApi()
  return new InventoryApi(universalApi)
}

// Simple wrapper for dashboard
export function useInventoryApiSimple() {
  const api = useInventoryApi()
  
  return {
    listLowStock: ({ organizationId, limit = 10 }: { organizationId: string; limit?: number }) => {
      return {
        data: { items: [] }, // Mock for now
        isLoading: false
      }
    }
  }
}

// ================================================================================
// REACT QUERY HOOKS FOR DASHBOARD
// ================================================================================

export function useInventoryAlerts({ organizationId }: { organizationId: string }) {
  return useQuery({
    queryKey: ['inventory', 'alerts', organizationId],
    queryFn: async () => {
      // For dashboard, return mock data
      // In production, this would query low stock items
      return {
        low_stock_count: 3,
        out_of_stock_count: 1,
        items: []
      }
    },
    enabled: !!organizationId
  })
}

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

export const InventoryUtils = {
  // Format quantity with unit
  formatQuantity: (qty: number, unit: string = 'ea') => {
    return `${qty.toLocaleString()} ${unit}`
  },

  // Get stock status color
  getStockStatusColor: (product: ProductWithInventory) => {
    if (product.is_low_stock) return 'text-red-600'
    if (product.qty_on_hand === 0) return 'text-gray-400'
    return 'text-green-600'
  },

  // Get stock status text
  getStockStatusText: (product: ProductWithInventory) => {
    if (product.qty_on_hand === 0) return 'Out of Stock'
    if (product.is_low_stock) return 'Low Stock'
    return 'In Stock'
  },

  // Calculate days of inventory
  calculateDaysOfInventory: (onHand: number, dailyUsage: number) => {
    if (dailyUsage <= 0) return Infinity
    return Math.round(onHand / dailyUsage)
  },

  // Generate product code
  generateProductCode: (name: string, category?: string) => {
    const categoryPrefix = category ? category.substring(0, 3).toUpperCase() : 'PRD'
    const nameCode = name.replace(/\s+/g, '').substring(0, 6).toUpperCase()
    const timestamp = Date.now().toString().slice(-4)
    return `${categoryPrefix}-${nameCode}-${timestamp}`
  }
}