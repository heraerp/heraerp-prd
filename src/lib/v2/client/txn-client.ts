import { post } from './base-client';
import type {
  TxnRead,
  TxnReadResponse,
  TxnQuery,
  TxnQueryResponse,
  TxnReverse,
  TxnReverseResponse,
  TxnEmit,
  TxnEmitLine
} from '../schemas/txn-schemas';

/**
 * HERA V2 API - Transaction Client
 * Event-sourced CRUD: Create (txn-emit exists) + Read + Query + Reverse
 * Immutable transactions - corrections via reversal only
 */

// TypeScript interfaces for client usage
export interface TransactionReadOptions {
  organization_id: string;
  transaction_id: string;
  include_lines?: boolean;
}

export interface TransactionQueryOptions {
  organization_id: string;
  source_entity_id?: string;
  target_entity_id?: string;
  transaction_type?: string;
  smart_code_like?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  include_lines?: boolean;
}

export interface TransactionReverseOptions {
  organization_id: string;
  original_transaction_id: string;
  smart_code: string;
  reason: string;
}

/**
 * Transaction Client V2
 * Sacred Six tables only - uses universal_transactions and universal_transaction_lines
 */
export const txnClientV2 = {
  /**
   * Read a single transaction by ID (with optional lines)
   */
  read: (options: TransactionReadOptions): Promise<TxnReadResponse> => {
    return post('/api/v2/universal/txn-read', {
      organization_id: options.organization_id,
      transaction_id: options.transaction_id,
      include_lines: options.include_lines !== false // Default true
    });
  },

  /**
   * Query transactions with flexible filters
   */
  query: (options: TransactionQueryOptions): Promise<TxnQueryResponse> => {
    const filters: Record<string, any> = {
      organization_id: options.organization_id
    };

    // Add optional filters
    if (options.source_entity_id) filters.source_entity_id = options.source_entity_id;
    if (options.target_entity_id) filters.target_entity_id = options.target_entity_id;
    if (options.transaction_type) filters.transaction_type = options.transaction_type;
    if (options.smart_code_like) filters.smart_code_like = options.smart_code_like;
    if (options.date_from) filters.date_from = options.date_from;
    if (options.date_to) filters.date_to = options.date_to;
    if (options.limit) filters.limit = options.limit;
    if (options.offset) filters.offset = options.offset;
    if (options.include_lines !== undefined) filters.include_lines = options.include_lines;

    return post('/api/v2/universal/txn-query', filters);
  },

  /**
   * Reverse a transaction (immutable correction)
   */
  reverse: (options: TransactionReverseOptions): Promise<TxnReverseResponse> => {
    return post('/api/v2/universal/txn-reverse', {
      organization_id: options.organization_id,
      original_transaction_id: options.original_transaction_id,
      smart_code: options.smart_code,
      reason: options.reason.trim()
    });
  },

  /**
   * Emit a new transaction (uses existing txn-emit endpoint)
   */
  emit: (payload: TxnEmit): Promise<{ api_version: string; transaction_id: string }> => {
    return post('/api/v2/universal/txn-emit', payload);
  }
};

