import { describe, it, expect } from 'vitest';
import { PostingSchema } from '../dsl/posting_schema';
import { validatePostingSchema, formatValidationErrors, getRequiredDimensions, matchSplitRule } from '../dsl/validate';

describe('PostingSchema Validation', () => {
  const validSchema = {
    ledgers: ['GL'],
    accounts: {
      revenue: '550e8400-e29b-41d4-a716-446655440001',
      tax_output: '550e8400-e29b-41d4-a716-446655440002',
      clearing: '550e8400-e29b-41d4-a716-446655440003',
      tips_payable: '550e8400-e29b-41d4-a716-446655440004'
    },
    tax: {
      profile_ref: '550e8400-e29b-41d4-a716-446655440005',
      inclusive_prices: true,
      rounding: 'line'
    },
    splits: {
      dimensions: ['cost_center', 'location'],
      rules: [
        {
          event_pattern: 'HERA\\.POS\\.SALE\\..*',
          split_by: 'location',
          allocation_method: 'proportional'
        }
      ]
    },
    dimension_requirements: [
      {
        account_pattern: '^5.*',
        required_dimensions: ['cost_center'],
        enforcement: 'error'
      }
    ]
  };

  describe('Schema Structure', () => {
    it('should accept valid schema', () => {
      const result = validatePostingSchema(validSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const invalid = { ...validSchema };
      delete invalid.tax;
      
      const result = validatePostingSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'tax')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const invalid = {
        ...validSchema,
        accounts: {
          ...validSchema.accounts,
          revenue: 'not-a-uuid'
        }
      };
      
      const result = validatePostingSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'accounts.revenue')).toBe(true);
    });

    it('should reject invalid ledger types', () => {
      const invalid = {
        ...validSchema,
        ledgers: ['GL', 'INVALID']
      };
      
      const result = validatePostingSchema(invalid);
      expect(result.valid).toBe(false);
    });

    it('should accept optional accounts', () => {
      const schema = {
        ...validSchema,
        accounts: {
          ...validSchema.accounts,
          fees: '550e8400-e29b-41d4-a716-446655440006',
          discount: '550e8400-e29b-41d4-a716-446655440007'
        }
      };
      
      const result = validatePostingSchema(schema);
      expect(result.valid).toBe(true);
    });
  });

  describe('Business Rules', () => {
    it('should reject duplicate account patterns', () => {
      const invalid = {
        ...validSchema,
        dimension_requirements: [
          {
            account_pattern: '^5.*',
            required_dimensions: ['cost_center'],
            enforcement: 'error'
          },
          {
            account_pattern: '^5.*',
            required_dimensions: ['location'],
            enforcement: 'warning'
          }
        ]
      };
      
      const result = validatePostingSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'DUPLICATE_PATTERN')).toBe(true);
    });

    it('should reject invalid split dimensions', () => {
      const invalid = {
        ...validSchema,
        splits: {
          dimensions: ['cost_center'],
          rules: [
            {
              event_pattern: 'HERA\\.POS\\..*',
              split_by: 'invalid_dimension',
              allocation_method: 'proportional'
            }
          ]
        }
      };
      
      const result = validatePostingSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_DIMENSION')).toBe(true);
    });

    it('should reject invalid regex patterns', () => {
      const invalid = {
        ...validSchema,
        dimension_requirements: [
          {
            account_pattern: '[invalid',
            required_dimensions: ['cost_center'],
            enforcement: 'error'
          }
        ]
      };
      
      const result = validatePostingSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'INVALID_REGEX')).toBe(true);
    });
  });

  describe('Warnings', () => {
    it('should warn about missing payment config', () => {
      const result = validatePostingSchema(validSchema);
      expect(result.warnings.some(w => w.includes('payment configuration'))).toBe(true);
    });

    it('should warn about missing optional accounts', () => {
      const result = validatePostingSchema(validSchema);
      expect(result.warnings.some(w => w.includes('fees account'))).toBe(true);
      expect(result.warnings.some(w => w.includes('discount account'))).toBe(true);
    });

    it('should warn about auto_default without defaults', () => {
      const schema = {
        ...validSchema,
        dimension_requirements: [
          {
            account_pattern: '^5.*',
            required_dimensions: ['cost_center'],
            enforcement: 'auto_default'
          }
        ]
      };
      
      const result = validatePostingSchema(schema);
      expect(result.warnings.some(w => w.includes('auto_default'))).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should format validation errors', () => {
      const errors = [
        { path: 'accounts.revenue', message: 'Invalid UUID', code: 'invalid_string' },
        { path: '', message: 'General error', code: 'custom' }
      ];
      
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('accounts.revenue: Invalid UUID');
      expect(formatted).toContain('General error');
    });

    it('should get required dimensions for account', () => {
      const parsed = PostingSchema.parse(validSchema);
      
      const req1 = getRequiredDimensions(parsed, '51000');
      expect(req1).toEqual({
        dimensions: ['cost_center'],
        enforcement: 'error'
      });
      
      const req2 = getRequiredDimensions(parsed, '11000');
      expect(req2).toBeNull();
    });

    it('should match split rules', () => {
      const parsed = PostingSchema.parse(validSchema);
      
      const rule1 = matchSplitRule(parsed, 'HERA.POS.SALE.v1');
      expect(rule1).toBeTruthy();
      expect(rule1?.split_by).toBe('location');
      
      const rule2 = matchSplitRule(parsed, 'HERA.INV.ADJUSTMENT.v1');
      expect(rule2).toBeNull();
    });
  });

  describe('Payment Configuration', () => {
    it('should accept payment config', () => {
      const schema = {
        ...validSchema,
        payments: {
          capture_type: 'deferred',
          open_item: true,
          settlement_days: 3
        }
      };
      
      const result = validatePostingSchema(schema);
      expect(result.valid).toBe(true);
    });

    it('should use defaults for payment config', () => {
      const parsed = PostingSchema.parse(validSchema);
      expect(parsed.payments?.capture_type).toBe('immediate');
      expect(parsed.payments?.open_item).toBe(false);
    });
  });

  describe('Validation Configuration', () => {
    it('should accept validation config', () => {
      const schema = {
        ...validSchema,
        validations: {
          max_line_count: 500,
          require_external_ref: true,
          allowed_currencies: ['USD', 'EUR', 'AED']
        }
      };
      
      const result = validatePostingSchema(schema);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid currency codes', () => {
      const schema = {
        ...validSchema,
        validations: {
          allowed_currencies: ['USD', 'INVALID']
        }
      };
      
      const result = validatePostingSchema(schema);
      expect(result.valid).toBe(false);
    });
  });
});