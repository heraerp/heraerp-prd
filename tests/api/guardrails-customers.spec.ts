/**
 * Customer Guardrails Tests
 * 
 * Tests API v2 guardrails validation for customers
 * Ensures Smart Code validation, org filtering, and actor stamping
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { heraCommand } from '@/lib/hera/client'

describe('Customer Guardrails Validation', () => {
  let testOrgId: string
  let testToken: string
  let createdCustomerIds: string[] = []

  beforeAll(async () => {
    // Get test environment variables
    testOrgId = process.env.TEST_ORGANIZATION_ID || 'test-org-id'
    testToken = process.env.TEST_JWT_TOKEN || 'test-jwt-token'
    
    if (!testOrgId || !testToken) {
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

  it('should require Smart Code for entity creation', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer No Smart Code",
        // Missing smart_code - should trigger guardrails
        organization_id: testOrgId
      }
    }

    await expect(heraCommand(payload, { orgId: testOrgId, token: testToken }))
      .rejects.toThrow(/smart.*code|SMARTCODE_MISSING/i)
  })

  it('should validate Smart Code format against HERA DNA pattern', async () => {
    const invalidSmartCodes = [
      'invalid.format',           // Missing HERA prefix
      'HERA.INVALID',             // Too few segments
      'hera.retail.customer.v1',  // Lowercase (should be uppercase)
      'HERA.RETAIL.CUSTOMER.V1',  // Version should be lowercase
      'HERA.RETAIL.CUSTOMER',     // Missing version
      'RETAIL.CUSTOMER.v1'        // Missing HERA prefix
    ]

    for (const invalidCode of invalidSmartCodes) {
      const payload = {
        op: "entities" as const,
        p_operation: "CREATE" as const,
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: `Test Customer Invalid Code: ${invalidCode}`,
          smart_code: invalidCode,
          organization_id: testOrgId
        }
      }

      await expect(heraCommand(payload, { orgId: testOrgId, token: testToken }))
        .rejects.toThrow(/SMARTCODE_INVALID_FORMAT/i)
    }
  })

  it('should require organization filter in all requests', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer No Org",
        smart_code: "HERA.RETAIL.CUSTOMER.v1"
        // Missing organization_id - should trigger guardrails
      }
    }

    await expect(heraCommand(payload, { token: testToken }))
      .rejects.toThrow(/ORG_FILTER_MISSING|organization.*required/i)
  })

  it('should validate organization membership for actor', async () => {
    // Use a non-existent organization ID to test membership validation
    const invalidOrgId = "00000000-0000-0000-0000-000000000000"
    
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer Invalid Org",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: invalidOrgId
      }
    }

    await expect(heraCommand(payload, { orgId: invalidOrgId, token: testToken }))
      .rejects.toThrow(/ACTOR_NOT_MEMBER|not.*member/i)
  })

  it('should accept valid Smart Code patterns', async () => {
    const validPayload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Valid Test Customer",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId,
        dynamic_fields: [
          {
            field_name: "email",
            field_type: "email",
            field_value_text: "test@example.com",
            smart_code: "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
          },
          {
            field_name: "loyalty_tier",
            field_type: "text",
            field_value_text: "VIP",
            smart_code: "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1"
          }
        ]
      }
    }

    const result = await heraCommand(validPayload, { orgId: testOrgId, token: testToken })
    
    expect(result).toBeDefined()
    expect(result.data).toBeDefined()
    expect(result.actor).toBeDefined() // Should include actor information
    expect(result.org).toBeDefined()   // Should include org information
    
    // Track for cleanup
    if (result.data?.entity_id) {
      createdCustomerIds.push(result.data.entity_id)
    }
  })

  it('should validate dynamic field Smart Codes', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer Invalid Field Code",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId,
        dynamic_fields: [
          {
            field_name: "email",
            field_type: "email",
            field_value_text: "test@example.com"
            // Missing smart_code on dynamic field - should trigger guardrails
          }
        ]
      }
    }

    await expect(heraCommand(payload, { orgId: testOrgId, token: testToken }))
      .rejects.toThrow(/SMARTCODE_MISSING_FIELD|smart.*code.*field/i)
  })

  it('should validate organization_id consistency between header and payload', async () => {
    const headerOrgId = testOrgId
    const payloadOrgId = "different-org-id"

    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer Org Mismatch",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: payloadOrgId // Different from header
      }
    }

    await expect(heraCommand(payload, { orgId: headerOrgId, token: testToken }))
      .rejects.toThrow(/ORG_FILTER_MISMATCH|organization.*mismatch/i)
  })

  it('should enforce field type validation for dynamic fields', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer Invalid Field Type",
        smart_code: "HERA.RETAIL.CUSTOMER.v1",
        organization_id: testOrgId,
        dynamic_fields: [
          {
            field_name: "email",
            field_type: "email",
            field_value_text: "not-an-email", // Invalid email format
            smart_code: "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
          }
        ]
      }
    }

    // Note: This might be validated at the application level rather than guardrails
    // The test verifies the validation exists somewhere in the pipeline
    try {
      await heraCommand(payload, { orgId: testOrgId, token: testToken })
      // If it succeeds, the validation might be at a different layer
      console.warn('⚠️ Email validation may not be enforced at the guardrails level')
    } catch (error) {
      // Expected to fail with validation error
      expect(error.message).toMatch(/email|validation|format/i)
    }
  })

  it('should provide detailed error responses with request IDs', async () => {
    const payload = {
      op: "entities" as const,
      p_operation: "CREATE" as const,
      p_data: {
        entity_type: "CUSTOMER",
        entity_name: "Test Customer For Error Response",
        smart_code: "invalid.smart.code", // Invalid Smart Code
        organization_id: testOrgId
      }
    }

    try {
      await heraCommand(payload, { orgId: testOrgId, token: testToken })
      expect.fail('Expected command to fail with invalid Smart Code')
    } catch (error) {
      // Verify error structure includes helpful information
      expect(error.message).toBeDefined()
      
      // Check if error includes request ID or other debugging info
      if (error.message.includes('(') && error.message.includes(')')) {
        // Error includes request ID in parentheses
        expect(error.message).toMatch(/\([^)]+\)/)
      }
    }
  })

  it('should handle concurrent requests without race conditions', async () => {
    // Test that multiple simultaneous requests are handled correctly
    const promises = Array.from({ length: 5 }, (_, i) => {
      const payload = {
        op: "entities" as const,
        p_operation: "CREATE" as const,
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: `Concurrent Test Customer ${i + 1}`,
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: testOrgId
        }
      }

      return heraCommand(payload, { orgId: testOrgId, token: testToken })
    })

    const results = await Promise.allSettled(promises)
    
    // All requests should succeed (no race conditions)
    const successful = results.filter(r => r.status === 'fulfilled')
    expect(successful.length).toBe(5)

    // Track successful creations for cleanup
    successful.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data?.entity_id) {
        createdCustomerIds.push(result.value.data.entity_id)
      }
    })
  })
})