/**
 * HERA Finance DNA v3.3: Dynamic Planning & Forecasting Test Suite
 * 
 * Comprehensive test suite for dynamic planning and forecasting functionality
 * including plan generation, variance analysis, approvals, and audit trails.
 * 
 * Smart Code: HERA.PLAN.TEST.SUITE.V3
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { callRPC } from '@/lib/server/index'
import { PlanningClient, type PlanType, type ApprovalAction } from '@/lib/planning/planning-client-v3'

// Test configuration
const TEST_ORG_ID = 'test-org-planning-v3'
const TEST_ACTOR_ID = 'test-actor-planning-v3'
const PERFORMANCE_THRESHOLD_MS = 8000 // 8 seconds for plan generation
const VARIANCE_THRESHOLD_PCT = 5.0
const TEST_PERIOD = '2025-02'

// Test data setup
let testPlanId: string
let testClient: PlanningClient

describe('HERA Finance DNA v3.3: Dynamic Planning & Forecasting', () => {

  beforeAll(async () => {
    // Initialize test client
    testClient = new PlanningClient(TEST_ORG_ID)
    
    // Setup test organization and baseline data
    await setupTestOrganization()
    await setupBaselineProfitabilityData()
  })

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
  })

  beforeEach(async () => {
    // Reset state for each test
    testPlanId = ''
  })

  // ============================================================================
  // Plan Generation Tests
  // ============================================================================

  describe('Plan Generation', () => {
    
    test('generates budget plan with AI insights', async () => {
      const startTime = Date.now()
      
      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'BUDGET',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })

      const totalTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(result.plan_entity_id).toBeDefined()
      expect(result.plan_type).toBe('BUDGET')
      expect(result.plan_lines_generated).toBeGreaterThan(0)
      expect(result.processing_time_ms).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(result.smart_code).toBe('HERA.PLAN.GENERATE.RUN.V3')
      
      testPlanId = result.plan_entity_id
    })

    test('generates forecast plan with driver-based planning', async () => {
      const driverPolicy = {
        drivers: [
          { name: 'SalesVolume', source: 'PRODUCT', measure: 'Qty', lag: 1 },
          { name: 'PricePerUnit', source: 'PRODUCT', measure: 'Price', lag: 0 }
        ],
        rules: [
          { name: 'Revenue=Volume×Price', enforce: true }
        ]
      }

      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'FORECAST',
        p_horizon_months: 12,
        p_driver_policy: driverPolicy,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.plan_type).toBe('FORECAST')
      expect(result.drivers_applied).toBeGreaterThan(0)
      expect(result.ai_insights_used).toBeGreaterThan(0)
      
      testPlanId = result.plan_entity_id
    })

    test('handles rolling forecast generation', async () => {
      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'ROLLING_FORECAST',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.plan_type).toBe('ROLLING_FORECAST')
      expect(result.forecast_accuracy_mape).toBeGreaterThanOrEqual(0)
      expect(result.forecast_accuracy_mape).toBeLessThanOrEqual(1)
      
      testPlanId = result.plan_entity_id
    })

    test('validates approval requirements for large plans', async () => {
      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'BUDGET',
        p_horizon_months: 12,
        p_plan_metadata: { high_value: true },
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.variance_guardrails).toBeDefined()
      expect(typeof result.approval_required).toBe('boolean')
      
      testPlanId = result.plan_entity_id
    })

    test('supports dry run mode', async () => {
      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'FORECAST',
        p_horizon_months: 6,
        p_dry_run: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.plan_lines_generated).toBeGreaterThan(0)
      
      // Verify no actual plan entity was created
      const planCheck = await callRPC('hera_execute_query', {
        query: 'SELECT COUNT(*) as count FROM core_entities WHERE id = $1',
        params: [result.plan_entity_id]
      }, { mode: 'service' })
      
      expect(planCheck.data[0].count).toBe(0)
    })

  })

  // ============================================================================
  // Plan Refresh Tests
  // ============================================================================

  describe('Plan Refresh', () => {

    beforeEach(async () => {
      // Create a test plan for refresh operations
      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'ROLLING_FORECAST',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })
      
      testPlanId = result.plan_entity_id
    })

    test('refreshes plan with AI trend adjustments', async () => {
      const result = await callRPC('hera_plan_refresh_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_refresh_horizon_months: 12,
        p_include_ai_adjustments: true,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.refresh_run_id).toBeDefined()
      expect(result.plan_id).toBe(testPlanId)
      expect(result.refresh_summary).toBeDefined()
      expect(result.refresh_summary.lines_refreshed).toBeGreaterThan(0)
      expect(result.smart_code).toBe('HERA.PLAN.REFRESH.RUN.V3')
    })

    test('applies auto-approval thresholds', async () => {
      const result = await callRPC('hera_plan_refresh_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_auto_approve_threshold_pct: 2.0, // Lower threshold
        p_include_ai_adjustments: true,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.refresh_summary.policy_checks).toBeDefined()
      expect(typeof result.approval_required).toBe('boolean')
    })

    test('tracks significant changes for approval', async () => {
      const result = await callRPC('hera_plan_refresh_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_auto_approve_threshold_pct: 1.0, // Very low threshold
        p_include_ai_adjustments: true,
        p_dry_run: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.refresh_summary.significant_changes).toBeGreaterThanOrEqual(0)
      expect(result.refresh_summary.ai_adjustments_applied).toBeGreaterThanOrEqual(0)
    })

  })

  // ============================================================================
  // Variance Analysis Tests
  // ============================================================================

  describe('Variance Analysis', () => {

    beforeEach(async () => {
      // Create test plan and add some baseline data
      const planResult = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'BUDGET',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })
      
      testPlanId = planResult.plan_entity_id
    })

    test('calculates plan vs actual variance', async () => {
      const result = await callRPC('hera_plan_variance_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_actual_period: TEST_PERIOD,
        p_variance_threshold_pct: VARIANCE_THRESHOLD_PCT,
        p_include_ai_explanation: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.variance_run_id).toBeDefined()
      expect(result.plan_id).toBe(testPlanId)
      expect(result.actual_period).toBe(TEST_PERIOD)
      expect(result.variance_summary).toBeDefined()
      expect(result.variance_summary.plan_lines_analyzed).toBeGreaterThanOrEqual(0)
      expect(result.smart_code).toBe('HERA.PLAN.VARIANCE.RUN.V3')
    })

    test('generates AI explanations for significant variances', async () => {
      const result = await callRPC('hera_plan_variance_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_actual_period: TEST_PERIOD,
        p_variance_threshold_pct: 1.0, // Low threshold to catch variances
        p_include_ai_explanation: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(Array.isArray(result.ai_explanations)).toBe(true)
      
      // Check AI explanation structure if any variances found
      if (result.ai_explanations.length > 0) {
        const explanation = result.ai_explanations[0]
        expect(explanation.variance_pattern).toBeDefined()
        expect(explanation.explanation).toBeDefined()
        expect(explanation.priority).toMatch(/^(CRITICAL|HIGH|MEDIUM|LOW)$/)
        expect(explanation.smart_code).toBe('HERA.PLAN.VARIANCE.AI.EXPLANATION.V3')
      }
    })

    test('identifies significant variance patterns', async () => {
      const result = await callRPC('hera_plan_variance_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_actual_period: TEST_PERIOD,
        p_variance_threshold_pct: VARIANCE_THRESHOLD_PCT,
        p_include_ai_explanation: false
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.variance_summary.variance_threshold_pct).toBe(VARIANCE_THRESHOLD_PCT)
      expect(result.variance_summary.significant_variances).toBeGreaterThanOrEqual(0)
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.variance_summary.analysis_quality)
    })

  })

  // ============================================================================
  // Plan Approval Tests
  // ============================================================================

  describe('Plan Approval', () => {

    beforeEach(async () => {
      // Create test plan requiring approval
      const planResult = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'BUDGET',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })
      
      testPlanId = planResult.plan_entity_id
    })

    test('approves plan with complete audit trail', async () => {
      const result = await callRPC('hera_plan_approve_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_approver_entity_id: TEST_ACTOR_ID,
        p_approval_action: 'APPROVE',
        p_approval_comments: 'Test approval for automated testing'
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.approval_run_id).toBeDefined()
      expect(result.plan_id).toBe(testPlanId)
      expect(result.approval_action).toBe('APPROVE')
      expect(result.approval_level).toBeGreaterThan(0)
      expect(result.required_approvals).toBeGreaterThan(0)
      expect(typeof result.approval_complete).toBe('boolean')
      expect(result.smart_code).toBe('HERA.PLAN.APPROVE.RUN.V3')
    })

    test('rejects plan with proper status update', async () => {
      const result = await callRPC('hera_plan_approve_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_approver_entity_id: TEST_ACTOR_ID,
        p_approval_action: 'REJECT',
        p_approval_comments: 'Rejecting for test purposes'
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.approval_action).toBe('REJECT')
      expect(result.new_plan_status).toBe('REJECTED')
      expect(result.approval_complete).toBe(true)
    })

    test('handles request for changes workflow', async () => {
      const result = await callRPC('hera_plan_approve_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_approver_entity_id: TEST_ACTOR_ID,
        p_approval_action: 'REQUEST_CHANGES',
        p_approval_comments: 'Please adjust revenue projections'
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.approval_action).toBe('REQUEST_CHANGES')
      expect(result.new_plan_status).toBe('CHANGES_REQUESTED')
      expect(result.approval_complete).toBe(false)
    })

    test('validates policy compliance', async () => {
      // Test with policy override
      const result = await callRPC('hera_plan_approve_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: testPlanId,
        p_approver_entity_id: TEST_ACTOR_ID,
        p_approval_action: 'APPROVE',
        p_approval_comments: 'Override policy for testing',
        p_override_policy: true
      }, { mode: 'service' })

      expect(result.success).toBe(true)
      expect(result.approval_action).toBe('APPROVE')
    })

  })

  // ============================================================================
  // Multi-Tenant Isolation Tests
  // ============================================================================

  describe('Multi-Tenant Isolation', () => {

    test('prevents cross-tenant plan access', async () => {
      const otherOrgId = 'other-test-org-planning'
      
      // Create plan in test org
      const planResult = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'BUDGET',
        p_horizon_months: 6,
        p_dry_run: false
      }, { mode: 'service' })
      
      // Try to access from other org
      const crossTenantResult = await callRPC('hera_plan_variance_v3', {
        p_organization_id: otherOrgId,
        p_plan_id: planResult.plan_entity_id,
        p_actual_period: TEST_PERIOD,
        p_variance_threshold_pct: 5.0
      }, { mode: 'service' })

      expect(crossTenantResult.success).toBe(false)
      expect(crossTenantResult.error_code).toBe('PLAN_NOT_FOUND')
    })

    test('isolates plan data by organization', async () => {
      // Generate plans for both orgs
      const org1Result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'FORECAST',
        p_horizon_months: 6,
        p_dry_run: false
      }, { mode: 'service' })

      const org2Result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: 'other-test-org-planning',
        p_actor_entity_id: 'other-test-actor',
        p_plan_type: 'FORECAST',
        p_horizon_months: 6,
        p_dry_run: false
      }, { mode: 'service' })

      // Verify plans are isolated
      expect(org1Result.plan_entity_id).not.toBe(org2Result.plan_entity_id)
      
      // Check that fact table respects org isolation
      const factQuery = await callRPC('hera_execute_query', {
        query: 'SELECT DISTINCT org_id FROM fact_plan_actual_v3 WHERE plan_entity_id = $1',
        params: [org1Result.plan_entity_id]
      }, { mode: 'service' })
      
      expect(factQuery.data.length).toBe(1)
      expect(factQuery.data[0].org_id).toBe(TEST_ORG_ID)
    })

  })

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {

    test('meets plan generation performance SLA', async () => {
      const startTime = Date.now()
      
      const result = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'FORECAST',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })
      
      const totalTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(result.processing_time_ms).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    })

    test('handles large plan refresh efficiently', async () => {
      // Create larger plan first
      const planResult = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'ROLLING_FORECAST',
        p_horizon_months: 24, // Larger plan
        p_dry_run: false
      }, { mode: 'service' })

      const startTime = Date.now()
      
      const refreshResult = await callRPC('hera_plan_refresh_v3', {
        p_organization_id: TEST_ORG_ID,
        p_plan_id: planResult.plan_entity_id,
        p_refresh_horizon_months: 24,
        p_include_ai_adjustments: true,
        p_dry_run: false
      }, { mode: 'service' })
      
      const totalTime = Date.now() - startTime
      
      expect(refreshResult.success).toBe(true)
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    })

  })

  // ============================================================================
  // Audit Trail Tests
  // ============================================================================

  describe('Audit Trail', () => {

    test('creates complete audit trail for plan operations', async () => {
      // Generate plan
      const planResult = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'BUDGET',
        p_horizon_months: 12,
        p_dry_run: false
      }, { mode: 'service' })

      // Check transaction header
      const headerQuery = await callRPC('hera_execute_query', {
        query: `SELECT * FROM universal_transactions 
                WHERE id = $1 AND transaction_type = 'PLAN_GENERATION'`,
        params: [planResult.run_id]
      }, { mode: 'service' })

      expect(headerQuery.data.length).toBe(1)
      expect(headerQuery.data[0].smart_code).toBe('HERA.PLAN.GENERATE.RUN.V3')
      expect(headerQuery.data[0].organization_id).toBe(TEST_ORG_ID)

      // Check transaction lines
      const linesQuery = await callRPC('hera_execute_query', {
        query: `SELECT COUNT(*) as count FROM universal_transaction_lines 
                WHERE transaction_id = $1`,
        params: [planResult.run_id]
      }, { mode: 'service' })

      expect(linesQuery.data[0].count).toBeGreaterThan(0)
    })

    test('maintains plan entity audit trail', async () => {
      const planResult = await callRPC('hera_plan_generate_v3', {
        p_organization_id: TEST_ORG_ID,
        p_actor_entity_id: TEST_ACTOR_ID,
        p_plan_type: 'FORECAST',
        p_horizon_months: 6,
        p_dry_run: false
      }, { mode: 'service' })

      // Check plan entity creation
      const entityQuery = await callRPC('hera_execute_query', {
        query: `SELECT * FROM core_entities WHERE id = $1`,
        params: [planResult.plan_entity_id]
      }, { mode: 'service' })

      expect(entityQuery.data.length).toBe(1)
      expect(entityQuery.data[0].entity_type).toBe('PLAN_VERSION')
      expect(entityQuery.data[0].smart_code).toBe('HERA.PLAN.ENTITY.PLAN_VERSION.V3')
      expect(entityQuery.data[0].organization_id).toBe(TEST_ORG_ID)
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
    params: [TEST_ORG_ID, 'Test Organization - Planning v3.3']
  }, { mode: 'service' })
}

async function setupBaselineProfitabilityData() {
  // Create some baseline profitability data for testing
  const testGLAccountId = 'test-gl-revenue-planning'
  const testPCId = 'test-pc-main-planning'
  
  // Create test GL account entity
  await callRPC('hera_execute_query', {
    query: `INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code, created_at, updated_at)
            VALUES ($1, $2, 'gl_account', 'Test Revenue Account', '4100', 'HERA.FIN.GL.ACC.REVENUE.V3', now(), now())
            ON CONFLICT (id) DO NOTHING`,
    params: [testGLAccountId, TEST_ORG_ID]
  }, { mode: 'service' })

  // Create test profit center entity
  await callRPC('hera_execute_query', {
    query: `INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, smart_code, created_at, updated_at)
            VALUES ($1, $2, 'profit_center', 'Test Main Operations', 'PC-MAIN', 'HERA.FIN.PROFIT.CENTER.V3', now(), now())
            ON CONFLICT (id) DO NOTHING`,
    params: [testPCId, TEST_ORG_ID]
  }, { mode: 'service' })

  // Create baseline profitability facts
  const periods = ['2024-12', '2025-01', '2025-02']
  for (const period of periods) {
    await callRPC('hera_execute_query', {
      query: `INSERT INTO fact_profitability_v2 (
                org_id, period, gl_account_id, profit_center_id, 
                revenue_aed, total_cost_aed, gross_margin_aed, gross_margin_pct,
                quantity, unit_cost_aed, last_updated
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
              ON CONFLICT (org_id, period, gl_account_id, profit_center_id) DO UPDATE SET
                revenue_aed = EXCLUDED.revenue_aed,
                total_cost_aed = EXCLUDED.total_cost_aed,
                last_updated = now()`,
      params: [
        TEST_ORG_ID, period, testGLAccountId, testPCId,
        10000, 6000, 4000, 40.0, 100, 60.0
      ]
    }, { mode: 'service' })
  }
}

async function cleanupTestData() {
  // Clean up test data
  const cleanupQueries = [
    `DELETE FROM universal_transaction_lines WHERE transaction_id IN (
       SELECT id FROM universal_transactions WHERE organization_id = '${TEST_ORG_ID}'
     )`,
    `DELETE FROM universal_transactions WHERE organization_id = '${TEST_ORG_ID}'`,
    `DELETE FROM core_entities WHERE organization_id = '${TEST_ORG_ID}'`,
    `DELETE FROM fact_profitability_v2 WHERE org_id = '${TEST_ORG_ID}'`,
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