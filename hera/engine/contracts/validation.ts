/**
 * Validation utilities for HERA Ledger Engine
 * Pure functional validators for business rules
 */

import { Result, ok, makeError } from './errors';
import { LedgerLine, DimensionData } from './dto';

/**
 * Check if required dimensions are present in ledger lines
 */
export function requireDims(
  lines: LedgerLine[],
  required: string[]
): Result<true> {
  const missingByLine: Array<{ lineIndex: number; missing: string[] }> = [];

  lines.forEach((line, index) => {
    const dimensions = line.line_data?.dimensions as DimensionData | undefined;
    const missing = required.filter(dim => !dimensions?.[dim as keyof DimensionData]);
    
    if (missing.length > 0) {
      missingByLine.push({ lineIndex: index, missing });
    }
  });

  if (missingByLine.length > 0) {
    return makeError(
      'E_DIM_MISSING',
      'Required dimensions are missing from ledger lines',
      {
        details: { missingByLine, requiredDimensions: required },
        hint: `Ensure all lines have the required dimensions: ${required.join(', ')}`
      }
    );
  }

  return ok(true);
}

/**
 * Assert that ledger lines are balanced
 */
export function assertBalanced(
  lines: LedgerLine[],
  tolerance: number = 0.005
): Result<true> {
  // Group by currency if multi-currency
  const byCurrency = new Map<string, { debits: number; credits: number }>();
  
  lines.forEach(line => {
    const currency = line.line_data?.currency || 'DEFAULT';
    const current = byCurrency.get(currency) || { debits: 0, credits: 0 };
    
    if (line.line_type === 'debit') {
      current.debits += line.line_amount;
    } else {
      current.credits += line.line_amount;
    }
    
    byCurrency.set(currency, current);
  });

  // Check balance for each currency
  const imbalances: Array<{ currency: string; debits: number; credits: number; difference: number }> = [];
  
  for (const [currency, totals] of byCurrency) {
    const difference = Math.abs(totals.debits - totals.credits);
    
    if (difference > tolerance) {
      imbalances.push({
        currency,
        debits: totals.debits,
        credits: totals.credits,
        difference
      });
    }
  }

  if (imbalances.length > 0) {
    return makeError(
      'E_UNBALANCED',
      'Journal entry is not balanced',
      {
        details: { imbalances, tolerance },
        hint: 'Ensure total debits equal total credits for each currency'
      }
    );
  }

  return ok(true);
}

/**
 * Guard against duplicate external references (idempotency)
 */
export async function guardIdempotency(
  checkFn: (extRef: string) => Promise<string | null>,
  external_reference?: string
): Promise<Result<{ existing_transaction_id?: string }>> {
  // No external reference means no idempotency check
  if (!external_reference) {
    return ok({});
  }

  try {
    const existingId = await checkFn(external_reference);
    
    if (existingId) {
      // Return as error with special handling
      return makeError(
        'E_IDEMPOTENT',
        'Transaction with this external reference already exists',
        {
          context: {
            external_reference,
            transaction_id: existingId
          }
        }
      );
    }

    return ok({});
  } catch (error) {
    return makeError(
      'E_UPSTREAM',
      'Failed to check idempotency',
      {
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    );
  }
}

/**
 * Validate account exists and is active
 */
export function validateAccount(
  account: { id: string; status?: string; entity_type?: string } | null
): Result<true> {
  if (!account) {
    return makeError(
      'E_NOT_FOUND',
      'Account not found',
      {
        hint: 'Ensure the account entity exists and is accessible'
      }
    );
  }

  if (account.status && account.status !== 'active') {
    return makeError(
      'E_GUARDRAIL',
      'Account is not active',
      {
        details: { accountId: account.id, status: account.status },
        hint: 'Only active accounts can be used in journal entries'
      }
    );
  }

  if (account.entity_type && account.entity_type !== 'account') {
    return makeError(
      'E_GUARDRAIL',
      'Entity is not an account',
      {
        details: { entityId: account.id, entityType: account.entity_type },
        hint: 'Only entities with type "account" can be used in journal entries'
      }
    );
  }

  return ok(true);
}

/**
 * Validate posting period is open
 */
export function validatePeriod(
  period: { code: string; status: string; start_date: string; end_date: string } | null,
  postingDate: Date = new Date()
): Result<true> {
  if (!period) {
    // No period means unrestricted posting
    return ok(true);
  }

  if (period.status !== 'open') {
    return makeError(
      'E_PERIOD_CLOSED',
      `Posting period ${period.code} is ${period.status}`,
      {
        details: { 
          periodCode: period.code, 
          status: period.status,
          postingDate: postingDate.toISOString()
        },
        hint: 'Wait for the period to be opened or post to a different period'
      }
    );
  }

  // Check if posting date is within period
  const start = new Date(period.start_date);
  const end = new Date(period.end_date);
  
  if (postingDate < start || postingDate > end) {
    return makeError(
      'E_GUARDRAIL',
      'Posting date is outside the period range',
      {
        details: {
          postingDate: postingDate.toISOString(),
          periodStart: period.start_date,
          periodEnd: period.end_date
        },
        hint: 'Use a posting date within the period range'
      }
    );
  }

  return ok(true);
}

/**
 * Validate smart code format
 */
export function validateSmartCode(smartCode: string): Result<true> {
  const pattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/;
  
  if (!pattern.test(smartCode)) {
    return makeError(
      'E_SMART_CODE_REQUIRED',
      'Invalid smart code format',
      {
        details: { providedCode: smartCode },
        hint: 'Use format: HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.v1'
      }
    );
  }

  return ok(true);
}

/**
 * Batch validate multiple conditions
 */
export async function validateAll(
  ...validators: Array<Result<any> | Promise<Result<any>>>
): Promise<Result<true>> {
  const results = await Promise.all(validators);
  
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
  }
  
  return ok(true);
}

/**
 * Create a dimension validator for specific requirements
 */
export function createDimensionValidator(
  requirements: Array<{
    accountPattern: RegExp;
    requiredDimensions: string[];
    enforcement: 'error' | 'warning' | 'auto_default';
  }>
) {
  return (accountCode: string, line: LedgerLine): Result<true> => {
    for (const req of requirements) {
      if (req.accountPattern.test(accountCode)) {
        if (req.enforcement === 'error') {
          return requireDims([line], req.requiredDimensions);
        }
        // For warning/auto_default, we don't fail validation
      }
    }
    return ok(true);
  };
}