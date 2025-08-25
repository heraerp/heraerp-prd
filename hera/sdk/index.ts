/**
 * HERA SDK - Main exports
 * Production-ready client SDK with retries and idempotency
 */

// Re-export contract types
export type {
  Result,
  HeraError,
  HeraErrorCode,
} from '../engine/contracts/errors';

export type {
  LedgerRequest,
  LedgerHeader,
  LedgerLine,
  SimulateResponse,
  PostResponse,
  DimensionData,
  TaxData,
  SettlementData,
} from '../engine/contracts/dto';

// Export client components
export { HttpClient } from './client';
export type { ClientConfig, HttpResponse } from './client';

// Export retry utilities
export {
  withRetry,
  calculateDelay,
  parseRetryAfter,
  isRetryableError,
  createRetryableFunction,
  DEFAULT_RETRY_CONFIG,
} from './retry';
export type { RetryConfig, RetryContext, RetryOptions } from './retry';

// Export idempotency utilities
export {
  IdempotencyManager,
  makeExternalRef,
  getGlobalIdempotencyManager,
  setGlobalIdempotencyManager,
  MemoryStorage,
  LocalStorageAdapter,
  DEFAULT_IDEMPOTENCY_CONFIG,
} from './idempotency';
export type { IdempotencyConfig, IdempotencyStorage } from './idempotency';

// Export ledger client
export {
  LedgerClient,
  createLedgerClient,
} from './ledger';
export type { LedgerClientConfig } from './ledger';

// Export version
export const SDK_VERSION = '0.1.0';

// Default export for convenience
export default {
  createLedgerClient,
  makeExternalRef,
  SDK_VERSION,
};