/**
 * HERA Product Costing v2: TypeScript Client SDK
 * 
 * Enterprise-grade TypeScript client for Product Costing v2 API with complete type safety,
 * BOM and routing management, WIP and variance integration, and React hooks.
 * 
 * Smart Code: HERA.COST.PRODUCT.CLIENT.SDK.V2
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type Product,
  type ProductCreateRequest,
  type ProductUpdateRequest,
  type ProductResponse,
  type ProductValidationError,
  type BOMComponent,
  type RoutingActivity,
  type BOMUpsertRequest,
  type RoutingUpsertRequest,
  type StandardCostComponents,
  PRODUCT_COSTING_SMART_CODES,
  validateProductCode,
  validateProductType,
  validateStandardCostComponents,
  validateEffectiveDates,
  validateBOMComponent,
  validateRoutingActivity
} from './productcosting-v2-standard'
import { applyProductCostingGuardrails } from './productcosting-v2-guardrails'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProductCostingClientConfig {
  baseUrl?: string
  apiVersion?: string
  organizationId: string
  headers?: Record<string, string>
}

export interface ProductQueryFilters {
  productId?: string
  productCode?: string
  productType?: 'FINISHED' | 'SEMI' | 'RAW' | 'SERVICE'
  search?: string
  status?: 'ACTIVE' | 'ARCHIVED'
  includeArchived?: boolean
  includeBOM?: boolean
  includeRouting?: boolean
}

export interface ProductCostingClientResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  validation_errors?: ProductValidationError[]
  audit_txn_id?: string
  smart_code?: string
  timestamp?: string
  count?: number
  filters?: Record<string, any>
}

export interface ProductHierarchyNode extends ProductResponse {
  bom_components?: BOMComponent[]
  routing_activities?: RoutingActivity[]
  total_bom_cost?: number
  total_routing_cost?: number
  cost_rollup?: StandardCostComponents
  production_cost?: number
}

export interface ProductionOrderRequest {
  product_id: string
  quantity: number
  due_date: string
  work_center_id?: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  reference_number?: string
}

export interface InventoryPostingRequest {
  product_id: string
  movement_type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  cost_per_unit?: number
  from_location?: string
  to_location?: string
  reference_number?: string
  posting_date: string
}

export interface VarianceReportRequest {
  product_id?: string
  period: string
  variance_types?: ('material' | 'labor' | 'overhead')[]
}

// ============================================================================
// Product Costing Client Class
// ============================================================================

export class ProductCostingClient {
  private config: Required<ProductCostingClientConfig>

  constructor(config: ProductCostingClientConfig) {
    this.config = {
      baseUrl: config.baseUrl || '/api',
      apiVersion: config.apiVersion || 'v2',
      organizationId: config.organizationId,
      headers: {
        'Content-Type': 'application/json',
        'x-hera-api-version': config.apiVersion || 'v2',
        'x-hera-organization-id': config.organizationId,
        ...config.headers
      }
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ProductCostingClientResponse<T>> {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/products${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }))
      throw new ProductCostingClientError(errorData.error || 'Request failed', errorData.code, response.status)
    }

    return response.json()
  }

  /**
   * Create new product
   */
  async createProduct(request: ProductCreateRequest): Promise<ProductCostingClientResponse<ProductResponse>> {
    // Client-side validation
    const codeValidation = validateProductCode(request.product_code)
    if (!codeValidation.valid) {
      throw new ProductCostingClientError(
        codeValidation.errors.join(', '),
        'ERR_PROD_INVALID_CODE_FORMAT'
      )
    }

    const typeValidation = validateProductType(request.product_type)
    if (!typeValidation.valid) {
      throw new ProductCostingClientError(
        typeValidation.errors.join(', '),
        'ERR_PROD_INVALID_TYPE'
      )
    }

    if (request.std_cost_components) {
      const costValidation = validateStandardCostComponents(request.std_cost_components)
      if (!costValidation.valid) {
        throw new ProductCostingClientError(
          costValidation.errors.join(', '),
          'ERR_PROD_STDCOST_INVALID'
        )
      }
    }

    if (request.effective_from || request.effective_to) {
      const datesValidation = validateEffectiveDates(request.effective_from, request.effective_to)
      if (!datesValidation.valid) {
        throw new ProductCostingClientError(
          datesValidation.errors.join(', '),
          'ERR_PROD_INVALID_DATE_RANGE'
        )
      }
    }

    return this.request<ProductResponse>('', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Update existing product
   */
  async updateProduct(
    productId: string, 
    request: ProductUpdateRequest
  ): Promise<ProductCostingClientResponse<ProductResponse>> {
    if (request.product_code) {
      const codeValidation = validateProductCode(request.product_code)
      if (!codeValidation.valid) {
        throw new ProductCostingClientError(
          codeValidation.errors.join(', '),
          'ERR_PROD_INVALID_CODE_FORMAT'
        )
      }
    }

    if (request.product_type) {
      const typeValidation = validateProductType(request.product_type)
      if (!typeValidation.valid) {
        throw new ProductCostingClientError(
          typeValidation.errors.join(', '),
          'ERR_PROD_INVALID_TYPE'
        )
      }
    }

    if (request.std_cost_components) {
      const costValidation = validateStandardCostComponents(request.std_cost_components)
      if (!costValidation.valid) {
        throw new ProductCostingClientError(
          costValidation.errors.join(', '),
          'ERR_PROD_STDCOST_INVALID'
        )
      }
    }

    return this.request<ProductResponse>('', {
      method: 'PUT',
      body: JSON.stringify({ ...request, product_id: productId })
    })
  }

  /**
   * Get products with filtering
   */
  async getProducts(filters: ProductQueryFilters = {}): Promise<ProductCostingClientResponse<ProductResponse[]>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<ProductResponse[]>(query)
  }

  /**
   * Get single product by ID
   */
  async getProduct(productId: string, options: { includeBOM?: boolean; includeRouting?: boolean } = {}): Promise<ProductCostingClientResponse<ProductResponse>> {
    const response = await this.getProducts({ 
      productId, 
      includeBOM: options.includeBOM, 
      includeRouting: options.includeRouting 
    })
    if (response.data && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0]!
      }
    }
    throw new ProductCostingClientError('Product not found', 'ERR_PROD_NOT_FOUND', 404)
  }

  /**
   * Archive product
   */
  async archiveProduct(productId: string): Promise<ProductCostingClientResponse<void>> {
    return this.request<void>(`?product_id=${productId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Update product BOM
   */
  async updateBOM(productId: string, components: BOMComponent[]): Promise<ProductCostingClientResponse<any>> {
    // Validate components
    for (const component of components) {
      const validation = validateBOMComponent({
        component_id: component.component_id,
        qty_per: component.qty_per,
        scrap_pct: component.scrap_pct
      })
      if (!validation.valid) {
        throw new ProductCostingClientError(
          validation.errors.join(', '),
          'ERR_BOM_COMPONENT_INVALID'
        )
      }
    }

    return this.request<any>(`/${productId}/bom`, {
      method: 'POST',
      body: JSON.stringify({ components })
    })
  }

  /**
   * Get product BOM
   */
  async getBOM(
    productId: string, 
    options: { multiLevel?: boolean; maxLevels?: number } = {}
  ): Promise<ProductCostingClientResponse<any>> {
    const params = new URLSearchParams()
    if (options.multiLevel) params.append('multi_level', 'true')
    if (options.maxLevels) params.append('max_levels', String(options.maxLevels))
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<any>(`/${productId}/bom${query}`)
  }

  /**
   * Clear product BOM
   */
  async clearBOM(productId: string): Promise<ProductCostingClientResponse<void>> {
    return this.request<void>(`/${productId}/bom`, {
      method: 'DELETE'
    })
  }

  /**
   * Update product routing
   */
  async updateRouting(productId: string, activities: RoutingActivity[]): Promise<ProductCostingClientResponse<any>> {
    // Validate activities
    for (const activity of activities) {
      const validation = validateRoutingActivity({
        activity_id: activity.activity_id,
        std_hours: activity.std_hours
      })
      if (!validation.valid) {
        throw new ProductCostingClientError(
          validation.errors.join(', '),
          'ERR_ROUTING_ACTIVITY_INVALID'
        )
      }
    }

    return this.request<any>(`/${productId}/routing`, {
      method: 'POST',
      body: JSON.stringify({ activities })
    })
  }

  /**
   * Get product routing
   */
  async getRouting(
    productId: string, 
    options: { includeWorkCenters?: boolean; includeCapacity?: boolean } = {}
  ): Promise<ProductCostingClientResponse<any>> {
    const params = new URLSearchParams()
    if (options.includeWorkCenters) params.append('include_work_centers', 'true')
    if (options.includeCapacity) params.append('include_capacity', 'true')
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<any>(`/${productId}/routing${query}`)
  }

  /**
   * Clear product routing
   */
  async clearRouting(productId: string): Promise<ProductCostingClientResponse<void>> {
    return this.request<void>(`/${productId}/routing`, {
      method: 'DELETE'
    })
  }

  /**
   * Calculate product cost
   */
  async calculateProductCost(productId: string): Promise<ProductCostingClientResponse<{
    standard_cost: StandardCostComponents
    bom_cost: number
    routing_cost: number
    total_cost: number
    cost_breakdown: any
  }>> {
    // Get product with BOM and routing
    const productResponse = await this.getProduct(productId, { includeBOM: true, includeRouting: true })
    if (!productResponse.success || !productResponse.data) {
      throw new ProductCostingClientError('Product not found for cost calculation', 'ERR_PROD_NOT_FOUND')
    }

    const product = productResponse.data as any
    const bomCost = (product.bom_components || []).reduce((sum: number, comp: any) => sum + (comp.extended_cost || 0), 0)
    const routingCost = (product.routing_activities || []).reduce((sum: number, act: any) => sum + (act.extended_cost || 0), 0)

    return {
      success: true,
      data: {
        standard_cost: product.std_cost_components || { material: 0, labor: 0, overhead: 0 },
        bom_cost: bomCost,
        routing_cost: routingCost,
        total_cost: bomCost + routingCost,
        cost_breakdown: {
          bom_components: product.bom_components || [],
          routing_activities: product.routing_activities || []
        }
      }
    }
  }

  /**
   * Search products by name, code, or type
   */
  async searchProducts(
    searchTerm: string, 
    filters: Omit<ProductQueryFilters, 'search'> = {}
  ): Promise<ProductCostingClientResponse<ProductResponse[]>> {
    return this.getProducts({ 
      ...filters, 
      search: searchTerm
    })
  }

  /**
   * Batch create multiple products
   */
  async batchCreateProducts(requests: ProductCreateRequest[]): Promise<ProductCostingClientResponse<ProductResponse[]>> {
    const results: ProductResponse[] = []
    const errors: Array<{ index: number; error: string }> = []

    for (let i = 0; i < requests.length; i++) {
      try {
        const response = await this.createProduct(requests[i]!)
        if (response.success && response.data) {
          results.push(response.data)
        } else {
          errors.push({ index: i, error: response.error || 'Unknown error' })
        }
      } catch (error) {
        errors.push({ 
          index: i, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      validation_errors: errors.map(e => ({
        code: 'ERR_PROD_BATCH_FAILED',
        message: `Product ${e.index + 1}: ${e.error}`,
        field: 'batch_operation',
        value: e.index
      }))
    }
  }

  /**
   * Validate product data without creating/updating
   */
  async validateProduct(
    operation: 'create' | 'update',
    data: ProductCreateRequest | ProductUpdateRequest,
    existingProducts: Product[] = []
  ): Promise<ProductCostingClientResponse<{ valid: boolean; errors: ProductValidationError[] }>> {
    return this.request<{ valid: boolean; errors: ProductValidationError[] }>('', {
      method: 'OPTIONS',
      body: JSON.stringify({
        operation,
        data,
        existing_products: existingProducts
      })
    })
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class ProductCostingClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public validationErrors?: ProductValidationError[]
  ) {
    super(message)
    this.name = 'ProductCostingClientError'
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook for managing product costing client instance
 */
export function useProductCostingClient(config: ProductCostingClientConfig) {
  const [client] = useState(() => new ProductCostingClient(config))
  
  useEffect(() => {
    // Update client config if organizationId changes
    client['config'].organizationId = config.organizationId
    client['config'].headers['x-hera-organization-id'] = config.organizationId
  }, [config.organizationId, client])
  
  return client
}

/**
 * Hook for fetching products
 */
export function useProducts(
  config: ProductCostingClientConfig,
  filters: ProductQueryFilters = {},
  options: { enabled?: boolean } = {}
) {
  const client = useProductCostingClient(config)
  
  return useQuery({
    queryKey: ['products', config.organizationId, filters],
    queryFn: () => client.getProducts(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching single product
 */
export function useProduct(
  config: ProductCostingClientConfig,
  productId: string,
  options: { enabled?: boolean; includeBOM?: boolean; includeRouting?: boolean } = {}
) {
  const client = useProductCostingClient(config)
  
  return useQuery({
    queryKey: ['product', config.organizationId, productId, options.includeBOM, options.includeRouting],
    queryFn: () => client.getProduct(productId, { includeBOM: options.includeBOM, includeRouting: options.includeRouting }),
    enabled: options.enabled !== false && !!productId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for creating products
 */
export function useCreateProduct(config: ProductCostingClientConfig) {
  const client = useProductCostingClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ProductCreateRequest) => client.createProduct(request),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products', config.organizationId] })
    }
  })
}

/**
 * Hook for updating products
 */
export function useUpdateProduct(config: ProductCostingClientConfig) {
  const client = useProductCostingClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, request }: { productId: string; request: ProductUpdateRequest }) => 
      client.updateProduct(productId, request),
    onSuccess: (data, variables) => {
      // Update cache for specific product
      queryClient.setQueryData(
        ['product', config.organizationId, variables.productId],
        { success: true, data: data.data }
      )
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['products', config.organizationId] })
    }
  })
}

/**
 * Hook for archiving products
 */
export function useArchiveProduct(config: ProductCostingClientConfig) {
  const client = useProductCostingClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (productId: string) => client.archiveProduct(productId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['products', config.organizationId] })
    }
  })
}

/**
 * Hook for managing product BOM
 */
export function useProductBOM(
  config: ProductCostingClientConfig,
  productId: string,
  options: { enabled?: boolean; multiLevel?: boolean } = {}
) {
  const client = useProductCostingClient(config)
  
  return useQuery({
    queryKey: ['product-bom', config.organizationId, productId, options.multiLevel],
    queryFn: () => client.getBOM(productId, { multiLevel: options.multiLevel }),
    enabled: options.enabled !== false && !!productId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for updating product BOM
 */
export function useUpdateBOM(config: ProductCostingClientConfig) {
  const client = useProductCostingClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, components }: { productId: string; components: BOMComponent[] }) => 
      client.updateBOM(productId, components),
    onSuccess: (data, variables) => {
      // Invalidate BOM queries
      queryClient.invalidateQueries({ queryKey: ['product-bom', config.organizationId, variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', config.organizationId, variables.productId] })
    }
  })
}

/**
 * Hook for managing product routing
 */
export function useProductRouting(
  config: ProductCostingClientConfig,
  productId: string,
  options: { enabled?: boolean; includeWorkCenters?: boolean } = {}
) {
  const client = useProductCostingClient(config)
  
  return useQuery({
    queryKey: ['product-routing', config.organizationId, productId, options.includeWorkCenters],
    queryFn: () => client.getRouting(productId, { includeWorkCenters: options.includeWorkCenters }),
    enabled: options.enabled !== false && !!productId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for updating product routing
 */
export function useUpdateRouting(config: ProductCostingClientConfig) {
  const client = useProductCostingClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, activities }: { productId: string; activities: RoutingActivity[] }) => 
      client.updateRouting(productId, activities),
    onSuccess: (data, variables) => {
      // Invalidate routing queries
      queryClient.invalidateQueries({ queryKey: ['product-routing', config.organizationId, variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['product', config.organizationId, variables.productId] })
    }
  })
}

/**
 * Hook for searching products with debounced input
 */
export function useSearchProducts(
  config: ProductCostingClientConfig,
  searchTerm: string,
  filters: Omit<ProductQueryFilters, 'search'> = {},
  debounceMs: number = 300
) {
  const client = useProductCostingClient(config)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])
  
  return useQuery({
    queryKey: ['products-search', config.organizationId, debouncedSearchTerm, filters],
    queryFn: () => client.searchProducts(debouncedSearchTerm, filters),
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a product costing client instance with default configuration
 */
export function createProductCostingClient(organizationId: string, options: Partial<ProductCostingClientConfig> = {}): ProductCostingClient {
  return new ProductCostingClient({
    organizationId,
    ...options
  })
}

/**
 * Calculate total cost from standard cost components
 */
export function calculateTotalCost(components: StandardCostComponents): number {
  return (components.material || 0) + 
         (components.labor || 0) + 
         (components.overhead || 0) + 
         (components.subcontract || 0) + 
         (components.freight || 0) + 
         (components.other || 0)
}

/**
 * Format product code for display
 */
export function formatProductCode(productCode: string, format: 'original' | 'display' = 'original'): string {
  if (format === 'display') {
    return productCode.toUpperCase()
  }
  return productCode
}

/**
 * Get products by type
 */
export function getProductsByType(products: ProductResponse[], productType: string): ProductResponse[] {
  return products.filter(product => product.product_type === productType)
}

/**
 * Check if product has BOM
 */
export function productHasBOM(product: any): boolean {
  return product.bom_components && product.bom_components.length > 0
}

/**
 * Check if product has routing
 */
export function productHasRouting(product: any): boolean {
  return product.routing_activities && product.routing_activities.length > 0
}

export default ProductCostingClient