// Helper functions for common transaction patterns
export const txnHelpers = {
  /**
   * Find transactions by entity (either source or target)
   */
  findByEntity: (
    organization_id: string,
    entity_id: string,
    options: Partial<TransactionQueryOptions> = {}
  ) => {
    return Promise.all([
      // As source entity
      txnClientV2.query({
        organization_id,
        source_entity_id: entity_id,
        ...options
      }),
      // As target entity
      txnClientV2.query({
        organization_id,
        target_entity_id: entity_id,
        ...options
      })
    ]).then(([asSource, asTarget]) => ({
      as_source: asSource.transactions,
      as_target: asTarget.transactions,
      total_as_source: asSource.total,
      total_as_target: asTarget.total
    }));
  },

  /**
   * Find transactions by date range
   */
  findByDateRange: (
    organization_id: string,
    date_from: string,
    date_to: string,
    options: Partial<TransactionQueryOptions> = {}
  ) => {
    return txnClientV2.query({
      organization_id,
      date_from,
      date_to,
      ...options
    });
  },

  /**
   * Find transactions by type with smart code pattern
   */
  findByTypeAndSmartCode: (
    organization_id: string,
    transaction_type: string,
    smart_code_pattern: string,
    options: Partial<TransactionQueryOptions> = {}
  ) => {
    return txnClientV2.query({
      organization_id,
      transaction_type,
      smart_code_like: smart_code_pattern,
      ...options
    });
  },

  /**
   * Get transaction with full audit trail (original + reversals)
   */
  getAuditTrail: async (
    organization_id: string,
    transaction_id: string
  ) => {
    // Get original transaction
    const original = await txnClientV2.read({
      organization_id,
      transaction_id,
      include_lines: true
    });

    // Find reversals of this transaction
    const reversals = await txnClientV2.query({
      organization_id,
      smart_code_like: 'REVERSE',
      include_lines: true
    });

    // Filter reversals that reference this transaction
    const relatedReversals = reversals.transactions.filter((txn: any) =>
      txn.metadata?.reversal_of === transaction_id
    );

    return {
      original: original.transaction,
      reversals: relatedReversals,
      audit_complete: true
    };
  },

  /**
   * Create a correction transaction (reverse + new)
   */
  correctTransaction: async (
    organization_id: string,
    original_transaction_id: string,
    correction_reason: string,
    new_transaction_data: TxnEmit
  ) => {
    // Step 1: Reverse the original
    const reversal = await txnClientV2.reverse({
      organization_id,
      original_transaction_id,
      smart_code: generateReversalSmartCode(new_transaction_data.smart_code),
      reason: `CORRECTION: ${correction_reason}`
    });

    // Step 2: Create the corrected transaction
    const corrected = await txnClientV2.emit({
      ...new_transaction_data,
      business_context: {
        ...new_transaction_data.business_context,
        correction_of: original_transaction_id,
        reversal_transaction_id: reversal.reversal_transaction_id,
        correction_reason
      }
    });

    return {
      reversal_transaction_id: reversal.reversal_transaction_id,
      corrected_transaction_id: corrected.transaction_id,
      original_transaction_id
    };
  },

  /**
   * Validate transaction balance (for financial transactions)
   */
  validateBalance: (lines: TxnEmitLine[], tolerance: number = 0.01): boolean => {
    const balances: Record<string, { debits: number; credits: number }> = {};

    lines.forEach(line => {
      if (!line.dr_cr || !line.line_amount) return;

      const currency = 'default'; // Multi-currency support can be added
      if (!balances[currency]) {
        balances[currency] = { debits: 0, credits: 0 };
      }

      if (line.dr_cr.toUpperCase() === 'DR') {
        balances[currency].debits += line.line_amount;
      } else if (line.dr_cr.toUpperCase() === 'CR') {
        balances[currency].credits += line.line_amount;
      }
    });

    return Object.values(balances).every(balance =>
      Math.abs(balance.debits - balance.credits) <= tolerance
    );
  },

  /**
   * Generate standard reversal smart code
   */
  generateReversalSmartCode: (originalSmartCode: string): string => {
    const parts = originalSmartCode.split('.');
    if (parts.length >= 2) {
      parts[parts.length - 2] = 'REVERSE';
    }
    return parts.join('.');
  }
};

// Utility function for smart code generation
function generateReversalSmartCode(originalSmartCode: string): string {
  const parts = originalSmartCode.split('.');
  if (parts.length >= 2) {
    parts[parts.length - 2] = 'REVERSE';
  }
  return parts.join('.');
}

// Export types for external use
export type {
  TxnRead,
  TxnReadResponse,
  TxnQuery,
  TxnQueryResponse,
  TxnReverse,
  TxnReverseResponse,
  TxnEmit,
  TxnEmitLine
} from '../schemas/txn-schemas';

// Transaction states for business logic
export const TRANSACTION_STATES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REVERSED: 'REVERSED',
  REVERSAL: 'REVERSAL'
} as const;

// Common transaction types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  PAYMENT: 'payment',
  RECEIPT: 'receipt',
  JOURNAL: 'journal_entry',
  APPOINTMENT: 'appointment',
  SERVICE: 'service',
  INVENTORY: 'inventory_movement',
  BUDGET: 'budget_line',
  FORECAST: 'forecast_line'
} as const;

// Common smart code patterns
export const SMART_CODE_PATTERNS = {
  SALE: 'HERA.*.SALES.*.*.V*',
  PURCHASE: 'HERA.*.PURCHASE.*.*.V*',
  PAYMENT: 'HERA.*.PAYMENT.*.*.V*',
  JOURNAL: 'HERA.*.FINANCE.JOURNAL.*.V*',
  REVERSAL: 'HERA.*.*.REVERSAL.*.V*'
} as const;