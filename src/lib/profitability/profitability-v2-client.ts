/**
 * HERA Profitability v2: TypeScript Client SDK
 * 
 * Complete TypeScript client for profitability operations with React hooks,
 * TanStack Query integration, and sub-second performance optimization.
 * 
 * Smart Code: HERA.PROFITABILITY.CLIENT.SDK.V2
 */

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'
import {
  type ProfitabilityRunRequest,
  type ProfitabilityRunResult,
  type ProfitabilityQuery,
  type ProfitabilityQueryResult,
  type ReconciliationResult,
  type AllocationAssessmentPolicy,
  type SettlementPolicy,
  type ValidationResult,
  validateAllocationPolicy,
  validateSettlementPolicy,
  validatePeriod,
  PROFITABILITY_ERROR_CODES,
  PROFITABILITY_SMART_CODES
} from './profitability-v2-standard'

// ============================================================================
// Core Client Class
// ============================================================================

export class ProfitabilityClient {
  constructor(
    private organizationId: string,
    private queryClient?: QueryClient
  ) {}

  // ========================================================================
  // Profitability Operations
  // ========================================================================

  /**
   * Execute allocation run
   */
  async runAllocation(request: Omit<ProfitabilityRunRequest, 'organization_id'>): Promise<ProfitabilityRunResult> {
    const response = await apiV2.post('profitability', {
      operation: 'allocation',
      organization_id: this.organizationId,
      ...request
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Allocation run failed')
    }
    
    // Invalidate related queries
    this.queryClient?.invalidateQueries({ queryKey: ['profitability', this.organizationId] })
    
    return response.data
  }

  /**
   * Execute assessment run
   */
  async runAssessment(request: Omit<ProfitabilityRunRequest, 'organization_id'>): Promise<ProfitabilityRunResult> {
    const response = await apiV2.post('profitability', {
      operation: 'assessment',
      organization_id: this.organizationId,
      ...request
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Assessment run failed')
    }
    
    this.queryClient?.invalidateQueries({ queryKey: ['profitability', this.organizationId] })
    
    return response.data
  }

  /**
   * Execute settlement run
   */
  async runSettlement(request: Omit<ProfitabilityRunRequest, 'organization_id'>): Promise<ProfitabilityRunResult> {
    const response = await apiV2.post('profitability', {
      operation: 'settlement',
      organization_id: this.organizationId,
      ...request
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Settlement run failed')
    }
    
    this.queryClient?.invalidateQueries({ queryKey: ['profitability', this.organizationId] })
    
    return response.data
  }

  /**
   * Execute reconciliation
   */
  async runReconciliation(period: string, tolerance = 0.01): Promise<ReconciliationResult> {
    const response = await apiV2.post('profitability', {
      operation: 'reconciliation',
      organization_id: this.organizationId,
      period,
      tolerance
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Reconciliation failed')
    }
    
    return response.data
  }

  // ========================================================================
  // Policy Management
  // ========================================================================

  /**
   * Create or update allocation policy
   */
  async saveAllocationPolicy(policyRef: string, policy: AllocationAssessmentPolicy): Promise<{ policy_entity_id: string }> {
    const validation = validateAllocationPolicy(policy)
    if (!validation.valid) {
      throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`)
    }

    const response = await apiV2.put('profitability', {
      policy_type: 'ALLOC_ASSESS_V2',
      policy_ref: policyRef,
      policy_data: policy,
      organization_id: this.organizationId
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to save allocation policy')
    }
    
    this.queryClient?.invalidateQueries({ queryKey: ['profitability-policies', this.organizationId] })
    
    return response.data
  }

  /**
   * Create or update settlement policy
   */
  async saveSettlementPolicy(policyRef: string, policy: SettlementPolicy): Promise<{ policy_entity_id: string }> {
    const validation = validateSettlementPolicy(policy)
    if (!validation.valid) {
      throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`)
    }

    const response = await apiV2.put('profitability', {
      policy_type: 'SETTLEMENT_V2',
      policy_ref: policyRef,
      policy_data: policy,
      organization_id: this.organizationId
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to save settlement policy')
    }
    
    this.queryClient?.invalidateQueries({ queryKey: ['profitability-policies', this.organizationId] })
    
    return response.data
  }

  /**
   * Archive policy
   */
  async archivePolicy(policyRef: string): Promise<{ archived: boolean }> {
    const response = await apiV2.delete(`profitability?organization_id=${this.organizationId}&policy_ref=${policyRef}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to archive policy')
    }
    
    this.queryClient?.invalidateQueries({ queryKey: ['profitability-policies', this.organizationId] })
    
    return response.data
  }

  // ========================================================================
  // Data Queries
  // ========================================================================

  /**
   * Query profitability data
   */
  async queryProfitability(query: Omit<ProfitabilityQuery, 'organization_id'>): Promise<ProfitabilityQueryResult> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      ...Object.entries(query).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = Array.isArray(value) ? value.join(',') : String(value)
        }
        return acc
      }, {} as Record<string, string>)
    })
    
    const response = await apiV2.get(`profitability?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Profitability query failed')
    }
    
    return response
  }

  // ========================================================================
  // Analytics
  // ========================================================================

  /**
   * Get profitability summary
   */
  async getSummary(period?: string, currency = 'AED'): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'summary',
      currency
    })
    
    if (period) params.set('period', period)
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get profitability summary')
    }
    
    return response.data
  }

