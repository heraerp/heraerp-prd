import { z } from 'zod';

// Tax calculation request schema
export const TaxCalculationRequest = z.object({
  organizationId: z.string().uuid(),
  items: z.array(z.object({
    entityId: z.string().uuid(),
    amount: z.number(),
    quantity: z.number().optional(),
    taxCategory: z.string().optional(), // If not provided, will be resolved from entity
  })),
  transactionDate: z.date().optional(),
  customerEntityId: z.string().uuid().optional(), // For B2B reverse charge checks
  transactionType: z.string(),
});

export type TaxCalculationRequestType = z.infer<typeof TaxCalculationRequest>;

// Tax calculation result
export interface TaxCalculationResult {
  items: Array<{
    entityId: string;
    grossAmount: number;
    netAmount: number;
    taxAmount: number;
    taxRate: number;
    taxCategory: string;
    reverseCharge: boolean;
  }>;
  totals: {
    grossTotal: number;
    netTotal: number;
    taxTotal: number;
    taxByRate: Record<string, number>;
  };
  taxProfileId: string;
  metadata: {
    inclusive_prices: boolean;
    rounding_method: string;
    jurisdiction: string;
  };
}

/**
 * Resolves tax rates and calculates tax for transactions
 */
export class TaxResolver {
  /**
   * Get active tax profile for an organization
   */
  static async getActiveTaxProfile(
    organizationId: string,
    transactionDate: Date = new Date()
  ): Promise<any> {
    // This would query:
    // 1. Find organization entity
    // 2. Find active 'uses_tax_profile' relationship
    // 3. Load tax profile entity
    // 4. Load all rates from core_dynamic_data
    
    // Simulated response for now
    return {
      profileId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      jurisdiction: 'AE',
      inclusive_prices: true,
      rounding_method: 'line',
      rates: {
        standard: 5.0,
        zero: 0.0,
        exempt: null
      }
    };
  }

  /**
   * Resolve tax category for an entity
   */
  static async resolveTaxCategory(
    entityId: string,
    entityType: string
  ): Promise<string> {
    // This would check:
    // 1. Entity's business_rules.tax_category
    // 2. Entity's smart code pattern
    // 3. Default based on entity type
    
    // Default mappings
    const defaultCategories: Record<string, string> = {
      'product': 'goods.standard',
      'service': 'services.standard',
      'gl_account': 'services.financial'
    };
    
    return defaultCategories[entityType] || 'goods.standard';
  }

  /**
   * Calculate tax for a transaction
   */
  static async calculateTax(
    request: TaxCalculationRequestType
  ): Promise<TaxCalculationResult> {
    const profile = await this.getActiveTaxProfile(
      request.organizationId,
      request.transactionDate
    );
    
    const result: TaxCalculationResult = {
      items: [],
      totals: {
        grossTotal: 0,
        netTotal: 0,
        taxTotal: 0,
        taxByRate: {}
      },
      taxProfileId: profile.profileId,
      metadata: {
        inclusive_prices: profile.inclusive_prices,
        rounding_method: profile.rounding_method,
        jurisdiction: profile.jurisdiction
      }
    };
    
    // Process each item
    for (const item of request.items) {
      const taxCategory = item.taxCategory || 
        await this.resolveTaxCategory(item.entityId, 'product');
      
      const taxRate = this.getTaxRate(profile, taxCategory);
      const reverseCharge = this.checkReverseCharge(
        taxCategory,
        request.customerEntityId,
        profile
      );
      
      let grossAmount = item.amount;
      let netAmount: number;
      let taxAmount: number;
      
      if (profile.inclusive_prices && taxRate > 0) {
        // Extract tax from gross
        netAmount = grossAmount / (1 + taxRate / 100);
        taxAmount = grossAmount - netAmount;
      } else {
        // Add tax to net
        netAmount = grossAmount;
        taxAmount = netAmount * (taxRate / 100);
        grossAmount = netAmount + taxAmount;
      }
      
      // Apply rounding
      if (profile.rounding_method === 'line') {
        taxAmount = Math.round(taxAmount * 100) / 100;
        grossAmount = netAmount + taxAmount;
      }
      
      result.items.push({
        entityId: item.entityId,
        grossAmount,
        netAmount,
        taxAmount: reverseCharge ? 0 : taxAmount,
        taxRate,
        taxCategory,
        reverseCharge
      });
      
      // Update totals
      result.totals.grossTotal += grossAmount;
      result.totals.netTotal += netAmount;
      result.totals.taxTotal += reverseCharge ? 0 : taxAmount;
      
      const rateKey = `${taxRate}%`;
      result.totals.taxByRate[rateKey] = 
        (result.totals.taxByRate[rateKey] || 0) + taxAmount;
    }
    
    // Apply total rounding if needed
    if (profile.rounding_method === 'total') {
      const oldTaxTotal = result.totals.taxTotal;
      result.totals.taxTotal = Math.round(result.totals.taxTotal * 100) / 100;
      const roundingDiff = result.totals.taxTotal - oldTaxTotal;
      
      if (roundingDiff !== 0 && result.items.length > 0) {
        // Apply rounding to last item
        result.items[result.items.length - 1].taxAmount += roundingDiff;
      }
    }
    
    return result;
  }

  /**
   * Get tax rate for a category
   */
  private static getTaxRate(profile: any, category: string): number {
    // Check specific category mappings
    const categoryRates: Record<string, number> = {
      'goods.export': 0,
      'services.financial': 0, // exempt
      'goods.standard': profile.rates.standard,
      'services.standard': profile.rates.standard
    };
    
    return categoryRates[category] ?? profile.rates.standard;
  }

  /**
   * Check if reverse charge applies
   */
  private static checkReverseCharge(
    category: string,
    customerEntityId: string | undefined,
    profile: any
  ): boolean {
    if (!profile.reverse_charge_applicable) return false;
    if (!customerEntityId) return false;
    
    const reverseChargeCategories = [
      'services.imported',
      'goods.imported_b2b',
      'reverse_charge'
    ];
    
    return reverseChargeCategories.includes(category);
  }

  /**
   * Format tax summary for display
   */
  static formatTaxSummary(result: TaxCalculationResult): string {
    const lines = [
      `Net Total: ${result.totals.netTotal.toFixed(2)}`,
      `Tax Total: ${result.totals.taxTotal.toFixed(2)}`,
      `Gross Total: ${result.totals.grossTotal.toFixed(2)}`,
      '',
      'Tax Breakdown:'
    ];
    
    for (const [rate, amount] of Object.entries(result.totals.taxByRate)) {
      lines.push(`  ${rate}: ${amount.toFixed(2)}`);
    }
    
    return lines.join('\n');
  }
}