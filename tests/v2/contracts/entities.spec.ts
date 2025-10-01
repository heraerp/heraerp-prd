/**
 * V2 Entities API Contract Tests
 * Black-box testing of universal entity operations with org isolation
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { apiV2 } from '@/lib/client/fetchV2'

const TEST_ORG_1 = process.env.TEST_ORG_1 || 'test-org-1-uuid'
const TEST_ORG_2 = process.env.TEST_ORG_2 || 'test-org-2-uuid'

describe('V2 Entities API Contracts', () => {
  let createdEntities: string[] = []

  afterAll(async () => {
    // Cleanup created entities
    for (const entityId of createdEntities) {
      try {
        await apiV2.delete(`/entities/${entityId}`)
      } catch (error) {
        console.warn(`Failed to cleanup entity ${entityId}:`, error)
      }
    }
  })

  describe('Entity CRUD Operations', () => {
    test('should create entity with valid data', async () => {
      const entityData = {
        entity_type: 'test_customer',
        entity_name: 'Test Customer V2',
        smart_code: 'HERA.TEST.CUSTOMER.ENTITY.V1',
        organization_id: TEST_ORG_1,
        dynamic_fields: {
          email: {
            value: 'test@example.com',
            type: 'text' as const,
            smart_code: 'HERA.TEST.CUSTOMER.EMAIL.V1'
          },
          credit_limit: {
            value: 5000,
            type: 'number' as const,
            smart_code: 'HERA.TEST.CUSTOMER.CREDIT.V1'
          }
        }
      }

      const { data, error } = await apiV2.post('/entities', entityData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      expect(data.data.entity_id).toBeDefined()
      
      createdEntities.push(data.data.entity_id)
    })

    test('should read entity by ID', async () => {
      // First create an entity
      const createData = {
        entity_type: 'test_product',
        entity_name: 'Test Product V2',
        smart_code: 'HERA.TEST.PRODUCT.ENTITY.V1',
        organization_id: TEST_ORG_1
      }

      const { data: createResult } = await apiV2.post('/entities', createData)
      const entityId = createResult.data.entity_id
      createdEntities.push(entityId)

      // Read the entity back
      const { data, error } = await apiV2.get('/entities', {
        entity_id: entityId,
        organization_id: TEST_ORG_1
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].entity_name).toBe('Test Product V2')
    })

    test('should list entities with filters', async () => {
      // Create multiple entities
      const createPromises = Array.from({ length: 3 }, (_, i) => 
        apiV2.post('/entities', {
          entity_type: 'test_service',
          entity_name: `Test Service ${i + 1}`,
          smart_code: 'HERA.TEST.SERVICE.ENTITY.V1',
          organization_id: TEST_ORG_1
        })
      )

      const createResults = await Promise.all(createPromises)
      createResults.forEach(result => {
        if (result.data?.data?.entity_id) {
          createdEntities.push(result.data.data.entity_id)
        }
      })

      // List entities with filter
      const { data, error } = await apiV2.get('/entities', {
        entity_type: 'test_service',
        organization_id: TEST_ORG_1,
        limit: 10
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeGreaterThanOrEqual(3)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.limit).toBe(10)
    })

    test('should update entity', async () => {
      // Create entity
      const createData = {
        entity_type: 'test_employee',
        entity_name: 'Test Employee Original',
        smart_code: 'HERA.TEST.EMPLOYEE.ENTITY.V1',
        organization_id: TEST_ORG_1
      }

      const { data: createResult } = await apiV2.post('/entities', createData)
      const entityId = createResult.data.entity_id
      createdEntities.push(entityId)

      // Update entity
      const updateData = {
        entity_id: entityId,
        entity_name: 'Test Employee Updated',
        organization_id: TEST_ORG_1,
        dynamic_fields: {
          department: {
            value: 'Engineering',
            type: 'text' as const,
            smart_code: 'HERA.TEST.EMPLOYEE.DEPT.V1'
          }
        }
      }

      const { data, error } = await apiV2.put('/entities', updateData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
    })
  })

  describe('Organization Isolation', () => {
    test('should enforce organization isolation on creation', async () => {
      const entityData = {
        entity_type: 'test_isolation',
        entity_name: 'Test Isolation Entity',
        smart_code: 'HERA.TEST.ISOLATION.ENTITY.V1',
        organization_id: TEST_ORG_2
      }

      // This should succeed for TEST_ORG_2
      const { data, error } = await apiV2.post('/entities', entityData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      
      if (data?.data?.entity_id) {
        createdEntities.push(data.data.entity_id)
      }
    })

    test('should not return entities from different organization', async () => {
      // Create entity in ORG_1
      const { data: createResult } = await apiV2.post('/entities', {
        entity_type: 'test_cross_org',
        entity_name: 'Cross Org Test',
        smart_code: 'HERA.TEST.CROSS.ORG.ENTITY.V1',
        organization_id: TEST_ORG_1
      })

      if (createResult?.data?.entity_id) {
        createdEntities.push(createResult.data.entity_id)
      }

      // Try to read from ORG_2
      const { data, error } = await apiV2.get('/entities', {
        entity_type: 'test_cross_org',
        organization_id: TEST_ORG_2
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.data).toHaveLength(0) // Should not find entities from ORG_1
    })

    test('should return 403 for organization mismatch in auth context', async () => {
      // This test assumes auth context is for TEST_ORG_1
      // but request tries to access TEST_ORG_2 data
      const { data, error } = await apiV2.get('/entities', {
        entity_type: 'any_type',
        organization_id: TEST_ORG_2
      })

      // Should either return 403 or empty results depending on auth implementation
      if (error) {
        expect(error.message).toContain('403')
      } else {
        expect(data.data).toHaveLength(0)
      }
    })
  })

  describe('Data Validation', () => {
    test('should reject invalid entity type', async () => {
      const { data, error } = await apiV2.post('/entities', {
        entity_type: '', // Invalid empty type
        entity_name: 'Test Entity',
        smart_code: 'HERA.TEST.INVALID.ENTITY.V1',
        organization_id: TEST_ORG_1
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('validation')
    })

    test('should reject invalid smart code format', async () => {
      const { data, error } = await apiV2.post('/entities', {
        entity_type: 'test_entity',
        entity_name: 'Test Entity',
        smart_code: 'INVALID_SMART_CODE', // Invalid format
        organization_id: TEST_ORG_1
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('smart_code')
    })

    test('should reject missing organization_id', async () => {
      const { data, error } = await apiV2.post('/entities', {
        entity_type: 'test_entity',
        entity_name: 'Test Entity',
        smart_code: 'HERA.TEST.ENTITY.V1'
        // Missing organization_id
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('organization_id')
    })
  })

  describe('Dynamic Fields', () => {
    test('should handle all dynamic field types', async () => {
      const entityData = {
        entity_type: 'test_dynamic',
        entity_name: 'Dynamic Fields Test',
        smart_code: 'HERA.TEST.DYNAMIC.ENTITY.V1',
        organization_id: TEST_ORG_1,
        dynamic_fields: {
          text_field: {
            value: 'Sample text',
            type: 'text' as const,
            smart_code: 'HERA.TEST.DYNAMIC.TEXT.V1'
          },
          number_field: {
            value: 42.5,
            type: 'number' as const,
            smart_code: 'HERA.TEST.DYNAMIC.NUMBER.V1'
          },
          boolean_field: {
            value: true,
            type: 'boolean' as const,
            smart_code: 'HERA.TEST.DYNAMIC.BOOLEAN.V1'
          },
          date_field: {
            value: '2024-01-01T00:00:00Z',
            type: 'date' as const,
            smart_code: 'HERA.TEST.DYNAMIC.DATE.V1'
          },
          json_field: {
            value: { nested: { data: 'value' } },
            type: 'json' as const,
            smart_code: 'HERA.TEST.DYNAMIC.JSON.V1'
          }
        }
      }

      const { data, error } = await apiV2.post('/entities', entityData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.success).toBe(true)
      
      if (data?.data?.entity_id) {
        createdEntities.push(data.data.entity_id)
      }
    })
  })
})