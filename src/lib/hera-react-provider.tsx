/**
 * HERA React Provider + TanStack Query Hooks
 * Smart Code: HERA.FRONTEND.PROVIDER.REACT.HOOKS.v1
 * 
 * React Context and hooks that Claude CLI will use for all generated frontends
 * Provides ready-made hooks for entities, transactions, and dynamic data
 * Never stubs or mocks - always connects to real HERA backend via SDK
 */

'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';
import {
  HeraClient,
  HeraConfig,
  HeraClientError,
  HeraResponse,
  EntityCreateRequest,
  EntityListParams,
  TransactionCreateRequest,
  TransactionListParams
} from './hera-frontend-sdk';

// =============================================================================
// Context Setup
// =============================================================================

interface HeraContextValue {
  client: HeraClient;
  config: HeraConfig;
}

const HeraContext = createContext<HeraContextValue | null>(null);

export interface HeraProviderProps {
  children: ReactNode;
  config: HeraConfig;
  queryClient?: QueryClient;
}

/**
 * Main HERA Provider that wraps the app with HERA client and TanStack Query
 * Claude will use this in generated apps
 */
export function HeraProvider({ children, config, queryClient }: HeraProviderProps) {
  const client = useMemo(() => new HeraClient(config), [config]);
  
  const defaultQueryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
        retry: (failureCount, error) => {
          // Don't retry on client errors (400-499) except rate limits
          if (error instanceof HeraClientError) {
            return error.isRetryable && failureCount < 3;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error instanceof HeraClientError) {
            return error.isRetryable && failureCount < 2;
          }
          return failureCount < 2;
        }
      }
    }
  }), []);

  const qc = queryClient || defaultQueryClient;

  return (
    <QueryClientProvider client={qc}>
      <HeraContext.Provider value={{ client, config }}>
        {children}
      </HeraContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * Hook to access HERA client - used by all other hooks
 */
export function useHera(): HeraContextValue {
  const context = useContext(HeraContext);
  if (!context) {
    throw new Error('useHera must be used within a HeraProvider');
  }
  return context;
}

/**
 * Hook to access just the HERA client
 */
export function useHeraClient(): HeraClient {
  const { client } = useHera();
  return client;
}

// =============================================================================
// Entity Hooks - Ready for Claude to use
// =============================================================================

/**
 * List entities with caching and filtering
 * Claude will use this for entity list pages
 */
export function useEntities(
  params: EntityListParams = {},
  options?: Omit<UseQueryOptions<HeraResponse<any[]>, HeraClientError>, 'queryKey' | 'queryFn'>
) {
  const { client } = useHera();
  
  return useQuery({
    queryKey: ['entities', params],
    queryFn: () => client.listEntities(params),
    ...options
  });
}

/**
 * Get single entity by ID with caching
 * Claude will use this for entity detail pages
 */
export function useEntity(
  id: string,
  options?: Omit<UseQueryOptions<HeraResponse<any>, HeraClientError>, 'queryKey' | 'queryFn'>
) {
  const { client } = useHera();
  
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => client.getEntity(id),
    enabled: !!id,
    ...options
  });
}

/**
 * Create or update entity with optimistic updates
 * Claude will use this for entity forms
 */
export function useUpsertEntity(
  options?: UseMutationOptions<
    HeraResponse<{ entity_id: string }>,
    HeraClientError,
    { id?: string; data: EntityCreateRequest }
  >
) {
  const { client } = useHera();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return client.updateEntity(id, data);
      } else {
        return client.createEntity(data);
      }
    },
    onSuccess: (response, variables) => {
      // Invalidate entity lists
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      
      // Update specific entity cache if it was an update
      if (variables.id) {
        queryClient.setQueryData(['entity', variables.id], response);
      }
    },
    ...options
  });
}

/**
 * Delete entity with cache invalidation
 * Claude will use this for delete buttons
 */
export function useDeleteEntity(
  options?: UseMutationOptions<HeraResponse<{ entity_id: string }>, HeraClientError, string>
) {
  const { client } = useHera();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => client.deleteEntity(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['entity', id] });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
    ...options
  });
}

// =============================================================================
// Transaction Hooks - Ready for Claude to use
// =============================================================================

/**
 * List transactions with caching and filtering
 * Claude will use this for transaction list pages
 */
export function useTransactions(
  params: TransactionListParams = {},
  options?: Omit<UseQueryOptions<HeraResponse<any[]>, HeraClientError>, 'queryKey' | 'queryFn'>
) {
  const { client } = useHera();
  
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => client.listTransactions(params),
    ...options
  });
}

/**
 * Get single transaction by ID
 * Claude will use this for transaction detail pages
 */
export function useTransaction(
  id: string,
  options?: Omit<UseQueryOptions<HeraResponse<any>, HeraClientError>, 'queryKey' | 'queryFn'>
) {
  const { client } = useHera();
  
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => client.getTransaction(id),
    enabled: !!id,
    ...options
  });
}

