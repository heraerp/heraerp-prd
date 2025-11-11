/**
 * HERA v2.2 React Hooks for Client SDK Integration
 * Smart Code: HERA.CLIENT.HOOKS.V22.REACT.v1
 * 
 * React hooks that integrate with HERA v2.2 Client SDK and existing auth system
 * Preserves compatibility with existing useHERAAuth and other hooks
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  HeraClient, 
  createEnvironmentAwareHeraClient, 
  createHeraClient,
  HeraClientError,
  HeraResponse,
  EntityCreateRequest,
  EntityReadRequest,
  TransactionCreateRequest,
  HeraRequestOptions 
} from '../hera-client';

// Re-export types for convenience
export type {
  HeraClient,
  HeraClientError,
  HeraResponse,
  EntityCreateRequest,
  EntityReadRequest,
  TransactionCreateRequest,
  HeraRequestOptions
} from '../hera-client';

// =============================================================================
// Hook for HERA Client Instance
// =============================================================================

export interface UseHeraClientOptions {
  environmentType?: 'development' | 'production' | 'auto';
  autoConnect?: boolean;
  retries?: number;
  timeout?: number;
}

export interface UseHeraClientResult {
  client: HeraClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: HeraClientError | null;
  environmentInfo: any;
  reconnect: () => Promise<void>;
}

/**
 * Main hook for HERA client integration
 * Integrates with existing auth system
 */
export function useHeraClient(
  token: string | null,
  organizationId: string | null,
  options: UseHeraClientOptions = {}
): UseHeraClientResult {
  const [client, setClient] = useState<HeraClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<HeraClientError | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null);

  const {
    environmentType = 'auto',
    autoConnect = true,
    retries = 3,
    timeout = 30000
  } = options;

  const connect = useCallback(async () => {
    if (!token || !organizationId) {
      setClient(null);
      setIsConnected(false);
      setError(null);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const newClient = await createEnvironmentAwareHeraClient(
        token,
        organizationId,
        environmentType
      );

      // Test connection with health check
      await newClient.healthCheck();
      
      setClient(newClient);
      setIsConnected(true);
      setEnvironmentInfo(newClient.getEnvironmentInfo());
      
    } catch (err) {
      const clientError = err instanceof HeraClientError 
        ? err 
        : new HeraClientError(
            err instanceof Error ? err.message : 'Unknown error',
            0,
            {
              error: 'connection_failed',
              message: err instanceof Error ? err.message : 'Unknown error',
              requestId: `hook_${Date.now()}`
            }
          );
      
      setError(clientError);
      setClient(null);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [token, organizationId, environmentType]);

  // Auto-connect when dependencies change
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [connect, autoConnect]);

  const reconnect = useCallback(async () => {
    await connect();
  }, [connect]);

  return {
    client,
    isConnected,
    isConnecting,
    error,
    environmentInfo,
    reconnect
  };
}

// =============================================================================
// Hook for Entity Operations
// =============================================================================

export interface UseHeraEntitiesOptions extends HeraRequestOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export interface UseHeraEntitiesResult {
  entities: any[];
  isLoading: boolean;
  error: HeraClientError | null;
  refetch: () => Promise<void>;
  createEntity: (request: EntityCreateRequest) => Promise<HeraResponse<any>>;
  updateEntity: (entityId: string, updates: Partial<EntityCreateRequest>) => Promise<HeraResponse<any>>;
  deleteEntity: (entityId: string) => Promise<HeraResponse<any>>;
}

/**
 * Hook for entity CRUD operations
 */
