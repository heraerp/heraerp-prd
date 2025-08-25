import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLedgerClient, makeExternalRef, IdempotencyManager } from '../index';
import type { LedgerRequest, SimulateResponse, PostResponse } from '../../engine/contracts/dto';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'test-uuid-1234',
} as any;

describe('HERA SDK', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HTTP Client', () => {
    it('should inject required headers', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
        apiKey: 'sk_test_123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: { header: {}, lines: [] },
        }),
      });

      await client.simulate({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/ledger/simulate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers),
        })
      );

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('X-Organization-Id')).toBe('org-123');
      expect(headers.get('Authorization')).toBe('Bearer sk_test_123');
    });

    it('should handle timeout', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
        timeoutMs: 100,
      });

      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const result = await client.simulate({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('E_UPSTREAM');
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on E_UPSTREAM with exponential backoff', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
        retry: {
          maxAttempts: 3,
          baseDelayMs: 10, // Fast for tests
          maxDelayMs: 50,
        },
      });

      let attempt = 0;
      mockFetch.mockImplementation(async () => {
        attempt++;
        if (attempt < 3) {
          return {
            ok: false,
            status: 502,
            headers: new Headers(),
            json: async () => ({
              success: false,
              error: {
                code: 'E_UPSTREAM',
                message: 'Database connection failed',
                retryable: true,
              },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: { transaction_id: 'txn-123' },
          }),
        };
      });

      const start = Date.now();
      const result = await client.post({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });

      const duration = Date.now() - start;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.transaction_id).toBe('txn-123');
      }
      // Should have some delay due to backoff
      expect(duration).toBeGreaterThan(10);
    });

    it('should not retry on non-retryable errors', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
        retry: { maxAttempts: 3 },
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers(),
        json: async () => ({
          success: false,
          error: {
            code: 'E_UNBALANCED',
            message: 'Journal entry is not balanced',
            retryable: false,
          },
        }),
      });

      const result = await client.post({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('E_UNBALANCED');
      }
    });

    it('should honor Retry-After header', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
        retry: {
          maxAttempts: 2,
          baseDelayMs: 1000, // Would normally be 1 second
        },
      });

      let attempt = 0;
      mockFetch.mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          const headers = new Headers();
          headers.set('Retry-After', '0.05'); // 50ms
          return {
            ok: false,
            status: 409,
            headers,
            json: async () => ({
              success: false,
              error: {
                code: 'E_PERIOD_CLOSED',
                message: 'Period is closed',
                retryable: true,
              },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            success: true,
            data: { transaction_id: 'txn-123' },
          }),
        };
      });

      const start = Date.now();
      await client.post({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });
      const duration = Date.now() - start;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Should use Retry-After value (50ms) instead of backoff (1000ms)
      expect(duration).toBeLessThan(200);
      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Idempotency', () => {
    it('should handle idempotent responses', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
      });

      // First call - returns with idempotent flag
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: { transaction_id: 'existing-txn-123' },
          meta: { idempotent: true },
        }),
      });

      const request: Omit<LedgerRequest, 'external_reference'> = {
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      };

      const result1 = await client.postWithIdempotency({
        ...request,
        external_reference: 'order-456',
      });

      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.data.transaction_id).toBe('existing-txn-123');
        expect(result1.meta?.idempotent).toBe(true);
      }

      // Second call - should return cached result without hitting API
      const result2 = await client.postWithIdempotency({
        ...request,
        external_reference: 'order-456',
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // Not called again
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.data.transaction_id).toBe('existing-txn-123');
        expect(result2.meta?.cached).toBe(true);
      }
    });

    it('should generate external reference if not provided', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: { transaction_id: 'new-txn-123' },
        }),
      });

      const result = await client.postWithIdempotency({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });

      expect(result.ok).toBe(true);
      
      // Check that external reference was generated
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.external_reference).toBe('test-uuid-1234');
    });

    it('should handle E_IDEMPOTENT error code', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
      });

      // Server returns E_IDEMPOTENT error (shouldn't happen but handle it)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: false,
          error: {
            code: 'E_IDEMPOTENT',
            message: 'Duplicate external reference',
            context: {
              transaction_id: 'existing-txn-789',
            },
          },
        }),
      });

      const result = await client.postWithIdempotency({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
        external_reference: 'duplicate-ref',
      });

      // Should convert to success
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.transaction_id).toBe('existing-txn-789');
        expect(result.meta?.idempotent).toBe(true);
      }
    });
  });

  describe('Simulate and Post', () => {
    it('should simulate successfully', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
      });

      const mockResponse: SimulateResponse = {
        header: {
          organization_id: 'org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.SALE.v1',
          transaction_currency_code: 'USD',
          base_currency_code: 'USD',
          total_amount: 100,
        },
        lines: [
          {
            entity_id: 'account-1',
            line_type: 'debit',
            line_amount: 100,
            smart_code: 'HERA.FIN.GL.LINE.v1',
          },
          {
            entity_id: 'account-2',
            line_type: 'credit',
            line_amount: 100,
            smart_code: 'HERA.FIN.GL.LINE.v1',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          success: true,
          data: mockResponse,
        }),
      });

      const result = await client.simulate({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'USD',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.header).toEqual(mockResponse.header);
        expect(result.data.lines).toHaveLength(2);
      }
    });

    it('should handle validation errors', async () => {
      const client = createLedgerClient({
        baseUrl: 'https://api.example.com',
        organizationId: 'org-123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({
          success: false,
          error: {
            code: 'E_GUARDRAIL',
            message: 'Invalid request',
            details: {
              issues: [
                {
                  path: 'currency',
                  message: 'Invalid ISO 4217 currency code',
                },
              ],
            },
          },
        }),
      });

      const result = await client.post({
        organization_id: 'org-123',
        event_smart_code: 'HERA.POS.SALE.v1',
        total_amount: 100,
        currency: 'INVALID',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('E_GUARDRAIL');
        expect(result.error.details).toBeDefined();
      }
    });
  });

  describe('External Reference Generation', () => {
    it('should generate UUID format', () => {
      const ref = makeExternalRef();
      expect(ref).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should support namespace prefix', () => {
      const ref = makeExternalRef({ namespace: 'order' });
      expect(ref).toMatch(/^order:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('Idempotency Storage', () => {
    it('should store and retrieve transaction IDs', () => {
      const manager = new IdempotencyManager();
      
      manager.remember('ref-1', 'txn-1');
      expect(manager.recall('ref-1')).toBe('txn-1');
      expect(manager.recall('ref-2')).toBeNull();
      
      manager.forget('ref-1');
      expect(manager.recall('ref-1')).toBeNull();
    });

    it('should check and set atomically', () => {
      const manager = new IdempotencyManager();
      
      const result1 = manager.checkAndSet('ref-1', 'txn-1');
      expect(result1.exists).toBe(false);
      
      const result2 = manager.checkAndSet('ref-1', 'txn-2');
      expect(result2.exists).toBe(true);
      expect(result2.existingTxnId).toBe('txn-1');
    });
  });
});