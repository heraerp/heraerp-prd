/**
 * HERA Finance DNA v3: AI Insights Engine Test Suite
 * 
 * Comprehensive test suite for AI Insights Engine v3 covering accuracy,
 * performance, audit compliance, and enterprise-grade reliability.
 * 
 * Smart Code: HERA.AI.INSIGHT.TEST.SUITE.V3
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-environment-jsdom'
import { callRPC } from '@/lib/supabase/rpc-client'
import { AIInsightsClient } from '@/lib/ai/ai-insights-client'
import {
  type AIInsightGenerationRequest,
  type AIInsightType,
  type AIIntelligenceLevel,
  validateAIInsightGenerationRequest,
  validatePeriod,
  validateInsightType,
  getCurrentPeriod,
  AI_ERROR_CODES,
  AI_INSIGHT_SMART_CODES
} from '@/lib/ai/ai-insights-standard'

// ============================================================================
// Test Configuration & Setup
// ============================================================================

const TEST_ORG_ID = 'test-org-ai-insights-v3'
const TEST_ACTOR_ID = 'test-actor-ai-insights-v3'
const TEST_PERIOD = '2024-12'
const PERFORMANCE_THRESHOLD_MS = 5000 // Sub-5 second requirement

// Test organization setup
beforeAll(async () => {
  console.log('[AI_V3_TEST] Setting up test environment...')
  
  // Create test organization if not exists
  await callRPC('hera_entity_upsert_v1', {
    p_organization_id: TEST_ORG_ID,
    p_entity_type: 'ORGANIZATION',
    p_entity_name: 'AI Test Organization',
    p_entity_code: 'AI_TEST_ORG',
    p_smart_code: 'HERA.AI.TEST.ORG.V3',
    p_entity_id: TEST_ORG_ID,
    p_metadata: { test_purpose: 'AI_INSIGHTS_V3_TESTING' }
  }, { mode: 'service' })
  
  // Create test profitability data for feature extraction
  const testTransactions = [
    {
      transaction_type: 'sale',
      total_amount: 50000,
      period: TEST_PERIOD,
      profit_center: 'PC_MAIN',
      product_code: 'PROD_A',
      customer_code: 'CUST_VIP'
    },
    {
      transaction_type: 'purchase',
      total_amount: -30000,
      period: TEST_PERIOD,
      profit_center: 'PC_MAIN',
      product_code: 'PROD_A',
      cost_center: 'CC_PROCUREMENT'
    }
  ]
  
  // Insert test transactions for profitability base data
  for (const txn of testTransactions) {
    await callRPC('hera_txn_create_v1', {
      p_header: {
        organization_id: TEST_ORG_ID,
        transaction_type: txn.transaction_type,
        transaction_code: `AI-TEST-${Date.now()}`,
        transaction_date: '2024-12-15',
        currency: 'AED',
        total_amount: txn.total_amount,
        smart_code: 'HERA.AI.TEST.TXN.V3'
      },
      p_lines: [{
        line_number: 1,
        line_amount: txn.total_amount,
        smart_code: 'HERA.AI.TEST.LINE.V3'
      }]
    }, { mode: 'service' })
  }
  
  console.log('[AI_V3_TEST] Test environment setup completed')
})

// Cleanup after tests
afterAll(async () => {
  console.log('[AI_V3_TEST] Cleaning up test environment...')
  
  // Archive test data (following HERA patterns - don't delete, archive)
  await callRPC('hera_entity_upsert_v1', {
    p_organization_id: TEST_ORG_ID,
    p_entity_type: 'ORGANIZATION',
    p_entity_name: 'AI Test Organization (Archived)',
    p_entity_code: 'AI_TEST_ORG',
    p_smart_code: 'HERA.AI.TEST.ORG.ARCHIVE.V3',
    p_entity_id: TEST_ORG_ID,
    p_metadata: { 
      test_purpose: 'AI_INSIGHTS_V3_TESTING',
      archived_at: new Date().toISOString(),
      archived_reason: 'TEST_COMPLETION'
    }
  }, { mode: 'service' })
  
  console.log('[AI_V3_TEST] Cleanup completed')
})

// ============================================================================
// Validation Tests
// ============================================================================

describe('AI Insights Standards Validation', () => {
  test('validates insight types correctly', () => {
    expect(validateInsightType('DESCRIPTIVE')).toBe(true)
    expect(validateInsightType('PREDICTIVE')).toBe(true)
    expect(validateInsightType('PRESCRIPTIVE')).toBe(true)
    expect(validateInsightType('AUTONOMOUS')).toBe(true)
    expect(validateInsightType('INVALID')).toBe(false)
    expect(validateInsightType('')).toBe(false)
  })
  
  test('validates period format correctly', () => {
    const validPeriod = validatePeriod('2024-12')
    expect(validPeriod.valid).toBe(true)
    expect(validPeriod.errors).toHaveLength(0)
    
    const invalidFormat = validatePeriod('2024/12')
    expect(invalidFormat.valid).toBe(false)
    expect(invalidFormat.errors).toContain('Period must be in YYYY-MM format')
    
    const invalidMonth = validatePeriod('2024-13')
    expect(invalidMonth.valid).toBe(false)
    expect(invalidMonth.errors).toContain('Month must be between 01 and 12')
  })
  
  test('validates AI insight generation request', () => {
    const validRequest: AIInsightGenerationRequest = {
      organization_id: TEST_ORG_ID,
      period: TEST_PERIOD,
      insight_types: ['DESCRIPTIVE'],
      intelligence_level: 1
    }
    
    const validation = validateAIInsightGenerationRequest(validRequest)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
    
    const invalidRequest = {
      organization_id: '',
      period: 'invalid',
      insight_types: ['INVALID_TYPE'],
      intelligence_level: 5
    } as any
    
    const invalidValidation = validateAIInsightGenerationRequest(invalidRequest)
    expect(invalidValidation.valid).toBe(false)
    expect(invalidValidation.errors.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// RPC Function Tests
// ============================================================================

describe('AI Insights RPC Function Tests', () => {
  test('generates descriptive insights successfully', async () => {
    const startTime = Date.now()
    
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_actor_entity_id: TEST_ACTOR_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: false
    }, { mode: 'service' })
    
    const processingTime = Date.now() - startTime
    
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data.success).toBe(true)
    expect(result.data.run_id).toBeDefined()
    expect(result.data.insights_generated).toBeGreaterThan(0)
    expect(result.data.processing_time_ms).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    expect(processingTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    
    // Validate intelligence layers
    expect(result.data.intelligence_layers).toBeDefined()
    expect(result.data.intelligence_layers.descriptive).toBeGreaterThan(0)
    expect(result.data.intelligence_layers.predictive).toBe(0) // Not requested
    
    console.log(`[AI_V3_TEST] Descriptive insights generated: ${result.data.insights_generated} in ${processingTime}ms`)
  }, 10000) // 10 second timeout
  
  test('generates predictive insights with intelligence level 2', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE', 'PREDICTIVE'],
      p_intelligence_level: 2,
      p_dry_run: false
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    expect(result.data.intelligence_layers.descriptive).toBeGreaterThan(0)
    expect(result.data.intelligence_layers.predictive).toBeGreaterThan(0)
    expect(result.data.intelligence_layers.prescriptive).toBe(0) // Not allowed at level 2
    
    console.log(`[AI_V3_TEST] Predictive insights - D:${result.data.intelligence_layers.descriptive}, P:${result.data.intelligence_layers.predictive}`)
  }, 10000)
  
  test('generates prescriptive insights with intelligence level 3', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE'],
      p_intelligence_level: 3,
      p_dry_run: false
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    expect(result.data.intelligence_layers.descriptive).toBeGreaterThan(0)
    expect(result.data.intelligence_layers.predictive).toBeGreaterThan(0)
    expect(result.data.intelligence_layers.prescriptive).toBeGreaterThan(0)
    expect(result.data.intelligence_layers.autonomous).toBe(0) // Not allowed at level 3
    
    console.log(`[AI_V3_TEST] Prescriptive insights - D:${result.data.intelligence_layers.descriptive}, P:${result.data.intelligence_layers.predictive}, Pr:${result.data.intelligence_layers.prescriptive}`)
  }, 10000)
  
  test('generates autonomous insights with intelligence level 4', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE', 'AUTONOMOUS'],
      p_intelligence_level: 4,
      p_dry_run: false
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    expect(result.data.intelligence_layers.autonomous).toBeGreaterThan(0)
    
    console.log(`[AI_V3_TEST] Full intelligence insights - A:${result.data.intelligence_layers.autonomous}`)
  }, 10000)
  
  test('dry run mode provides preview without persistence', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: true
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    expect(result.data.preview_insights).toBeDefined()
    expect(result.data.preview_insights.descriptive).toBeDefined()
    expect(Array.isArray(result.data.preview_insights.descriptive)).toBe(true)
    expect(result.data.preview_insights.descriptive.length).toBeGreaterThan(0)
    
    // Verify insight structure
    const firstInsight = result.data.preview_insights.descriptive[0]
    expect(firstInsight.insight_type).toBe('DESCRIPTIVE')
    expect(firstInsight.insight_title).toBeDefined()
    expect(firstInsight.insight_description).toBeDefined()
    expect(firstInsight.confidence_score).toBeGreaterThan(0)
    expect(firstInsight.confidence_score).toBeLessThanOrEqual(1)
    expect(firstInsight.smart_code).toContain('HERA.AI.INSIGHT.DESC')
    
    console.log(`[AI_V3_TEST] Dry run preview: ${result.data.preview_insights.descriptive.length} insights`)
  }, 10000)
  
  test('handles invalid organization gracefully', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: 'invalid-org-id',
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: true
    }, { mode: 'service' })
    
    expect(result.success).toBe(false)
    expect(result.data.success).toBe(false)
    expect(result.data.error_code).toBe('AI_ORG_NOT_FOUND')
    expect(result.data.error).toContain('Organization not found')
  })
  
  test('handles invalid period format gracefully', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: 'invalid-period',
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: true
    }, { mode: 'service' })
    
    expect(result.success).toBe(false)
    expect(result.data.success).toBe(false)
    expect(result.data.error_code).toBe('AI_PERIOD_INVALID')
    expect(result.data.error).toContain('Invalid period format')
  })
})

// ============================================================================
// TypeScript Client Tests
// ============================================================================

describe('AI Insights TypeScript Client', () => {
  let client: AIInsightsClient
  
  beforeEach(() => {
    client = new AIInsightsClient(TEST_ORG_ID)
  })
  
  test('generates insights via TypeScript client', async () => {
    const result = await client.generateDescriptiveInsights(TEST_PERIOD, {
      dry_run: true,
      confidence_threshold: 0.7
    })
    
    expect(result.success).toBe(true)
    expect(result.insights_generated).toBeGreaterThan(0)
    expect(result.preview_insights?.descriptive).toBeDefined()
    
    console.log(`[AI_V3_TEST] Client generated: ${result.insights_generated} insights`)
  }, 10000)
  
  test('generates predictive insights via client', async () => {
    const result = await client.generatePredictiveInsights(TEST_PERIOD, {
      include_descriptive: true,
      dry_run: true
    })
    
    expect(result.success).toBe(true)
    expect(result.intelligence_layers?.descriptive).toBeGreaterThan(0)
    expect(result.intelligence_layers?.predictive).toBeGreaterThan(0)
    
    console.log(`[AI_V3_TEST] Predictive via client - D:${result.intelligence_layers?.descriptive}, P:${result.intelligence_layers?.predictive}`)
  }, 10000)
  
  test('queries insights after generation', async () => {
    // First generate some insights
    await client.generateDescriptiveInsights(TEST_PERIOD)
    
    // Then query them
    const insights = await client.getInsightsByPeriod(TEST_PERIOD, ['DESCRIPTIVE'])
    
    expect(Array.isArray(insights)).toBe(true)
    expect(insights.length).toBeGreaterThan(0)
    
    // Validate insight structure
    const firstInsight = insights[0]
    expect(firstInsight.organization_id).toBe(TEST_ORG_ID)
    expect(firstInsight.insight_type).toBe('DESCRIPTIVE')
    expect(firstInsight.confidence_score).toBeGreaterThan(0)
    expect(firstInsight.smart_code).toContain('HERA.AI.INSIGHT')
    
    console.log(`[AI_V3_TEST] Queried ${insights.length} insights for period ${TEST_PERIOD}`)
  }, 15000)
  
  test('gets high confidence insights', async () => {
    const insights = await client.getHighConfidenceInsights(TEST_PERIOD, 0.8)
    
    expect(Array.isArray(insights)).toBe(true)
    
    // All returned insights should meet confidence threshold
    for (const insight of insights) {
      expect(insight.confidence_score).toBeGreaterThanOrEqual(0.8)
    }
    
    console.log(`[AI_V3_TEST] Found ${insights.length} high-confidence insights`)
  }, 10000)
  
  test('gets insights summary', async () => {
    const summary = await client.getInsightsSummary(TEST_PERIOD)
    
    expect(summary).toBeDefined()
    expect(summary.total_insights).toBeGreaterThanOrEqual(0)
    expect(summary.by_type).toBeDefined()
    expect(summary.avg_confidence).toBeGreaterThanOrEqual(0)
    expect(summary.avg_confidence).toBeLessThanOrEqual(1)
    
    console.log(`[AI_V3_TEST] Summary: ${summary.total_insights} insights, ${summary.avg_confidence} avg confidence`)
  }, 10000)
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('AI Insights Performance Tests', () => {
  test('meets sub-5 second performance requirement', async () => {
    const startTime = Date.now()
    
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE', 'PREDICTIVE'],
      p_intelligence_level: 2,
      p_dry_run: false
    }, { mode: 'service' })
    
    const totalTime = Date.now() - startTime
    
    expect(result.success).toBe(true)
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    expect(result.data.processing_time_ms).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
    
    console.log(`[AI_V3_PERFORMANCE] Total: ${totalTime}ms, Processing: ${result.data.processing_time_ms}ms`)
  }, 10000)
  
  test('handles concurrent insight generation', async () => {
    const concurrentRequests = 3
    const promises = []
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        callRPC('hera_ai_insight_generate_v3', {
          p_organization_id: TEST_ORG_ID,
          p_period: TEST_PERIOD,
          p_insight_types: ['DESCRIPTIVE'],
          p_intelligence_level: 1,
          p_dry_run: true
        }, { mode: 'service' })
      )
    }
    
    const startTime = Date.now()
    const results = await Promise.all(promises)
    const totalTime = Date.now() - startTime
    
    // All requests should succeed
    for (const result of results) {
      expect(result.success).toBe(true)
      expect(result.data.success).toBe(true)
    }
    
    // Total time should still be reasonable (not 3x longer)
    expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 1.5)
    
    console.log(`[AI_V3_PERFORMANCE] Concurrent ${concurrentRequests} requests: ${totalTime}ms`)
  }, 15000)
})

// ============================================================================
// Audit Trail Tests
// ============================================================================

describe('AI Insights Audit Trail', () => {
  test('creates proper universal transactions audit trail', async () => {
    // Generate insights
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: false
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    const runId = result.data.run_id
    
    // Verify transaction header exists
    const headerQuery = await callRPC('hera_universal_query_v2', {
      p_sql: `
        SELECT id, transaction_type, transaction_code, smart_code, status, metadata
        FROM universal_transactions 
        WHERE id = $1 AND organization_id = $2
      `,
      p_params: [runId, TEST_ORG_ID]
    }, { mode: 'service' })
    
    expect(headerQuery.success).toBe(true)
    expect(headerQuery.data.length).toBe(1)
    
    const header = headerQuery.data[0]
    expect(header.transaction_type).toBe('AI_INSIGHT_RUN')
    expect(header.smart_code).toBe(AI_INSIGHT_SMART_CODES.RUN)
    expect(header.status).toBe('COMPLETED')
    expect(header.metadata).toBeDefined()
    
    // Verify transaction lines exist  
    const linesQuery = await callRPC('hera_universal_query_v2', {
      p_sql: `
        SELECT line_type, smart_code, metadata
        FROM universal_transaction_lines 
        WHERE transaction_id = $1 AND organization_id = $2
        ORDER BY line_number
      `,
      p_params: [runId, TEST_ORG_ID]
    }, { mode: 'service' })
    
    expect(linesQuery.success).toBe(true)
    expect(linesQuery.data.length).toBeGreaterThan(0)
    
    // Verify line structure
    const firstLine = linesQuery.data[0]
    expect(firstLine.line_type).toBe('AI_INSIGHT_DESCRIPTIVE')
    expect(firstLine.smart_code).toBe(AI_INSIGHT_SMART_CODES.DESCRIPTIVE)
    expect(firstLine.metadata).toBeDefined()
    
    const metadata = JSON.parse(firstLine.metadata)
    expect(metadata.insight_type).toBe('DESCRIPTIVE')
    expect(metadata.insight_title).toBeDefined()
    expect(metadata.confidence_score).toBeGreaterThan(0)
    
    console.log(`[AI_V3_AUDIT] Verified audit trail for run ${runId} with ${linesQuery.data.length} insight lines`)
  }, 10000)
  
  test('maintains complete audit trail across intelligence layers', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE', 'PREDICTIVE', 'PRESCRIPTIVE'],
      p_intelligence_level: 3,
      p_dry_run: false
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    const runId = result.data.run_id
    
    // Verify all insight types are recorded
    const typesQuery = await callRPC('hera_universal_query_v2', {
      p_sql: `
        SELECT line_type, COUNT(*) as count
        FROM universal_transaction_lines 
        WHERE transaction_id = $1 AND organization_id = $2
        GROUP BY line_type
        ORDER BY line_type
      `,
      p_params: [runId, TEST_ORG_ID]
    }, { mode: 'service' })
    
    expect(typesQuery.success).toBe(true)
    
    const typesByName = typesQuery.data.reduce((acc: any, row: any) => {
      acc[row.line_type] = parseInt(row.count)
      return acc
    }, {})
    
    expect(typesByName['AI_INSIGHT_DESCRIPTIVE']).toBeGreaterThan(0)
    expect(typesByName['AI_INSIGHT_PREDICTIVE']).toBeGreaterThan(0)
    expect(typesByName['AI_INSIGHT_PRESCRIPTIVE']).toBeGreaterThan(0)
    
    console.log(`[AI_V3_AUDIT] Intelligence layers recorded:`, typesByName)
  }, 15000)
})

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('AI Insights Error Handling', () => {
  test('handles insufficient data gracefully', async () => {
    // Use a period with no data
    const emptyPeriod = '2020-01'
    
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: emptyPeriod,
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: true
    }, { mode: 'service' })
    
    // Should still succeed but with appropriate warnings/metadata
    expect(result.success).toBe(true)
    expect(result.data.data_foundation.fact_count).toBe(0)
    
    console.log(`[AI_V3_ERROR] Empty period handled gracefully: ${result.data.data_foundation.fact_count} facts`)
  })
  
  test('validates intelligence level constraints', async () => {
    // Try to get prescriptive insights with level 1 (should be limited)
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['PRESCRIPTIVE'], // Requires level 3+
      p_intelligence_level: 1, // Too low
      p_dry_run: true
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    // Should not generate prescriptive insights at level 1
    expect(result.data.intelligence_layers.prescriptive).toBe(0)
    
    console.log(`[AI_V3_ERROR] Intelligence level constraint respected`)
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('AI Insights Integration Tests', () => {
  test('integrates with profitability v2 data correctly', async () => {
    // This test verifies the AI insights extract features from the profitability fact table
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE'],
      p_intelligence_level: 1,
      p_dry_run: true
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    expect(result.data.data_foundation.fact_count).toBeGreaterThan(0)
    
    // Verify feature vector includes profitability data
    const metadata = result.data.metadata
    expect(metadata.organization_id).toBe(TEST_ORG_ID)
    
    console.log(`[AI_V3_INTEGRATION] Used ${result.data.data_foundation.fact_count} profitability facts`)
  }, 10000)
  
  test('smart codes follow HERA DNA patterns', async () => {
    const result = await callRPC('hera_ai_insight_generate_v3', {
      p_organization_id: TEST_ORG_ID,
      p_period: TEST_PERIOD,
      p_insight_types: ['DESCRIPTIVE', 'PREDICTIVE'],
      p_intelligence_level: 2,
      p_dry_run: true
    }, { mode: 'service' })
    
    expect(result.success).toBe(true)
    
    // Verify preview insights have proper smart codes
    if (result.data.preview_insights) {
      for (const insight of result.data.preview_insights.descriptive || []) {
        expect(insight.smart_code).toMatch(/^HERA\.AI\.INSIGHT\.DESC\..*\.V3$/)
      }
      
      for (const insight of result.data.preview_insights.predictive || []) {
        expect(insight.smart_code).toMatch(/^HERA\.AI\.INSIGHT\.PRED\..*\.V3$/)
      }
    }
    
    console.log(`[AI_V3_INTEGRATION] Smart codes verified for DNA compliance`)
  }, 10000)
})

console.log('[AI_V3_TEST] AI Insights Engine v3 Test Suite Loaded - Ready for execution')