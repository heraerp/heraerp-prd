/**
 * HERA Cost Center v2: Comprehensive Test Suite
 * 
 * Complete test coverage for Cost Center v2 standard including:
 * - Guardrails validation
 * - RPC function behavior
 * - API endpoints
 * - Hierarchy management
 * - Edge cases and error handling
 * 
 * Smart Code: HERA.COSTCENTER.TEST.SUITE.V2
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/testing-library/jest-dom'
import { createClient } from '@supabase/supabase-js'
import {
  CostCenterGuardrailsEngine,
  applyCostCenterGuardrails,
  validatePostingCostCenter,
  validateCostCenterArchive,
  batchValidateCostCenters
} from '@/lib/costcenter/costcenter-v2-guardrails'
import {
  type CostCenter,
  type CostCenterCreateRequest,
  type CostCenterUpdateRequest,
  type CostCenterValidationError,
  COST_CENTER_SMART_CODES,
  COST_CENTER_TYPES,
  STANDARD_COST_CENTER_TEMPLATES,
  calculateCostCenterDepth,
  generateCostCenterCode,
  validateCostCenterCode,
  validateCostCenterType,
  validateValidityDates,
  validateTags,
  validateSmartCode,
  detectCycle,
  buildCostCenterPath,
  getCostCenterAncestors,
  getCostCenterDescendants
} from '@/lib/costcenter/costcenter-v2-standard'

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

const createTestCostCenter = (overrides: Partial<CostCenter> = {}): CostCenter => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  organization_id: TEST_ORG_ID,
  entity_type: 'COST_CENTER',
  entity_name: 'Test Administration',
  entity_code: 'CC-ADMIN-001',
  status: 'ACTIVE',
  smart_code: COST_CENTER_SMART_CODES.ENTITY_COST_CENTER,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  cc_code: 'CC-ADMIN-001',
  depth: 1,
  cost_center_type: 'ADMIN',
  valid_from: '2025-01-01',
  valid_to: undefined,
  responsible_person: 'John Doe',
  segment: 'CORPORATE',
  tags: ['ADMIN', 'OVERHEAD'],
  parent_id: undefined,
  ...overrides
})

const createTestCreateRequest = (overrides: Partial<CostCenterCreateRequest> = {}): CostCenterCreateRequest => ({
  entity_name: 'Test Cost Center',
  cc_code: 'CC-TEST-001',
  cost_center_type: 'ADMIN',
  valid_from: '2025-01-01',
  tags: ['TEST'],
  ...overrides
})

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Cost Center v2 Utility Functions', () => {
  describe('calculateCostCenterDepth', () => {
    test('should calculate correct depth for root level', () => {
      expect(calculateCostCenterDepth(null)).toBe(1)
      expect(calculateCostCenterDepth(0)).toBe(1)
    })

    test('should calculate correct depth for child levels', () => {
      expect(calculateCostCenterDepth(1)).toBe(2)
      expect(calculateCostCenterDepth(3)).toBe(4)
      expect(calculateCostCenterDepth(5)).toBe(6)
    })
  })

  describe('generateCostCenterCode', () => {
    test('should generate correctly formatted codes', () => {
      expect(generateCostCenterCode('CC', 'ADMIN', 1)).toBe('CC-ADM-001')
      expect(generateCostCenterCode('CC', 'PRODUCTION', 15)).toBe('CC-PRO-015')
      expect(generateCostCenterCode('CC', 'SALES', 123)).toBe('CC-SAL-123')
    })
  })

  describe('validateCostCenterCode', () => {
    test('should accept valid cost center codes', () => {
      const result1 = validateCostCenterCode('CC-ADMIN-001')
      expect(result1.valid).toBe(true)
      expect(result1.errors).toHaveLength(0)

      const result2 = validateCostCenterCode('DEPT_IT_UK_001')
      expect(result2.valid).toBe(true)
      expect(result2.errors).toHaveLength(0)
    })

    test('should reject invalid cost center codes', () => {
      const result1 = validateCostCenterCode('')
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain('Cost center code is required')

      const result2 = validateCostCenterCode('AB')
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain('Cost center code must be between 3 and 50 characters')

      const result3 = validateCostCenterCode('CC-ADMIN-001!')
      expect(result3.valid).toBe(false)
      expect(result3.errors).toContain('Cost center code can only contain letters, numbers, hyphens, and underscores')
    })
  })

  describe('validateCostCenterType', () => {
    test('should accept valid cost center types', () => {
      Object.values(COST_CENTER_TYPES).forEach(type => {
        const result = validateCostCenterType(type)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    test('should reject invalid cost center types', () => {
      const result1 = validateCostCenterType('')
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain('Cost center type is required')

      const result2 = validateCostCenterType('INVALID_TYPE')
      expect(result2.valid).toBe(false)
      expect(result2.errors[0]).toContain('Invalid cost center type')
    })
  })

  describe('validateValidityDates', () => {
    test('should accept valid date ranges', () => {
      const result1 = validateValidityDates('2025-01-01', '2025-12-31')
      expect(result1.valid).toBe(true)
      expect(result1.errors).toHaveLength(0)

      const result2 = validateValidityDates('2025-01-01', undefined)
      expect(result2.valid).toBe(true)
      expect(result2.errors).toHaveLength(0)
    })

    test('should reject invalid date ranges', () => {
      const result1 = validateValidityDates('2025-12-31', '2025-01-01')
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain('valid_to date must be after valid_from date')

      const result2 = validateValidityDates('invalid-date', '2025-12-31')
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain('Invalid valid_from date format')
    })
  })

  describe('validateTags', () => {
    test('should accept valid tags', () => {
      const result = validateTags(['ADMIN', 'OVERHEAD', 'UK'])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject invalid tags', () => {
      const result1 = validateTags(['ADMIN', 'ADMIN']) // Duplicates
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain('Duplicate tags are not allowed')

      const result2 = validateTags(['ADMIN', 'INVALID@TAG'])
      expect(result2.valid).toBe(false)
      expect(result2.errors[0]).toContain('Tags must be non-empty strings')
    })
  })

  describe('validateSmartCode', () => {
    test('should accept valid smart codes', () => {
      expect(validateSmartCode(COST_CENTER_SMART_CODES.ENTITY_COST_CENTER)).toBe(true)
      expect(validateSmartCode('HERA.COSTCENTER.TEST.EXAMPLE.v1')).toBe(true)
    })

    test('should reject invalid smart codes', () => {
      expect(validateSmartCode('invalid-smart-code')).toBe(false)
      expect(validateSmartCode('HERA.FINANCE')).toBe(false)
    })
  })

  describe('detectCycle', () => {
    test('should detect direct cycle', () => {
      const costCenters = [
        createTestCostCenter({ id: 'a', parent_id: undefined }),
        createTestCostCenter({ id: 'b', parent_id: 'a' })
      ]
      
      expect(detectCycle('a', 'b', costCenters)).toBe(false)
      expect(detectCycle('b', 'a', costCenters)).toBe(true)
    })

    test('should detect indirect cycle', () => {
      const costCenters = [
        createTestCostCenter({ id: 'a', parent_id: undefined }),
        createTestCostCenter({ id: 'b', parent_id: 'a' }),
        createTestCostCenter({ id: 'c', parent_id: 'b' })
      ]
      
      expect(detectCycle('a', 'c', costCenters)).toBe(true)
      expect(detectCycle('c', 'a', costCenters)).toBe(false)
    })
  })
})

// ============================================================================
// Guardrails Engine Tests
// ============================================================================

describe('Cost Center v2 Guardrails Engine', () => {
  let guardrails: CostCenterGuardrailsEngine

  beforeEach(() => {
    guardrails = new CostCenterGuardrailsEngine()
  })

  describe('validateCreate', () => {
    test('should accept valid cost center creation', async () => {
      const request = createTestCreateRequest()
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject duplicate cost center codes', async () => {
      const request = createTestCreateRequest({ cc_code: 'CC-ADMIN-001' })
      const existingCostCenters = [createTestCostCenter({ cc_code: 'CC-ADMIN-001' })]
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, existingCostCenters)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_DUPLICATE_CODE'
        })
      )
    })

    test('should reject invalid cost center code format', async () => {
      const request = createTestCreateRequest({ cc_code: 'INVALID@CODE' })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_INVALID_CODE_FORMAT'
        })
      )
    })

    test('should reject invalid cost center type', async () => {
      const request = createTestCreateRequest({ cost_center_type: 'INVALID_TYPE' })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_INVALID_TYPE'
        })
      )
    })

    test('should reject invalid validity dates', async () => {
      const request = createTestCreateRequest({
        valid_from: '2025-12-31',
        valid_to: '2025-01-01'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_INVALID_VALIDITY_DATES'
        })
      )
    })

    test('should reject invalid tags', async () => {
      const request = createTestCreateRequest({
        tags: ['ADMIN', 'ADMIN'] // Duplicates
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_INVALID_TAGS'
        })
      )
    })

    test('should reject non-existent parent', async () => {
      const request = createTestCreateRequest({
        parent_id: 'non-existent-parent'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_PARENT_NOT_FOUND'
        })
      )
    })

    test('should reject archived parent', async () => {
      const parentCostCenter = createTestCostCenter({
        id: 'parent-id',
        status: 'ARCHIVED'
      })
      
      const request = createTestCreateRequest({
        parent_id: 'parent-id'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [parentCostCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_ARCHIVED_PARENT'
        })
      )
    })

    test('should reject excessive depth', async () => {
      const parentCostCenter = createTestCostCenter({
        id: 'parent-id',
        depth: 6 // Max depth, child would be 7
      })
      
      const request = createTestCreateRequest({
        parent_id: 'parent-id'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [parentCostCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_MAX_DEPTH_EXCEEDED'
        })
      )
    })
  })

  describe('validateUpdate', () => {
    test('should accept valid cost center updates', async () => {
      const existingCostCenter = createTestCostCenter()
      const request: CostCenterUpdateRequest = {
        entity_name: 'Updated Cost Center Name'
      }
      
      const result = await guardrails.validateUpdate('cost-center-id', request, existingCostCenter, [existingCostCenter])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject cycle creation', async () => {
      const parentCostCenter = createTestCostCenter({ id: 'parent-id', parent_id: 'child-id' })
      const childCostCenter = createTestCostCenter({ id: 'child-id', parent_id: 'parent-id' })
      
      const request: CostCenterUpdateRequest = {
        parent_id: 'child-id'
      }
      
      const result = await guardrails.validateUpdate('parent-id', request, parentCostCenter, [parentCostCenter, childCostCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_CYCLE_DETECTED'
        })
      )
    })
  })

  describe('validatePostingRequirement', () => {
    test('should require cost center for 6xxx accounts', () => {
      const result = guardrails.validatePostingRequirement('6.1.1') // OPEX account
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_DIM_MISSING_COST_CENTER'
        })
      )
    })

    test('should accept cost center for 6xxx accounts', () => {
      const costCenter = createTestCostCenter()
      const result = guardrails.validatePostingRequirement('6.1.1', costCenter.id, [costCenter])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should not require cost center for non-6xxx accounts', () => {
      const result = guardrails.validatePostingRequirement('1.1.1') // Asset account
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject archived cost center for posting', () => {
      const costCenter = createTestCostCenter({ status: 'ARCHIVED' })
      const result = guardrails.validatePostingRequirement('6.1.1', costCenter.id, [costCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_ARCHIVED_PARENT'
        })
      )
    })
  })

  describe('validateArchive', () => {
    test('should allow archiving leaf cost centers', () => {
      const costCenter = createTestCostCenter()
      const result = guardrails.validateArchive(costCenter, [costCenter], false)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject archiving cost centers with children', () => {
      const parentCostCenter = createTestCostCenter({ id: 'parent-id' })
      const childCostCenter = createTestCostCenter({ parent_id: 'parent-id' })
      
      const result = guardrails.validateArchive(parentCostCenter, [parentCostCenter, childCostCenter], false)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_IN_USE'
        })
      )
    })

    test('should reject archiving cost centers with transactions when policy enforces', () => {
      const costCenter = createTestCostCenter()
      const result = guardrails.validateArchive(costCenter, [costCenter], true)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_CC_IN_USE'
        })
      )
    })
  })
})

// ============================================================================
// Batch Operations Tests
// ============================================================================

describe('Cost Center v2 Batch Operations', () => {
  test('should validate multiple cost centers correctly', async () => {
    const costCenters = [
      createTestCreateRequest({ cc_code: 'CC-ADMIN-001' }),
      createTestCreateRequest({ cc_code: 'CC-ADMIN-002' }),
      createTestCreateRequest({ cc_code: 'CC-ADMIN-001' }) // Duplicate
    ]
    
    const results = await batchValidateCostCenters(costCenters, TEST_ORG_ID, [])
    
    expect(results).toHaveLength(3)
    expect(results[0]!.valid).toBe(true)
    expect(results[1]!.valid).toBe(true)
    expect(results[2]!.valid).toBe(false) // Duplicate should fail
    expect(results[2]!.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_CC_DUPLICATE_CODE'
      })
    )
  })
})

// ============================================================================
// Hierarchy Management Tests
// ============================================================================

describe('Cost Center v2 Hierarchy Management', () => {
  test('should build correct cost center path', () => {
    const rootCC = createTestCostCenter({ 
      id: 'root', 
      cc_code: 'ROOT', 
      parent_id: undefined 
    })
    const childCC = createTestCostCenter({ 
      id: 'child', 
      cc_code: 'CHILD', 
      parent_id: 'root' 
    })
    const grandchildCC = createTestCostCenter({ 
      id: 'grandchild', 
      cc_code: 'GRANDCHILD', 
      parent_id: 'child' 
    })
    
    const allCostCenters = [rootCC, childCC, grandchildCC]
    const path = buildCostCenterPath(grandchildCC, allCostCenters)
    
    expect(path).toEqual(['ROOT', 'CHILD', 'GRANDCHILD'])
  })

  test('should get correct ancestors', () => {
    const rootCC = createTestCostCenter({ 
      id: 'root', 
      cc_code: 'ROOT', 
      parent_id: undefined 
    })
    const childCC = createTestCostCenter({ 
      id: 'child', 
      cc_code: 'CHILD', 
      parent_id: 'root' 
    })
    const grandchildCC = createTestCostCenter({ 
      id: 'grandchild', 
      cc_code: 'GRANDCHILD', 
      parent_id: 'child' 
    })
    
    const allCostCenters = [rootCC, childCC, grandchildCC]
    const ancestors = getCostCenterAncestors('grandchild', allCostCenters)
    
    expect(ancestors).toHaveLength(2)
    expect(ancestors[0]!.id).toBe('child')
    expect(ancestors[1]!.id).toBe('root')
  })

  test('should get correct descendants', () => {
    const rootCC = createTestCostCenter({ 
      id: 'root', 
      cc_code: 'ROOT', 
      parent_id: undefined 
    })
    const child1CC = createTestCostCenter({ 
      id: 'child1', 
      cc_code: 'CHILD1', 
      parent_id: 'root' 
    })
    const child2CC = createTestCostCenter({ 
      id: 'child2', 
      cc_code: 'CHILD2', 
      parent_id: 'root' 
    })
    const grandchildCC = createTestCostCenter({ 
      id: 'grandchild', 
      cc_code: 'GRANDCHILD', 
      parent_id: 'child1' 
    })
    
    const allCostCenters = [rootCC, child1CC, child2CC, grandchildCC]
    const descendants = getCostCenterDescendants('root', allCostCenters)
    
    expect(descendants).toHaveLength(3)
    expect(descendants.map(d => d.id)).toContain('child1')
    expect(descendants.map(d => d.id)).toContain('child2')
    expect(descendants.map(d => d.id)).toContain('grandchild')
  })
})

// ============================================================================
// Standard Templates Tests
// ============================================================================

describe('Cost Center v2 Standard Templates', () => {
  test('should have valid salon templates', () => {
    const adminTemplate = STANDARD_COST_CENTER_TEMPLATES.SALON_ADMIN
    expect(adminTemplate.cost_center_type).toBe('ADMIN')
    expect(adminTemplate.tags).toContain('ADMIN')
    
    const frontOfficeTemplate = STANDARD_COST_CENTER_TEMPLATES.SALON_FRONT_OFFICE
    expect(frontOfficeTemplate.cost_center_type).toBe('SERVICE')
    expect(frontOfficeTemplate.tags).toContain('CUSTOMER_FACING')
  })

  test('should have valid restaurant templates', () => {
    const kitchenTemplate = STANDARD_COST_CENTER_TEMPLATES.RESTAURANT_KITCHEN
    expect(kitchenTemplate.cost_center_type).toBe('PRODUCTION')
    expect(kitchenTemplate.tags).toContain('KITCHEN')
    
    const fohTemplate = STANDARD_COST_CENTER_TEMPLATES.RESTAURANT_FRONT_HOUSE
    expect(fohTemplate.cost_center_type).toBe('SERVICE')
    expect(fohTemplate.tags).toContain('CUSTOMER_FACING')
  })
})

// ============================================================================
// Integration Tests (with Supabase)
// ============================================================================

describe('Cost Center v2 Integration Tests', () => {
  beforeAll(async () => {
    // Setup test organization and cleanup any existing test data
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_type', 'COST_CENTER')
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_type', 'COST_CENTER')
  })

  test('should create cost center via RPC function', async () => {
    const { data, error } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'Test Administration',
      p_cc_code: 'CC-ADMIN-TEST-001',
      p_cost_center_type: 'ADMIN',
      p_valid_from: '2025-01-01',
      p_tags: ['ADMIN', 'TEST'],
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      entity_name: 'Test Administration',
      cc_code: 'CC-ADMIN-TEST-001',
      cost_center_type: 'ADMIN',
      depth: 1,
      status: 'ACTIVE'
    })
  })

  test('should update cost center via RPC function', async () => {
    // First create a cost center
    const { data: createResult } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'Original Name',
      p_cc_code: 'CC-ORIGINAL-001',
      p_cost_center_type: 'ADMIN',
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    const costCenterId = createResult[0]!.cost_center_id

    // Then update it
    const { data, error } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: costCenterId,
      p_entity_name: 'Updated Name',
      p_cc_code: 'CC-UPDATED-001',
      p_cost_center_type: 'SALES',
      p_smart_code: COST_CENTER_SMART_CODES.TXN_UPDATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(data[0]).toMatchObject({
      cost_center_id: costCenterId,
      entity_name: 'Updated Name',
      cc_code: 'CC-UPDATED-001',
      cost_center_type: 'SALES'
    })
  })

  test('should reject duplicate cost center codes', async () => {
    // First create a cost center
    await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'First Cost Center',
      p_cc_code: 'CC-DUPLICATE-001',
      p_cost_center_type: 'ADMIN',
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    // Try to create duplicate
    const { error } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'Duplicate Cost Center',
      p_cc_code: 'CC-DUPLICATE-001', // Same code
      p_cost_center_type: 'ADMIN',
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('already exists')
  })

  test('should validate cost center type', async () => {
    const { error } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'Invalid Type Cost Center',
      p_cc_code: 'CC-INVALID-TYPE-001',
      p_cost_center_type: 'INVALID_TYPE',
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('Invalid cost center type')
  })

  test('should create parent-child hierarchy', async () => {
    // Create parent cost center
    const { data: parentResult } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'Parent Administration',
      p_cc_code: 'CC-PARENT-001',
      p_cost_center_type: 'ADMIN',
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    const parentId = parentResult[0]!.cost_center_id

    // Create child cost center
    const { data: childResult, error } = await supabase.rpc('hera_costcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_cost_center_id: null,
      p_entity_name: 'Child Administration',
      p_cc_code: 'CC-CHILD-001',
      p_cost_center_type: 'ADMIN',
      p_parent_id: parentId,
      p_smart_code: COST_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(childResult[0]).toMatchObject({
      entity_name: 'Child Administration',
      parent_id: parentId,
      depth: 2
    })
  })
})

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Cost Center v2 Edge Cases', () => {
  test('should handle cost center codes with different formats', () => {
    const result1 = validateCostCenterCode('CC_ADMIN_001')
    expect(result1.valid).toBe(true)

    const result2 = validateCostCenterCode('DEPARTMENT-IT-UK-001')
    expect(result2.valid).toBe(true)

    const result3 = validateCostCenterCode('123-NUMERIC-START')
    expect(result3.valid).toBe(true)
  })

  test('should handle empty tags array', () => {
    const result = validateTags([])
    expect(result.valid).toBe(true)
  })

  test('should handle cost centers with null dates', async () => {
    const request = createTestCreateRequest({
      valid_from: undefined,
      valid_to: undefined
    })
    
    const guardrails = new CostCenterGuardrailsEngine()
    const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
    expect(result.valid).toBe(true)
  })

  test('should handle cost centers with null parent_id', async () => {
    const request = createTestCreateRequest({
      parent_id: undefined
    })
    
    const guardrails = new CostCenterGuardrailsEngine()
    const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
    expect(result.valid).toBe(true)
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('Cost Center v2 Performance Tests', () => {
  test('should handle large batch validation efficiently', async () => {
    const costCenters = Array.from({ length: 100 }, (_, i) => 
      createTestCreateRequest({ 
        cc_code: `CC-BATCH-${i.toString().padStart(3, '0')}`,
        entity_name: `Batch Cost Center ${i + 1}`
      })
    )
    
    const startTime = performance.now()
    const results = await batchValidateCostCenters(costCenters, TEST_ORG_ID, [])
    const endTime = performance.now()
    
    expect(results).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
    
    // All should be valid since they have unique codes
    const allValid = results.every(r => r.valid)
    expect(allValid).toBe(true)
  })

  test('should validate posting requirements quickly', () => {
    const costCenter = createTestCostCenter()
    const startTime = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      validatePostingCostCenter('6.1.1', costCenter.id, [costCenter])
    }
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // Should be very fast
  })

  test('should handle deep hierarchy efficiently', () => {
    // Create a deep hierarchy (6 levels)
    const costCenters: CostCenter[] = []
    let parentId: string | undefined = undefined
    
    for (let i = 1; i <= 6; i++) {
      const cc = createTestCostCenter({
        id: `level-${i}`,
        cc_code: `CC-LEVEL-${i}`,
        parent_id: parentId,
        depth: i
      })
      costCenters.push(cc)
      parentId = cc.id
    }
    
    const startTime = performance.now()
    const path = buildCostCenterPath(costCenters[5]!, costCenters)
    const ancestors = getCostCenterAncestors('level-6', costCenters)
    const descendants = getCostCenterDescendants('level-1', costCenters)
    const endTime = performance.now()
    
    expect(path).toHaveLength(6)
    expect(ancestors).toHaveLength(5)
    expect(descendants).toHaveLength(5)
    expect(endTime - startTime).toBeLessThan(10) // Should be very fast
  })
})