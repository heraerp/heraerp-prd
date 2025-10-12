/**
 * HERA Profit Center v2: Comprehensive Test Suite
 * 
 * Complete test coverage for Profit Center v2 standard including:
 * - Guardrails validation with IFRS 8 (CODM) support
 * - RPC function behavior with segment accounting
 * - API endpoints with multi-tenant security
 * - Hierarchy management with cycle detection
 * - Edge cases and error handling
 * - Performance benchmarks
 * 
 * Smart Code: HERA.PROFITCENTER.TEST.SUITE.V2
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import {
  ProfitCenterGuardrailsEngine,
  applyProfitCenterGuardrails,
  validatePostingProfitCenter,
  validateProfitCenterArchive,
  batchValidateProfitCenters,
  validateCODMRequirements
} from '@/lib/profitcenter/profitcenter-v2-guardrails'
import {
  type ProfitCenter,
  type ProfitCenterCreateRequest,
  type ProfitCenterUpdateRequest,
  type ProfitCenterValidationError,
  PROFIT_CENTER_SMART_CODES,
  validateProfitCenterCode,
  validateSegmentCode,
  validateValidityDates,
  validateTags,
  validateSmartCode,
  detectCycle,
  buildProfitCenterPath,
  getProfitCenterAncestors,
  getProfitCenterDescendants,
  isValidForCODMReporting,
  isProfitCenterValidForPosting,
  STANDARD_PROFIT_CENTER_TEMPLATES
} from '@/lib/profitcenter/profitcenter-v2-standard'

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

const createTestProfitCenter = (overrides: Partial<ProfitCenter> = {}): ProfitCenter => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  organization_id: TEST_ORG_ID,
  entity_type: 'PROFIT_CENTER',
  entity_name: 'Test Salon Operations',
  entity_code: 'PC-SALON-001',
  status: 'ACTIVE',
  smart_code: PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER,
  metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  pc_code: 'PC-SALON-001',
  segment_code: 'SALON-OPERATIONS',
  depth: 1,
  parent_id: undefined,
  valid_from: '2025-01-01',
  valid_to: undefined,
  manager: 'Sarah Johnson',
  region_code: 'UK-LONDON',
  tags: ['SALON', 'CUSTOMER_FACING'],
  codm_inclusion: true,
  ...overrides
})

const createTestCreateRequest = (overrides: Partial<ProfitCenterCreateRequest> = {}): ProfitCenterCreateRequest => ({
  entity_name: 'Test Profit Center',
  pc_code: 'PC-TEST-001',
  segment_code: 'TEST-SEGMENT',
  codm_inclusion: true,
  valid_from: '2025-01-01',
  tags: ['TEST'],
  ...overrides
})

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Profit Center v2 Utility Functions', () => {
  describe('validateProfitCenterCode', () => {
    test('should accept valid profit center codes', () => {
      const result1 = validateProfitCenterCode('PC-SALON-001')
      expect(result1.valid).toBe(true)
      expect(result1.errors).toHaveLength(0)

      const result2 = validateProfitCenterCode('DEPT_OPERATIONS_UK_001')
      expect(result2.valid).toBe(true)
      expect(result2.errors).toHaveLength(0)
    })

    test('should reject invalid profit center codes', () => {
      const result1 = validateProfitCenterCode('')
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain(expect.objectContaining({
        message: 'Profit center code is required'
      }))

      const result2 = validateProfitCenterCode('AB')
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain(expect.objectContaining({
        message: 'Profit center code must be between 3 and 50 characters'
      }))

      const result3 = validateProfitCenterCode('PC-SALON-001!')
      expect(result3.valid).toBe(false)
      expect(result3.errors).toContain(expect.objectContaining({
        message: 'Profit center code can only contain letters, numbers, hyphens, and underscores'
      }))
    })
  })

  describe('validateSegmentCode', () => {
    test('should accept valid segment codes', () => {
      const result1 = validateSegmentCode('SALON-OPERATIONS')
      expect(result1.valid).toBe(true)
      expect(result1.errors).toHaveLength(0)

      const result2 = validateSegmentCode('UK-RETAIL')
      expect(result2.valid).toBe(true)
      expect(result2.errors).toHaveLength(0)

      const result3 = validateSegmentCode(undefined)
      expect(result3.valid).toBe(true)
      expect(result3.errors).toHaveLength(0)
    })

    test('should reject invalid segment codes', () => {
      const result1 = validateSegmentCode('')
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain(expect.objectContaining({
        message: 'Segment code cannot be empty if provided'
      }))

      const result2 = validateSegmentCode('A')
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain(expect.objectContaining({
        message: 'Segment code must be between 2 and 30 characters'
      }))

      const result3 = validateSegmentCode('SEGMENT@CODE')
      expect(result3.valid).toBe(false)
      expect(result3.errors).toContain(expect.objectContaining({
        message: 'Segment code can only contain letters, numbers, hyphens, and underscores'
      }))
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
      expect(result1.errors).toContain(expect.objectContaining({
        message: 'valid_to date must be after valid_from date'
      }))

      const result2 = validateValidityDates('invalid-date', '2025-12-31')
      expect(result2.valid).toBe(false)
      expect(result2.errors).toContain(expect.objectContaining({
        message: 'Invalid valid_from date format'
      }))
    })
  })

  describe('validateTags', () => {
    test('should accept valid tags', () => {
      const result = validateTags(['SALON', 'CUSTOMER_FACING', 'UK'])
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject invalid tags', () => {
      const result1 = validateTags(['SALON', 'SALON']) // Duplicates
      expect(result1.valid).toBe(false)
      expect(result1.errors).toContain(expect.objectContaining({
        message: 'Duplicate tags are not allowed'
      }))

      const result2 = validateTags(['SALON', 'INVALID@TAG'])
      expect(result2.valid).toBe(false)
      expect(result2.errors[0].message).toContain('contains invalid characters')
    })
  })

  describe('validateSmartCode', () => {
    test('should accept valid smart codes', () => {
      expect(validateSmartCode(PROFIT_CENTER_SMART_CODES.ENTITY_PROFIT_CENTER)).toBe(true)
      expect(validateSmartCode('HERA.PROFITCENTER.TEST.EXAMPLE.v1')).toBe(true)
    })

    test('should reject invalid smart codes', () => {
      expect(validateSmartCode('invalid-smart-code')).toBe(false)
      expect(validateSmartCode('HERA.PROFITCENTER')).toBe(false)
    })
  })

  describe('detectCycle', () => {
    test('should detect direct cycle', () => {
      const profitCenters = [
        createTestProfitCenter({ id: 'a', parent_id: undefined }),
        createTestProfitCenter({ id: 'b', parent_id: 'a' })
      ]
      
      expect(detectCycle('a', 'b', profitCenters)).toBe(false)
      expect(detectCycle('b', 'a', profitCenters)).toBe(true)
    })

    test('should detect indirect cycle', () => {
      const profitCenters = [
        createTestProfitCenter({ id: 'a', parent_id: undefined }),
        createTestProfitCenter({ id: 'b', parent_id: 'a' }),
        createTestProfitCenter({ id: 'c', parent_id: 'b' })
      ]
      
      expect(detectCycle('a', 'c', profitCenters)).toBe(true)
      expect(detectCycle('c', 'a', profitCenters)).toBe(false)
    })
  })

  describe('isValidForCODMReporting', () => {
    test('should validate CODM eligibility', () => {
      const validCODMPC = createTestProfitCenter({
        status: 'ACTIVE',
        codm_inclusion: true,
        segment_code: 'SALON-OPERATIONS'
      })
      expect(isValidForCODMReporting(validCODMPC)).toBe(true)

      const invalidCODMPC = createTestProfitCenter({
        status: 'ACTIVE',
        codm_inclusion: true,
        segment_code: undefined
      })
      expect(isValidForCODMReporting(invalidCODMPC)).toBe(false)

      const archivedCODMPC = createTestProfitCenter({
        status: 'ARCHIVED',
        codm_inclusion: true,
        segment_code: 'SALON-OPERATIONS'
      })
      expect(isValidForCODMReporting(archivedCODMPC)).toBe(false)
    })
  })
})

// ============================================================================
// Guardrails Engine Tests
// ============================================================================

describe('Profit Center v2 Guardrails Engine', () => {
  let guardrails: ProfitCenterGuardrailsEngine

  beforeEach(() => {
    guardrails = new ProfitCenterGuardrailsEngine()
  })

  describe('validateCreate', () => {
    test('should accept valid profit center creation', async () => {
      const request = createTestCreateRequest()
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject duplicate profit center codes', async () => {
      const request = createTestCreateRequest({ pc_code: 'PC-SALON-001' })
      const existingProfitCenters = [createTestProfitCenter({ pc_code: 'PC-SALON-001' })]
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, existingProfitCenters)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_DUPLICATE_CODE'
        })
      )
    })

    test('should reject invalid profit center code format', async () => {
      const request = createTestCreateRequest({ pc_code: 'INVALID@CODE' })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_INVALID_CODE_FORMAT'
        })
      )
    })

    test('should reject invalid segment code format', async () => {
      const request = createTestCreateRequest({ segment_code: 'INVALID@SEGMENT' })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_INVALID_SEGMENT_CODE'
        })
      )
    })

    test('should reject CODM inclusion without segment mapping', async () => {
      const request = createTestCreateRequest({
        codm_inclusion: true,
        segment_code: undefined
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_CODM_MAPPING_REQUIRED'
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
          code: 'ERR_PC_PARENT_NOT_FOUND'
        })
      )
    })

    test('should reject archived parent', async () => {
      const parentProfitCenter = createTestProfitCenter({
        id: 'parent-id',
        status: 'ARCHIVED'
      })
      
      const request = createTestCreateRequest({
        parent_id: 'parent-id'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [parentProfitCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_ARCHIVED_PARENT'
        })
      )
    })

    test('should reject excessive depth', async () => {
      const parentProfitCenter = createTestProfitCenter({
        id: 'parent-id',
        depth: 6 // Max depth, child would be 7
      })
      
      const request = createTestCreateRequest({
        parent_id: 'parent-id'
      })
      
      const result = await guardrails.validateCreate(request, TEST_ORG_ID, [parentProfitCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_MAX_DEPTH_EXCEEDED'
        })
      )
    })
  })

  describe('validateUpdate', () => {
    test('should accept valid profit center updates', async () => {
      const existingProfitCenter = createTestProfitCenter()
      const request: ProfitCenterUpdateRequest = {
        entity_name: 'Updated Profit Center Name'
      }
      
      const result = await guardrails.validateUpdate('profit-center-id', request, existingProfitCenter, [existingProfitCenter])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject cycle creation', async () => {
      const parentProfitCenter = createTestProfitCenter({ id: 'parent-id', parent_id: 'child-id' })
      const childProfitCenter = createTestProfitCenter({ id: 'child-id', parent_id: 'parent-id' })
      
      const request: ProfitCenterUpdateRequest = {
        parent_id: 'child-id'
      }
      
      const result = await guardrails.validateUpdate('parent-id', request, parentProfitCenter, [parentProfitCenter, childProfitCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_CYCLE_DETECTED'
        })
      )
    })

    test('should validate CODM requirements on update', async () => {
      const existingProfitCenter = createTestProfitCenter({
        codm_inclusion: false,
        segment_code: 'SALON-OPERATIONS'
      })
      
      const request: ProfitCenterUpdateRequest = {
        codm_inclusion: true,
        segment_code: undefined // This should fail
      }
      
      const result = await guardrails.validateUpdate('profit-center-id', request, existingProfitCenter, [existingProfitCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_CODM_MAPPING_REQUIRED'
        })
      )
    })
  })

  describe('validatePostingRequirement', () => {
    test('should require profit center for 4xxx accounts', () => {
      const result = guardrails.validatePostingRequirement('4.1.1') // Revenue account
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_DIM_MISSING_PROFIT_CENTER'
        })
      )
    })

    test('should require profit center for 5xxx accounts', () => {
      const result = guardrails.validatePostingRequirement('5.1.1') // COGS account
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_DIM_MISSING_PROFIT_CENTER'
        })
      )
    })

    test('should accept profit center for 4xxx accounts', () => {
      const profitCenter = createTestProfitCenter()
      const result = guardrails.validatePostingRequirement('4.1.1', profitCenter.id, [profitCenter])
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should not require profit center for 1xxx accounts', () => {
      const result = guardrails.validatePostingRequirement('1.1.1') // Asset account
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject archived profit center for posting', () => {
      const profitCenter = createTestProfitCenter({ status: 'ARCHIVED' })
      const result = guardrails.validatePostingRequirement('4.1.1', profitCenter.id, [profitCenter])
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_ARCHIVED_PARENT'
        })
      )
    })
  })

  describe('validateArchive', () => {
    test('should allow archiving leaf profit centers', () => {
      const profitCenter = createTestProfitCenter()
      const result = guardrails.validateArchive(profitCenter, [profitCenter], false)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject archiving profit centers with children', () => {
      const parentProfitCenter = createTestProfitCenter({ id: 'parent-id' })
      const childProfitCenter = createTestProfitCenter({ parent_id: 'parent-id' })
      
      const result = guardrails.validateArchive(parentProfitCenter, [parentProfitCenter, childProfitCenter], false)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_IN_USE'
        })
      )
    })

    test('should reject archiving profit centers with transactions when policy enforces', () => {
      const profitCenter = createTestProfitCenter()
      const result = guardrails.validateArchive(profitCenter, [profitCenter], true)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'ERR_PC_IN_USE'
        })
      )
    })
  })
})

// ============================================================================
// CODM Validation Tests
// ============================================================================

describe('Profit Center v2 CODM Validation', () => {
  test('should validate CODM requirements across profit centers', () => {
    const profitCenters = [
      createTestProfitCenter({
        id: 'pc1',
        codm_inclusion: true,
        segment_code: 'SALON-OPERATIONS'
      }),
      createTestProfitCenter({
        id: 'pc2',
        codm_inclusion: true,
        segment_code: undefined // Invalid
      }),
      createTestProfitCenter({
        id: 'pc3',
        codm_inclusion: false,
        segment_code: undefined // Valid (not included in CODM)
      })
    ]
    
    const result = validateCODMRequirements(profitCenters)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      code: 'ERR_PC_CODM_MAPPING_REQUIRED',
      value: 'pc2'
    })
  })
})

// ============================================================================
// Batch Operations Tests
// ============================================================================

describe('Profit Center v2 Batch Operations', () => {
  test('should validate multiple profit centers correctly', async () => {
    const profitCenters = [
      createTestCreateRequest({ pc_code: 'PC-SALON-001' }),
      createTestCreateRequest({ pc_code: 'PC-SALON-002' }),
      createTestCreateRequest({ pc_code: 'PC-SALON-001' }) // Duplicate
    ]
    
    const results = await batchValidateProfitCenters(profitCenters, TEST_ORG_ID, [])
    
    expect(results).toHaveLength(3)
    expect(results[0]!.valid).toBe(true)
    expect(results[1]!.valid).toBe(true)
    expect(results[2]!.valid).toBe(false) // Duplicate should fail
    expect(results[2]!.errors).toContainEqual(
      expect.objectContaining({
        code: 'ERR_PC_DUPLICATE_CODE'
      })
    )
  })
})

// ============================================================================
// Hierarchy Management Tests
// ============================================================================

describe('Profit Center v2 Hierarchy Management', () => {
  test('should build correct profit center path', () => {
    const rootPC = createTestProfitCenter({ 
      id: 'root', 
      pc_code: 'ROOT', 
      parent_id: undefined 
    })
    const childPC = createTestProfitCenter({ 
      id: 'child', 
      pc_code: 'CHILD', 
      parent_id: 'root' 
    })
    const grandchildPC = createTestProfitCenter({ 
      id: 'grandchild', 
      pc_code: 'GRANDCHILD', 
      parent_id: 'child' 
    })
    
    const allProfitCenters = [rootPC, childPC, grandchildPC]
    const path = buildProfitCenterPath(grandchildPC, allProfitCenters)
    
    expect(path).toEqual(['ROOT', 'CHILD', 'GRANDCHILD'])
  })

  test('should get correct ancestors', () => {
    const rootPC = createTestProfitCenter({ 
      id: 'root', 
      pc_code: 'ROOT', 
      parent_id: undefined 
    })
    const childPC = createTestProfitCenter({ 
      id: 'child', 
      pc_code: 'CHILD', 
      parent_id: 'root' 
    })
    const grandchildPC = createTestProfitCenter({ 
      id: 'grandchild', 
      pc_code: 'GRANDCHILD', 
      parent_id: 'child' 
    })
    
    const allProfitCenters = [rootPC, childPC, grandchildPC]
    const ancestors = getProfitCenterAncestors('grandchild', allProfitCenters)
    
    expect(ancestors).toHaveLength(2)
    expect(ancestors[0]!.id).toBe('child')
    expect(ancestors[1]!.id).toBe('root')
  })

  test('should get correct descendants', () => {
    const rootPC = createTestProfitCenter({ 
      id: 'root', 
      pc_code: 'ROOT', 
      parent_id: undefined 
    })
    const child1PC = createTestProfitCenter({ 
      id: 'child1', 
      pc_code: 'CHILD1', 
      parent_id: 'root' 
    })
    const child2PC = createTestProfitCenter({ 
      id: 'child2', 
      pc_code: 'CHILD2', 
      parent_id: 'root' 
    })
    const grandchildPC = createTestProfitCenter({ 
      id: 'grandchild', 
      pc_code: 'GRANDCHILD', 
      parent_id: 'child1' 
    })
    
    const allProfitCenters = [rootPC, child1PC, child2PC, grandchildPC]
    const descendants = getProfitCenterDescendants('root', allProfitCenters)
    
    expect(descendants).toHaveLength(3)
    expect(descendants.map(d => d.id)).toContain('child1')
    expect(descendants.map(d => d.id)).toContain('child2')
    expect(descendants.map(d => d.id)).toContain('grandchild')
  })
})

// ============================================================================
// Standard Templates Tests
// ============================================================================

describe('Profit Center v2 Standard Templates', () => {
  test('should have valid salon templates', () => {
    const mainBranchTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.SALON_MAIN_BRANCH
    expect(mainBranchTemplate.segment_code).toBe('SALON-OPERATIONS')
    expect(mainBranchTemplate.codm_inclusion).toBe(true)
    expect(mainBranchTemplate.tags).toContain('SALON')
    
    const adminTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.SALON_ADMIN
    expect(adminTemplate.segment_code).toBe('SALON-SUPPORT')
    expect(adminTemplate.codm_inclusion).toBe(false)
    expect(adminTemplate.tags).toContain('ADMIN')
  })

  test('should have valid restaurant templates', () => {
    const diningTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.RESTAURANT_DINING
    expect(diningTemplate.segment_code).toBe('RESTAURANT-OPERATIONS')
    expect(diningTemplate.codm_inclusion).toBe(true)
    expect(diningTemplate.tags).toContain('RESTAURANT')
    
    const cateringTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.RESTAURANT_CATERING
    expect(cateringTemplate.segment_code).toBe('RESTAURANT-CATERING')
    expect(cateringTemplate.codm_inclusion).toBe(true)
    expect(cateringTemplate.tags).toContain('CATERING')
  })

  test('should have valid healthcare templates', () => {
    const outpatientTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.HEALTHCARE_OUTPATIENT
    expect(outpatientTemplate.segment_code).toBe('HEALTHCARE-CLINICAL')
    expect(outpatientTemplate.codm_inclusion).toBe(true)
    expect(outpatientTemplate.tags).toContain('HEALTHCARE')
    
    const pharmacyTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.HEALTHCARE_PHARMACY
    expect(pharmacyTemplate.segment_code).toBe('HEALTHCARE-RETAIL')
    expect(pharmacyTemplate.codm_inclusion).toBe(true)
    expect(pharmacyTemplate.tags).toContain('PHARMACY')
  })

  test('should have valid manufacturing templates', () => {
    const productionTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.MANUFACTURING_PRODUCTION
    expect(productionTemplate.segment_code).toBe('MANUFACTURING-CORE')
    expect(productionTemplate.codm_inclusion).toBe(true)
    expect(productionTemplate.tags).toContain('MANUFACTURING')
    
    const rndTemplate = STANDARD_PROFIT_CENTER_TEMPLATES.MANUFACTURING_R_AND_D
    expect(rndTemplate.segment_code).toBe('MANUFACTURING-INNOVATION')
    expect(rndTemplate.codm_inclusion).toBe(false)
    expect(rndTemplate.tags).toContain('R_AND_D')
  })
})

// ============================================================================
// Integration Tests (with Supabase)
// ============================================================================

describe('Profit Center v2 Integration Tests', () => {
  beforeAll(async () => {
    // Setup test organization and cleanup any existing test data
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_type', 'PROFIT_CENTER')
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('core_entities')
      .delete()
      .eq('organization_id', TEST_ORG_ID)
      .eq('entity_type', 'PROFIT_CENTER')
  })

  test('should create profit center via RPC function', async () => {
    const { data, error } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'Test Salon Operations',
      p_pc_code: 'PC-SALON-TEST-001',
      p_segment_code: 'SALON-OPERATIONS',
      p_codm_inclusion: true,
      p_valid_from: '2025-01-01',
      p_tags: ['SALON', 'TEST'],
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      entity_name: 'Test Salon Operations',
      pc_code: 'PC-SALON-TEST-001',
      segment_code: 'SALON-OPERATIONS',
      depth: 1,
      status: 'ACTIVE',
      codm_inclusion: true
    })
  })

  test('should update profit center via RPC function', async () => {
    // First create a profit center
    const { data: createResult } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'Original Name',
      p_pc_code: 'PC-ORIGINAL-001',
      p_segment_code: 'ORIGINAL-SEGMENT',
      p_codm_inclusion: false,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    const profitCenterId = createResult[0]!.profit_center_id

    // Then update it
    const { data, error } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: profitCenterId,
      p_entity_name: 'Updated Name',
      p_pc_code: 'PC-UPDATED-001',
      p_segment_code: 'UPDATED-SEGMENT',
      p_codm_inclusion: true,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_UPDATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(data[0]).toMatchObject({
      profit_center_id: profitCenterId,
      entity_name: 'Updated Name',
      pc_code: 'PC-UPDATED-001',
      segment_code: 'UPDATED-SEGMENT',
      codm_inclusion: true
    })
  })

  test('should reject duplicate profit center codes', async () => {
    // First create a profit center
    await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'First Profit Center',
      p_pc_code: 'PC-DUPLICATE-001',
      p_segment_code: 'TEST-SEGMENT',
      p_codm_inclusion: false,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    // Try to create duplicate
    const { error } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'Duplicate Profit Center',
      p_pc_code: 'PC-DUPLICATE-001', // Same code
      p_segment_code: 'TEST-SEGMENT',
      p_codm_inclusion: false,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('already exists')
  })

  test('should validate CODM inclusion requires segment mapping', async () => {
    const { error } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'Invalid CODM Profit Center',
      p_pc_code: 'PC-INVALID-CODM-001',
      p_segment_code: null, // Missing segment
      p_codm_inclusion: true, // But CODM inclusion is true
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).not.toBeNull()
    expect(error?.message).toContain('CODM inclusion requires valid segment mapping')
  })

  test('should create parent-child hierarchy', async () => {
    // Create parent profit center
    const { data: parentResult } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'Parent Operations',
      p_pc_code: 'PC-PARENT-001',
      p_segment_code: 'PARENT-SEGMENT',
      p_codm_inclusion: true,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    const parentId = parentResult[0]!.profit_center_id

    // Create child profit center
    const { data: childResult, error } = await supabase.rpc('hera_profitcenter_upsert_v2', {
      p_organization_id: TEST_ORG_ID,
      p_profit_center_id: null,
      p_entity_name: 'Child Operations',
      p_pc_code: 'PC-CHILD-001',
      p_parent_id: parentId,
      p_segment_code: 'CHILD-SEGMENT',
      p_codm_inclusion: false,
      p_smart_code: PROFIT_CENTER_SMART_CODES.TXN_CREATE,
      p_actor_entity_id: TEST_USER_ID
    })

    expect(error).toBeNull()
    expect(childResult[0]).toMatchObject({
      entity_name: 'Child Operations',
      parent_id: parentId,
      depth: 2
    })
  })
})

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Profit Center v2 Edge Cases', () => {
  test('should handle profit center codes with different formats', () => {
    const result1 = validateProfitCenterCode('PC_SALON_001')
    expect(result1.valid).toBe(true)

    const result2 = validateProfitCenterCode('DEPARTMENT-OPERATIONS-UK-001')
    expect(result2.valid).toBe(true)

    const result3 = validateProfitCenterCode('123-NUMERIC-START')
    expect(result3.valid).toBe(true)
  })

  test('should handle empty tags array', () => {
    const result = validateTags([])
    expect(result.valid).toBe(true)
  })

  test('should handle profit centers with null dates', async () => {
    const request = createTestCreateRequest({
      valid_from: undefined,
      valid_to: undefined
    })
    
    const guardrails = new ProfitCenterGuardrailsEngine()
    const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
    expect(result.valid).toBe(true)
  })

  test('should handle profit centers with null parent_id', async () => {
    const request = createTestCreateRequest({
      parent_id: undefined
    })
    
    const guardrails = new ProfitCenterGuardrailsEngine()
    const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
    expect(result.valid).toBe(true)
  })

  test('should handle undefined segment_code for non-CODM profit centers', async () => {
    const request = createTestCreateRequest({
      segment_code: undefined,
      codm_inclusion: false
    })
    
    const guardrails = new ProfitCenterGuardrailsEngine()
    const result = await guardrails.validateCreate(request, TEST_ORG_ID, [])
    expect(result.valid).toBe(true)
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('Profit Center v2 Performance Tests', () => {
  test('should handle large batch validation efficiently', async () => {
    const profitCenters = Array.from({ length: 100 }, (_, i) => 
      createTestCreateRequest({ 
        pc_code: `PC-BATCH-${i.toString().padStart(3, '0')}`,
        entity_name: `Batch Profit Center ${i + 1}`,
        segment_code: `SEGMENT-${i % 5}` // 5 different segments
      })
    )
    
    const startTime = performance.now()
    const results = await batchValidateProfitCenters(profitCenters, TEST_ORG_ID, [])
    const endTime = performance.now()
    
    expect(results).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
    
    // All should be valid since they have unique codes
    const allValid = results.every(r => r.valid)
    expect(allValid).toBe(true)
  })

  test('should validate posting requirements quickly', () => {
    const profitCenter = createTestProfitCenter()
    const startTime = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      validatePostingProfitCenter('4.1.1', profitCenter.id, [profitCenter])
    }
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // Should be very fast
  })

  test('should handle deep hierarchy efficiently', () => {
    // Create a deep hierarchy (6 levels)
    const profitCenters: ProfitCenter[] = []
    let parentId: string | undefined = undefined
    
    for (let i = 1; i <= 6; i++) {
      const pc = createTestProfitCenter({
        id: `level-${i}`,
        pc_code: `PC-LEVEL-${i}`,
        parent_id: parentId,
        depth: i
      })
      profitCenters.push(pc)
      parentId = pc.id
    }
    
    const startTime = performance.now()
    const path = buildProfitCenterPath(profitCenters[5]!, profitCenters)
    const ancestors = getProfitCenterAncestors('level-6', profitCenters)
    const descendants = getProfitCenterDescendants('level-1', profitCenters)
    const endTime = performance.now()
    
    expect(path).toHaveLength(6)
    expect(ancestors).toHaveLength(5)
    expect(descendants).toHaveLength(5)
    expect(endTime - startTime).toBeLessThan(10) // Should be very fast
  })

  test('should validate CODM requirements efficiently', () => {
    const profitCenters = Array.from({ length: 1000 }, (_, i) => 
      createTestProfitCenter({
        id: `pc-${i}`,
        pc_code: `PC-${i.toString().padStart(4, '0')}`,
        codm_inclusion: i % 3 === 0, // Every third is CODM
        segment_code: i % 3 === 0 ? `SEGMENT-${i % 5}` : undefined
      })
    )
    
    const startTime = performance.now()
    const result = validateCODMRequirements(profitCenters)
    const endTime = performance.now()
    
    expect(result.valid).toBe(true) // All CODM profit centers have segments
    expect(endTime - startTime).toBeLessThan(50) // Should complete quickly
  })
})