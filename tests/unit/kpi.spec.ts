/**
 * KPI Calculation Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  leadTimeDays, 
  coverageAvg, 
  guardrailPassRate, 
  auditReady,
  fiscalAligned
} from '../../src/lib/metrics/kpi';
import type { 
  UniversalTransaction, 
  UniversalTransactionLine, 
  FiscalPeriod 
} from '../../src/lib/types/factory';

describe('KPI Calculations', () => {
  describe('leadTimeDays', () => {
    it('should return 0 for empty transactions', () => {
      expect(leadTimeDays([])).toBe(0);
    });

    it('should calculate lead time between PLAN and RELEASE', () => {
      const txns: UniversalTransaction[] = [
        {
          id: '1',
          organization_id: 'org-1',
          transaction_type: 'FACTORY.PLAN',
          smart_code: 'HERA.MODULE.A.v1',
          transaction_date: '2024-01-01T00:00:00Z',
          transaction_status: 'passed',
        },
        {
          id: '2',
          organization_id: 'org-1',
          transaction_type: 'FACTORY.RELEASE',
          smart_code: 'HERA.MODULE.A.v1',
          transaction_date: '2024-01-03T00:00:00Z',
          transaction_status: 'passed',
        },
      ];

      expect(leadTimeDays(txns)).toBe(2);
    });

    it('should average multiple pipeline lead times', () => {
      const txns: UniversalTransaction[] = [
        // Module A: 2 days
        {
          id: '1',
          organization_id: 'org-1',
          transaction_type: 'FACTORY.PLAN',
          smart_code: 'HERA.MODULE.A.v1',
          transaction_date: '2024-01-01T00:00:00Z',
          transaction_status: 'passed',
        },
        {
          id: '2',
          organization_id: 'org-1',
          transaction_type: 'FACTORY.RELEASE',
          smart_code: 'HERA.MODULE.A.v1',
          transaction_date: '2024-01-03T00:00:00Z',
          transaction_status: 'passed',
        },
        // Module B: 4 days
        {
          id: '3',
          organization_id: 'org-1',
          transaction_type: 'FACTORY.PLAN',
          smart_code: 'HERA.MODULE.B.v1',
          transaction_date: '2024-01-01T00:00:00Z',
          transaction_status: 'passed',
        },
        {
          id: '4',
          organization_id: 'org-1',
          transaction_type: 'FACTORY.RELEASE',
          smart_code: 'HERA.MODULE.B.v1',
          transaction_date: '2024-01-05T00:00:00Z',
          transaction_status: 'passed',
        },
      ];

      expect(leadTimeDays(txns)).toBe(3); // Average of 2 and 4
    });
  });

  describe('coverageAvg', () => {
    it('should return 0 for empty lines', () => {
      expect(coverageAvg([])).toBe(0);
    });

    it('should calculate average coverage from test lines', () => {
      const lines: UniversalTransactionLine[] = [
        {
          id: '1',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 1,
          line_type: 'STEP.UNIT',
          smart_code: 'HERA.TEST.v1',
          metadata: { coverage: 0.85 },
        },
        {
          id: '2',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 2,
          line_type: 'STEP.E2E',
          smart_code: 'HERA.TEST.v1',
          metadata: { coverage: 0.75 },
        },
      ];

      expect(coverageAvg(lines)).toBe(80); // Average of 85% and 75%
    });

    it('should ignore non-test lines', () => {
      const lines: UniversalTransactionLine[] = [
        {
          id: '1',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 1,
          line_type: 'STEP.UNIT',
          smart_code: 'HERA.TEST.v1',
          metadata: { coverage: 0.9 },
        },
        {
          id: '2',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 2,
          line_type: 'STEP.BUILD', // Not a test line
          smart_code: 'HERA.BUILD.v1',
          metadata: { coverage: 0.5 }, // Should be ignored
        },
      ];

      expect(coverageAvg(lines)).toBe(90);
    });
  });

  describe('guardrailPassRate', () => {
    it('should return 100 for empty lines', () => {
      expect(guardrailPassRate([])).toBe(100);
    });

    it('should calculate pass rate for compliance lines', () => {
      const lines: UniversalTransactionLine[] = [
        {
          id: '1',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 1,
          line_type: 'STEP.COMPLIANCE.SOX',
          smart_code: 'HERA.COMPLIANCE.v1',
          metadata: { status: 'PASSED' },
        },
        {
          id: '2',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 2,
          line_type: 'STEP.SECURITY',
          smart_code: 'HERA.SECURITY.v1',
          metadata: { status: 'FAILED' },
        },
        {
          id: '3',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 3,
          line_type: 'STEP.CONTRACT',
          smart_code: 'HERA.CONTRACT.v1',
          metadata: { status: 'WAIVED' },
        },
      ];

      expect(guardrailPassRate(lines)).toBe(66.7); // 2 out of 3 passed/waived
    });
  });

  describe('auditReady', () => {
    it('should return false for empty lines', () => {
      expect(auditReady([])).toBe(false);
    });

    it('should return true when recent SBOM and attestation exist', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const lines: UniversalTransactionLine[] = [
        {
          id: '1',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 1,
          line_type: 'STEP.PACKAGE',
          smart_code: 'HERA.PACKAGE.v1',
          created_at: recentDate.toISOString(),
          metadata: {
            artifacts: {
              sbom: 's3://artifacts/sbom.json',
            },
          },
        },
        {
          id: '2',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 2,
          line_type: 'STEP.ATTESTATION',
          smart_code: 'HERA.ATTESTATION.v1',
          created_at: recentDate.toISOString(),
        },
      ];

      expect(auditReady(lines)).toBe(true);
    });

    it('should return false when artifacts are too old', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

      const lines: UniversalTransactionLine[] = [
        {
          id: '1',
          transaction_id: 'txn-1',
          organization_id: 'org-1',
          line_number: 1,
          line_type: 'STEP.PACKAGE',
          smart_code: 'HERA.PACKAGE.v1',
          created_at: oldDate.toISOString(),
          metadata: {
            artifacts: {
              sbom: 's3://artifacts/sbom.json',
            },
          },
        },
      ];

      expect(auditReady(lines)).toBe(false);
    });
  });

  describe('fiscalAligned', () => {
    it('should return true for empty periods', () => {
      expect(fiscalAligned([])).toBe(true);
    });

    it('should return true when open period exists', () => {
      const periods: FiscalPeriod[] = [
        {
          id: '1',
          organization_id: 'org-1',
          entity_type: 'fiscal_period',
          entity_code: 'FY2024-Q1',
          metadata: {
            status: 'open',
            period_start: '2024-01-01',
            period_end: '2024-03-31',
            fiscal_year: 2024,
          },
        },
      ];

      expect(fiscalAligned(periods)).toBe(true);
    });

    it('should return true when current period exists', () => {
      const periods: FiscalPeriod[] = [
        {
          id: '1',
          organization_id: 'org-1',
          entity_type: 'fiscal_period',
          entity_code: 'FY2024-Q1',
          metadata: {
            status: 'current',
            period_start: '2024-01-01',
            period_end: '2024-03-31',
            fiscal_year: 2024,
          },
        },
      ];

      expect(fiscalAligned(periods)).toBe(true);
    });

    it('should return false when all periods are closed', () => {
      const periods: FiscalPeriod[] = [
        {
          id: '1',
          organization_id: 'org-1',
          entity_type: 'fiscal_period',
          entity_code: 'FY2024-Q1',
          metadata: {
            status: 'closed',
            period_start: '2024-01-01',
            period_end: '2024-03-31',
            fiscal_year: 2024,
          },
        },
      ];

      expect(fiscalAligned(periods)).toBe(false);
    });
  });
});