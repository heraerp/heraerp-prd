/**
 * HERA COA v2: TypeScript Client SDK
 * 
 * Enterprise-grade TypeScript client for COA v2 API with complete type safety,
 * intelligent error handling, and React hooks integration.
 * 
 * Smart Code: HERA.FIN.COA.CLIENT.SDK.V2
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  type COAAccount,
  type COACreateRequest,
  type COAUpdateRequest,
  type COAResponse,
  type COAValidationError,
  COA_SMART_CODES,
  validateAccountNumber,
  validateIFRSTags
} from './coa-v2-standard'
import { applyCOAGuardrails } from './coa-v2-guardrails'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface COAClientConfig {
  baseUrl?: string
  apiVersion?: string
  organizationId: string
  headers?: Record<string, string>
}

export interface COAQueryFilters {
  accountId?: string
  parentId?: string
  range?: string // e.g., "4xxx"
  isPostable?: boolean
  includeArchived?: boolean
  searchTerm?: string
}

export interface COAClientResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  validation_errors?: COAValidationError[]
  audit_txn_id?: string
  smart_code?: string
  timestamp?: string
}

export interface COAHierarchyNode extends COAResponse {
  children?: COAHierarchyNode[]
  level: number
  path: string[]
}

// ============================================================================
// COA Client Class
// ============================================================================

export class COAClient {
  private config: Required<COAClientConfig>

  constructor(config: COAClientConfig) {
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
  ): Promise<COAClientResponse<T>> {
    const url = `${this.config.baseUrl}/${this.config.apiVersion}/coa${endpoint}`
    
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
      throw new COAClientError(errorData.error || 'Request failed', errorData.code, response.status)
    }

    return response.json()
  }

  /**
   * Create new COA account
   */
  async createAccount(request: COACreateRequest): Promise<COAClientResponse<COAResponse>> {
    // Client-side validation
    const numberValidation = validateAccountNumber(request.account_number)
    if (!numberValidation.valid) {
      throw new COAClientError(
        numberValidation.errors.join(', '),
        'ERR_COA_INVALID_NUMBER_FORMAT'
      )
    }

    if (request.is_postable) {
      const tagsValidation = validateIFRSTags(request.ifrs_tags)
      if (!tagsValidation.valid) {
        throw new COAClientError(
          tagsValidation.errors.join(', '),
          'ERR_COA_MISSING_IFRS_TAGS'
        )
      }
    }

    return this.request<COAResponse>('', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Update existing COA account
   */
  async updateAccount(
    accountId: string, 
    request: COAUpdateRequest
  ): Promise<COAClientResponse<COAResponse>> {
    if (request.account_number) {
      const numberValidation = validateAccountNumber(request.account_number)
      if (!numberValidation.valid) {
        throw new COAClientError(
          numberValidation.errors.join(', '),
          'ERR_COA_INVALID_NUMBER_FORMAT'
        )
      }
    }

    return this.request<COAResponse>('', {
      method: 'PUT',
      body: JSON.stringify({ ...request, account_id: accountId })
    })
  }

  /**
   * Get COA accounts with filtering
   */
  async getAccounts(filters: COAQueryFilters = {}): Promise<COAClientResponse<COAResponse[]>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<COAResponse[]>(query)
  }

  /**
   * Get single COA account by ID
   */
  async getAccount(accountId: string): Promise<COAClientResponse<COAResponse>> {
    const response = await this.getAccounts({ accountId })
    if (response.data && response.data.length > 0) {
      return {
        ...response,
        data: response.data[0]!
      }
    }
    throw new COAClientError('Account not found', 'ERR_COA_PARENT_NOT_FOUND', 404)
  }

  /**
   * Archive COA account
   */
  async archiveAccount(accountId: string): Promise<COAClientResponse<void>> {
    return this.request<void>(`?account_id=${accountId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get COA accounts in hierarchical tree structure
   */
  async getAccountsTree(filters: COAQueryFilters = {}): Promise<COAClientResponse<COAHierarchyNode[]>> {
    const response = await this.getAccounts(filters)
    if (!response.success || !response.data) {
      return response as COAClientResponse<COAHierarchyNode[]>
    }

    const tree = this.buildHierarchyTree(response.data)
    return {
      ...response,
      data: tree
    }
  }

  /**
   * Build hierarchical tree from flat account list
   */
  private buildHierarchyTree(accounts: COAResponse[]): COAHierarchyNode[] {
    const accountMap = new Map<string, COAHierarchyNode>()
    const rootAccounts: COAHierarchyNode[] = []

    // Convert to hierarchy nodes
    accounts.forEach(account => {
      const node: COAHierarchyNode = {
        ...account,
        children: [],
        level: account.depth,
        path: account.account_number.split('.')
      }
      accountMap.set(account.account_id, node)
    })

    // Build hierarchy
    accounts.forEach(account => {
      const node = accountMap.get(account.account_id)!
      
      if (account.parent_id && accountMap.has(account.parent_id)) {
        const parent = accountMap.get(account.parent_id)!
        parent.children!.push(node)
      } else {
        rootAccounts.push(node)
      }
    })

    // Sort by account number
    const sortByAccountNumber = (a: COAHierarchyNode, b: COAHierarchyNode) => {
      return a.account_number.localeCompare(b.account_number, undefined, { numeric: true })
    }

    rootAccounts.sort(sortByAccountNumber)
    rootAccounts.forEach(root => this.sortTreeRecursively(root, sortByAccountNumber))

    return rootAccounts
  }

  /**
   * Recursively sort tree nodes
   */
  private sortTreeRecursively(
    node: COAHierarchyNode, 
    sortFn: (a: COAHierarchyNode, b: COAHierarchyNode) => number
  ) {
    if (node.children && node.children.length > 0) {
      node.children.sort(sortFn)
      node.children.forEach(child => this.sortTreeRecursively(child, sortFn))
    }
  }

  /**
   * Batch create multiple accounts
   */
  async batchCreateAccounts(requests: COACreateRequest[]): Promise<COAClientResponse<COAResponse[]>> {
    const results: COAResponse[] = []
    const errors: Array<{ index: number; error: string }> = []

    for (let i = 0; i < requests.length; i++) {
      try {
        const response = await this.createAccount(requests[i]!)
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
        code: 'ERR_COA_BATCH_FAILED',
        message: `Account ${e.index + 1}: ${e.error}`,
        field: 'batch_operation',
        value: e.index
      }))
    }
  }

  /**
   * Search accounts by name or number
   */
  async searchAccounts(
    searchTerm: string, 
    filters: Omit<COAQueryFilters, 'searchTerm'> = {}
  ): Promise<COAClientResponse<COAResponse[]>> {
    const response = await this.getAccounts({ ...filters, searchTerm })
    
    if (response.success && response.data) {
      // Additional client-side filtering for fuzzy search
      const filtered = response.data.filter(account => 
        account.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_number.includes(searchTerm) ||
        account.display_number?.includes(searchTerm)
      )
      
      return {
        ...response,
        data: filtered
      }
    }
    
    return response
  }
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class COAClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public validationErrors?: COAValidationError[]
  ) {
    super(message)
    this.name = 'COAClientError'
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook for managing COA client instance
 */
export function useCOAClient(config: COAClientConfig) {
  const [client] = useState(() => new COAClient(config))
  
  useEffect(() => {
    // Update client config if organizationId changes
    client['config'].organizationId = config.organizationId
    client['config'].headers['x-hera-organization-id'] = config.organizationId
  }, [config.organizationId, client])
  
  return client
}

/**
 * Hook for fetching COA accounts
 */
export function useCOAAccounts(
  config: COAClientConfig,
  filters: COAQueryFilters = {},
  options: { enabled?: boolean } = {}
) {
  const client = useCOAClient(config)
  
  return useQuery({
    queryKey: ['coa-accounts', config.organizationId, filters],
    queryFn: () => client.getAccounts(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching COA accounts tree
 */
export function useCOAAccountsTree(
  config: COAClientConfig,
  filters: COAQueryFilters = {},
  options: { enabled?: boolean } = {}
) {
  const client = useCOAClient(config)
  
  return useQuery({
    queryKey: ['coa-accounts-tree', config.organizationId, filters],
    queryFn: () => client.getAccountsTree(filters),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching single COA account
 */
export function useCOAAccount(
  config: COAClientConfig,
  accountId: string,
  options: { enabled?: boolean } = {}
) {
  const client = useCOAClient(config)
  
  return useQuery({
    queryKey: ['coa-account', config.organizationId, accountId],
    queryFn: () => client.getAccount(accountId),
    enabled: options.enabled !== false && !!accountId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for creating COA accounts
 */
export function useCreateCOAAccount(config: COAClientConfig) {
  const client = useCOAClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: COACreateRequest) => client.createAccount(request),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['coa-accounts', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['coa-accounts-tree', config.organizationId] })
    }
  })
}

/**
 * Hook for updating COA accounts
 */
export function useUpdateCOAAccount(config: COAClientConfig) {
  const client = useCOAClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ accountId, request }: { accountId: string; request: COAUpdateRequest }) => 
      client.updateAccount(accountId, request),
    onSuccess: (data, variables) => {
      // Update cache for specific account
      queryClient.setQueryData(
        ['coa-account', config.organizationId, variables.accountId],
        { success: true, data: data.data }
      )
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['coa-accounts', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['coa-accounts-tree', config.organizationId] })
    }
  })
}

/**
 * Hook for archiving COA accounts
 */
export function useArchiveCOAAccount(config: COAClientConfig) {
  const client = useCOAClient(config)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (accountId: string) => client.archiveAccount(accountId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['coa-accounts', config.organizationId] })
      queryClient.invalidateQueries({ queryKey: ['coa-accounts-tree', config.organizationId] })
    }
  })
}

/**
 * Hook for searching COA accounts with debounced input
 */
export function useSearchCOAAccounts(
  config: COAClientConfig,
  searchTerm: string,
  filters: Omit<COAQueryFilters, 'searchTerm'> = {},
  debounceMs: number = 300
) {
  const client = useCOAClient(config)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])
  
  return useQuery({
    queryKey: ['coa-search', config.organizationId, debouncedSearchTerm, filters],
    queryFn: () => client.searchAccounts(debouncedSearchTerm, filters),
    enabled: debouncedSearchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a COA client instance with default configuration
 */
export function createCOAClient(organizationId: string, options: Partial<COAClientConfig> = {}): COAClient {
  return new COAClient({
    organizationId,
    ...options
  })
}

/**
 * Format account number for display
 */
export function formatAccountNumber(accountNumber: string, format: 'hierarchical' | 'display' = 'hierarchical'): string {
  if (format === 'display') {
    return accountNumber.split('.').map(part => part.padStart(2, '0')).join('')
  }
  return accountNumber
}

/**
 * Get account range display name
 */
export function getAccountRangeDisplayName(accountNumber: string): string {
  const firstDigit = accountNumber.charAt(0)
  const rangeNames: Record<string, string> = {
    '1': 'Assets',
    '2': 'Liabilities',
    '3': 'Equity',
    '4': 'Revenue',
    '5': 'Cost of Goods Sold',
    '6': 'Operating Expenses',
    '7': 'Other Income/Expense',
    '8': 'Tax/Finance/Exceptional',
    '9': 'Statistical/Control'
  }
  return rangeNames[firstDigit] || 'Unknown'
}

/**
 * Check if account is a parent (has children)
 */
export function isParentAccount(account: COAHierarchyNode): boolean {
  return account.children !== undefined && account.children.length > 0
}

/**
 * Get all leaf accounts from tree
 */
export function getLeafAccounts(tree: COAHierarchyNode[]): COAHierarchyNode[] {
  const leaves: COAHierarchyNode[] = []
  
  const traverse = (nodes: COAHierarchyNode[]) => {
    nodes.forEach(node => {
      if (!isParentAccount(node)) {
        leaves.push(node)
      } else if (node.children) {
        traverse(node.children)
      }
    })
  }
  
  traverse(tree)
  return leaves
}

export default COAClient