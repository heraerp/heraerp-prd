import { describe, it, expect } from 'vitest';
import { 
  makeError, 
  ok, 
  isOk, 
  isError, 
  mapResult, 
  chainResult,
  combineResults
} from '../contracts/errors';
import { toHttpResponse, isRetryable, getHttpStatus } from '../contracts/http';
import { 
  LedgerRequestSchema, 
  LedgerLineSchema,
  parseLedgerRequest,
  createSimpleJournal
} from '../contracts/dto';
import { 
  requireDims, 
  assertBalanced, 
  guardIdempotency,
  validateAccount,
  validatePeriod,
  validateSmartCode,
  validateAll
} from '../contracts/validation';

describe('Error System', () => {
  describe('Result Monad', () => {
    it('should create success results', () => {
      const result = ok({ value: 42 });
      expect(isOk(result)).toBe(true);
      expect(result.ok).toBe(true);
      if (isOk(result)) {
        expect(result.data).toEqual({ value: 42 });
      }
    });

    it('should create success results with meta', () => {
      const result = ok({ id: '123' }, { cached: true });
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.meta).toEqual({ cached: true });
      }
    });

    it('should create error results', () => {
      const result = makeError('E_NOT_FOUND', 'Entity not found');
      expect(isError(result)).toBe(true);
      expect(result.ok).toBe(false);
      if (isError(result)) {
        expect(result.error.code).toBe('E_NOT_FOUND');
        expect(result.error.message).toBe('Entity not found');
      }
    });

    it('should create error results with extras', () => {
      const result = makeError('E_DIM_MISSING', 'Missing dimensions', {
        details: { missing: ['cost_center'] },
        hint: 'Add cost center to the line',
        context: { organization_id: '123' }
      });
      
      if (isError(result)) {
        expect(result.error.details).toEqual({ missing: ['cost_center'] });
        expect(result.error.hint).toBe('Add cost center to the line');
        expect(result.error.context?.organization_id).toBe('123');
      }
    });

    it('should map successful results', () => {
      const result = ok(5);
      const mapped = mapResult(result, x => x * 2);
      
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.data).toBe(10);
      }
    });

    it('should not map error results', () => {
      const result = makeError('E_INTERNAL', 'Error');
      const mapped = mapResult(result, x => x * 2);
      
      expect(isError(mapped)).toBe(true);
      if (isError(mapped)) {
        expect(mapped.error.code).toBe('E_INTERNAL');
      }
    });

    it('should chain results', async () => {
      const result1 = ok(5);
      const result2 = await chainResult(result1, async x => ok(x * 2));
      
      expect(isOk(result2)).toBe(true);
      if (isOk(result2)) {
        expect(result2.data).toBe(10);
      }
    });

    it('should stop chain on error', async () => {
      const result1 = makeError('E_NOT_FOUND', 'Not found');
      const result2 = await chainResult(result1, async x => ok(x * 2));
      
      expect(isError(result2)).toBe(true);
      if (isError(result2)) {
        expect(result2.error.code).toBe('E_NOT_FOUND');
      }
    });

    it('should combine multiple success results', () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = combineResults(results);
      
      expect(isOk(combined)).toBe(true);
      if (isOk(combined)) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it('should fail combination on any error', () => {
      const results = [ok(1), makeError('E_NOT_FOUND', 'Not found'), ok(3)];
      const combined = combineResults(results);
      
      expect(isError(combined)).toBe(true);
      if (isError(combined)) {
        expect(combined.error.code).toBe('E_INTERNAL');
        expect(combined.error.message).toContain('Multiple errors');
      }
    });
  });
});

