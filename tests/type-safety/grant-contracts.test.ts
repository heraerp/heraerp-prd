/**
 * HERA Type Safety Tests - Grant Contracts
 * 
 * These tests ensure that grant data contracts are enforced
 * at runtime and provide type safety at compile time.
 */

import { describe, it, expect } from 'vitest';

import {
  CreateGrantApplicationRequestSchema,
  ReviewGrantRequestSchema,
  GrantApplicationStatusSchema,
  GrantScoringSchema,
  GrantFiltersSchema,
  GRANT_SMART_CODES,
  validateCreateGrantRequest,
  validateReviewGrantRequest,
  isGrantApplicationStatus,
  isGrantReviewAction,
} from '@/contracts/crm-grants';

import type {
  CreateGrantApplicationRequest,
  ReviewGrantRequest,
  GrantApplicationStatus,
  GrantScoring,
  GrantFilters,
} from '@/contracts/crm-grants';

import { exact } from '@/utils/exact';

describe('Grant Contracts Type Safety', () => {
  describe('CreateGrantApplicationRequest', () => {
    it('validates correct grant application request', () => {
      const validRequest: CreateGrantApplicationRequest = {
        applicant: {
          type: 'constituent',
          id: 'const-123',
        },
        round_id: 'round-456',
        summary: 'Test grant application',
        amount_requested: 50000,
        tags: ['EDUCATION', 'YOUTH'],
        start_run: false,
      };

      const result = CreateGrantApplicationRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);

      // Test with validation helper
      expect(() => validateCreateGrantRequest(validRequest)).not.toThrow();
    });

    it('rejects request with invalid applicant type', () => {
      const invalidRequest = {
        applicant: {
          type: 'invalid_type', // ❌ Not 'constituent' or 'ps_org'
          id: 'const-123',
        },
        round_id: 'round-456',
      };

      const result = CreateGrantApplicationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('rejects request with negative amount', () => {
      const invalidRequest = {
        applicant: {
          type: 'constituent',
          id: 'const-123',
        },
        round_id: 'round-456',
        amount_requested: -1000, // ❌ Negative amount
      };

      const result = CreateGrantApplicationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('requires non-empty applicant ID', () => {
      const invalidRequest = {
        applicant: {
          type: 'constituent',
          id: '', // ❌ Empty ID
        },
        round_id: 'round-456',
      };

      const result = CreateGrantApplicationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('prevents excess properties (prop drift protection)', () => {
      const invalidRequest = {
        applicant: {
          type: 'constituent',
          id: 'const-123',
        },
        round_id: 'round-456',
        extraField: 'not allowed', // ❌ Excess property
      };

      const result = CreateGrantApplicationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('ReviewGrantRequest', () => {
    it('validates correct review request', () => {
      const validReview = exact<ReviewGrantRequest>()({
        action: 'approve',
        amount_awarded: 45000,
        notes: 'Excellent application with strong community impact.',
      });

      const result = ReviewGrantRequestSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it('validates award action with amount', () => {
      const validAward = exact<ReviewGrantRequest>()({
        action: 'award',
        amount_awarded: 25000,
        notes: 'Approved for partial funding.',
      });

      const result = ReviewGrantRequestSchema.safeParse(validAward);
      expect(result.success).toBe(true);
    });

    it('validates reject action without amount', () => {
      const validReject = exact<ReviewGrantRequest>()({
        action: 'reject',
        notes: 'Insufficient documentation provided.',
      });

      const result = ReviewGrantRequestSchema.safeParse(validReject);
      expect(result.success).toBe(true);
    });

    it('rejects invalid action', () => {
      const invalidReview = {
        action: 'maybe', // ❌ Not a valid action
        notes: 'Not sure about this one.',
      };

      const result = ReviewGrantRequestSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });

    it('rejects negative award amount', () => {
      const invalidReview = {
        action: 'award',
        amount_awarded: -5000, // ❌ Negative amount
        notes: 'Invalid amount.',
      };

      const result = ReviewGrantRequestSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });
  });

  describe('GrantScoring', () => {
    it('validates correct scoring', () => {
      const validScoring = exact<GrantScoring>()({
        need: 8,
        impact: 9,
        feasibility: 7,
        total: 24,
      });

      const result = GrantScoringSchema.safeParse(validScoring);
      expect(result.success).toBe(true);
    });

    it('rejects scores outside valid range', () => {
      const invalidScoring = {
        need: 11, // ❌ Max is 10
        impact: 0, // ❌ Min is 1
        feasibility: 5,
        total: 16,
      };

      const result = GrantScoringSchema.safeParse(invalidScoring);
      expect(result.success).toBe(false);
    });

    it('rejects invalid total range', () => {
      const invalidScoring = {
        need: 5,
        impact: 5,
        feasibility: 5,
        total: 2, // ❌ Min total is 3
      };

      const result = GrantScoringSchema.safeParse(invalidScoring);
      expect(result.success).toBe(false);
    });
  });

  describe('GrantFilters', () => {
    it('validates correct filters', () => {
      const validFilters = exact<GrantFilters>()({
        page: 1,
        page_size: 20,
        q: 'education',
        status: 'approved',
        tags: ['EDUCATION', 'YOUTH'],
        min_amount: 1000,
        max_amount: 100000,
      });

      const result = GrantFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('rejects invalid pagination', () => {
      const invalidFilters = {
        page: 0, // ❌ Page must be positive
        page_size: 200, // ❌ Max page size is 100
      };

      const result = GrantFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });

    it('rejects negative amounts', () => {
      const invalidFilters = {
        page: 1,
        page_size: 20,
        min_amount: -100, // ❌ Must be non-negative
      };

      const result = GrantFiltersSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });
  });

  describe('Status Type Guards', () => {
    it('correctly identifies valid grant status', () => {
      expect(isGrantApplicationStatus('submitted')).toBe(true);
      expect(isGrantApplicationStatus('approved')).toBe(true);
      expect(isGrantApplicationStatus('invalid_status')).toBe(false);
    });

    it('correctly identifies valid review actions', () => {
      expect(isGrantReviewAction('approve')).toBe(true);
      expect(isGrantReviewAction('reject')).toBe(true);
      expect(isGrantReviewAction('award')).toBe(true);
      expect(isGrantReviewAction('invalid_action')).toBe(false);
    });
  });

  describe('Smart Codes', () => {
    it('provides correct smart code constants', () => {
      expect(GRANT_SMART_CODES.PROGRAM).toBe('HERA.CIVIC.PROG.ENT.GOV.v1');
      expect(GRANT_SMART_CODES.GRANT_APPLICATION).toBe('HERA.CIVIC.GRANT.APP.SUBMISSION.v1');
      expect(GRANT_SMART_CODES.APPLICATION_REVIEW).toBe('HERA.CIVIC.GRANT.TXN.REVIEW.v1');
    });

    it('ensures smart codes follow HERA format', () => {
      const smartCodePattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/;
      
      Object.values(GRANT_SMART_CODES).forEach(smartCode => {
        expect(smartCode).toMatch(smartCodePattern);
      });
    });
  });

  describe('Comprehensive Type Safety', () => {
    it('prevents mixing of incompatible types', () => {
      // This would cause a compile error - demonstrating type safety:
      // const invalidStatus: GrantApplicationStatus = 'invalid_status'; // ❌
      
      const validStatus: GrantApplicationStatus = 'approved'; // ✅
      expect(validStatus).toBe('approved');
    });

    it('enforces exact object shapes', () => {
      // This would fail at compile time due to excess properties:
      // const invalidRequest = exact<CreateGrantApplicationRequest>()({
      //   applicant: { type: 'constituent', id: 'test' },
      //   round_id: 'round-123',
      //   extraProperty: 'not allowed', // ❌ Excess property
      // });

      const validRequest = exact<CreateGrantApplicationRequest>()({
        applicant: { type: 'constituent', id: 'test' },
        round_id: 'round-123',
        tags: [],
        start_run: false,
      });

      expect(validRequest).toBeDefined();
    });
  });

  describe('Runtime vs Compile Time Safety', () => {
    it('catches runtime errors that bypass TypeScript', () => {
      // Simulate data coming from API (unknown type)
      const apiData: unknown = {
        applicant: {
          type: 'invalid_type', // This would pass TypeScript if we trusted the API
          id: 'test',
        },
        round_id: 'round-123',
      };

      // But Zod validation catches it at runtime
      const result = CreateGrantApplicationRequestSchema.safeParse(apiData);
      expect(result.success).toBe(false);
    });

    it('provides detailed error information', () => {
      const invalidData = {
        applicant: {
          type: 'invalid',
          id: '',
        },
        round_id: '',
        amount_requested: -100,
      };

      const result = CreateGrantApplicationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        // Should have multiple validation errors
        expect(result.error.issues.length).toBeGreaterThan(1);
        
        // Check for specific error types
        const errorPaths = result.error.issues.map(issue => issue.path.join('.'));
        expect(errorPaths).toContain('applicant.type');
        expect(errorPaths).toContain('applicant.id');
        expect(errorPaths).toContain('round_id');
        expect(errorPaths).toContain('amount_requested');
      }
    });
  });
});