  /**
   * Get CODM analysis
   */
  async getCODMAnalysis(period?: string, currency = 'AED'): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'codm',
      currency
    })
    
    if (period) params.set('period', period)
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get CODM analysis')
    }
    
    return response.data
  }

  /**
   * Get product profitability
   */
  async getProductProfitability(period?: string, currency = 'AED'): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'product',
      currency
    })
    
    if (period) params.set('period', period)
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get product profitability')
    }
    
    return response.data
  }

  /**
   * Get customer profitability
   */
  async getCustomerProfitability(period?: string, currency = 'AED'): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'customer',
      currency
    })
    
    if (period) params.set('period', period)
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get customer profitability')
    }
    
    return response.data
  }

  /**
   * Get variance analysis
   */
  async getVarianceAnalysis(period: string, comparePeriod: string, currency = 'AED'): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'variance',
      period,
      compare_period: comparePeriod,
      currency
    })
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get variance analysis')
    }
    
    return response.data
  }

  /**
   * Get trending analysis
   */
  async getTrendingAnalysis(currency = 'AED'): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'trending',
      currency
    })
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get trending analysis')
    }
    
    return response.data
  }

  /**
   * Get dimensional completeness report
   */
  async getDimensionalCompleteness(period?: string): Promise<any[]> {
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      type: 'dimensional_completeness'
    })
    
    if (period) params.set('period', period)
    
    const response = await apiV2.get(`profitability/analytics?${params}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get dimensional completeness report')
    }
    
    return response.data
  }

  /**
   * Execute custom analytics query
   */
  async executeCustomQuery(query: string, parameters?: any[]): Promise<any[]> {
    const response = await apiV2.post('profitability/analytics', {
      custom_query: query,
      organization_id: this.organizationId,
      parameters
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Custom query execution failed')
    }
    
    return response.data
  }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to get profitability client instance
 */
export function useProfitabilityClient(organizationId: string) {
  const queryClient = useQueryClient()
  return new ProfitabilityClient(organizationId, queryClient)
}

/**
 * Hook for allocation operations
 */
export function useAllocation(organizationId: string) {
  const client = useProfitabilityClient(organizationId)
  
  return useMutation({
    mutationFn: (request: Omit<ProfitabilityRunRequest, 'organization_id'>) => 
      client.runAllocation(request),
    onSuccess: () => {
      // Invalidate profitability data
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability', organizationId] 
      })
    }
  })
}

/**
 * Hook for assessment operations
 */
export function useAssessment(organizationId: string) {
  const client = useProfitabilityClient(organizationId)
  
  return useMutation({
    mutationFn: (request: Omit<ProfitabilityRunRequest, 'organization_id'>) => 
      client.runAssessment(request),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability', organizationId] 
      })
    }
  })
}

/**
 * Hook for settlement operations
 */
export function useSettlement(organizationId: string) {
  const client = useProfitabilityClient(organizationId)
  
  return useMutation({
    mutationFn: (request: Omit<ProfitabilityRunRequest, 'organization_id'>) => 
      client.runSettlement(request),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability', organizationId] 
      })
    }
  })
}

/**
 * Hook for reconciliation operations
 */
export function useReconciliation(organizationId: string) {
  const client = useProfitabilityClient(organizationId)
  
  return useMutation({
    mutationFn: ({ period, tolerance = 0.01 }: { period: string; tolerance?: number }) => 
      client.runReconciliation(period, tolerance),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability', organizationId] 
      })
    }
  })
}

/**
 * Hook for profitability summary data
 */
export function useProfitabilitySummary(
  organizationId: string, 
  period?: string, 
  currency = 'AED',
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-summary', organizationId, period, currency],
    queryFn: () => client.getSummary(period, currency),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })
}

/**
 * Hook for CODM analysis data
 */
export function useCODMAnalysis(
  organizationId: string, 
  period?: string, 
  currency = 'AED',
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-codm', organizationId, period, currency],
    queryFn: () => client.getCODMAnalysis(period, currency),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

/**
 * Hook for product profitability data
 */
export function useProductProfitability(
  organizationId: string, 
  period?: string, 
  currency = 'AED',
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-product', organizationId, period, currency],
    queryFn: () => client.getProductProfitability(period, currency),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

/**
 * Hook for customer profitability data
 */
export function useCustomerProfitability(
  organizationId: string, 
  period?: string, 
  currency = 'AED',
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-customer', organizationId, period, currency],
    queryFn: () => client.getCustomerProfitability(period, currency),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

/**
 * Hook for variance analysis
 */
export function useVarianceAnalysis(
  organizationId: string, 
  period?: string, 
  comparePeriod?: string, 
  currency = 'AED',
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-variance', organizationId, period, comparePeriod, currency],
    queryFn: () => client.getVarianceAnalysis(period!, comparePeriod!, currency),
    enabled: !!organizationId && !!period && !!comparePeriod && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

/**
 * Hook for trending analysis
 */
export function useTrendingAnalysis(
  organizationId: string, 
  currency = 'AED',
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-trending', organizationId, currency],
    queryFn: () => client.getTrendingAnalysis(currency),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 10 * 60 * 1000, // 10 minutes for trending data
    cacheTime: 15 * 60 * 1000
  })
}

/**
 * Hook for dimensional completeness report
 */
export function useDimensionalCompleteness(
  organizationId: string, 
  period?: string,
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-dimensional', organizationId, period],
    queryFn: () => client.getDimensionalCompleteness(period),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  })
}

/**
 * Hook for custom profitability queries
 */
export function useCustomProfitabilityQuery(
  organizationId: string,
  query: Omit<ProfitabilityQuery, 'organization_id'>,
  options?: { enabled?: boolean }
) {
  const client = useProfitabilityClient(organizationId)
  
  return useQuery({
    queryKey: ['profitability-custom', organizationId, query],
    queryFn: () => client.queryProfitability(query),
    enabled: !!organizationId && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes for custom queries
    cacheTime: 5 * 60 * 1000
  })
}

/**
 * Hook for policy management
 */
export function useProfitabilityPolicies(organizationId: string) {
  const client = useProfitabilityClient(organizationId)
  
  const saveAllocationPolicy = useMutation({
    mutationFn: ({ policyRef, policy }: { policyRef: string; policy: AllocationAssessmentPolicy }) =>
      client.saveAllocationPolicy(policyRef, policy),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability-policies', organizationId] 
      })
    }
  })
  
  const saveSettlementPolicy = useMutation({
    mutationFn: ({ policyRef, policy }: { policyRef: string; policy: SettlementPolicy }) =>
      client.saveSettlementPolicy(policyRef, policy),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability-policies', organizationId] 
      })
    }
  })
  
  const archivePolicy = useMutation({
    mutationFn: (policyRef: string) => client.archivePolicy(policyRef),
    onSuccess: () => {
      client.queryClient?.invalidateQueries({ 
        queryKey: ['profitability-policies', organizationId] 
      })
    }
  })
  
  return {
    saveAllocationPolicy,
    saveSettlementPolicy,
    archivePolicy
  }
}

// ============================================================================
// Export Types for External Use
// ============================================================================

export type {
  ProfitabilityRunRequest,
  ProfitabilityRunResult,
  ProfitabilityQuery,
  ProfitabilityQueryResult,
  ReconciliationResult,
  AllocationAssessmentPolicy,
  SettlementPolicy,
  ValidationResult
}

export {
  PROFITABILITY_ERROR_CODES,
  PROFITABILITY_SMART_CODES,
  validateAllocationPolicy,
  validateSettlementPolicy,
  validatePeriod
}