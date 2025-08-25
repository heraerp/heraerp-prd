/**
 * HERA Ledger Engine Error System
 * Unified error handling with Result monad pattern
 */

// Error code string union
export type HeraErrorCode =
  | 'E_ORG_REQUIRED'        // missing organization_id
  | 'E_SMART_CODE_REQUIRED' // required smart_code not set (entity/txn/line)
  | 'E_SCHEMA'              // no posting schema found for event/org
  | 'E_DIM_MISSING'         // required dimensions missing
  | 'E_TAX_PROFILE'         // tax profile not bound / invalid
  | 'E_RATE_RESOLUTION'     // tax rate could not be resolved
  | 'E_UNBALANCED'          // debits != credits
  | 'E_PERIOD_CLOSED'       // posting period closed
  | 'E_NOT_FOUND'           // referenced entity/account not found
  | 'E_IDEMPOTENT'          // duplicate external_reference detected
  | 'E_GUARDRAIL'           // violated guardrail (org/smart_code/etc)
  | 'E_UPSTREAM'            // provider/network dependency failed
  | 'E_INTERNAL';           // unexpected error

// Error structure
export type HeraError = {
  code: HeraErrorCode;
  message: string;
  details?: Record<string, unknown>;
  hint?: string;
  context?: {
    organization_id?: string;
    event_smart_code?: string;
    transaction_id?: string;
    external_reference?: string;
  };
};

// Result type for functional error handling
export type Result<T> = 
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; error: HeraError };

/**
 * Create an error result
 */
export function makeError(
  code: HeraErrorCode,
  message: string,
  extras?: Partial<HeraError>
): Result<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      ...extras
    }
  };
}

/**
 * Create a success result
 */
export function ok<T>(
  data: T,
  meta?: Record<string, unknown>
): Result<T> {
  return {
    ok: true,
    data,
    ...(meta && { meta })
  };
}

/**
 * Type guard for success results
 */
export function isOk<T>(result: Result<T>): result is { ok: true; data: T; meta?: Record<string, unknown> } {
  return result.ok === true;
}

/**
 * Type guard for error results
 */
export function isError<T>(result: Result<T>): result is { ok: false; error: HeraError } {
  return result.ok === false;
}

/**
 * Map a successful result to a new value
 */
export function mapResult<T, U>(
  result: Result<T>,
  fn: (data: T) => U
): Result<U> {
  if (isOk(result)) {
    return ok(fn(result.data), result.meta);
  }
  return result;
}

/**
 * Chain results together (monadic bind)
 */
export async function chainResult<T, U>(
  result: Result<T>,
  fn: (data: T) => Promise<Result<U>> | Result<U>
): Promise<Result<U>> {
  if (isOk(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Combine multiple results into one
 */
export function combineResults<T extends ReadonlyArray<unknown>>(
  results: { [K in keyof T]: Result<T[K]> }
): Result<T> {
  const errors: HeraError[] = [];
  const values: unknown[] = [];
  
  for (const result of results) {
    if (isError(result)) {
      errors.push(result.error);
    } else {
      values.push(result.data);
    }
  }
  
  if (errors.length > 0) {
    return makeError(
      'E_INTERNAL',
      `Multiple errors occurred: ${errors.map(e => e.message).join(', ')}`,
      {
        details: { errors }
      }
    );
  }
  
  return ok(values as T);
}

/**
 * Extract value or throw
 */
export function unwrapResult<T>(result: Result<T>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw new Error(`Result error: ${result.error.code} - ${result.error.message}`);
}