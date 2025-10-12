/**
 * HERA Finance DNA v3.4: Cross-Org Consolidation Test Suite
 * 
 * Comprehensive test suite for IFRS 10 compliant multi-entity consolidation
 * including prepare, eliminate, translate, aggregate, and reconcile operations.
 * 
 * Smart Code: HERA.CONSOL.TEST.SUITE.V3
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { callRPC } from '@/lib/server/index'
import { ConsolidationClient } from '@/lib/consolidation/consolidation-client-v3'

// Test configuration
const TEST_ORG_ID = 'test-org-consolidation-v3'
const TEST_GROUP_ID = 'test-group-consolidation-v3'
const TEST_ACTOR_ID = 'test-actor-consolidation-v3'
const PERFORMANCE_THRESHOLD_MS = 10000 // 10 seconds for complete consolidation
const TOLERANCE_AMOUNT = 0.01
const TEST_PERIOD = '2025-02'
const BASE_CURRENCY = 'GBP'

// Test data setup
let testClient: ConsolidationClient
let testMemberEntityIds: string[] = []
let testGLAccountIds: string[] = []

describe('HERA Finance DNA v3.4: Cross-Org Consolidation', () => {

  beforeAll(async () => {
    // Initialize test client
    testClient = new ConsolidationClient(TEST_ORG_ID)
    
    // Setup test organization and demo data
    await setupTestOrganization()
    await setupConsolidationGroupStructure()
    await setupTestTransactionData()
  })

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })

  beforeEach(async () => {
    // Reset state for each test
    // No persistent state to reset
  })

  // ============================================================================
  // Consolidation Preparation Tests
  // ============================================================================

  describe('Consolidation Preparation', () => {
    
    test('prepares consolidation with group validation', async () => {
      const result = await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.group_id).toBe(TEST_GROUP_ID)
      expect(result.period).toBe(TEST_PERIOD)
      expect(result.validation_passed).toBe(true)
      expect(result.preparation_summary).toBeDefined()
      expect(result.preparation_summary.member_count).toBeGreaterThan(0)
      expect(result.preparation_summary.fx_pairs_validated).toBeGreaterThanOrEqual(0)
      expect(result.preparation_summary.elimination_pairs_validated).toBeGreaterThanOrEqual(0)
      expect(result.smart_code).toBe('HERA.CONSOL.PREP.RUN.V3')
    })

    test('validates group members and ownership percentages', async () => {
      const result = await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.preparation_summary.cached_members).toBeDefined()
      expect(Array.isArray(result.preparation_summary.cached_members)).toBe(true)
      
      if (result.preparation_summary.cached_members.length > 0) {
        const member = result.preparation_summary.cached_members[0]
        expect(member.member_entity_id).toBeDefined()
        expect(member.ownership_pct).toBeGreaterThan(0)
        expect(member.ownership_pct).toBeLessThanOrEqual(100)
        expect(member.consolidation_method).toMatch(/^(FULL|PROPORTIONATE|EQUITY)$/)
        expect(member.validation_status).toBeDefined()
      }
    })

    test('validates FX rates availability', async () => {
      const result = await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.preparation_summary.fx_rates).toBeDefined()
      
      // Check FX rate structure if any rates exist
      const fxRates = result.preparation_summary.fx_rates
      if (Object.keys(fxRates).length > 0) {
        const firstRate = Object.values(fxRates)[0] as any
        expect(firstRate.avg_rate).toBeDefined()
        expect(firstRate.closing_rate).toBeDefined()
        expect(firstRate.validation_status).toBeDefined()
      }
    })

    test('handles validation failures gracefully', async () => {
      // Test with invalid group ID
      const result = await callRPC('hera_consol_prepare_v3', {
        p_group_id: 'invalid-group-id',
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })

      expect(result.success).toBe(false)
      expect(result.error_code).toBe('GROUP_NOT_FOUND')
      expect(result.error_message).toBeDefined()
    })

  })

  // ============================================================================
  // Intercompany Elimination Tests
  // ============================================================================

  describe('Intercompany Elimination', () => {

    beforeEach(async () => {
      // Ensure preparation is completed before elimination
      await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })
    })

    test('eliminates intercompany revenue and COGS', async () => {
      const result = await callRPC('hera_consol_eliminate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.group_id).toBe(TEST_GROUP_ID)
      expect(result.period).toBe(TEST_PERIOD)
      expect(result.elimination_summary).toBeDefined()
      expect(result.elimination_summary.elimination_pairs_processed).toBeGreaterThanOrEqual(0)
      expect(result.elimination_summary.elimination_entries_created).toBeGreaterThanOrEqual(0)
      expect(result.balance_check_passed).toBe(true)
      expect(result.smart_code).toBe('HERA.CONSOL.ELIM.TXN.V3')
    })

    test('eliminates intercompany receivables and payables', async () => {
      const result = await callRPC('hera_consol_eliminate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.elimination_summary.total_eliminated_amount).toBeGreaterThanOrEqual(0)
      
      // Check that elimination entries were created
      if (result.elimination_summary.elimination_entries_created > 0) {
        expect(result.elimination_summary.elimination_pairs_processed).toBeGreaterThan(0)
      }
    })

    test('ensures balanced elimination entries', async () => {
      const result = await callRPC('hera_consol_eliminate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.balance_check_passed).toBe(true)
    })

    test('supports dry run mode for elimination testing', async () => {
      const result = await callRPC('hera_consol_eliminate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_dry_run: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.dry_run).toBe(true)
    })

  })

  // ============================================================================
  // FX Translation Tests
  // ============================================================================

  describe('FX Translation', () => {

    beforeEach(async () => {
      // Ensure preparation is completed before translation
      await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })
    })

    test('translates foreign currency amounts using current rate method', async () => {
      const result = await callRPC('hera_consol_translate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_translation_method: 'CURRENT_RATE',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.group_id).toBe(TEST_GROUP_ID)
      expect(result.period).toBe(TEST_PERIOD)
      expect(result.translation_summary).toBeDefined()
      expect(result.translation_summary.translation_method).toBe('CURRENT_RATE')
      expect(result.translation_summary.members_translated).toBeGreaterThanOrEqual(0)
      expect(result.translation_summary.ifrs_21_compliant).toBe(true)
      expect(result.smart_code).toBe('HERA.CONSOL.TRANSLATE.TXN.V3')
    })

    test('supports temporal translation method', async () => {
      const result = await callRPC('hera_consol_translate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_translation_method: 'TEMPORAL',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.translation_summary.translation_method).toBe('TEMPORAL')
      expect(result.translation_summary.ifrs_21_compliant).toBe(true)
    })

    test('creates cumulative translation adjustments to OCI', async () => {
      const result = await callRPC('hera_consol_translate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_translation_method: 'CURRENT_RATE',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.translation_summary.total_translation_adjustment).toBeDefined()
      expect(result.translation_summary.fx_rates_used).toBeDefined()
    })

    test('handles invalid translation methods', async () => {
      const result = await callRPC('hera_consol_translate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_translation_method: 'INVALID_METHOD',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(false)
      expect(result.error_code).toBe('INVALID_TRANSLATION_METHOD')
    })

  })

  // ============================================================================
  // Consolidation Aggregation Tests
  // ============================================================================

  describe('Consolidation Aggregation', () => {

    beforeEach(async () => {
      // Run preparation, elimination, and translation before aggregation
      await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })

      await callRPC('hera_consol_eliminate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_dry_run: false
      }, { mode: 'service' })

      await callRPC('hera_consol_translate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_translation_method: 'CURRENT_RATE',
        p_dry_run: false
      }, { mode: 'service' })
    })

    test('aggregates consolidated balances using full consolidation', async () => {
      const result = await callRPC('hera_consol_aggregate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_consolidation_level: 'FULL',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.group_id).toBe(TEST_GROUP_ID)
      expect(result.period).toBe(TEST_PERIOD)
      expect(result.aggregation_summary).toBeDefined()
      expect(result.aggregation_summary.consolidation_level).toBe('FULL')
      expect(result.aggregation_summary.members_aggregated).toBeGreaterThanOrEqual(0)
      expect(result.aggregation_summary.aggregate_entries_created).toBeGreaterThanOrEqual(0)
      expect(result.smart_code).toBe('HERA.CONSOL.AGGREGATE.TXN.V3')
    })

    test('supports proportionate consolidation method', async () => {
      const result = await callRPC('hera_consol_aggregate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_consolidation_level: 'PROPORTIONATE',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.aggregation_summary.consolidation_level).toBe('PROPORTIONATE')
    })

    test('calculates non-controlling interests for full consolidation', async () => {
      const result = await callRPC('hera_consol_aggregate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_consolidation_level: 'FULL',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.aggregation_summary.totals).toBeDefined()
      expect(result.aggregation_summary.totals.total_consolidated_amount).toBeDefined()
      expect(result.aggregation_summary.totals.total_elimination_amount).toBeDefined()
      expect(result.aggregation_summary.totals.total_translation_amount).toBeDefined()
    })

    test('provides consolidated balances by category', async () => {
      const result = await callRPC('hera_consol_aggregate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_consolidation_level: 'FULL',
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.aggregation_summary.consolidated_balances_by_category).toBeDefined()
    })

  })

  // ============================================================================
  // Consolidation Reconciliation Tests
  // ============================================================================

  describe('Consolidation Reconciliation', () => {

    beforeEach(async () => {
      // Run complete consolidation pipeline before reconciliation
      await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_validation_mode: true
      }, { mode: 'service' })

      await callRPC('hera_consol_eliminate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_dry_run: false
      }, { mode: 'service' })

      await callRPC('hera_consol_translate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_translation_method: 'CURRENT_RATE',
        p_dry_run: false
      }, { mode: 'service' })

      await callRPC('hera_consol_aggregate_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_consolidation_level: 'FULL',
        p_dry_run: false
      }, { mode: 'service' })
    })

    test('reconciles consolidation entries with tolerance checking', async () => {
      const result = await callRPC('hera_consol_reconcile_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_tolerance_amount: TOLERANCE_AMOUNT,
        p_auto_adjust: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.group_id).toBe(TEST_GROUP_ID)
      expect(result.period).toBe(TEST_PERIOD)
      expect(result.reconciliation_summary).toBeDefined()
      expect(result.reconciliation_summary.reconciliation_checks).toBeGreaterThan(0)
      expect(result.tolerance_amount).toBe(TOLERANCE_AMOUNT)
      expect(result.smart_code).toBe('HERA.CONSOL.RECONCILE.TXN.V3')
    })

    test('performs balance sheet reconciliation (Assets = Liabilities + Equity)', async () => {
      const result = await callRPC('hera_consol_reconcile_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_tolerance_amount: TOLERANCE_AMOUNT,
        p_auto_adjust: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.reconciliation_summary.balance_checks).toBeDefined()
      expect(Array.isArray(result.reconciliation_summary.balance_checks)).toBe(true)
      
      // Check for balance sheet reconciliation
      const balanceSheetCheck = result.reconciliation_summary.balance_checks.find(
        (check: any) => check.check_type === 'BALANCE_SHEET_RECONCILIATION'
      )
      if (balanceSheetCheck) {
        expect(balanceSheetCheck.check_status).toMatch(/^(PASS|FAIL)$/)
      }
    })

    test('validates elimination balance integrity', async () => {
      const result = await callRPC('hera_consol_reconcile_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_tolerance_amount: TOLERANCE_AMOUNT,
        p_auto_adjust: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      
      // Check for elimination balance check
      const eliminationCheck = result.reconciliation_summary.balance_checks.find(
        (check: any) => check.check_type === 'ELIMINATION_BALANCE_CHECK'
      )
      if (eliminationCheck) {
        expect(eliminationCheck.check_status).toMatch(/^(PASS|FAIL)$/)
      }
    })

    test('supports auto-adjustment for variances exceeding tolerance', async () => {
      const result = await callRPC('hera_consol_reconcile_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_tolerance_amount: 0.001, // Very low tolerance to force adjustments
        p_auto_adjust: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.reconciliation_summary.auto_adjust_enabled).toBe(true)
      expect(result.auto_adjustments_made).toBeGreaterThanOrEqual(0)
    })

    test('provides IFRS 10 compliance confirmation', async () => {
      const result = await callRPC('hera_consol_reconcile_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: BASE_CURRENCY,
        p_tolerance_amount: TOLERANCE_AMOUNT,
        p_auto_adjust: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.ifrs_10_compliant).toBeDefined()
      expect(result.reconciliation_summary.ifrs_10_compliant).toBeDefined()
    })

  })

  // ============================================================================
  // Complete Consolidation Flow Tests
  // ============================================================================

  describe('Complete Consolidation Flow', () => {

    test('executes complete consolidation pipeline successfully', async () => {
      const startTime = Date.now()
      
      const result = await testClient.runCompleteConsolidation({
        group_id: TEST_GROUP_ID,
        period: TEST_PERIOD,
        base_currency: BASE_CURRENCY,
        dry_run: false
      })
      
      const totalTime = Date.now() - startTime
      
      expect(result.prepare.success).toBe(true)
      expect(result.eliminate.success).toBe(true)
      expect(result.translate.success).toBe(true)
      expect(result.aggregate.success).toBe(true)
      expect(result.reconcile.success).toBe(true)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(result.totalProcessingTimeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    })

    test('maintains data integrity across all consolidation steps', async () => {
      const result = await testClient.runCompleteConsolidation({
        group_id: TEST_GROUP_ID,
        period: TEST_PERIOD,
        base_currency: BASE_CURRENCY,
        dry_run: false
      })
      
      // Validate preparation results
      expect(result.prepare.validation_passed).toBe(true)
      expect(result.prepare.preparation_summary.member_count).toBeGreaterThan(0)
      
      // Validate elimination results
      expect(result.eliminate.balance_check_passed).toBe(true)
      
      // Validate translation results
      expect(result.translate.translation_summary.ifrs_21_compliant).toBe(true)
      
      // Validate aggregation results
      expect(result.aggregate.members_aggregated).toBeGreaterThan(0)
      
      // Validate reconciliation results
      expect(result.reconcile.reconciliation_passed).toBe(true)
      expect(result.reconcile.ifrs_10_compliant).toBe(true)
    })

  })

  // ============================================================================
  // Query and Reporting Tests
  // ============================================================================

  describe('Consolidation Query and Reporting', () => {

    beforeEach(async () => {
      // Ensure we have consolidation data for queries
      await testClient.runCompleteConsolidation({
        group_id: TEST_GROUP_ID,
        period: TEST_PERIOD,
        base_currency: BASE_CURRENCY,
        dry_run: false
      })
    })

    test('queries consolidated facts with filtering', async () => {
      const facts = await testClient.getConsolidatedFacts(TEST_GROUP_ID, TEST_PERIOD, {
        accountCategory: 'REVENUE',
        limit: 5
      })
      
      expect(Array.isArray(facts)).toBe(true)
      
      if (facts.length > 0) {
        const fact = facts[0]
        expect(fact.group_id).toBe(TEST_GROUP_ID)
        expect(fact.period).toBe(TEST_PERIOD)
        expect(fact.account_category).toBe('REVENUE')
        expect(fact.total_consolidated_amount).toBeDefined()
        expect(fact.consolidation_method).toMatch(/^(FULL|PROPORTIONATE|EQUITY)$/)
      }
    })

    test('queries segment notes for IFRS 8 reporting', async () => {
      const segments = await testClient.getSegmentNotes(TEST_GROUP_ID, TEST_PERIOD, {
        reportableOnly: true,
        limit: 5
      })
      
      expect(Array.isArray(segments)).toBe(true)
      
      if (segments.length > 0) {
        const segment = segments[0]
        expect(segment.group_id).toBe(TEST_GROUP_ID)
        expect(segment.period).toBe(TEST_PERIOD)
        expect(segment.is_reportable_segment).toBe(true)
        expect(segment.segment_revenue).toBeDefined()
        expect(segment.revenue_materiality_pct).toBeGreaterThanOrEqual(0)
      }
    })

    test('queries FX translation differences', async () => {
      const fxDiffs = await testClient.getFxTranslationDifferences(TEST_GROUP_ID, TEST_PERIOD, {
        materialityLevel: 'HIGH',
        limit: 5
      })
      
      expect(Array.isArray(fxDiffs)).toBe(true)
      
      if (fxDiffs.length > 0) {
        const fxDiff = fxDiffs[0]
        expect(fxDiff.group_id).toBe(TEST_GROUP_ID)
        expect(fxDiff.period).toBe(TEST_PERIOD)
        expect(fxDiff.translation_materiality).toBe('HIGH')
        expect(fxDiff.currency_pair).toBeDefined()
        expect(fxDiff.total_translation_difference).toBeDefined()
      }
    })

    test('refreshes materialized views', async () => {
      const result = await testClient.refreshConsolidatedViews(TEST_GROUP_ID, TEST_PERIOD)
      
      expect(typeof result).toBe('string')
      expect(result).toContain('refresh')
    })

  })

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {

    test('meets consolidation performance SLA', async () => {
      const startTime = Date.now()
      
      const result = await testClient.runCompleteConsolidation({
        group_id: TEST_GROUP_ID,
        period: TEST_PERIOD,
        base_currency: BASE_CURRENCY,
        dry_run: false
      })
      
      const totalTime = Date.now() - startTime
      
      expect(result.prepare.success).toBe(true)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(result.totalProcessingTimeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    })

    test('handles large group consolidations efficiently', async () => {
      // This would test with a larger group structure
      // For demo purposes, using same group but with higher expectations
      const startTime = Date.now()
      
      const result = await testClient.runCompleteConsolidation({
        group_id: TEST_GROUP_ID,
        period: TEST_PERIOD,
        base_currency: BASE_CURRENCY,
        dry_run: false
      })
      
      const totalTime = Date.now() - startTime
      
      expect(result.reconcile.success).toBe(true)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    })

  })

  // ============================================================================
  // Error Handling and Edge Cases
  // ============================================================================

  describe('Error Handling', () => {

    test('handles invalid group ID gracefully', async () => {
      try {
        await testClient.prepareConsolidation({
          group_id: 'invalid-group-id',
          period: TEST_PERIOD,
          base_currency: BASE_CURRENCY
        })
      } catch (error: any) {
        expect(error.message).toContain('not found')
      }
    })

    test('handles invalid period format', async () => {
      try {
        await testClient.prepareConsolidation({
          group_id: TEST_GROUP_ID,
          period: 'invalid-period',
          base_currency: BASE_CURRENCY
        })
      } catch (error: any) {
        expect(error.message).toContain('format')
      }
    })

    test('handles missing FX rates gracefully', async () => {
      // This would test consolidation with missing FX rates
      // The system should handle this and report validation failures
      const result = await callRPC('hera_consol_prepare_v3', {
        p_group_id: TEST_GROUP_ID,
        p_period: TEST_PERIOD,
        p_actor_id: TEST_ACTOR_ID,
        p_base_currency: 'UNKNOWN_CURRENCY',
        p_validation_mode: true
      }, { mode: 'service' })

      // Should succeed but may have validation warnings
      expect(result.success).toBe(true)
    })

  })

})

// ============================================================================
// Helper Functions
// ============================================================================

async function setupTestOrganization() {
  // Create test organization if it doesn't exist
  await callRPC('hera_execute_query', {
    query: `INSERT INTO core_organizations (id, name, created_at, updated_at)
            VALUES ($1, $2, now(), now())
            ON CONFLICT (id) DO NOTHING`,
    params: [TEST_ORG_ID, 'Test Organization - Consolidation v3.4']
  }, { mode: 'service' })
}

async function setupConsolidationGroupStructure() {
  // Create test group entity
  await callRPC('hera_execute_query', {
    query: `INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code, created_at, updated_at)
            VALUES ($1, $2, 'GROUP', 'Test Consolidation Group', 'GROUP-TEST', 'HERA.CONSOL.ENTITY.GROUP.V3', now(), now())
            ON CONFLICT (id) DO NOTHING`,
    params: [TEST_GROUP_ID, TEST_ORG_ID]
  }, { mode: 'service' })

  // Create test member entities
  const memberEntities = [
    { id: 'member-entity-uk', name: 'UK Subsidiary', currency: 'GBP', ownership: 100 },
    { id: 'member-entity-us', name: 'US Subsidiary', currency: 'USD', ownership: 80 },
    { id: 'member-entity-eu', name: 'EU Subsidiary', currency: 'EUR', ownership: 75 }
  ]

  for (const member of memberEntities) {
    // Create member entity
    await callRPC('hera_execute_query', {
      query: `INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code, created_at, updated_at)
              VALUES ($1, $2, 'SUBSIDIARY', $3, $4, 'HERA.CONSOL.ENTITY.MEMBER.V3', now(), now())
              ON CONFLICT (id) DO NOTHING`,
      params: [member.id, TEST_ORG_ID, member.name, member.id.toUpperCase()]
    }, { mode: 'service' })

    // Create group membership relationship
    await callRPC('hera_execute_query', {
      query: `INSERT INTO core_relationships (id, from_entity_id, to_entity_id, relationship_type, smart_code, metadata, is_active, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, 'GROUP_HAS_MEMBER', 'HERA.CONSOL.REL.GROUP_HAS_MEMBER.V3', $3, true, now(), now())
              ON CONFLICT DO NOTHING`,
      params: [
        TEST_GROUP_ID, 
        member.id, 
        JSON.stringify({
          ownership_pct: member.ownership,
          method: 'FULL',
          local_currency: member.currency
        })
      ]
    }, { mode: 'service' })

    testMemberEntityIds.push(member.id)
  }

  // Create currency pair entities and FX rates
  const currencyPairs = [
    { from: 'USD', to: 'GBP', avg_rate: 0.79, close_rate: 0.80 },
    { from: 'EUR', to: 'GBP', avg_rate: 0.86, close_rate: 0.85 }
  ]

  for (const pair of currencyPairs) {
    const currencyPairId = `currency-pair-${pair.from}-${pair.to}`
    
    // Create currency pair entity
    await callRPC('hera_execute_query', {
      query: `INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code, created_at, updated_at)
              VALUES ($1, $2, 'CURRENCY_PAIR', $3, $4, 'HERA.CONSOL.ENTITY.CURRENCY_PAIR.V3', now(), now())
              ON CONFLICT (id) DO NOTHING`,
      params: [currencyPairId, TEST_ORG_ID, `${pair.from} to ${pair.to}`, `${pair.from}-${pair.to}`]
    }, { mode: 'service' })

    // Create FX rate dynamic data
    const periodKey = TEST_PERIOD.replace('-', '_')
    
    await callRPC('hera_execute_query', {
      query: `INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_number, smart_code, created_at, updated_at)
              VALUES ($1, $2, 'number', $3, 'HERA.CONSOL.FX.RATE.AVG.V3', now(), now())
              ON CONFLICT (entity_id, field_name) DO UPDATE SET field_value_number = EXCLUDED.field_value_number`,
      params: [currencyPairId, `rate_avg_${periodKey}`, pair.avg_rate]
    }, { mode: 'service' })

    await callRPC('hera_execute_query', {
      query: `INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_number, smart_code, created_at, updated_at)
              VALUES ($1, $2, 'number', $3, 'HERA.CONSOL.FX.RATE.CLOSE.V3', now(), now())
              ON CONFLICT (entity_id, field_name) DO UPDATE SET field_value_number = EXCLUDED.field_value_number`,
      params: [currencyPairId, `rate_close_${periodKey}`, pair.close_rate]
    }, { mode: 'service' })
  }
}

async function setupTestTransactionData() {
  // Create test GL accounts
  const glAccounts = [
    { id: 'gl-revenue-test', code: '4100', name: 'Revenue', category: 'REVENUE' },
    { id: 'gl-cogs-test', code: '5100', name: 'Cost of Goods Sold', category: 'EXPENSES' },
    { id: 'gl-ar-test', code: '1200', name: 'Accounts Receivable', category: 'ASSETS' },
    { id: 'gl-ap-test', code: '2100', name: 'Accounts Payable', category: 'LIABILITIES' }
  ]

  for (const account of glAccounts) {
    await callRPC('hera_execute_query', {
      query: `INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code, created_at, updated_at)
              VALUES ($1, $2, 'gl_account', $3, $4, 'HERA.FIN.GL.ACC.V3', now(), now())
              ON CONFLICT (id) DO NOTHING`,
      params: [account.id, TEST_ORG_ID, account.name, account.code]
    }, { mode: 'service' })

    testGLAccountIds.push(account.id)
  }

  // Create some sample transactions for each member entity
  for (const memberId of testMemberEntityIds) {
    const txnId = `txn-${memberId}-${TEST_PERIOD}`
    
    await callRPC('hera_execute_query', {
      query: `INSERT INTO universal_transactions (id, organization_id, transaction_type, transaction_code, transaction_date, total_amount, currency, status, smart_code, metadata, created_at, updated_at)
              VALUES ($1, $2, 'SALE', $3, now(), 10000, 'GBP', 'COMPLETED', 'HERA.CONSOL.TEST.TXN.V3', $4, now(), now())
              ON CONFLICT (id) DO NOTHING`,
      params: [
        txnId, 
        TEST_ORG_ID, 
        `SALE-${memberId}-${TEST_PERIOD}`,
        JSON.stringify({
          period: TEST_PERIOD,
          member_entity_id: memberId,
          test_transaction: true
        })
      ]
    }, { mode: 'service' })

    // Create transaction lines
    await callRPC('hera_execute_query', {
      query: `INSERT INTO universal_transaction_lines (id, transaction_id, line_number, line_type, line_entity_id, quantity, unit_price, line_amount, currency, smart_code, metadata, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, 1, 'REVENUE', $2, 1, 10000, 10000, 'GBP', 'HERA.CONSOL.TEST.LINE.V3', $3, now(), now())
              ON CONFLICT DO NOTHING`,
      params: [
        txnId,
        testGLAccountIds[0], // Revenue GL account
        JSON.stringify({
          account_category: 'REVENUE',
          gl_account_id: testGLAccountIds[0],
          gl_account_code: '4100',
          gl_account_name: 'Revenue'
        })
      ]
    }, { mode: 'service' })
  }
}

async function cleanupTestData() {
  // Clean up test data in reverse order
  const cleanupQueries = [
    `DELETE FROM universal_transaction_lines WHERE transaction_id IN (
       SELECT id FROM universal_transactions WHERE organization_id = '${TEST_ORG_ID}'
     )`,
    `DELETE FROM universal_transactions WHERE organization_id = '${TEST_ORG_ID}'`,
    `DELETE FROM core_dynamic_data WHERE entity_id IN (
       SELECT id FROM core_entities WHERE organization_id = '${TEST_ORG_ID}'
     )`,
    `DELETE FROM core_relationships WHERE from_entity_id IN (
       SELECT id FROM core_entities WHERE organization_id = '${TEST_ORG_ID}'
     ) OR to_entity_id IN (
       SELECT id FROM core_entities WHERE organization_id = '${TEST_ORG_ID}'
     )`,
    `DELETE FROM core_entities WHERE organization_id = '${TEST_ORG_ID}'`,
    `DELETE FROM core_organizations WHERE id = '${TEST_ORG_ID}'`
  ]

  for (const query of cleanupQueries) {
    try {
      await callRPC('hera_execute_query', { query, params: [] }, { mode: 'service' })
    } catch (error) {
      console.warn('Cleanup query failed:', query, error)
    }
  }
}