/**
 * Customer Actor Stamping Tests
 * 
 * Tests actor stamping and audit trail for customers
 * Ensures proper WHO tracking in all operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { heraCommand } from '@/lib/hera/client'

describe('Customer Actor Stamping', () => {
  let testOrgId: string
  let testToken: string
  let testActorId: string
  let createdCustomerIds: string[] = []

  beforeAll(async () => {
    // Get test environment variables
    testOrgId = process.env.TEST_ORGANIZATION_ID || 'test-org-id'
    testToken = process.env.TEST_JWT_TOKEN || 'test-jwt-token'
    testActorId = process.env.TEST_ACTOR_ID || 'test-actor-id'
    
    if (!testOrgId || !testToken || !testActorId) {
      console.warn('⚠️ Missing test environment variables. Some tests may be skipped.')
    }
  })

  afterAll(async () => {
    // Clean up created test customers
    for (const customerId of createdCustomerIds) {
      try {
        await heraCommand({
          op: "entities",
          p_operation: "DELETE",
          p_data: {
            entity_id: customerId,
            entity_type: "CUSTOMER",
            smart_code: "HERA.RETAIL.CUSTOMER.v1",
            organization_id: testOrgId
          }
        }, { orgId: testOrgId, token: testToken })
      } catch (error) {
        console.warn(`Failed to clean up customer ${customerId}:`, error)
      }
    }
  })

  it('should stamp created_by and updated_by on entity creation', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Actor Stamping Test Customer",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId,
        dynamic_fields: [
          {
            field_name: "email",
            field_type: "email",
            field_value_text: "actor-test@example.com",
            smart_code: "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
          }
        ]
      }
    }

    const result = await heraCommand(payload, { orgId: testOrgId, token: testToken })
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(result.data.entity_id).toBeDefined()
    expect(result.data.created_by).toBe(testActorId)
    expect(result.data.updated_by).toBe(testActorId)
    expect(result.data.created_at).toBeDefined()
    expect(result.data.updated_at).toBeDefined()
    
    // Track for cleanup
    createdCustomerIds.push(result.data.entity_id)
  })

  it('should update updated_by field on entity updates', async () => {
    // First create a customer
    const createPayload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Actor Update Test Customer",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId
      }
    }

    const createResult = await heraCommand(createPayload, { orgId: testOrgId, token: testToken })
    createdCustomerIds.push(createResult.data.entity_id)

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100))

    // Now update the customer
    const updatePayload = {
      op: "entities" as const,
      p_operation: "UPDATE" as const,
      p_data: {
        entity_id: createResult.data.entity_id,
        entity_type: "CUSTOMER",
        entity_name: "Updated Actor Test Customer",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId
      }
    }

    const updateResult = await heraCommand(updatePayload, { orgId: testOrgId, token: testToken })
    
    expect(updateResult.data.created_by).toBe(testActorId) // Should remain the same
    expect(updateResult.data.updated_by).toBe(testActorId) // Should be updated
    expect(updateResult.data.updated_at).not.toBe(createResult.data.updated_at) // Should be different
  })

  it('should stamp actor on dynamic field operations', async () => {
    // Create customer first
    const createPayload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Dynamic Field Actor Test",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId,
        dynamic_fields: [
          {
            field_name: "email",
            field_type: "email",
            field_value_text: "dynamic-test@example.com",
            smart_code: "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
          }
        ]
      }
    }

    const result = await heraCommand(createPayload, { orgId: testOrgId, token: testToken })
    createdCustomerIds.push(result.data.entity_id)

    // Verify dynamic field was created with actor stamping
    expect(result.data.dynamic_fields).toBeDefined()
    expect(result.data.dynamic_fields.email).toBeDefined()
    expect(result.data.dynamic_fields.email.created_by).toBe(testActorId)
    expect(result.data.dynamic_fields.email.updated_by).toBe(testActorId)
  })

  it('should provide actor traceability in API responses', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Actor Traceability Test",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId
      }
    }

    const result = await heraCommand(payload, { orgId: testOrgId, token: testToken })
    
    // API response should include actor context
    expect(result.actor).toBeDefined()
    expect(result.actor).toBe(testActorId)
    expect(result.org).toBeDefined()
    expect(result.org).toBe(testOrgId)
    expect(result.rid).toBeDefined() // Request ID for tracing
    
    createdCustomerIds.push(result.data.entity_id)
  })

  it('should enforce actor membership validation', async () => {
    // Use a token that doesn't belong to the organization
    const invalidToken = "invalid-token-for-different-actor"
    
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Invalid Actor Test",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId
      }
    }

    await expect(heraCommand(payload, { orgId: testOrgId, token: invalidToken }))
      .rejects.toThrow(/ACTOR_NOT_MEMBER|not.*member|unauthorized/i)
  })

  it('should maintain audit trail across operations', async () => {
    // Create customer
    const createPayload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Audit Trail Test Customer",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId
      }
    }

    const createResult = await heraCommand(createPayload, { orgId: testOrgId, token: testToken })
    const customerId = createResult.data.entity_id
    createdCustomerIds.push(customerId)

    // Update customer multiple times
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)) // Small delay
      
      const updatePayload = {
        op: "entities" as const,
        p_operation: "UPDATE" as const,
        p_data: {
          entity_id: customerId,
          entity_type: "CUSTOMER",
          entity_name: `Audit Trail Test Customer - Update ${i}`,
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: testOrgId
        }
      }

      const updateResult = await heraCommand(updatePayload, { orgId: testOrgId, token: testToken })
      
      // Verify audit fields are consistent
      expect(updateResult.data.created_by).toBe(testActorId) // Never changes
      expect(updateResult.data.updated_by).toBe(testActorId) // Always current actor
      expect(updateResult.data.entity_name).toBe(`Audit Trail Test Customer - Update ${i}`)
    }
  })

  it('should handle concurrent operations with proper actor stamping', async () => {
    // Create multiple customers concurrently
    const promises = Array.from({ length: 3 }, (_, i) => {
      const payload = {
        op: "entities" as const,
        p_operation: "CREATE" as const,
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: `Concurrent Actor Test Customer ${i + 1}`,
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: testOrgId
        }
      }

      return heraCommand(payload, { orgId: testOrgId, token: testToken })
    })

    const results = await Promise.allSettled(promises)
    
    // All should succeed with proper actor stamping
    const successful = results.filter(r => r.status === 'fulfilled')
    expect(successful.length).toBe(3)

    successful.forEach(result => {
      if (result.status === 'fulfilled') {
        expect(result.value.data.created_by).toBe(testActorId)
        expect(result.value.data.updated_by).toBe(testActorId)
        expect(result.value.actor).toBe(testActorId)
        expect(result.value.org).toBe(testOrgId)
        
        // Track for cleanup
        createdCustomerIds.push(result.value.data.entity_id)
      }
    })
  })
})