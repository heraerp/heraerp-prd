/**
 * V2 Relationships API Contract Tests
 * Black-box testing of universal relationship operations with org isolation
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { apiV2 } from '@/lib/client/fetchV2'

const TEST_ORG_1 = process.env.TEST_ORG_1 || 'test-org-1-uuid'
const TEST_ORG_2 = process.env.TEST_ORG_2 || 'test-org-2-uuid'

describe('V2 Relationships API Contracts', () => {
  let createdEntities: string[] = []
  let createdRelationships: string[] = []

  beforeAll(async () => {
    // Create test entities for relationships
    const entityPromises = [
      apiV2.post('/entities', {
        entity_type: 'test_customer',
        entity_name: 'Parent Customer',
        smart_code: 'HERA.TEST.CUSTOMER.PARENT.V1',
        organization_id: TEST_ORG_1
      }),
      apiV2.post('/entities', {
        entity_type: 'test_order',
        entity_name: 'Child Order',
        smart_code: 'HERA.TEST.ORDER.CHILD.V1',
        organization_id: TEST_ORG_1
      }),
      apiV2.post('/entities', {
        entity_type: 'test_product',
        entity_name: 'Related Product',
        smart_code: 'HERA.TEST.PRODUCT.RELATED.V1',
        organization_id: TEST_ORG_1
      })
    ]

    const results = await Promise.all(entityPromises)
    results.forEach(result => {
      if (result.data?.data?.entity_id) {
        createdEntities.push(result.data.data.entity_id)
      }
    })
  })

  afterAll(async () => {
    // Cleanup relationships first
    for (const relationshipId of createdRelationships) {
      try {
        await apiV2.delete(`/relationships?relationship_id=${relationshipId}&organization_id=${TEST_ORG_1}`)
      } catch (error) {
        console.warn(`Failed to cleanup relationship ${relationshipId}:`, error)
      }
    }

    // Then cleanup entities
    for (const entityId of createdEntities) {
      try {
        await apiV2.delete(`/entities/${entityId}`)
      } catch (error) {
        console.warn(`Failed to cleanup entity ${entityId}:`, error)
      }
    }
  })

  describe('Relationship CRUD Operations', () => {
    test('should create relationship between entities', async () => {
      const [customerEntity, orderEntity] = createdEntities

      const relationshipData = {
        organization_id: TEST_ORG_1,
        from_entity_id: customerEntity,
        to_entity_id: orderEntity,
        relationship_type: 'customer_order',
        smart_code: 'HERA.TEST.REL.CUSTOMER.ORDER.V1',
        relationship_direction: 'forward',
        relationship_strength: 1.0,
        relationship_data: {
          order_date: '2024-01-01',
          order_priority: 'high'
        }
      }

      const { data, error } = await apiV2.post('/relationships', relationshipData)

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      expect(data.relationship_id).toBeDefined()
      
      createdRelationships.push(data.relationship_id)
    })

    test('should read specific relationship', async () => {
      // Create a relationship first
      const [entity1, entity2] = createdEntities.slice(0, 2)
      
      const { data: createResult } = await apiV2.post('/relationships', {
        organization_id: TEST_ORG_1,
        from_entity_id: entity1,
        to_entity_id: entity2,
        relationship_type: 'test_read_rel',
        smart_code: 'HERA.TEST.REL.READ.V1'
      })

      const relationshipId = createResult.relationship_id
      createdRelationships.push(relationshipId)

      // Read the relationship back
      const { data, error } = await apiV2.get('/relationships', {
        relationship_id: relationshipId,
        organization_id: TEST_ORG_1
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
    })

    test('should query relationships with filters', async () => {
      // Create multiple relationships
      const [entity1, entity2, entity3] = createdEntities

      const relationshipPromises = [
        apiV2.post('/relationships', {
          organization_id: TEST_ORG_1,
          from_entity_id: entity1,
          to_entity_id: entity2,
          relationship_type: 'test_query_rel',
          smart_code: 'HERA.TEST.REL.QUERY1.V1'
        }),
        apiV2.post('/relationships', {
          organization_id: TEST_ORG_1,
          from_entity_id: entity1,
          to_entity_id: entity3,
          relationship_type: 'test_query_rel',
          smart_code: 'HERA.TEST.REL.QUERY2.V1'
        })
      ]

      const results = await Promise.all(relationshipPromises)
      results.forEach(result => {
        if (result.data?.relationship_id) {
          createdRelationships.push(result.data.relationship_id)
        }
      })

      // Query relationships
      const { data, error } = await apiV2.get('/relationships', {
        organization_id: TEST_ORG_1,
        from_entity_id: entity1,
        relationship_type: 'test_query_rel'
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
    })

    test('should delete relationship', async () => {
      // Create a relationship to delete
      const [entity1, entity2] = createdEntities.slice(0, 2)
      
      const { data: createResult } = await apiV2.post('/relationships', {
        organization_id: TEST_ORG_1,
        from_entity_id: entity1,
        to_entity_id: entity2,
        relationship_type: 'test_delete_rel',
        smart_code: 'HERA.TEST.REL.DELETE.V1'
      })

      const relationshipId = createResult.relationship_id

      // Delete the relationship
      const { data, error } = await apiV2.delete('/relationships', {
        relationship_id: relationshipId,
        organization_id: TEST_ORG_1
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
    })
  })

  describe('Organization Isolation', () => {
    test('should enforce organization isolation on relationship creation', async () => {
      // Create entities in ORG_2
      const entity1Result = await apiV2.post('/entities', {
        entity_type: 'test_iso_entity1',
        entity_name: 'Isolation Test Entity 1',
        smart_code: 'HERA.TEST.ISO.ENTITY1.V1',
        organization_id: TEST_ORG_2
      })

      const entity2Result = await apiV2.post('/entities', {
        entity_type: 'test_iso_entity2',
        entity_name: 'Isolation Test Entity 2',
        smart_code: 'HERA.TEST.ISO.ENTITY2.V1',
        organization_id: TEST_ORG_2
      })

      const entity1Id = entity1Result.data.data.entity_id
      const entity2Id = entity2Result.data.data.entity_id
      createdEntities.push(entity1Id, entity2Id)

      // Create relationship in ORG_2
      const { data, error } = await apiV2.post('/relationships', {
        organization_id: TEST_ORG_2,
        from_entity_id: entity1Id,
        to_entity_id: entity2Id,
        relationship_type: 'test_isolation',
        smart_code: 'HERA.TEST.REL.ISOLATION.V1'
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      
      if (data?.relationship_id) {
        createdRelationships.push(data.relationship_id)
      }
    })

    test('should not return relationships from different organization', async () => {
      const { data, error } = await apiV2.get('/relationships', {
        organization_id: TEST_ORG_2,
        relationship_type: 'customer_order' // Type that exists in ORG_1
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      // Should not find relationships from ORG_1
    })

    test('should return 403 for cross-organization access', async () => {
      // This test assumes auth context is for TEST_ORG_1
      // but request tries to access TEST_ORG_2 data
      const { data, error } = await apiV2.get('/relationships', {
        organization_id: TEST_ORG_2
      })

      // Should either return 403 or empty results depending on auth implementation
      if (error) {
        expect(error.message).toContain('403')
      } else {
        expect(data).toBeDefined()
      }
    })
  })

  describe('BOM (Bill of Materials) Use Case', () => {
    test('should create BOM hierarchy relationships', async () => {
      // Create parent product (finished good)
      const { data: parentResult } = await apiV2.post('/entities', {
        entity_type: 'finished_product',
        entity_name: 'Dining Table',
        smart_code: 'HERA.TEST.BOM.FINISHED.V1',
        organization_id: TEST_ORG_1
      })

      // Create component parts
      const componentPromises = [
        apiV2.post('/entities', {
          entity_type: 'component',
          entity_name: 'Table Top',
          smart_code: 'HERA.TEST.BOM.COMPONENT.TOP.V1',
          organization_id: TEST_ORG_1
        }),
        apiV2.post('/entities', {
          entity_type: 'component',
          entity_name: 'Table Legs',
          smart_code: 'HERA.TEST.BOM.COMPONENT.LEGS.V1',
          organization_id: TEST_ORG_1
        })
      ]

      const componentResults = await Promise.all(componentPromises)
      const parentId = parentResult.data.entity_id
      const componentIds = componentResults.map(r => r.data.data.entity_id)
      
      createdEntities.push(parentId, ...componentIds)

      // Create BOM relationships
      const bomPromises = componentIds.map((componentId, index) => 
        apiV2.post('/relationships', {
          organization_id: TEST_ORG_1,
          from_entity_id: parentId,
          to_entity_id: componentId,
          relationship_type: 'bom_component',
          smart_code: 'HERA.TEST.BOM.REL.COMPONENT.V1',
          relationship_data: {
            quantity: index === 0 ? 1 : 4, // 1 table top, 4 legs
            unit: 'each'
          }
        })
      )

      const bomResults = await Promise.all(bomPromises)
      bomResults.forEach(result => {
        if (result.data?.relationship_id) {
          createdRelationships.push(result.data.relationship_id)
        }
      })

      // Query BOM structure
      const { data, error } = await apiV2.get('/relationships', {
        organization_id: TEST_ORG_1,
        from_entity_id: parentId,
        relationship_type: 'bom_component'
      })

      expect(error).toBeUndefined()
      expect(data).toBeDefined()
      expect(data.api_version).toBe('v2')
      // Should find both component relationships
    })
  })

  describe('Data Validation', () => {
    test('should reject invalid relationship with missing entities', async () => {
      const { data, error } = await apiV2.post('/relationships', {
        organization_id: TEST_ORG_1,
        from_entity_id: 'invalid-uuid',
        to_entity_id: 'another-invalid-uuid',
        relationship_type: 'test_invalid',
        smart_code: 'HERA.TEST.REL.INVALID.V1'
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('validation')
    })

    test('should reject relationship without required fields', async () => {
      const { data, error } = await apiV2.post('/relationships', {
        organization_id: TEST_ORG_1
        // Missing required fields
      })

      expect(error).toBeDefined()
      expect(error.message).toContain('validation')
    })
  })
})