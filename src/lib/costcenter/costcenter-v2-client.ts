/**
 * HERA Cost Center v2: TypeScript Client SDK
 * 
 * Enterprise-grade TypeScript client for Cost Center v2 API with complete type safety,
 * intelligent error handling, and React hooks integration.
 * 
 * Smart Code: HERA.COSTCENTER.CLIENT.SDK.V2
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type CostCenter,
  type CostCenterCreateRequest,
  type CostCenterUpdateRequest,
  type CostCenterResponse,
  type CostCenterValidationError,
  COST_CENTER_SMART_CODES,
  validateCostCenterCode,
  validateCostCenterType,
  validateValidityDates,
  validateTags
} from './costcenter-v2-standard'
import { applyCostCenterGuardrails } from './costcenter-v2-guardrails'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CostCenterClientConfig {
  baseUrl?: string
  apiVersion?: string
  organizationId: string
  headers?: Record<string, string>
}

export interface CostCenterQueryFilters {
  costCenterId?: string
  parentId?: string
  costCenterType?: string
  view?: 'tree' | 'flat'
  search?: string
  status?: 'ACTIVE' | 'ARCHIVED'
  includeArchived?: boolean
}

export interface CostCenterClientResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  validation_errors?: CostCenterValidationError[]
  audit_txn_id?: string
  smart_code?: string
  timestamp?: string
  count?: number
  view?: string
  filters?: Record<string, any>
}

export interface CostCenterHierarchyNode extends CostCenterResponse {
  children?: CostCenterHierarchyNode[]
  level: number
  path: string[]
  isLeaf: boolean
}

// ============================================================================
// Cost Center Client Class
// ============================================================================

export class CostCenterClient {
  private config: Required<CostCenterClientConfig>

  constructor(config: CostCenterClientConfig) {
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
  ): Promise<CostCenterClientResponse<T>> {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/cost-centers${endpoint}`
    
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
      throw new CostCenterClientError(errorData.error || 'Request failed', errorData.code, response.status)
    }

    return response.json()
  }

  /**
   * Create new cost center
   */
  async createCostCenter(request: CostCenterCreateRequest): Promise<CostCenterClientResponse<CostCenterResponse>> {
    // Client-side validation
    const codeValidation = validateCostCenterCode(request.cc_code)
    if (!codeValidation.valid) {
      throw new CostCenterClientError(
        codeValidation.errors.join(', '),
        'ERR_CC_INVALID_CODE_FORMAT'
      )
    }

    const typeValidation = validateCostCenterType(request.cost_center_type)
    if (!typeValidation.valid) {
      throw new CostCenterClientError(
        typeValidation.errors.join(', '),
        'ERR_CC_INVALID_TYPE'
      )
    }

    if (request.valid_from || request.valid_to) {
      const datesValidation = validateValidityDates(request.valid_from, request.valid_to)
      if (!datesValidation.valid) {
        throw new CostCenterClientError(
          datesValidation.errors.join(', '),
          'ERR_CC_INVALID_VALIDITY_DATES'
        )
      }
    }

    if (request.tags && request.tags.length > 0) {
      const tagsValidation = validateTags(request.tags)
      if (!tagsValidation.valid) {
        throw new CostCenterClientError(
          tagsValidation.errors.join(', '),
          'ERR_CC_INVALID_TAGS'
        )
      }
    }

    return this.request<CostCenterResponse>('', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Update existing cost center
   */
  async updateCostCenter(
    costCenterId: string, 
    request: CostCenterUpdateRequest
  ): Promise<CostCenterClientResponse<CostCenterResponse>> {
    if (request.cc_code) {
      const codeValidation = validateCostCenterCode(request.cc_code)
      if (!codeValidation.valid) {
        throw new CostCenterClientError(
          codeValidation.errors.join(', '),
          'ERR_CC_INVALID_CODE_FORMAT'
        )
      }
    }

    if (request.cost_center_type) {
      const typeValidation = validateCostCenterType(request.cost_center_type)
      if (!typeValidation.valid) {
        throw new CostCenterClientError(
          typeValidation.errors.join(', '),
          'ERR_CC_INVALID_TYPE'
        )
      }
    }

    return this.request<CostCenterResponse>('', {
      method: 'PUT',
      body: JSON.stringify({ ...request, cost_center_id: costCenterId })
    })
  }

  /**
   * Get cost centers with filtering
   */
  async getCostCenters(filters: CostCenterQueryFilters = {}): Promise<CostCenterClientResponse<CostCenterResponse[]>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<CostCenterResponse[]>(query)
  }

  /**
   * Get single cost center by ID
   */
  async getCostCenter(costCenterId: string): Promise<CostCenterClientResponse<CostCenterResponse>> {
    const response = await this.getCostCenters({ costCenterId })
    if (response.data && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0]!
      }
    }
    throw new CostCenterClientError('Cost center not found', 'ERR_CC_PARENT_NOT_FOUND', 404)
  }

  /**
   * Archive cost center
   */
  async archiveCostCenter(costCenterId: string): Promise<CostCenterClientResponse<void>> {
    return this.request<void>(`?cost_center_id=${costCenterId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get cost centers in hierarchical tree structure
   */
  async getCostCentersTree(filters: Omit<CostCenterQueryFilters, 'view'> = {}): Promise<CostCenterClientResponse<CostCenterHierarchyNode[]>> {
    const response = await this.getCostCenters({ ...filters, view: 'tree' })
    if (!response.success || !response.data) {
      return response as CostCenterClientResponse<CostCenterHierarchyNode[]>
    }

    const tree = this.buildHierarchyTree(response.data)
    return {
      ...response,
      data: tree
    }
  }

  /**
   * Build hierarchical tree from flat cost center list
   */
  private buildHierarchyTree(costCenters: CostCenterResponse[]): CostCenterHierarchyNode[] {
    const costCenterMap = new Map<string, CostCenterHierarchyNode>()
    const rootCostCenters: CostCenterHierarchyNode[] = []

    // Convert to hierarchy nodes
    costCenters.forEach(costCenter => {
      const node: CostCenterHierarchyNode = {
        ...costCenter,
        children: [],
        level: costCenter.depth,
        path: costCenter.cc_code.split('.'),
        isLeaf: true // Will be updated if children are found
      }
      costCenterMap.set(costCenter.id, node)
    })

    // Build hierarchy
    costCenters.forEach(costCenter => {
      const node = costCenterMap.get(costCenter.id)!
      
      if (costCenter.parent_id && costCenterMap.has(costCenter.parent_id)) {
        const parent = costCenterMap.get(costCenter.parent_id)!
        parent.children!.push(node)
        parent.isLeaf = false // Parent has children
      } else {
        rootCostCenters.push(node)
      }
    })

    // Sort by cost center code
    const sortByCCCode = (a: CostCenterHierarchyNode, b: CostCenterHierarchyNode) => {
      return a.cc_code.localeCompare(b.cc_code, undefined, { numeric: true })
    }

    rootCostCenters.sort(sortByCCCode)
    rootCostCenters.forEach(root => this.sortTreeRecursively(root, sortByCCCode))

    return rootCostCenters
  }

  /**
   * Recursively sort tree nodes
   */
  private sortTreeRecursively(
    node: CostCenterHierarchyNode, 
    sortFn: (a: CostCenterHierarchyNode, b: CostCenterHierarchyNode) => number
  ) {
    if (node.children && node.children.length > 0) {
      node.children.sort(sortFn)
      node.children.forEach(child => this.sortTreeRecursively(child, sortFn))
    }
  }

  /**
   * Batch create multiple cost centers
   */
  async batchCreateCostCenters(requests: CostCenterCreateRequest[]): Promise<CostCenterClientResponse<CostCenterResponse[]>> {
    const results: CostCenterResponse[] = []
    const errors: Array<{ index: number; error: string }> = []

    for (let i = 0; i < requests.length; i++) {
      try {
        const response = await this.createCostCenter(requests[i]!)
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
        code: 'ERR_CC_BATCH_FAILED',
        message: `Cost center ${e.index + 1}: ${e.error}`,
        field: 'batch_operation',
        value: e.index
      }))
    }
  }

  /**
   * Search cost centers by name, code, or type
   */
  async searchCostCenters(
    searchTerm: string, 
    filters: Omit<CostCenterQueryFilters, 'search'> = {}
  ): Promise<CostCenterClientResponse<CostCenterResponse[]>> {
    const response = await this.getCostCenters({ 
      ...filters, 
      search: searchTerm,
      view: 'flat' // Use flat view for better search performance
    })
    
    if (response.success && response.data) {
      // Additional client-side filtering for fuzzy search
      const filtered = response.data.filter(costCenter => 
        costCenter.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        costCenter.cc_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        costCenter.cost_center_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        costCenter.responsible_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        costCenter.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      
      return {
        ...response,
        data: filtered
      }
    }
    
    return response
  }

  /**
   * Get cost center descendants (children and grandchildren)
   */
  async getCostCenterDescendants(costCenterId: string): Promise<CostCenterClientResponse<CostCenterResponse[]>> {
    const tree = await this.getCostCentersTree()
    if (!tree.success || !tree.data) {
      return tree as CostCenterClientResponse<CostCenterResponse[]>
    }

    const descendants: CostCenterResponse[] = []
    
    const findAndCollectDescendants = (nodes: CostCenterHierarchyNode[]) => {
      for (const node of nodes) {
        if (node.id === costCenterId) {
          this.collectAllDescendants(node, descendants)
          break
        }
        if (node.children && node.children.length > 0) {
          findAndCollectDescendants(node.children)
        }
      }
    }

    findAndCollectDescendants(tree.data)

    return {
      success: true,
      data: descendants,
      count: descendants.length,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Collect all descendants recursively
   */
  private collectAllDescendants(node: CostCenterHierarchyNode, results: CostCenterResponse[]) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        results.push(child)
        this.collectAllDescendants(child, results)
      }
    }
  }

  /**
   * Validate cost center data without creating/updating
   */
  async validateCostCenter(
    operation: 'create' | 'update',
    data: CostCenterCreateRequest | CostCenterUpdateRequest,
    existingCostCenters: CostCenter[] = []
  ): Promise<CostCenterClientResponse<{ valid: boolean; errors: CostCenterValidationError[] }>> {
    return this.request<{ valid: boolean; errors: CostCenterValidationError[] }>('', {
      method: 'OPTIONS',
      body: JSON.stringify({
        operation,
        data,
        existing_cost_centers: existingCostCenters
      })
    })
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class CostCenterClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public validationErrors?: CostCenterValidationError[]
  ) {
    super(message)
    this.name = 'CostCenterClientError'
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook for managing cost center client instance
 */
export function useCostCenterClient(config: CostCenterClientConfig) {
  const [client] = useState(() => new CostCenterClient(config))
  
  useEffect(() => {
    // Update client config if organizationId changes
    client['config'].organizationId = config.organizationId
    client['config'].headers['x-hera-organization-id'] = config.organizationId
  }, [config.organizationId, client])
  
  return client
}

/**
 * Hook for fetching cost centers
 */
export function useCostCenters(
  config: CostCenterClientConfig,
  filters: CostCenterQueryFilters = {},
  options: { enabled?: boolean } = {}
) {
  const client = useCostCenterClient(config)
  
  return useQuery({
    queryKey: ['cost-centers', config.organizationId, filters],
    queryFn: () => client.getCostCenters(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching cost centers tree
 */
export function useCostCentersTree(
  config: CostCenterClientConfig,
  filters: Omit<CostCenterQueryFilters, 'view'> = {},
  options: { enabled?: boolean } = {}
) {
  const client = useCostCenterClient(config)
  
  return useQuery({
    queryKey: ['cost-centers-tree', config.organizationId, filters],
    queryFn: () => client.getCostCentersTree(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching single cost center
 */
export function useCostCenter(
  config: CostCenterClientConfig,
  costCenterId: string,
  options: { enabled?: boolean } = {}
) {
  const client = useCostCenterClient(config)
  
  return useQuery({
    queryKey: ['cost-center', config.organizationId, costCenterId],
    queryFn: () => client.getCostCenter(costCenterId),
    enabled: options.enabled !== false && !!costCenterId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for creating cost centers
 */
export function useCreateCostCenter(config: CostCenterClientConfig) {
  const client = useCostCenterClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: CostCenterCreateRequest) => client.createCostCenter(request),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['cost-centers', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['cost-centers-tree', config.organizationId] })
    }
  })
}

/**
 * Hook for updating cost centers
 */
export function useUpdateCostCenter(config: CostCenterClientConfig) {
  const client = useCostCenterClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ costCenterId, request }: { costCenterId: string; request: CostCenterUpdateRequest }) => 
      client.updateCostCenter(costCenterId, request),
    onSuccess: (data, variables) => {
      // Update cache for specific cost center
      queryClient.setQueryData(
        ['cost-center', config.organizationId, variables.costCenterId],
        { success: true, data: data.data }
      )
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['cost-centers', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['cost-centers-tree', config.organizationId] })
    }
  })
}

/**
 * Hook for archiving cost centers
 */
export function useArchiveCostCenter(config: CostCenterClientConfig) {
  const client = useCostCenterClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (costCenterId: string) => client.archiveCostCenter(costCenterId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['cost-centers', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['cost-centers-tree', config.organizationId] })
    }
  })
}

/**
 * Hook for searching cost centers with debounced input
 */
export function useSearchCostCenters(
  config: CostCenterClientConfig,
  searchTerm: string,
  filters: Omit<CostCenterQueryFilters, 'search'> = {},
  debounceMs: number = 300
) {
  const client = useCostCenterClient(config)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])
  
  return useQuery({
    queryKey: ['cost-centers-search', config.organizationId, debouncedSearchTerm, filters],
    queryFn: () => client.searchCostCenters(debouncedSearchTerm, filters),
    enabled: debouncedSearchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a cost center client instance with default configuration
 */
export function createCostCenterClient(organizationId: string, options: Partial<CostCenterClientConfig> = {}): CostCenterClient {
  return new CostCenterClient({
    organizationId,
    ...options
  })
}

/**
 * Format cost center code for display
 */
export function formatCostCenterCode(ccCode: string, format: 'original' | 'display' = 'original'): string {
  if (format === 'display') {
    return ccCode.toUpperCase()
  }
  return ccCode
}

/**
 * Get cost center type display name
 */
export function getCostCenterTypeDisplayName(type: string): string {
  const typeNames: Record<string, string> = {
    'ADMIN': 'Administration',
    'PRODUCTION': 'Production',
    'SALES': 'Sales & Marketing',
    'SERVICE': 'Customer Service',
    'FINANCE': 'Finance',
    'HR': 'Human Resources',
    'IT': 'Information Technology',
    'FACILITY': 'Facilities',
    'R_AND_D': 'Research & Development'
  }
  return typeNames[type] || type
}

/**
 * Check if cost center is a parent (has children)
 */
export function isParentCostCenter(costCenter: CostCenterHierarchyNode): boolean {
  return !costCenter.isLeaf
}

/**
 * Get all leaf cost centers from tree
 */
export function getLeafCostCenters(tree: CostCenterHierarchyNode[]): CostCenterHierarchyNode[] {
  const leaves: CostCenterHierarchyNode[] = []
  
  const traverse = (nodes: CostCenterHierarchyNode[]) => {
    nodes.forEach(node => {
      if (node.isLeaf) {
        leaves.push(node)
      } else if (node.children) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return leaves
}

/**
 * Check if cost center is valid for a given date
 */
export function isCostCenterValidForDate(costCenter: CostCenterResponse, date: Date = new Date()): boolean {
  const dateStr = date.toISOString().split('T')[0]
  
  if (costCenter.status !== 'ACTIVE') {
    return false
  }
  
  if (costCenter.valid_from && dateStr < costCenter.valid_from) {
    return false
  }
  
  if (costCenter.valid_to && dateStr > costCenter.valid_to) {
    return false
  }
  
  return true
}

/**
 * Generate cost center hierarchy breadcrumbs
 */
export function getCostCenterBreadcrumbs(
  costCenter: CostCenterHierarchyNode, 
  tree: CostCenterHierarchyNode[]
): { id: string; name: string; code: string }[] {
  const breadcrumbs: { id: string; name: string; code: string }[] = []
  
  // Find path to root
  const findPath = (nodes: CostCenterHierarchyNode[], targetId: string, currentPath: CostCenterHierarchyNode[]): boolean => {
    for (const node of nodes) {
      const newPath = [...currentPath, node]
      
      if (node.id === targetId) {
        breadcrumbs.push(...newPath.map(n => ({ 
          id: n.id, 
          name: n.entity_name, 
          code: n.cc_code 
        })))
        return true
      }
      
      if (node.children && findPath(node.children, targetId, newPath)) {
        return true
      }
    }
    return false
  }
  
  findPath(tree, costCenter.id, [])
  return breadcrumbs
}

export default CostCenterClient