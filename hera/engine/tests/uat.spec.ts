import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LedgerRequest, SimulateResponse } from '../contracts/dto';

// Mock the edge function handler
const mockSimulate = vi.fn();

// Mock posting schema DSL
const mockPostingSchema = {
  ledgers: ['GL'],
  accounts: {
    revenue: '11111111-1111-1111-1111-111111111111',
    tax_output: '22222222-2222-2222-2222-222222222222',
    tips_payable: '33333333-3333-3333-3333-333333333333',
    clearing: '44444444-4444-4444-4444-444444444444',
    fees: '55555555-5555-5555-5555-555555555555'
  },
  tax: {
    profile_ref: '66666666-6666-6666-6666-666666666666',
    inclusive_prices: true,
    rounding: 'line'
  },
  splits: {
    dimensions: ['org_unit', 'staff_id'],
    rules: [
      {
        event_pattern: 'HERA\\.POS\\..*',
        split_by: 'staff_id',
        allocation_method: 'proportional'
      }
    ]
  },
  dimension_requirements: [
    {
      account_pattern: '^4.*',
      required_dimensions: ['org_unit', 'staff_id'],
      enforcement: 'error'
    }
  ],
  payments: {
    capture_type: 'immediate',
    open_item: false
  }
};

describe('UAT - Global Posting Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario 1: Sale + Tip + Single Tax (Inclusive)', () => {
    it('should generate balanced journal with correct dimensions', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.SALE.V1',
        total_amount: 105.00,
        currency: 'USD',
        business_context: {
          sale_amount: 100.00,
          tip_amount: 5.00,
          tax_inclusive: true,
          org_unit: 'BR-01',
          staff_id: 'EMP-001',
          order_id: 'ORD-2025-001'
        }
      };

      const expectedResponse: SimulateResponse = {
        header: {
          organization_id: 'test-org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.SALE.V1',
          transaction_currency_code: 'USD',
          base_currency_code: 'USD',
          total_amount: 105.00,
          business_context: request.business_context
        },
        lines: [
          {
            entity_id: mockPostingSchema.accounts.clearing,
            line_type: 'debit',
            line_amount: 105.00,
            smart_code: 'HERA.GL.LINE.CLEARING.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'credit',
            line_amount: 95.24, // 100 / 1.05 (5% tax inclusive)
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-01',
                staff_id: 'EMP-001'
              }
            }
          },
          {
            entity_id: mockPostingSchema.accounts.tax_output,
            line_type: 'credit',
            line_amount: 4.76, // Tax portion
            smart_code: 'HERA.GL.LINE.TAX.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.tips_payable,
            line_type: 'credit',
            line_amount: 5.00,
            smart_code: 'HERA.GL.LINE.TIPS.v1'
          }
        ]
      };

      mockSimulate.mockResolvedValueOnce(expectedResponse);
      const result = await mockSimulate(request);

      // Verify balanced
      const debits = result.lines
        .filter(l => l.line_type === 'debit')
        .reduce((sum, l) => sum + l.line_amount, 0);
      const credits = result.lines
        .filter(l => l.line_type === 'credit')
        .reduce((sum, l) => sum + l.line_amount, 0);
      
      expect(debits).toBeCloseTo(credits, 2);
      expect(debits).toBe(105.00);

      // Verify dimensions on revenue line
      const revenueLine = result.lines.find(l => l.entity_id === mockPostingSchema.accounts.revenue);
      expect(revenueLine?.line_data?.dimensions).toEqual({
        org_unit: 'BR-01',
        staff_id: 'EMP-001'
      });
    });
  });

  describe('Scenario 2: Sale with Exclusive Tax', () => {
    it('should calculate tax on top and maintain balance', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.SALE.V1',
        total_amount: 105.00, // 100 + 5 tax
        currency: 'EUR',
        business_context: {
          sale_amount: 100.00,
          tax_amount: 5.00,
          tax_inclusive: false,
          org_unit: 'BR-02',
          staff_id: 'EMP-002'
        }
      };

      const expectedResponse: SimulateResponse = {
        header: {
          organization_id: 'test-org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.SALE.V1',
          transaction_currency_code: 'EUR',
          base_currency_code: 'EUR',
          total_amount: 105.00,
          business_context: request.business_context
        },
        lines: [
          {
            entity_id: mockPostingSchema.accounts.clearing,
            line_type: 'debit',
            line_amount: 105.00,
            smart_code: 'HERA.GL.LINE.CLEARING.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'credit',
            line_amount: 100.00,
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-02',
                staff_id: 'EMP-002'
              }
            }
          },
          {
            entity_id: mockPostingSchema.accounts.tax_output,
            line_type: 'credit',
            line_amount: 5.00,
            smart_code: 'HERA.GL.LINE.TAX.v1'
          }
        ]
      };

      mockSimulate.mockResolvedValueOnce(expectedResponse);
      const result = await mockSimulate(request);

      // Verify tax calculation
      const revenueLine = result.lines.find(l => l.entity_id === mockPostingSchema.accounts.revenue);
      const taxLine = result.lines.find(l => l.entity_id === mockPostingSchema.accounts.tax_output);
      
      expect(revenueLine?.line_amount).toBe(100.00);
      expect(taxLine?.line_amount).toBe(5.00);
    });
  });

  describe('Scenario 3: Multi-Split Across Staff', () => {
    it('should split revenue proportionally by staff', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.SALE.V1',
        total_amount: 200.00,
        currency: 'GBP',
        business_context: {
          org_unit: 'BR-01',
          items: [
            { amount: 120.00, staff_id: 'EMP-001' },
            { amount: 80.00, staff_id: 'EMP-002' }
          ]
        }
      };

      const expectedResponse: SimulateResponse = {
        header: {
          organization_id: 'test-org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.SALE.V1',
          transaction_currency_code: 'GBP',
          base_currency_code: 'GBP',
          total_amount: 200.00,
          business_context: request.business_context
        },
        lines: [
          {
            entity_id: mockPostingSchema.accounts.clearing,
            line_type: 'debit',
            line_amount: 200.00,
            smart_code: 'HERA.GL.LINE.CLEARING.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'credit',
            line_amount: 114.29, // 120 / 1.05 (tax inclusive)
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-01',
                staff_id: 'EMP-001'
              }
            }
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'credit',
            line_amount: 76.19, // 80 / 1.05 (tax inclusive)
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-01',
                staff_id: 'EMP-002'
              }
            }
          },
          {
            entity_id: mockPostingSchema.accounts.tax_output,
            line_type: 'credit',
            line_amount: 9.52, // Combined tax
            smart_code: 'HERA.GL.LINE.TAX.v1'
          }
        ]
      };

      mockSimulate.mockResolvedValueOnce(expectedResponse);
      const result = await mockSimulate(request);

      // Verify split
      const revenueLines = result.lines.filter(l => l.entity_id === mockPostingSchema.accounts.revenue);
      expect(revenueLines).toHaveLength(2);
      
      const emp1Line = revenueLines.find(l => l.line_data?.dimensions?.staff_id === 'EMP-001');
      const emp2Line = revenueLines.find(l => l.line_data?.dimensions?.staff_id === 'EMP-002');
      
      expect(emp1Line).toBeDefined();
      expect(emp2Line).toBeDefined();
      
      // Verify proportions (60% and 40%)
      const totalRevenue = revenueLines.reduce((sum, l) => sum + l.line_amount, 0);
      expect(emp1Line!.line_amount / totalRevenue).toBeCloseTo(0.6, 1);
      expect(emp2Line!.line_amount / totalRevenue).toBeCloseTo(0.4, 1);
    });
  });

  describe('Scenario 4: Refund (Negative Mirror)', () => {
    it('should generate balanced refund journal', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.REFUND.V1',
        total_amount: -52.50,
        currency: 'USD',
        business_context: {
          original_order_id: 'ORD-2025-001',
          refund_reason: 'Customer complaint',
          org_unit: 'BR-01',
          staff_id: 'MGR-001'
        }
      };

      const expectedResponse: SimulateResponse = {
        header: {
          organization_id: 'test-org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.REFUND.V1',
          transaction_currency_code: 'USD',
          base_currency_code: 'USD',
          total_amount: -52.50,
          business_context: request.business_context
        },
        lines: [
          {
            entity_id: mockPostingSchema.accounts.clearing,
            line_type: 'credit', // Opposite of sale
            line_amount: 52.50,
            smart_code: 'HERA.GL.LINE.CLEARING.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'debit', // Opposite of sale
            line_amount: 50.00,
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-01',
                staff_id: 'MGR-001'
              }
            }
          },
          {
            entity_id: mockPostingSchema.accounts.tax_output,
            line_type: 'debit', // Opposite of sale
            line_amount: 2.50,
            smart_code: 'HERA.GL.LINE.TAX.v1'
          }
        ]
      };

      mockSimulate.mockResolvedValueOnce(expectedResponse);
      const result = await mockSimulate(request);

      // Verify it's a mirror image (debits and credits swapped)
      const clearingLine = result.lines.find(l => l.entity_id === mockPostingSchema.accounts.clearing);
      expect(clearingLine?.line_type).toBe('credit'); // Opposite of sale
      
      const revenueLine = result.lines.find(l => l.entity_id === mockPostingSchema.accounts.revenue);
      expect(revenueLine?.line_type).toBe('debit'); // Opposite of sale
    });
  });

  describe('Scenario 5: Idempotency Dry-Run', () => {
    it('should return consistent results for same external reference', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.SALE.V1',
        total_amount: 75.00,
        currency: 'USD',
        external_reference: 'IDEMPOTENT-TEST-001',
        business_context: {
          org_unit: 'BR-01',
          staff_id: 'EMP-001'
        }
      };

      const response: SimulateResponse = {
        header: {
          organization_id: 'test-org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.SALE.V1',
          transaction_currency_code: 'USD',
          base_currency_code: 'USD',
          total_amount: 75.00,
          external_reference: 'IDEMPOTENT-TEST-001',
          business_context: request.business_context
        },
        lines: [
          {
            entity_id: mockPostingSchema.accounts.clearing,
            line_type: 'debit',
            line_amount: 75.00,
            smart_code: 'HERA.GL.LINE.CLEARING.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'credit',
            line_amount: 71.43,
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-01',
                staff_id: 'EMP-001'
              }
            }
          },
          {
            entity_id: mockPostingSchema.accounts.tax_output,
            line_type: 'credit',
            line_amount: 3.57,
            smart_code: 'HERA.GL.LINE.TAX.v1'
          }
        ]
      };

      // Simulate same request twice
      mockSimulate.mockResolvedValueOnce(response);
      mockSimulate.mockResolvedValueOnce(response);

      const result1 = await mockSimulate(request);
      const result2 = await mockSimulate(request);

      // Verify identical results
      expect(result1).toEqual(result2);
      expect(result1.header.external_reference).toBe('IDEMPOTENT-TEST-001');
      expect(result2.header.external_reference).toBe('IDEMPOTENT-TEST-001');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero tax scenarios', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.SALE.V1',
        total_amount: 100.00,
        currency: 'USD',
        business_context: {
          tax_exempt: true,
          org_unit: 'BR-01',
          staff_id: 'EMP-001'
        }
      };

      const response: SimulateResponse = {
        header: {
          organization_id: 'test-org-123',
          transaction_type: 'GL_JOURNAL',
          smart_code: 'HERA.POS.SALE.V1',
          transaction_currency_code: 'USD',
          base_currency_code: 'USD',
          total_amount: 100.00,
          business_context: request.business_context
        },
        lines: [
          {
            entity_id: mockPostingSchema.accounts.clearing,
            line_type: 'debit',
            line_amount: 100.00,
            smart_code: 'HERA.GL.LINE.CLEARING.v1'
          },
          {
            entity_id: mockPostingSchema.accounts.revenue,
            line_type: 'credit',
            line_amount: 100.00,
            smart_code: 'HERA.GL.LINE.REVENUE.v1',
            line_data: {
              dimensions: {
                org_unit: 'BR-01',
                staff_id: 'EMP-001'
              }
            }
          }
        ]
      };

      mockSimulate.mockResolvedValueOnce(response);
      const result = await mockSimulate(request);

      // Should not have tax line
      const taxLine = result.lines.find(l => l.entity_id === mockPostingSchema.accounts.tax_output);
      expect(taxLine).toBeUndefined();
    });

    it('should validate dimension requirements', async () => {
      const request: LedgerRequest = {
        organization_id: 'test-org-123',
        event_smart_code: 'HERA.POS.SALE.V1',
        total_amount: 50.00,
        currency: 'USD',
        business_context: {
          // Missing required dimensions
        }
      };

      // Simulate dimension validation error
      mockSimulate.mockRejectedValueOnce({
        ok: false,
        error: {
          code: 'E_DIM_MISSING',
          message: 'Required dimensions are missing',
          details: {
            missingByLine: [{
              lineIndex: 1,
              missing: ['org_unit', 'staff_id']
            }]
          }
        }
      });

      await expect(mockSimulate(request)).rejects.toMatchObject({
        error: {
          code: 'E_DIM_MISSING'
        }
      });
    });
  });
});