export function useHeraEntities(
  client: HeraClient | null,
  organizationId: string | null,
  filters: Partial<EntityReadRequest> = {},
  options: UseHeraEntitiesOptions = {}
): UseHeraEntitiesResult {
  const [entities, setEntities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<HeraClientError | null>(null);

  const { autoFetch = true, refetchInterval, ...requestOptions } = options;

  const fetchEntities = useCallback(async () => {
    if (!client || !organizationId) {
      setEntities([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.readEntities({
        operation: 'READ',
        organization_id: organizationId,
        ...filters
      }, requestOptions);

      setEntities(response.data || []);
    } catch (err) {
      const clientError = err instanceof HeraClientError 
        ? err 
        : new HeraClientError(
            err instanceof Error ? err.message : 'Unknown error',
            0,
            {
              error: 'fetch_failed',
              message: err instanceof Error ? err.message : 'Unknown error',
              requestId: `entities_${Date.now()}`
            }
          );
      
      setError(clientError);
      setEntities([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, organizationId, filters, requestOptions]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchEntities();
    }
  }, [fetchEntities, autoFetch]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchEntities, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEntities, refetchInterval]);

  const createEntity = useCallback(async (request: EntityCreateRequest) => {
    if (!client) {
      throw new HeraClientError('Client not available', 0, {
        error: 'client_unavailable',
        message: 'HERA client is not connected',
        requestId: `create_${Date.now()}`
      });
    }

    const response = await client.createEntity(request, requestOptions);
    
    // Refresh entities list after creation
    await fetchEntities();
    
    return response;
  }, [client, requestOptions, fetchEntities]);

  const updateEntity = useCallback(async (
    entityId: string, 
    updates: Partial<EntityCreateRequest>
  ) => {
    if (!client) {
      throw new HeraClientError('Client not available', 0, {
        error: 'client_unavailable', 
        message: 'HERA client is not connected',
        requestId: `update_${Date.now()}`
      });
    }

    const response = await client.updateEntity(entityId, updates, requestOptions);
    
    // Refresh entities list after update
    await fetchEntities();
    
    return response;
  }, [client, requestOptions, fetchEntities]);

  const deleteEntity = useCallback(async (entityId: string) => {
    if (!client || !organizationId) {
      throw new HeraClientError('Client not available', 0, {
        error: 'client_unavailable',
        message: 'HERA client is not connected',
        requestId: `delete_${Date.now()}`
      });
    }

    const response = await client.deleteEntity(entityId, organizationId, requestOptions);
    
    // Refresh entities list after deletion
    await fetchEntities();
    
    return response;
  }, [client, organizationId, requestOptions, fetchEntities]);

  return {
    entities,
    isLoading,
    error,
    refetch: fetchEntities,
    createEntity,
    updateEntity,
    deleteEntity
  };
}

// =============================================================================
// Hook for Transaction Operations
// =============================================================================

export interface UseHeraTransactionsOptions extends HeraRequestOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
}

export interface UseHeraTransactionsResult {
  transactions: any[];
  isLoading: boolean;
  error: HeraClientError | null;
  refetch: () => Promise<void>;
  createTransaction: (request: TransactionCreateRequest) => Promise<HeraResponse<any>>;
  createSale: (saleData: any) => Promise<HeraResponse<any>>;
}

/**
 * Hook for transaction operations
 */
export function useHeraTransactions(
  client: HeraClient | null,
  organizationId: string | null,
  filters: {
    transaction_type?: string;
    transaction_id?: string;
    limit?: number;
  } = {},
  options: UseHeraTransactionsOptions = {}
): UseHeraTransactionsResult {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<HeraClientError | null>(null);

  const { autoFetch = true, refetchInterval, ...requestOptions } = options;

  const fetchTransactions = useCallback(async () => {
    if (!client || !organizationId) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.readTransactions(
        organizationId,
        filters,
        requestOptions
      );

      setTransactions(response.data || []);
    } catch (err) {
      const clientError = err instanceof HeraClientError 
        ? err 
        : new HeraClientError(
            err instanceof Error ? err.message : 'Unknown error',
            0,
            {
              error: 'fetch_failed',
              message: err instanceof Error ? err.message : 'Unknown error',
              requestId: `transactions_${Date.now()}`
            }
          );
      
      setError(clientError);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, organizationId, filters, requestOptions]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [fetchTransactions, autoFetch]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchTransactions, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTransactions, refetchInterval]);

  const createTransaction = useCallback(async (request: TransactionCreateRequest) => {
    if (!client) {
      throw new HeraClientError('Client not available', 0, {
        error: 'client_unavailable',
        message: 'HERA client is not connected',
        requestId: `create_txn_${Date.now()}`
      });
    }

    const response = await client.createTransaction(request, requestOptions);
    
    // Refresh transactions list after creation
    await fetchTransactions();
    
    return response;
  }, [client, requestOptions, fetchTransactions]);

  const createSale = useCallback(async (saleData: {
    customerId?: string;
    totalAmount: number;
    currency?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitAmount: number;
      lineAmount: number;
    }>;
  }) => {
    if (!client || !organizationId) {
      throw new HeraClientError('Client not available', 0, {
        error: 'client_unavailable',
        message: 'HERA client is not connected',
        requestId: `create_sale_${Date.now()}`
      });
    }

    const response = await client.createSaleTransaction(organizationId, saleData, requestOptions);
    
    // Refresh transactions list after creation
    await fetchTransactions();
    
    return response;
  }, [client, organizationId, requestOptions, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    createSale
  };
}

// =============================================================================
// Hook for Health Monitoring
// =============================================================================

export interface UseHeraHealthOptions {
  interval?: number;
  autoStart?: boolean;
}

export interface UseHeraHealthResult {
  health: any | null;
  isHealthy: boolean;
  isChecking: boolean;
  error: HeraClientError | null;
  lastCheck: Date | null;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkNow: () => Promise<void>;
}

/**
 * Hook for health monitoring
 */
export function useHeraHealth(
  client: HeraClient | null,
  options: UseHeraHealthOptions = {}
): UseHeraHealthResult {
  const [health, setHealth] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<HeraClientError | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const { interval = 30000, autoStart = false } = options;

  const checkHealth = useCallback(async () => {
    if (!client) {
      setHealth(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await client.healthCheck();
      setHealth(response.data);
      setLastCheck(new Date());
    } catch (err) {
      const clientError = err instanceof HeraClientError 
        ? err 
        : new HeraClientError(
            err instanceof Error ? err.message : 'Unknown error',
            0,
            {
              error: 'health_check_failed',
              message: err instanceof Error ? err.message : 'Unknown error',
              requestId: `health_${Date.now()}`
            }
          );
      
      setError(clientError);
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  }, [client]);

  const startMonitoring = useCallback(() => {
    if (intervalId) return; // Already monitoring

    const id = setInterval(checkHealth, interval);
    setIntervalId(id);
    
    // Do initial check
    checkHealth();
  }, [checkHealth, interval, intervalId]);

  const stopMonitoring = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [intervalId]);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart && client) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [autoStart, client, startMonitoring, stopMonitoring]);

  const isHealthy = useMemo(() => {
    return health?.status === 'healthy' && !error;
  }, [health, error]);

  return {
    health,
    isHealthy,
    isChecking,
    error,
    lastCheck,
    startMonitoring,
    stopMonitoring,
    checkNow: checkHealth
  };
}

