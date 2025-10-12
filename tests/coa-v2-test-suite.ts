/**
 * HERA COA v2: Comprehensive Test Suite
 * 
 * Complete test coverage for COA v2 standard including:
 * - Guardrails validation
 * - RPC function behavior
 * - API endpoints
 * - Edge cases and error handling
 * 
 * Smart Code: HERA.FIN.COA.TEST.SUITE.V2
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom'
import { createClient } from '@supabase/supabase-js'
import {
  COAGuardrailsEngine,
  applyCOAGuardrails,
  validatePostingDimensions,
  validateAccountArchive,
  batchValidateCOAAccounts
} from '@/lib/coa/coa-v2-guardrails'
import {
  type COAAccount,
  type COACreateRequest,
  type COAUpdateRequest,
  type COAValidationError,
  COA_SMART_CODES,
  IFRS_STANDARD_TAGS,
  getAccountRange,
  inferNormalBalance,
  calculateDepth,
  generateDisplayNumber,
  validateAccountNumber,
  validateIFRSTags,
  validateSmartCode
} from '@/lib/coa/coa-v2-standard'

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_ORG_ID = '123e4567-e89b-12d3-a456-426614174000'
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174001'

// Mock Supabase client for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// Test Data Setup
// ============================================================================

const createTestAccount = (overrides: Partial<COAAccount> = {}): COAAccount => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  organization_id: TEST_ORG_ID,
  entity_type: 'ACCOUNT',
  entity_name: 'Test Cash Account',
  entity_code: '1.1.1',
  status: 'ACTIVE',
  smart_code: COA_SMART_CODES.ENTITY_ACCOUNT,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  account_number: '1.1.1',
  normal_balance: 'Dr',
  depth: 3,
  is_postable: true,
  ifrs_tags: [IFRS_STANDARD_TAGS.CURRENT_ASSETS, IFRS_STANDARD_TAGS.CASH],
  parent_id: '123e4567-e89b-12d3-a456-426614174003',
  ...overrides
})

const createTestCreateRequest = (overrides: Partial<COACreateRequest> = {}): COACreateRequest => ({
  entity_name: 'Test Account',
  account_number: '4.1.1',
  is_postable: true,
  ifrs_tags: [IFRS_STANDARD_TAGS.REVENUE],
  ...overrides
})

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('COA v2 Utility Functions', () => {
  describe('getAccountRange', () => {
    test('should return correct range for single digit', () => {
      expect(getAccountRange('1')).toBe('1xxx')
      expect(getAccountRange('4')).toBe('4xxx')
      expect(getAccountRange('9')).toBe('9xxx')
    })

    test('should return correct range for hierarchical numbers', () => {
      expect(getAccountRange('1.2.3')).toBe('1xxx')
      expect(getAccountRange('4.10.5')).toBe('4xxx')
      expect(getAccountRange('9.99.99.99')).toBe('9xxx')
    })
  })

  describe('inferNormalBalance', () => {
    test('should infer correct normal balance for assets', () => {
      expect(inferNormalBalance('1')).toBe('Dr')
      expect(inferNormalBalance('1.2.3')).toBe('Dr')
    })

    test('should infer correct normal balance for liabilities', () => {
      expect(inferNormalBalance('2')).toBe('Cr')
      expect(inferNormalBalance('2.1.1')).toBe('Cr')
    })

    test('should infer correct normal balance for revenue', () => {
      expect(inferNormalBalance('4')).toBe('Cr')
      expect(inferNormalBalance('4.1.2')).toBe('Cr')
    })

    test('should infer correct normal balance for expenses', () => {
      expect(inferNormalBalance('6')).toBe('Dr')
      expect(inferNormalBalance('6.2.1')).toBe('Dr')
    })
  })

  describe('calculateDepth', () => {
    test('should calculate correct depth', () => {
      expect(calculateDepth('1')).toBe(1)
      expect(calculateDepth('1.2')).toBe(2)
      expect(calculateDepth('1.2.3')).toBe(3)
      expect(calculateDepth('1.2.3.4.5.6.7.8')).toBe(8)
    })
  })

  describe('generateDisplayNumber', () => {
    test('should generate zero-padded display number', () => {
      expect(generateDisplayNumber('1.2.3')).toBe('010203')
      expect(generateDisplayNumber('4.10.5')).toBe('041005')
      expect(generateDisplayNumber('1', 8)).toBe('01000000')
    })
  })

  describe('validateAccountNumber', () => {
    test('should accept valid hierarchical formats', () => {
      const result1 = validateAccountNumber('1.2.3')
      expect(result1.valid).toBe(true)
      expect(result1.errors).toHaveLength(0)

      const result2 = validateAccountNumber('4.10.15.20')
      expect(result2.valid).toBe(true)
      expect(result2.errors).toHaveLength(0)
    })

    test('should reject invalid formats', () => {
      const result1 = validateAccountNumber('0.1.2')
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain('Account number must start with digit 1-9')

      const result2 = validateAccountNumber('1.2.3.4.5.6.7.8.9')
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain('Account number cannot exceed 8 levels of depth')

      const result3 = validateAccountNumber('1-2-3')
      expect(result3.valid).toBe(false)
      expect(result3.errors).toContain('Account number must follow hierarchical format (e.g., "4.1.2")')
    })
  })

  describe('validateIFRSTags', () => {
    test('should accept valid IFRS tags', () => {
      const result = validateIFRSTags(['CURRENT_ASSETS', 'CASH'])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject empty or invalid tags', () => {
      const result1 = validateIFRSTags([])
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain('IFRS tags are required for postable accounts')

      const result2 = validateIFRSTags(['invalid-tag', 'VALID_TAG'])
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain('Invalid IFRS tag format: invalid-tag')
    })
  })

  describe('validateSmartCode', () => {
    test('should accept valid smart codes', () => {
      expect(validateSmartCode(COA_SMART_CODES.ENTITY_ACCOUNT)).toBe(true)
      expect(validateSmartCode('HERA.FIN.COA.TEST.EXAMPLE.v1')).toBe(true)
    })

    test('should reject invalid smart codes', () => {
      expect(validateSmartCode('invalid-smart-code')).toBe(false)
      expect(validateSmartCode('HERA.FIN')).toBe(false)
      expect(validateSmartCode('HERA.FIN.COA.TEST.v1.EXTRA')).toBe(false)
    })
  })
})

// ============================================================================
// Guardrails Engine Tests
// ============================================================================

describe('COA v2 Guardrails Engine', () => {
  let guardrails: COAGuardrailsEngine

  beforeEach(() => {
    guardrails = new COAGuardrailsEngine()
  })

  describe('validateCreate', () => {
    test('should accept valid account creation', async () => {
      const request = createTestCreateRequest()
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject duplicate account numbers', async () => {
      const request = createTestCreateRequest({ account_number: '4.1.1' })
      const existingAccounts = [createTestAccount({ account_number: '4.1.1' })]
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, existingAccounts)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_DUPLICATE_NUMBER'
        })
      )
    })

    test('should reject invalid normal balance for range', async () => {
      const request = createTestCreateRequest({
        account_number: '4.1.1',  // Revenue range
        normal_balance: 'Dr'      // Should be Cr for revenue
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_INVALID_NORMAL_BALANCE'
        })
      )
    })

    test('should reject postable accounts without IFRS tags', async () => {
      const request = createTestCreateRequest({
        is_postable: true,
        ifrs_tags: []
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_MISSING_IFRS_TAGS'
        })
      )
    })

    test('should reject accounts exceeding maximum depth', async () => {
      const request = createTestCreateRequest({
        account_number: '1.2.3.4.5.6.7.8.9'  // 9 levels, max is 8
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_MAX_DEPTH_EXCEEDED'
        })
      )
    })

    test('should validate parent-child relationship depth', async () => {
      const parentAccount = createTestAccount({
        id: 'parent-id',
        account_number: '4.1',
        depth: 2
      })
      
      const request = createTestCreateRequest({
        account_number: '4.1.1.1',  // Should be depth 3, not 4
        parent_id: 'parent-id'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [parentAccount])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_INVALID_NUMBER_FORMAT'
        })
      )
    })
  })

  describe('validateUpdate', () => {
    test('should accept valid account updates', async () => {
      const existingAccount = createTestAccount()
      const request: COAUpdateRequest = {
        entity_name: 'Updated Account Name'
      }
      
      const result = await guardrails.validateUpdate('account-id', request, existingAccount, [existingAccount])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject making parent account postable', async () => {
      const parentAccount = createTestAccount({ id: 'parent-id' })
      const childAccount = createTestAccount({ parent_id: 'parent-id' })
      
      const request: COAUpdateRequest = {
        is_postable: true
      }
      
      const result = await guardrails.validateUpdate('parent-id', request, parentAccount, [parentAccount, childAccount])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_POSTABLE_NOT_LEAF'
        })
      )
    })
  })

  describe('validateDimensionalCompleteness', () => {
    test('should accept complete dimensions for revenue accounts', () => {
      const result = guardrails.validateDimensionalCompleteness('4.1.1', {
        profit_center: 'PC001',
        product: 'PROD001',
        region: 'NORTH',
        channel: 'ONLINE'
      })
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject missing required dimensions', () => {
      const result = guardrails.validateDimensionalCompleteness('4.1.1', {
        profit_center: 'PC001'
        // Missing: product, region, channel
      })
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_DIM_REQUIREMENT_MISSING'
        })
      )
    })

    test('should allow missing dimensions for asset accounts', () => {
      const result = guardrails.validateDimensionalCompleteness('1.1.1', {})
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateArchive', () => {
    test('should allow archiving leaf accounts with no transactions', () => {
      const account = createTestAccount()
      const result = guardrails.validateArchive(account, [account], false)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject archiving accounts with children', () => {
      const parentAccount = createTestAccount({ id: 'parent-id' })
      const childAccount = createTestAccount({ parent_id: 'parent-id' })
      
      const result = guardrails.validateArchive(parentAccount, [parentAccount, childAccount], false)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_ACCOUNT_IN_USE'
        })
      )
    })

    test('should reject archiving accounts with transactions when policy enforces', () => {
      const account = createTestAccount()
      const result = guardrails.validateArchive(account, [account], true)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_COA_ACCOUNT_IN_USE'
        })
      )
    })
  })
})

// ============================================================================
// Batch Operations Tests
// ============================================================================

describe('COA v2 Batch Operations', () => {
  test('should validate multiple accounts correctly', async () => {
    const accounts = [
      createTestCreateRequest({ account_number: '4.1.1' }),
      createTestCreateRequest({ account_number: '4.1.2' }),
      createTestCreateRequest({ account_number: '4.1.1' }) // Duplicate
    ]
    
    const results = await batchValidateCOAAccounts(accounts, TEST_ORG_ID, [])
    
    expect(results).toHaveLength(3)
    expect(results[0]!.valid).toBe(true)
    expect(results[1]!.valid).toBe(true)
    expect(results[2]!.valid).toBe(false) // Duplicate should fail
    expect(results[2]!.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_COA_DUPLICATE_NUMBER'
      })
    )
  })
})

// ============================================================================
// Integration Tests (with Supabase)
// ============================================================================

describe('COA v2 Integration Tests', () => {
  beforeAll(async () => {
    // Setup test organization and cleanup any existing test data
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', TEST_ORG_ID)
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', TEST_ORG_ID)
  })

  test('should create account via RPC function', async () => {
    const { data, error } = await supabase.rpc('hera_coa_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_account_id: null,
      p_entity_name: 'Test Cash Account',
      p_account_number: '1.1.1',
      p_normal_balance: 'Dr',
      p_is_postable: true,
      p_ifrs_tags: ['CURRENT_ASSETS', 'CASH'],
      p_smart_code: COA_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      entity_name: 'Test Cash Account',
      account_number: '1.1.1',
      normal_balance: 'Dr',
      depth: 3,
      is_postable: true
    })
  })

  test('should update account via RPC function', async () => {
    // First create an account
    const { data: createResult } = await supabase.rpc('hera_coa_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_account_id: null,
      p_entity_name: 'Original Name',
      p_account_number: '1.2.1',
      p_is_postable: true,
      p_ifrs_tags: ['CURRENT_ASSETS'],
      p_smart_code: COA_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    const accountId = createResult[0]!.account_id

    // Then update it
    const { data, error } = await supabase.rpc('hera_coa_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_account_id: accountId,
      p_entity_name: 'Updated Name',
      p_account_number: '1.2.1',
      p_is_postable: false,
      p_ifrs_tags: ['CURRENT_ASSETS'],
      p_smart_code: COA_SMART_CODES.TXN_UPDATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(data[0]).toMatchObject({
      account_id: accountId,
      entity_name: 'Updated Name',
      is_postable: false
    })
  })

  test('should reject duplicate account numbers', async () => {
    // First create an account
    await supabase.rpc('hera_coa_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_account_id: null,
      p_entity_name: 'First Account',
      p_account_number: '1.3.1',
      p_is_postable: true,
      p_ifrs_tags: ['CURRENT_ASSETS'],
      p_smart_code: COA_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    // Try to create duplicate
    const { error } = await supabase.rpc('hera_coa_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_account_id: null,
      p_entity_name: 'Duplicate Account',
      p_account_number: '1.3.1', // Same number
      p_is_postable: true,
      p_ifrs_tags: ['CURRENT_ASSETS'],
      p_smart_code: COA_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('already exists')
  })

  test('should validate normal balance against range', async () => {
    const { error } = await supabase.rpc('hera_coa_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_account_id: null,
      p_entity_name: 'Invalid Revenue Account',
      p_account_number: '4.1.1',
      p_normal_balance: 'Dr', // Should be Cr for revenue
      p_is_postable: true,
      p_ifrs_tags: ['REVENUE'],
      p_smart_code: COA_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('Normal balance')
  })
})

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('COA v2 Edge Cases', () => {
  test('should handle account numbers with leading zeros', () => {
    const result = validateAccountNumber('1.01.02')
    expect(result.valid).toBe(true)
  })

  test('should handle very deep hierarchies up to limit', () => {
    const result = validateAccountNumber('1.2.3.4.5.6.7.8')
    expect(result.valid).toBe(true)
    expect(calculateDepth('1.2.3.4.5.6.7.8')).toBe(8)
  })

  test('should handle empty IFRS tags for non-postable accounts', () => {
    const request = createTestCreateRequest({
      is_postable: false,
      ifrs_tags: []
    })
    
    const guardrails = new COAGuardrailsEngine()
    return guardrails.validateCreate(request, TEST_ORG_ID, []).then(result => {
      expect(result.valid).toBe(true)
    })
  })

  test('should handle accounts with null parent_id', async () => {
    const request = createTestCreateRequest({
      parent_id: undefined
    })
    
    const guardrails = new COAGuardrailsEngine()
    const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
    expect(result.valid).toBe(true)
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('COA v2 Performance Tests', () => {
  test('should handle large batch validation efficiently', async () => {
    const accounts = Array.from({ length: 100 }, (_, i) => 
      createTestCreateRequest({ 
        account_number: `4.${Math.floor(i / 10) + 1}.${(i % 10) + 1}`,
        entity_name: `Account ${i + 1}`
      })
    )
    
    const startTime = performance.now()
    const results = await batchValidateCOAAccounts(accounts, TEST_ORG_ID, [])
    const endTime = performance.now()
    
    expect(results).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
    
    // All should be valid since they have unique numbers
    const allValid = results.every(r => r.valid)
    expect(allValid).toBe(true)
  })

  test('should validate complex dimensional requirements quickly', () => {
    const startTime = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      validatePostingDimensions('4.1.1', {
        profit_center: 'PC001',
        product: 'PROD001',
        region: 'NORTH',
        channel: 'ONLINE'
      })
    }
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // Should be very fast
  })
})