describe('HTTP Mapping', () => {
  it('should map success results to HTTP 200', () => {
    const result = ok({ transaction_id: '123' });
    const response = toHttpResponse(result);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ transaction_id: '123' });
  });

  it('should map error codes to correct HTTP status', () => {
    const testCases = [
      { code: 'E_ORG_REQUIRED', status: 400 },
      { code: 'E_SCHEMA', status: 404 },
      { code: 'E_UNBALANCED', status: 422 },
      { code: 'E_PERIOD_CLOSED', status: 409 },
      { code: 'E_UPSTREAM', status: 502 },
      { code: 'E_INTERNAL', status: 500 },
    ] as const;

    for (const { code, status } of testCases) {
      const result = makeError(code, 'Test error');
      const response = toHttpResponse(result);
      expect(response.status).toBe(status);
      expect(response.body.success).toBe(false);
      expect(response.body.error?.code).toBe(code);
    }
  });

  it('should handle idempotency as success', () => {
    const result = makeError('E_IDEMPOTENT', 'Already exists', {
      context: { transaction_id: 'existing-123' }
    });
    const response = toHttpResponse(result);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ transaction_id: 'existing-123' });
    expect(response.body.meta).toEqual({ idempotent: true });
  });

  it('should mark appropriate errors as retryable', () => {
    expect(isRetryable('E_PERIOD_CLOSED')).toBe(true);
    expect(isRetryable('E_UPSTREAM')).toBe(true);
    expect(isRetryable('E_INTERNAL')).toBe(true);
    
    expect(isRetryable('E_ORG_REQUIRED')).toBe(false);
    expect(isRetryable('E_UNBALANCED')).toBe(false);
  });

  it('should get HTTP status for error codes', () => {
    expect(getHttpStatus('E_NOT_FOUND')).toBe(404);
    expect(getHttpStatus('E_GUARDRAIL')).toBe(400);
    expect(getHttpStatus('E_INTERNAL')).toBe(500);
  });
});

describe('DTO Validation', () => {
  describe('LedgerRequest Schema', () => {
    it('should validate valid ledger request', () => {
      const data = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        event_smart_code: 'HERA.POS.SALE.ORDER.COMPLETE.v1',
        total_amount: 100.50,
        currency: 'USD'
      };
      
      const result = parseLedgerRequest(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.simulate).toBe(false); // default
      }
    });

    it('should reject invalid UUID', () => {
      const data = {
        organization_id: 'not-a-uuid',
        event_smart_code: 'HERA.POS.SALE.ORDER.COMPLETE.v1',
        total_amount: 100,
        currency: 'USD'
      };
      
      const result = parseLedgerRequest(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid smart code', () => {
      const data = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        event_smart_code: 'INVALID_SMART_CODE',
        total_amount: 100,
        currency: 'USD'
      };
      
      const result = parseLedgerRequest(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid currency', () => {
      const data = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        event_smart_code: 'HERA.POS.SALE.ORDER.COMPLETE.v1',
        total_amount: 100,
        currency: 'US' // Should be 3 letters
      };
      
      const result = parseLedgerRequest(data);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const data = {
        organization_id: '123e4567-e89b-12d3-a456-426614174000',
        event_smart_code: 'HERA.POS.SALE.ORDER.COMPLETE.v1',
        total_amount: 100,
        currency: 'USD',
        external_reference: 'ORDER-123',
        simulate: true,
        business_context: { order_id: '123' }
      };
      
      const result = parseLedgerRequest(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.external_reference).toBe('ORDER-123');
        expect(result.data.simulate).toBe(true);
      }
    });
  });

  describe('LedgerLine Schema', () => {
    it('should validate valid ledger line', () => {
      const line = {
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        line_type: 'debit',
        line_amount: 100,
        smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
      };
      
      const result = LedgerLineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('should reject invalid line type', () => {
      const line = {
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        line_type: 'invalid',
        line_amount: 100,
        smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
      };
      
      const result = LedgerLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });

    it('should reject negative amounts', () => {
      const line = {
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        line_type: 'debit',
        line_amount: -100,
        smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
      };
      
      const result = LedgerLineSchema.safeParse(line);
      expect(result.success).toBe(false);
    });
  });

  describe('Journal Creation Helpers', () => {
    it('should create simple journal', () => {
      const journal = createSimpleJournal(
        '123e4567-e89b-12d3-a456-426614174000',
        'debit-account-id',
        'credit-account-id',
        100,
        'HERA.FIN.GL.JOURNAL.MANUAL.v1'
      );
      
      expect(journal.header.transaction_type).toBe('GL_JOURNAL');
      expect(journal.header.total_amount).toBe(100);
      expect(journal.lines).toHaveLength(2);
      expect(journal.lines[0].line_type).toBe('debit');
      expect(journal.lines[1].line_type).toBe('credit');
    });
  });
});