// =============================================================================
// Convenience Hook for Full HERA Integration
// =============================================================================

export interface UseHeraOptions extends UseHeraClientOptions {
  entityFilters?: Partial<EntityReadRequest>;
  transactionFilters?: {
    transaction_type?: string;
    transaction_id?: string;
    limit?: number;
  };
  enableHealthMonitoring?: boolean;
  healthCheckInterval?: number;
}

export interface UseHeraResult {
  // Client
  client: HeraClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  clientError: HeraClientError | null;
  environmentInfo: any;
  reconnect: () => Promise<void>;
  
  // Entities
  entities: any[];
  entitiesLoading: boolean;
  entitiesError: HeraClientError | null;
  refetchEntities: () => Promise<void>;
  createEntity: (request: EntityCreateRequest) => Promise<HeraResponse<any>>;
  
  // Transactions
  transactions: any[];
  transactionsLoading: boolean;
  transactionsError: HeraClientError | null;
  refetchTransactions: () => Promise<void>;
  createTransaction: (request: TransactionCreateRequest) => Promise<HeraResponse<any>>;
  createSale: (saleData: any) => Promise<HeraResponse<any>>;
  
  // Health
  health: any | null;
  isHealthy: boolean;
  healthError: HeraClientError | null;
  lastHealthCheck: Date | null;
}

/**
 * Comprehensive hook that combines all HERA functionality
 */
export function useHera(
  token: string | null,
  organizationId: string | null,
  options: UseHeraOptions = {}
): UseHeraResult {
  const {
    entityFilters = {},
    transactionFilters = {},
    enableHealthMonitoring = true,
    healthCheckInterval = 30000,
    ...clientOptions
  } = options;

  // Client connection
  const {
    client,
    isConnected,
    isConnecting,
    error: clientError,
    environmentInfo,
    reconnect
  } = useHeraClient(token, organizationId, clientOptions);

  // Entity operations
  const {
    entities,
    isLoading: entitiesLoading,
    error: entitiesError,
    refetch: refetchEntities,
    createEntity
  } = useHeraEntities(client, organizationId, entityFilters);

  // Transaction operations
  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    createTransaction,
    createSale
  } = useHeraTransactions(client, organizationId, transactionFilters);

  // Health monitoring
  const {
    health,
    isHealthy,
    error: healthError,
    lastCheck: lastHealthCheck
  } = useHeraHealth(client, {
    interval: healthCheckInterval,
    autoStart: enableHealthMonitoring
  });

  return {
    // Client
    client,
    isConnected,
    isConnecting,
    clientError,
    environmentInfo,
    reconnect,
    
    // Entities
    entities,
    entitiesLoading,
    entitiesError,
    refetchEntities,
    createEntity,
    
    // Transactions
    transactions,
    transactionsLoading,
    transactionsError,
    refetchTransactions,
    createTransaction,
    createSale,
    
    // Health
    health,
    isHealthy,
    healthError,
    lastHealthCheck
  };
}