/**
 * Create transaction with idempotency and cache invalidation
 * Claude will use this for transaction forms
 */
export function usePostTransaction(
  options?: UseMutationOptions<
    HeraResponse<{ transaction_id: string; lines_created: number }>,
    HeraClientError,
    { payload: TransactionCreateRequest; idempotencyKey?: string }
  >
) {
  const { client } = useHera();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, idempotencyKey }) => client.postTransaction(payload, idempotencyKey),
    onSuccess: () => {
      // Invalidate transaction lists
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    ...options
  });
}

// =============================================================================
// Dynamic Data Hooks
// =============================================================================

/**
 * List dynamic data fields
 * Claude will use this for entity detail pages showing dynamic fields
 */
export function useDynamicData(
  params: { entity_id?: string; field_name?: string; limit?: number; offset?: number } = {},
  options?: Omit<UseQueryOptions<HeraResponse<any[]>, HeraClientError>, 'queryKey' | 'queryFn'>
) {
  const { client } = useHera();
  
  return useQuery({
    queryKey: ['dynamic-data', params],
    queryFn: () => client.listDynamicData(params),
    ...options
  });
}

/**
 * Create dynamic data field
 * Claude will use this for adding custom fields to entities
 */
export function useCreateDynamicData(
  options?: UseMutationOptions<
    HeraResponse<{ field_id: string }>,
    HeraClientError,
    { entity_id: string; field_name: string; field_type: string; field_value?: any; smart_code?: string }
  >
) {
  const { client } = useHera();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => client.createDynamicData(data),
    onSuccess: (_, variables) => {
      // Invalidate dynamic data for this entity
      queryClient.invalidateQueries({ 
        queryKey: ['dynamic-data', { entity_id: variables.entity_id }] 
      });
      // Invalidate entity to refresh computed fields
      queryClient.invalidateQueries({ 
        queryKey: ['entity', variables.entity_id] 
      });
    },
    ...options
  });
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Health check hook
 * Claude will use this for debugging and status pages
 */
export function useHeraHealth(
  options?: Omit<UseQueryOptions<HeraResponse<{ status: string }>, HeraClientError>, 'queryKey' | 'queryFn'>
) {
  const { client } = useHera();
  
  return useQuery({
    queryKey: ['hera-health'],
    queryFn: () => client.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    ...options
  });
}

/**
 * GL Balance validation hook
 * Claude will use this in transaction forms for real-time validation
 */
export function useGLBalance(lines: TransactionCreateRequest['lines'] = []) {
  const { client } = useHera();
  
  return useMemo(() => {
    return client.validateGLBalance(lines);
  }, [client, lines]);
}

/**
 * Smart Code generator hook
 * Claude will use this to suggest Smart Codes in forms
 */
export function useSmartCodeGenerator() {
  const { client } = useHera();
  
  return useMemo(() => {
    return (params: {
      industry?: string;
      module?: string;
      type: string;
      subtype?: string;
      version?: string;
    }) => client.generateSmartCode(params);
  }, [client]);
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Hook to extract user-friendly error messages
 * Claude will use this for error display in forms
 */
export function useErrorMessage(error: HeraClientError | Error | null): string | null {
  return useMemo(() => {
    if (!error) return null;
    
    if (error instanceof HeraClientError) {
      // Return validation errors if available
      if (error.isValidationError && error.response.violations?.length) {
        return error.response.violations.join(', ');
      }
      
      // Return specific error messages for common cases
      if (error.isUnauthorized) {
        return 'Please log in to continue';
      }
      
      if (error.isForbidden) {
        return 'You do not have permission to perform this action';
      }
      
      if (error.isNotFound) {
        return 'The requested resource was not found';
      }
      
      if (error.isConflict) {
        return 'This operation conflicts with existing data';
      }
      
      if (error.isRateLimited) {
        return 'Too many requests. Please wait and try again';
      }
      
      return error.response.message || error.message;
    }
    
    return error.message;
  }, [error]);
}

/**
 * Hook for handling form submission errors
 * Claude will use this in generated forms for error display
 */
export function useFormErrors(error: HeraClientError | null) {
  return useMemo(() => {
    if (!error?.isValidationError) return {};
    
    const fieldErrors: Record<string, string> = {};
    
    if (error.response.field && error.response.message) {
      fieldErrors[error.response.field] = error.response.message;
    }
    
    error.response.violations?.forEach(violation => {
      // Try to extract field name from violation message
      const fieldMatch = violation.match(/field '([^']+)'/);
      if (fieldMatch) {
        fieldErrors[fieldMatch[1]] = violation;
      }
    });
    
    return fieldErrors;
  }, [error]);
}

// =============================================================================
// Export Everything for Claude
// =============================================================================

export type {
  HeraConfig,
  EntityCreateRequest,
  EntityListParams,
  TransactionCreateRequest,
  TransactionListParams,
  HeraClientError,
  HeraResponse
};

export {
  HeraClient,
  createHeraClient,
  createViteHeraClient
} from './hera-frontend-sdk';