describe('Validation Utilities', () => {
  describe('Dimension Requirements', () => {
    it('should pass when all dimensions present', () => {
      const lines = [
        {
          entity_id: '123e4567-e89b-12d3-a456-426614174000',
          line_type: 'debit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1',
          line_data: {
            dimensions: {
              cost_center: 'CC001',
              location: 'LOC001'
            }
          }
        }
      ];
      
      const result = requireDims(lines, ['cost_center', 'location']);
      expect(isOk(result)).toBe(true);
    });

    it('should fail when dimensions missing', () => {
      const lines = [
        {
          entity_id: '123e4567-e89b-12d3-a456-426614174000',
          line_type: 'debit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1',
          line_data: {
            dimensions: {
              cost_center: 'CC001'
            }
          }
        }
      ];
      
      const result = requireDims(lines, ['cost_center', 'location']);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_DIM_MISSING');
        expect(result.error.details?.missingByLine).toHaveLength(1);
      }
    });
  });

  describe('Balance Validation', () => {
    it('should pass for balanced entries', () => {
      const lines = [
        {
          entity_id: 'account1',
          line_type: 'debit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        },
        {
          entity_id: 'account2',
          line_type: 'credit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        }
      ];
      
      const result = assertBalanced(lines);
      expect(isOk(result)).toBe(true);
    });

    it('should fail for unbalanced entries', () => {
      const lines = [
        {
          entity_id: 'account1',
          line_type: 'debit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        },
        {
          entity_id: 'account2',
          line_type: 'credit' as const,
          line_amount: 90,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        }
      ];
      
      const result = assertBalanced(lines);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_UNBALANCED');
      }
    });

    it('should respect tolerance', () => {
      const lines = [
        {
          entity_id: 'account1',
          line_type: 'debit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        },
        {
          entity_id: 'account2',
          line_type: 'credit' as const,
          line_amount: 100.004,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1'
        }
      ];
      
      const result = assertBalanced(lines, 0.005);
      expect(isOk(result)).toBe(true);
    });

    it('should handle multi-currency', () => {
      const lines = [
        {
          entity_id: 'account1',
          line_type: 'debit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1',
          line_data: { currency: 'USD' }
        },
        {
          entity_id: 'account2',
          line_type: 'credit' as const,
          line_amount: 100,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1',
          line_data: { currency: 'USD' }
        },
        {
          entity_id: 'account3',
          line_type: 'debit' as const,
          line_amount: 80,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1',
          line_data: { currency: 'EUR' }
        },
        {
          entity_id: 'account4',
          line_type: 'credit' as const,
          line_amount: 80,
          smart_code: 'HERA.FIN.GL.JOURNAL.LINE.v1',
          line_data: { currency: 'EUR' }
        }
      ];
      
      const result = assertBalanced(lines);
      expect(isOk(result)).toBe(true);
    });
  });

  describe('Idempotency Guard', () => {
    it('should pass when no existing transaction', async () => {
      const checkFn = async (ref: string) => null;
      const result = await guardIdempotency(checkFn, 'ORDER-123');
      expect(isOk(result)).toBe(true);
    });

    it('should return idempotent error when transaction exists', async () => {
      const checkFn = async (ref: string) => 'existing-txn-id';
      const result = await guardIdempotency(checkFn, 'ORDER-123');
      
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_IDEMPOTENT');
        expect(result.error.context?.transaction_id).toBe('existing-txn-id');
      }
    });

    it('should skip check when no external reference', async () => {
      const checkFn = async (ref: string) => 'should-not-be-called';
      const result = await guardIdempotency(checkFn, undefined);
      expect(isOk(result)).toBe(true);
    });

    it('should handle check function errors', async () => {
      const checkFn = async (ref: string) => {
        throw new Error('Database error');
      };
      const result = await guardIdempotency(checkFn, 'ORDER-123');
      
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_UPSTREAM');
      }
    });
  });

  describe('Account Validation', () => {
    it('should pass for valid active account', () => {
      const account = {
        id: '123',
        status: 'active',
        entity_type: 'account'
      };
      
      const result = validateAccount(account);
      expect(isOk(result)).toBe(true);
    });

    it('should fail for null account', () => {
      const result = validateAccount(null);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_NOT_FOUND');
      }
    });

    it('should fail for inactive account', () => {
      const account = {
        id: '123',
        status: 'inactive',
        entity_type: 'account'
      };
      
      const result = validateAccount(account);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_GUARDRAIL');
      }
    });

    it('should fail for non-account entity', () => {
      const account = {
        id: '123',
        status: 'active',
        entity_type: 'customer'
      };
      
      const result = validateAccount(account);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_GUARDRAIL');
      }
    });
  });

  describe('Period Validation', () => {
    it('should pass for open period', () => {
      const period = {
        code: '2025-01',
        status: 'open',
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      };
      
      const result = validatePeriod(period, new Date('2025-01-15'));
      expect(isOk(result)).toBe(true);
    });

    it('should pass when no period restriction', () => {
      const result = validatePeriod(null);
      expect(isOk(result)).toBe(true);
    });

    it('should fail for closed period', () => {
      const period = {
        code: '2025-01',
        status: 'closed',
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      };
      
      const result = validatePeriod(period);
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_PERIOD_CLOSED');
      }
    });

    it('should fail when date outside period', () => {
      const period = {
        code: '2025-01',
        status: 'open',
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      };
      
      const result = validatePeriod(period, new Date('2025-02-15'));
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_GUARDRAIL');
      }
    });
  });

  describe('Smart Code Validation', () => {
    it('should pass valid smart codes', () => {
      const validCodes = [
        'HERA.POS.SALE.ORDER.COMPLETE.v1',
        'HERA.FIN.GL.JOURNAL.MANUAL.v1',
        'HERA.INV.ADJUSTMENT.PHYSICAL.COUNT.v2'
      ];
      
      for (const code of validCodes) {
        const result = validateSmartCode(code);
        expect(isOk(result)).toBe(true);
      }
    });

    it('should fail invalid smart codes', () => {
      const invalidCodes = [
        'INVALID',
        'HERA.SALE',
        'hera.pos.sale.order.complete.v1', // lowercase
        'HERA.POS.SALE.ORDER.COMPLETE', // no version
        'HERA.POS.SALE.ORDER.COMPLETE.v' // incomplete version
      ];
      
      for (const code of invalidCodes) {
        const result = validateSmartCode(code);
        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.code).toBe('E_SMART_CODE_REQUIRED');
        }
      }
    });
  });

  describe('Batch Validation', () => {
    it('should pass when all validators pass', async () => {
      const result = await validateAll(
        ok(true),
        Promise.resolve(ok(true)),
        ok(true)
      );
      
      expect(isOk(result)).toBe(true);
    });

    it('should fail on first error', async () => {
      const result = await validateAll(
        ok(true),
        makeError('E_NOT_FOUND', 'Not found'),
        ok(true)
      );
      
      expect(isError(result)).toBe(true);
      if (isError(result)) {
        expect(result.error.code).toBe('E_NOT_FOUND');
      }
    });
  });
});