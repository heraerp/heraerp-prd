/**
 * Ledger domain methods for HERA SDK
 * High-level API for ledger operations with retry and idempotency
 */

import type { 
  Result, 
  HeraError,
  HeraErrorCode 
} from '../engine/contracts/errors';
import type { 
  LedgerRequest, 
  SimulateResponse, 
  PostResponse 
} from '../engine/contracts/dto';
import { HttpClient } from './client';
import { withRetry, isRetryableError } from './retry';
import { IdempotencyManager, makeExternalRef } from './idempotency';

export interface LedgerClientConfig {
  client: HttpClient;
  idempotencyManager?: IdempotencyManager;
  retry?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  };
  onRetry?: (context: { attempt: number; delay: number; error: HeraError }) => void;
}

/**
 * Parse HTTP response into Result type
 */
function parseResponse<T>(response: { status: number; json: any }): Result<T> {
  const { json } = response;

  // Check if response indicates success
  if (json.success === true && json.data) {
    return {
      ok: true,
      data: json.data as T,
      meta: json.meta,
    };
  }

  // Handle error response
  if (json.success === false && json.error) {
    return {
      ok: false,
      error: {
        code: json.error.code as HeraErrorCode,
        message: json.error.message,
        details: json.error.details,
        hint: json.error.hint,
      },
    };
  }

  // Unexpected response format
  return {
    ok: false,
    error: {
      code: 'E_INTERNAL',
      message: 'Unexpected response format',
      details: { response: json },
    },
  };
}

/**
 * Check if error is retryable based on response
 */
function checkRetryable(error: any): { 
  retryable: boolean; 
  code?: HeraErrorCode; 
  retryAfter?: string | null 
} {
  // If it's a Result with error
  if (error && typeof error === 'object' && 'ok' in error && !error.ok) {
    const heraError = error.error as HeraError;
    return {
      retryable: isRetryableError(heraError.code),
      code: heraError.code,
      retryAfter: null,
    };
  }

  // If it's an HTTP response error
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response;
    const retryAfter = response.headers?.get?.('Retry-After') || null;
    
    if (response.json?.error?.code) {
      const code = response.json.error.code as HeraErrorCode;
      return {
        retryable: isRetryableError(code),
        code,
        retryAfter,
      };
    }
  }

  // Default to retryable for network errors
  return { retryable: true, code: 'E_UPSTREAM' };
}

export class LedgerClient {
  private client: HttpClient;
  private idempotencyManager: IdempotencyManager;
  private retryConfig: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  private onRetry?: (context: { attempt: number; delay: number; error: HeraError }) => void;

  constructor(config: LedgerClientConfig) {
    this.client = config.client;
    this.idempotencyManager = config.idempotencyManager || new IdempotencyManager();
    this.retryConfig = {
      maxAttempts: config.retry?.maxAttempts || 3,
      baseDelayMs: config.retry?.baseDelayMs || 250,
      maxDelayMs: config.retry?.maxDelayMs || 4000,
    };
    this.onRetry = config.onRetry;
  }

  /**
   * Simulate a ledger posting without persisting
   */
  async simulate(request: LedgerRequest): Promise<Result<SimulateResponse>> {
    return withRetry(
      async () => {
        const response = await this.client.post('/ledger/simulate', request);
        const result = parseResponse<SimulateResponse>(response);
        
        if (!result.ok) {
          // Attach response for retry logic
          const error = new Error(result.error.message) as any;
          error.response = response;
          error.ok = false;
          error.error = result.error;
          throw error;
        }
        
        return result;
      },
      checkRetryable,
      {
        config: this.retryConfig,
        onRetry: this.onRetry ? (ctx) => {
          this.onRetry!({
            attempt: ctx.attempt,
            delay: ctx.delay,
            error: ctx.error as HeraError,
          });
        } : undefined,
      }
    );
  }

  /**
   * Post a ledger entry (persist to database)
   */
  async post(request: LedgerRequest): Promise<Result<PostResponse>> {
    return withRetry(
      async () => {
        const response = await this.client.post('/ledger/post', request);
        const result = parseResponse<PostResponse>(response);
        
        if (!result.ok) {
          // Attach response for retry logic
          const error = new Error(result.error.message) as any;
          error.response = response;
          error.ok = false;
          error.error = result.error;
          throw error;
        }
        
        return result;
      },
      checkRetryable,
      {
        config: this.retryConfig,
        onRetry: this.onRetry ? (ctx) => {
          this.onRetry!({
            attempt: ctx.attempt,
            delay: ctx.delay,
            error: ctx.error as HeraError,
          });
        } : undefined,
      }
    );
  }

  /**
   * Post with automatic idempotency handling
   */
  async postWithIdempotency(
    request: Omit<LedgerRequest, 'external_reference'> & { 
      external_reference?: string 
    }
  ): Promise<Result<PostResponse>> {
    // Generate external reference if not provided
    const externalRef = request.external_reference || makeExternalRef();
    
    // Check if we've already posted this
    const existingTxnId = this.idempotencyManager.recall(externalRef);
    if (existingTxnId) {
      return {
        ok: true,
        data: { transaction_id: existingTxnId },
        meta: { idempotent: true, cached: true },
      };
    }

    // Make the request with external reference
    const fullRequest: LedgerRequest = {
      ...request,
      external_reference: externalRef,
    };

    const result = await this.post(fullRequest);

    // Handle successful response
    if (result.ok) {
      // Check if this was an idempotent response
      if (result.meta?.idempotent) {
        // Server recognized as duplicate, remember for future
        this.idempotencyManager.remember(externalRef, result.data.transaction_id);
      } else {
        // New transaction, remember it
        this.idempotencyManager.remember(externalRef, result.data.transaction_id);
      }
    } else if (result.error.code === 'E_IDEMPOTENT') {
      // Special handling for E_IDEMPOTENT error (should be 200 but just in case)
      const txnId = (result.error.context as any)?.transaction_id;
      if (txnId) {
        this.idempotencyManager.remember(externalRef, txnId);
        return {
          ok: true,
          data: { transaction_id: txnId },
          meta: { idempotent: true },
        };
      }
    }

    return result;
  }

  /**
   * Get the idempotency manager
   */
  getIdempotencyManager(): IdempotencyManager {
    return this.idempotencyManager;
  }
}

/**
 * Create a ledger client with configuration
 */
export function createLedgerClient(config: {
  baseUrl: string;
  apiKey?: string;
  organizationId: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  retry?: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  };
  idempotency?: {
    storage?: 'memory' | 'local';
    prefix?: string;
  };
  onRetry?: (context: { attempt: number; delay: number; error: HeraError }) => void;
}): LedgerClient {
  const httpClient = new HttpClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    organizationId: config.organizationId,
    defaultHeaders: config.defaultHeaders,
    timeoutMs: config.timeoutMs,
  });

  const idempotencyManager = new IdempotencyManager(config.idempotency);

  return new LedgerClient({
    client: httpClient,
    idempotencyManager,
    retry: config.retry,
    onRetry: config.onRetry,
  });
}