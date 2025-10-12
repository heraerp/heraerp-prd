/**
 * HERA Profit Center v2: TypeScript Client SDK
 * 
 * Enterprise-grade TypeScript client for Profit Center v2 API with complete type safety,
 * IFRS 8 (CODM) support, intelligent error handling, and React hooks integration.
 * 
 * Smart Code: HERA.PROFITCENTER.CLIENT.SDK.V2
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type ProfitCenter,
  type ProfitCenterCreateRequest,
  type ProfitCenterUpdateRequest,
  type ProfitCenterResponse,
  type ProfitCenterValidationError,
  PROFIT_CENTER_SMART_CODES,
  validateProfitCenterCode,
  validateSegmentCode,
  validateValidityDates,
  validateTags
} from './profitcenter-v2-standard'
import { applyProfitCenterGuardrails } from './profitcenter-v2-guardrails'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ProfitCenterClientConfig {
  baseUrl?: string
  apiVersion?: string
  organizationId: string
  headers?: Record<string, string>
}

export interface ProfitCenterQueryFilters {
  profitCenterId?: string
  parentId?: string
  segmentCode?: string
  view?: 'tree' | 'flat'
  search?: string
  status?: 'ACTIVE' | 'ARCHIVED'
  includeArchived?: boolean
  codmOnly?: boolean
}

export interface ProfitCenterClientResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  validation_errors?: ProfitCenterValidationError[]
  audit_txn_id?: string
  smart_code?: string
  timestamp?: string
  count?: number
  view?: string
  filters?: Record<string, any>
}

export interface ProfitCenterHierarchyNode extends ProfitCenterResponse {
  children?: ProfitCenterHierarchyNode[]
  level: number
  path: string[]
  isLeaf: boolean
  isCODMEligible: boolean
}

export interface CODMSegmentSummary {
  segment_code: string
  profit_center_count: number
  total_revenue: number
  total_expenses: number
  operating_profit: number
}

// ============================================================================
// Profit Center Client Class
// ============================================================================

export class ProfitCenterClient {
  private config: Required<ProfitCenterClientConfig>

  constructor(config: ProfitCenterClientConfig) {
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
  ): Promise<ProfitCenterClientResponse<T>> {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/profit-centers${endpoint}`
    
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
      throw new ProfitCenterClientError(errorData.error || 'Request failed', errorData.code, response.status)
    }

    return response.json()
  }

  /**
   * Create new profit center
   */
  async createProfitCenter(request: ProfitCenterCreateRequest): Promise<ProfitCenterClientResponse<ProfitCenterResponse>> {
    // Client-side validation
    const codeValidation = validateProfitCenterCode(request.pc_code)
    if (!codeValidation.valid) {
      throw new ProfitCenterClientError(
        codeValidation.errors.join(', '),
        'ERR_PC_INVALID_CODE_FORMAT'
      )
    }

    if (request.segment_code) {
      const segmentValidation = validateSegmentCode(request.segment_code)
      if (!segmentValidation.valid) {
        throw new ProfitCenterClientError(
          segmentValidation.errors.join(', '),
          'ERR_PC_INVALID_SEGMENT_CODE'
        )
      }
    }

    if (request.valid_from || request.valid_to) {
      const datesValidation = validateValidityDates(request.valid_from, request.valid_to)
      if (!datesValidation.valid) {
        throw new ProfitCenterClientError(
          datesValidation.errors.join(', '),
          'ERR_PC_INVALID_VALIDITY_DATES'
        )
      }
    }

    if (request.tags && request.tags.length > 0) {
      const tagsValidation = validateTags(request.tags)
      if (!tagsValidation.valid) {
        throw new ProfitCenterClientError(
          tagsValidation.errors.join(', '),
          'ERR_PC_INVALID_TAGS'
        )
      }
    }

    // CODM validation
    if (request.codm_inclusion === true && !request.segment_code) {
      throw new ProfitCenterClientError(
        'CODM inclusion requires valid segment mapping',
        'ERR_PC_CODM_MAPPING_REQUIRED'
      )
    }

    return this.request<ProfitCenterResponse>('', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Update existing profit center
   */
  async updateProfitCenter(
    profitCenterId: string, 
    request: ProfitCenterUpdateRequest
  ): Promise<ProfitCenterClientResponse<ProfitCenterResponse>> {
    if (request.pc_code) {
      const codeValidation = validateProfitCenterCode(request.pc_code)
      if (!codeValidation.valid) {
        throw new ProfitCenterClientError(
          codeValidation.errors.join(', '),
          'ERR_PC_INVALID_CODE_FORMAT'
        )
      }
    }

    if (request.segment_code !== undefined) {
      const segmentValidation = validateSegmentCode(request.segment_code)
      if (!segmentValidation.valid) {
        throw new ProfitCenterClientError(
          segmentValidation.errors.join(', '),
          'ERR_PC_INVALID_SEGMENT_CODE'
        )
      }
    }

    return this.request<ProfitCenterResponse>('', {
      method: 'PUT',
      body: JSON.stringify({ ...request, profit_center_id: profitCenterId })
    })
  }

  /**
   * Get profit centers with filtering
   */
  async getProfitCenters(filters: ProfitCenterQueryFilters = {}): Promise<ProfitCenterClientResponse<ProfitCenterResponse[]>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<ProfitCenterResponse[]>(query)
  }

  /**
   * Get single profit center by ID
   */
  async getProfitCenter(profitCenterId: string): Promise<ProfitCenterClientResponse<ProfitCenterResponse>> {
    const response = await this.getProfitCenters({ profitCenterId })
    if (response.data && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0]!
      }
    }
    throw new ProfitCenterClientError('Profit center not found', 'ERR_PC_PARENT_NOT_FOUND', 404)
  }

  /**
   * Archive profit center
   */
  async archiveProfitCenter(profitCenterId: string): Promise<ProfitCenterClientResponse<void>> {
    return this.request<void>(`?profit_center_id=${profitCenterId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get profit centers in hierarchical tree structure
   */
  async getProfitCentersTree(filters: Omit<ProfitCenterQueryFilters, 'view'> = {}): Promise<ProfitCenterClientResponse<ProfitCenterHierarchyNode[]>> {
    const response = await this.getProfitCenters({ ...filters, view: 'tree' })
    if (!response.success || !response.data) {
      return response as ProfitCenterClientResponse<ProfitCenterHierarchyNode[]>
    }

    const tree = this.buildHierarchyTree(response.data)
    return {
      ...response,
      data: tree
    }
  }

  /**
   * Get CODM-eligible profit centers only
   */
  async getCODMProfitCenters(filters: Omit<ProfitCenterQueryFilters, 'codmOnly'> = {}): Promise<ProfitCenterClientResponse<ProfitCenterResponse[]>> {
    return this.getProfitCenters({ ...filters, codmOnly: true })
  }

  /**
   * Get CODM segment summary
   */
  async getCODMSegmentSummary(segmentCode?: string): Promise<ProfitCenterClientResponse<CODMSegmentSummary[]>> {
    // This would call a specialized CODM endpoint if available
    // For now, we'll aggregate from profit center data
    const response = await this.getCODMProfitCenters()
    
    if (!response.success || !response.data) {
      return response as ProfitCenterClientResponse<CODMSegmentSummary[]>
    }

    const segmentSummary: Record<string, CODMSegmentSummary> = {}
    
    response.data.forEach(pc => {
      const segment = pc.segment_code || 'UNASSIGNED'
      if (!segmentSummary[segment]) {
        segmentSummary[segment] = {
          segment_code: segment,
          profit_center_count: 0,
          total_revenue: 0,
          total_expenses: 0,
          operating_profit: 0
        }
      }
      segmentSummary[segment].profit_center_count++
      // Note: Revenue/expense data would come from actual financial transactions
    })

    const summaryArray = Object.values(segmentSummary)
    
    if (segmentCode) {
      const filtered = summaryArray.filter(s => s.segment_code === segmentCode)
      return {
        success: true,
        data: filtered,
        count: filtered.length,
        timestamp: new Date().toISOString()
      }
    }

    return {
      success: true,
      data: summaryArray,
      count: summaryArray.length,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Build hierarchical tree from flat profit center list
   */
  private buildHierarchyTree(profitCenters: ProfitCenterResponse[]): ProfitCenterHierarchyNode[] {
    const profitCenterMap = new Map<string, ProfitCenterHierarchyNode>()
    const rootProfitCenters: ProfitCenterHierarchyNode[] = []

    // Convert to hierarchy nodes
    profitCenters.forEach(profitCenter => {
      const node: ProfitCenterHierarchyNode = {
        ...profitCenter,
        children: [],
        level: profitCenter.depth,
        path: profitCenter.pc_code.split('.'),
        isLeaf: true,
        isCODMEligible: profitCenter.codm_inclusion === true && !!profitCenter.segment_code
      }
      profitCenterMap.set(profitCenter.id, node)
    })

    // Build hierarchy
    profitCenters.forEach(profitCenter => {
      const node = profitCenterMap.get(profitCenter.id)!
      
      if (profitCenter.parent_id && profitCenterMap.has(profitCenter.parent_id)) {
        const parent = profitCenterMap.get(profitCenter.parent_id)!
        parent.children!.push(node)
        parent.isLeaf = false
      } else {
        rootProfitCenters.push(node)
      }
    })

    // Sort by profit center code
    const sortByPCCode = (a: ProfitCenterHierarchyNode, b: ProfitCenterHierarchyNode) => {
      return a.pc_code.localeCompare(b.pc_code, undefined, { numeric: true })
    }

    rootProfitCenters.sort(sortByPCCode)
    rootProfitCenters.forEach(root => this.sortTreeRecursively(root, sortByPCCode))

    return rootProfitCenters
  }

  /**
   * Recursively sort tree nodes
   */
  private sortTreeRecursively(
    node: ProfitCenterHierarchyNode, 
    sortFn: (a: ProfitCenterHierarchyNode, b: ProfitCenterHierarchyNode) => number
  ) {
    if (node.children && node.children.length > 0) {
      node.children.sort(sortFn)
      node.children.forEach(child => this.sortTreeRecursively(child, sortFn))
    }
  }

  /**
   * Batch create multiple profit centers
   */
  async batchCreateProfitCenters(requests: ProfitCenterCreateRequest[]): Promise<ProfitCenterClientResponse<ProfitCenterResponse[]>> {
    const results: ProfitCenterResponse[] = []
    const errors: Array<{ index: number; error: string }> = []

    for (let i = 0; i < requests.length; i++) {
      try {
        const response = await this.createProfitCenter(requests[i]!)
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
        code: 'ERR_PC_BATCH_FAILED',
        message: `Profit center ${e.index + 1}: ${e.error}`,
        field: 'batch_operation',
        value: e.index
      }))
    }
  }

  /**
   * Search profit centers by name, code, segment, or manager
   */
  async searchProfitCenters(
    searchTerm: string, 
    filters: Omit<ProfitCenterQueryFilters, 'search'> = {}
  ): Promise<ProfitCenterClientResponse<ProfitCenterResponse[]>> {
    const response = await this.getProfitCenters({ 
      ...filters, 
      search: searchTerm,
      view: 'flat'
    })
    
    if (response.success && response.data) {
      // Additional client-side filtering for fuzzy search
      const filtered = response.data.filter(profitCenter => 
        profitCenter.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profitCenter.pc_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profitCenter.segment_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profitCenter.manager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profitCenter.region_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profitCenter.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      
      return {
        ...response,
        data: filtered
      }
    }
    
    return response
  }

  /**
   * Get profit center descendants (children and grandchildren)
   */
  async getProfitCenterDescendants(profitCenterId: string): Promise<ProfitCenterClientResponse<ProfitCenterResponse[]>> {
    const tree = await this.getProfitCentersTree()
    if (!tree.success || !tree.data) {
      return tree as ProfitCenterClientResponse<ProfitCenterResponse[]>
    }

    const descendants: ProfitCenterResponse[] = []
    
    const findAndCollectDescendants = (nodes: ProfitCenterHierarchyNode[]) => {
      for (const node of nodes) {
        if (node.id === profitCenterId) {
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
  private collectAllDescendants(node: ProfitCenterHierarchyNode, results: ProfitCenterResponse[]) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        results.push(child)
        this.collectAllDescendants(child, results)
      }
    }
  }

  /**
   * Validate profit center data without creating/updating
   */
  async validateProfitCenter(
    operation: 'create' | 'update',
    data: ProfitCenterCreateRequest | ProfitCenterUpdateRequest,
    existingProfitCenters: ProfitCenter[] = []
  ): Promise<ProfitCenterClientResponse<{ valid: boolean; errors: ProfitCenterValidationError[] }>> {
    return this.request<{ valid: boolean; errors: ProfitCenterValidationError[] }>('', {
      method: 'OPTIONS',
      body: JSON.stringify({
        operation,
        data,
        existing_profit_centers: existingProfitCenters
      })
    })
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class ProfitCenterClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public validationErrors?: ProfitCenterValidationError[]
  ) {
    super(message)
    this.name = 'ProfitCenterClientError'
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook for managing profit center client instance
 */
export function useProfitCenterClient(config: ProfitCenterClientConfig) {
  const [client] = useState(() => new ProfitCenterClient(config))
  
  useEffect(() => {
    // Update client config if organizationId changes
    client['config'].organizationId = config.organizationId
    client['config'].headers['x-hera-organization-id'] = config.organizationId
  }, [config.organizationId, client])
  
  return client
}

/**
 * Hook for fetching profit centers
 */
export function useProfitCenters(
  config: ProfitCenterClientConfig,
  filters: ProfitCenterQueryFilters = {},
  options: { enabled?: boolean } = {}
) {
  const client = useProfitCenterClient(config)
  
  return useQuery({
    queryKey: ['profit-centers', config.organizationId, filters],
    queryFn: () => client.getProfitCenters(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching profit centers tree
 */
export function useProfitCentersTree(
  config: ProfitCenterClientConfig,
  filters: Omit<ProfitCenterQueryFilters, 'view'> = {},
  options: { enabled?: boolean } = {}
) {
  const client = useProfitCenterClient(config)
  
  return useQuery({
    queryKey: ['profit-centers-tree', config.organizationId, filters],
    queryFn: () => client.getProfitCentersTree(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching CODM profit centers
 */
export function useCODMProfitCenters(
  config: ProfitCenterClientConfig,
  filters: Omit<ProfitCenterQueryFilters, 'codmOnly'> = {},
  options: { enabled?: boolean } = {}
) {
  const client = useProfitCenterClient(config)
  
  return useQuery({
    queryKey: ['codm-profit-centers', config.organizationId, filters],
    queryFn: () => client.getCODMProfitCenters(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching single profit center
 */
export function useProfitCenter(
  config: ProfitCenterClientConfig,
  profitCenterId: string,
  options: { enabled?: boolean } = {}
) {
  const client = useProfitCenterClient(config)
  
  return useQuery({
    queryKey: ['profit-center', config.organizationId, profitCenterId],
    queryFn: () => client.getProfitCenter(profitCenterId),
    enabled: options.enabled !== false && !!profitCenterId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for creating profit centers
 */
export function useCreateProfitCenter(config: ProfitCenterClientConfig) {
  const client = useProfitCenterClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ProfitCenterCreateRequest) => client.createProfitCenter(request),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profit-centers', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['profit-centers-tree', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['codm-profit-centers', config.organizationId] })
    }
  })
}

/**
 * Hook for updating profit centers
 */
export function useUpdateProfitCenter(config: ProfitCenterClientConfig) {
  const client = useProfitCenterClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ profitCenterId, request }: { profitCenterId: string; request: ProfitCenterUpdateRequest }) => 
      client.updateProfitCenter(profitCenterId, request),
    onSuccess: (data, variables) => {
      // Update cache for specific profit center
      queryClient.setQueryData(
        ['profit-center', config.organizationId, variables.profitCenterId],
        { success: true, data: data.data }
      )
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['profit-centers', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['profit-centers-tree', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['codm-profit-centers', config.organizationId] })
    }
  })
}

/**
 * Hook for archiving profit centers
 */
export function useArchiveProfitCenter(config: ProfitCenterClientConfig) {
  const client = useProfitCenterClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (profitCenterId: string) => client.archiveProfitCenter(profitCenterId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profit-centers', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['profit-centers-tree', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['codm-profit-centers', config.organizationId] })
    }
  })
}

/**
 * Hook for searching profit centers with debounced input
 */
export function useSearchProfitCenters(
  config: ProfitCenterClientConfig,
  searchTerm: string,
  filters: Omit<ProfitCenterQueryFilters, 'search'> = {},
  debounceMs: number = 300
) {
  const client = useProfitCenterClient(config)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])
  
  return useQuery({
    queryKey: ['profit-centers-search', config.organizationId, debouncedSearchTerm, filters],
    queryFn: () => client.searchProfitCenters(debouncedSearchTerm, filters),
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for CODM segment summary
 */
export function useCODMSegmentSummary(
  config: ProfitCenterClientConfig,
  segmentCode?: string,
  options: { enabled?: boolean } = {}
) {
  const client = useProfitCenterClient(config)
  
  return useQuery({
    queryKey: ['codm-segment-summary', config.organizationId, segmentCode],
    queryFn: () => client.getCODMSegmentSummary(segmentCode),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a profit center client instance with default configuration
 */
export function createProfitCenterClient(organizationId: string, options: Partial<ProfitCenterClientConfig> = {}): ProfitCenterClient {
  return new ProfitCenterClient({
    organizationId,
    ...options
  })
}

/**
 * Format profit center code for display
 */
export function formatProfitCenterCode(pcCode: string, format: 'original' | 'display' = 'original'): string {
  if (format === 'display') {
    return pcCode.toUpperCase()
  }
  return pcCode
}

/**
 * Check if profit center is a parent (has children)
 */
export function isParentProfitCenter(profitCenter: ProfitCenterHierarchyNode): boolean {
  return !profitCenter.isLeaf
}

/**
 * Get all leaf profit centers from tree
 */
export function getLeafProfitCenters(tree: ProfitCenterHierarchyNode[]): ProfitCenterHierarchyNode[] {
  const leaves: ProfitCenterHierarchyNode[] = []
  
  const traverse = (nodes: ProfitCenterHierarchyNode[]) => {
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
 * Get all CODM-eligible profit centers from tree
 */
export function getCODMEligibleProfitCenters(tree: ProfitCenterHierarchyNode[]): ProfitCenterHierarchyNode[] {
  const codmEligible: ProfitCenterHierarchyNode[] = []
  
  const traverse = (nodes: ProfitCenterHierarchyNode[]) => {
    nodes.forEach(node => {
      if (node.isCODMEligible) {
        codmEligible.push(node)
      }
      if (node.children) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return codmEligible
}

/**
 * Check if profit center is valid for a given date
 */
export function isProfitCenterValidForDate(profitCenter: ProfitCenterResponse, date: Date = new Date()): boolean {
  const dateStr = date.toISOString().split('T')[0]
  
  if (profitCenter.status !== 'ACTIVE') {
    return false
  }
  
  if (profitCenter.valid_from && dateStr < profitCenter.valid_from) {
    return false
  }
  
  if (profitCenter.valid_to && dateStr > profitCenter.valid_to) {
    return false
  }
  
  return true
}

/**
 * Generate profit center hierarchy breadcrumbs
 */
export function getProfitCenterBreadcrumbs(
  profitCenter: ProfitCenterHierarchyNode, 
  tree: ProfitCenterHierarchyNode[]
): { id: string; name: string; code: string; segment?: string }[] {
  const breadcrumbs: { id: string; name: string; code: string; segment?: string }[] = []
  
  // Find path to root
  const findPath = (nodes: ProfitCenterHierarchyNode[], targetId: string, currentPath: ProfitCenterHierarchyNode[]): boolean => {
    for (const node of nodes) {
      const newPath = [...currentPath, node]
      
      if (node.id === targetId) {
        breadcrumbs.push(...newPath.map(n => ({ 
          id: n.id, 
          name: n.entity_name, 
          code: n.pc_code,
          segment: n.segment_code
        })))
        return true
      }
      
      if (node.children && findPath(node.children, targetId, newPath)) {
        return true
      }
    }
    return false
  }
  
  findPath(tree, profitCenter.id, [])
  return breadcrumbs
}

/**
 * Group profit centers by segment for CODM reporting
 */
export function groupProfitCentersBySegment(profitCenters: ProfitCenterResponse[]): Record<string, ProfitCenterResponse[]> {
  const grouped: Record<string, ProfitCenterResponse[]> = {}
  
  profitCenters.forEach(pc => {
    const segment = pc.segment_code || 'UNASSIGNED'
    if (!grouped[segment]) {
      grouped[segment] = []
    }
    grouped[segment].push(pc)
  })
  
  return grouped
}

export default ProfitCenterClient