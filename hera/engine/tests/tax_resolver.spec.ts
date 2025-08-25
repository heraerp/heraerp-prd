import { describe, it, expect, vi } from 'vitest';
import { TaxResolver } from '../resolvers/tax_resolver';

describe('TaxResolver', () => {
  describe('Tax Calculation', () => {
    it('should calculate tax with inclusive prices', async () => {
      // Mock the tax profile
      vi.spyOn(TaxResolver as any, 'getActiveTaxProfile').mockResolvedValue({
        profileId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        jurisdiction: 'AE',
        inclusive_prices: true,
        rounding_method: 'line',
        rates: {
          standard: 5.0,
          zero: 0.0
        }
      });

      const request = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            entityId: '456e7890-e89b-12d3-a456-426614174000',
            amount: 105.00, // Gross amount including 5% VAT
            taxCategory: 'goods.standard'
          }
        ],
        transactionType: 'sale'
      };

      const result = await TaxResolver.calculateTax(request);

      expect(result.items[0].grossAmount).toBe(105.00);
      expect(result.items[0].netAmount).toBe(100.00);
      expect(result.items[0].taxAmount).toBe(5.00);
      expect(result.items[0].taxRate).toBe(5.0);
    });

    it('should calculate tax with exclusive prices', async () => {
      vi.spyOn(TaxResolver as any, 'getActiveTaxProfile').mockResolvedValue({
        profileId: 'test-profile',
        jurisdiction: 'US',
        inclusive_prices: false,
        rounding_method: 'line',
        rates: {
          standard: 8.75
        }
      });

      const request = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            entityId: '456e7890-e89b-12d3-a456-426614174000',
            amount: 100.00, // Net amount
            taxCategory: 'goods.standard'
          }
        ],
        transactionType: 'sale'
      };

      const result = await TaxResolver.calculateTax(request);

      expect(result.items[0].netAmount).toBe(100.00);
      expect(result.items[0].taxAmount).toBe(8.75);
      expect(result.items[0].grossAmount).toBe(108.75);
    });

    it('should handle zero-rated items', async () => {
      vi.spyOn(TaxResolver as any, 'getActiveTaxProfile').mockResolvedValue({
        profileId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        jurisdiction: 'AE',
        inclusive_prices: true,
        rounding_method: 'line',
        rates: {
          standard: 5.0,
          zero: 0.0
        }
      });

      const request = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            entityId: '456e7890-e89b-12d3-a456-426614174000',
            amount: 100.00,
            taxCategory: 'goods.export' // Zero-rated
          }
        ],
        transactionType: 'sale'
      };

      const result = await TaxResolver.calculateTax(request);

      expect(result.items[0].taxRate).toBe(0);
      expect(result.items[0].taxAmount).toBe(0);
      expect(result.items[0].grossAmount).toBe(100.00);
    });

    it('should handle multiple items with different rates', async () => {
      vi.spyOn(TaxResolver as any, 'getActiveTaxProfile').mockResolvedValue({
        profileId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        jurisdiction: 'AE',
        inclusive_prices: true,
        rounding_method: 'line',
        rates: {
          standard: 5.0,
          zero: 0.0
        }
      });

      const request = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            entityId: 'item1',
            amount: 105.00,
            taxCategory: 'goods.standard' // 5% VAT
          },
          {
            entityId: 'item2',
            amount: 200.00,
            taxCategory: 'goods.export' // 0% VAT
          },
          {
            entityId: 'item3',
            amount: 52.50,
            taxCategory: 'goods.standard' // 5% VAT
          }
        ],
        transactionType: 'sale'
      };

      const result = await TaxResolver.calculateTax(request);

      // Check totals
      expect(result.totals.grossTotal).toBe(357.50);
      expect(result.totals.taxTotal).toBe(7.50); // 5.00 + 0 + 2.50
      expect(result.totals.taxByRate['5%']).toBe(7.50);
      expect(result.totals.taxByRate['0%']).toBe(0);
    });

    it('should apply line-level rounding', async () => {
      vi.spyOn(TaxResolver as any, 'getActiveTaxProfile').mockResolvedValue({
        profileId: 'test',
        jurisdiction: 'AE',
        inclusive_prices: false,
        rounding_method: 'line',
        rates: {
          standard: 5.0
        }
      });

      const request = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            entityId: 'item1',
            amount: 33.33, // Will result in 1.6665 tax
          },
          {
            entityId: 'item2',
            amount: 66.67, // Will result in 3.3335 tax
          }
        ],
        transactionType: 'sale'
      };

      const result = await TaxResolver.calculateTax(request);

      // Line level rounding
      expect(result.items[0].taxAmount).toBe(1.67); // Rounded from 1.6665
      expect(result.items[1].taxAmount).toBe(3.33); // Rounded from 3.3335
      expect(result.totals.taxTotal).toBe(5.00);
    });

    it('should handle reverse charge', async () => {
      vi.spyOn(TaxResolver as any, 'getActiveTaxProfile').mockResolvedValue({
        profileId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        jurisdiction: 'AE',
        inclusive_prices: false,
        rounding_method: 'line',
        reverse_charge_applicable: true,
        rates: {
          standard: 5.0
        }
      });

      const request = {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            entityId: 'service1',
            amount: 1000.00,
            taxCategory: 'services.imported'
          }
        ],
        customerEntityId: 'b2b-customer-id',
        transactionType: 'purchase'
      };

      const result = await TaxResolver.calculateTax(request);

      expect(result.items[0].reverseCharge).toBe(true);
      expect(result.items[0].taxAmount).toBe(0); // Tax not charged
      expect(result.items[0].taxRate).toBe(5.0); // Rate still shown
    });
  });

  describe('Tax Summary Formatting', () => {
    it('should format tax summary correctly', () => {
      const result = {
        items: [],
        totals: {
          grossTotal: 315.00,
          netTotal: 300.00,
          taxTotal: 15.00,
          taxByRate: {
            '5%': 10.00,
            '0%': 0.00,
            '2.5%': 5.00
          }
        },
        taxProfileId: 'test',
        metadata: {
          inclusive_prices: true,
          rounding_method: 'line',
          jurisdiction: 'AE'
        }
      };

      const summary = TaxResolver.formatTaxSummary(result);

      expect(summary).toContain('Net Total: 300.00');
      expect(summary).toContain('Tax Total: 15.00');
      expect(summary).toContain('Gross Total: 315.00');
      expect(summary).toContain('5%: 10.00');
      expect(summary).toContain('2.5%: 5.00');
    });
  });
});