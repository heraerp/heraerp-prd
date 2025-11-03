/**
 * Customer RLS Tests
 * 
 * Tests row-level security isolation for customers
 * Ensures proper organization boundaries and data isolation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Customer RLS Isolation', () => {
  let orgAId: string
  let orgBId: string
  let tokenA: string
  let tokenB: string
  let baseUrl: string
  let createdCustomerIds: string[] = []

  beforeAll(async () => {
    // Set up test environment with two organizations
    orgAId = process.env.TEST_ORG_A_ID || 'org-a-test-id'
    orgBId = process.env.TEST_ORG_B_ID || 'org-b-test-id'
    tokenA = process.env.TEST_ORG_A_TOKEN || 'token-a'
    tokenB = process.env.TEST_ORG_B_TOKEN || 'token-b'
    baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

    if (!orgAId || !orgBId || !tokenA || !tokenB) {
      console.warn('⚠️ Missing test environment variables. Some tests may be skipped.')
    }
  })

  afterAll(async () => {
    // Clean up created test customers
    for (const customerId of createdCustomerIds) {
      try {
        await fetch(`${baseUrl}/api/v2/command`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenA}`,
            'X-Organization-Id': orgAId,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            op: "entities",
            p_operation: "DELETE",
            p_data: {
              entity_id: customerId,
              entity_type: "CUSTOMER",
              smart_code: "HERA.RETAIL.CUSTOMER.v1",
              organization_id: orgAId
            }
          })
        })
      } catch (error) {
        console.warn(`Failed to clean up customer ${customerId}:`, error)
      }
    }
  })

  it('should prevent cross-org read access via API', async () => {
    // Create customer in Org A
    const createResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Org A Customer for RLS Test",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId,
          dynamic_fields: [
            {
              field_name: "email",
              field_type: "email",
              field_value_text: "org-a-customer@example.com",
              smart_code: "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
            }
          ]
        }
      })
    })

    expect(createResponse.status).toBe(200)
    const { data: orgACustomer } = await createResponse.json()
    expect(orgACustomer.entity_id).toBeDefined()
    
    // Track for cleanup
    createdCustomerIds.push(orgACustomer.entity_id)

    // Try to read Org A customer from Org B context (should fail due to RLS)
    const crossOrgResponse = await fetch(`${baseUrl}/api/v2/customers/${orgACustomer.entity_id}`, {
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId
      }
    })

    // Should not find the customer due to RLS isolation
    expect(crossOrgResponse.status).toBe(404)
    
    const errorData = await crossOrgResponse.json()
    expect(errorData.error).toMatch(/not found|CUSTOMER_NOT_FOUND/i)
  })

  it('should prevent cross-org write access', async () => {
    // Try to create customer in Org A context but with Org B token
    const crossOrgWriteResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgAId, // Trying to write to Org A with Org B token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Cross-Org Write Attempt",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId
        }
      })
    })

    // Should be forbidden due to membership validation
    expect(crossOrgWriteResponse.status).toBe(403)
    
    const errorData = await crossOrgWriteResponse.json()
    expect(errorData.error_code).toBe('ACTOR_NOT_MEMBER')
  })

  it('should allow same-org access for all operations', async () => {
    // Create customer in Org A
    const createResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Same Org Access Test Customer",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId,
          dynamic_fields: [
            {
              field_name: "email",
              field_type: "email",
              field_value_text: "same-org@example.com",
              smart_code: "HERA.RETAIL.CUSTOMER.DYN.EMAIL.v1"
            }
          ]
        }
      })
    })

    expect(createResponse.status).toBe(200)
    const { data: createdCustomer } = await createResponse.json()
    createdCustomerIds.push(createdCustomer.entity_id)

    // Read same customer from same org (should succeed)
    const readResponse = await fetch(`${baseUrl}/api/v2/customers/${createdCustomer.entity_id}`, {
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId
      }
    })

    expect(readResponse.status).toBe(200)
    const { data: readCustomer } = await readResponse.json()
    expect(readCustomer.entity_id).toBe(createdCustomer.entity_id)
    expect(readCustomer.entity_name).toBe("Same Org Access Test Customer")

    // Update customer from same org (should succeed)
    const updateResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "UPDATE",
        p_data: {
          entity_id: createdCustomer.entity_id,
          entity_type: "CUSTOMER",
          entity_name: "Updated Same Org Customer",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId
        }
      })
    })

    expect(updateResponse.status).toBe(200)
  })

  it('should isolate customer lists by organization', async () => {
    // Create customers in both organizations
    const orgACustomer = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Org A List Test Customer",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId
        }
      })
    })

    const orgBCustomer = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Org B List Test Customer",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgBId
        }
      })
    })

    const { data: customerA } = await orgACustomer.json()
    const { data: customerB } = await orgBCustomer.json()
    
    // Track for cleanup (note: customerB will need to be cleaned up with tokenB/orgBId)
    createdCustomerIds.push(customerA.entity_id)

    // Get customer list for Org A
    const listAResponse = await fetch(`${baseUrl}/api/v2/customers`, {
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId
      }
    })

    expect(listAResponse.status).toBe(200)
    const { data: orgACustomers } = await listAResponse.json()

    // Get customer list for Org B  
    const listBResponse = await fetch(`${baseUrl}/api/v2/customers`, {
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId
      }
    })

    expect(listBResponse.status).toBe(200)
    const { data: orgBCustomers } = await listBResponse.json()

    // Verify no overlap between org lists
    const orgAIds = orgACustomers.map(c => c.entity_id)
    const orgBIds = orgBCustomers.map(c => c.entity_id)
    const overlap = orgAIds.filter(id => orgBIds.includes(id))
    
    expect(overlap).toHaveLength(0)

    // Verify each org sees its own customer
    expect(orgAIds).toContain(customerA.entity_id)
    expect(orgBIds).toContain(customerB.entity_id)
    
    // Verify each org doesn't see the other's customer
    expect(orgAIds).not.toContain(customerB.entity_id)
    expect(orgBIds).not.toContain(customerA.entity_id)

    // Clean up Org B customer
    await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "DELETE",
        p_data: {
          entity_id: customerB.entity_id,
          entity_type: "CUSTOMER",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgBId
        }
      })
    })
  })

  it('should isolate dynamic data by organization', async () => {
    // Create customer with dynamic data in Org A
    const createResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Dynamic Data Test Customer",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId,
          dynamic_fields: [
            {
              field_name: "secret_data",
              field_type: "text",
              field_value_text: "This is sensitive org A data",
              smart_code: "HERA.RETAIL.CUSTOMER.DYN.SECRET_DATA.v1"
            },
            {
              field_name: "loyalty_tier",
              field_type: "text",
              field_value_text: "PLATINUM",
              smart_code: "HERA.RETAIL.CUSTOMER.DYN.LOYALTY_TIER.v1"
            }
          ]
        }
      })
    })

    const { data: customer } = await createResponse.json()
    createdCustomerIds.push(customer.entity_id)

    // Verify Org A can see the dynamic data
    const orgAReadResponse = await fetch(`${baseUrl}/api/v2/customers/${customer.entity_id}`, {
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId
      }
    })

    expect(orgAReadResponse.status).toBe(200)
    const { data: orgACustomer } = await orgAReadResponse.json()
    expect(orgACustomer.dynamic_fields.secret_data?.field_value_text).toBe("This is sensitive org A data")
    expect(orgACustomer.dynamic_fields.loyalty_tier?.field_value_text).toBe("PLATINUM")

    // Verify Org B cannot see the customer or its dynamic data
    const orgBReadResponse = await fetch(`${baseUrl}/api/v2/customers/${customer.entity_id}`, {
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId
      }
    })

    expect(orgBReadResponse.status).toBe(404)
  })

  it('should enforce organization filter in search operations', async () => {
    // Create customers with distinctive names in both orgs
    const orgAResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Unique Search Test Customer A",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgAId
        }
      })
    })

    const orgBResponse = await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "CREATE",
        p_data: {
          entity_type: "CUSTOMER",
          entity_name: "Unique Search Test Customer B",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgBId
        }
      })
    })

    const { data: customerA } = await orgAResponse.json()
    const { data: customerB } = await orgBResponse.json()
    createdCustomerIds.push(customerA.entity_id)

    // Search from Org A context
    const searchAResponse = await fetch(`${baseUrl}/api/v2/customers?search=Unique Search Test`, {
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'X-Organization-Id': orgAId
      }
    })

    expect(searchAResponse.status).toBe(200)
    const { data: searchAResults } = await searchAResponse.json()

    // Search from Org B context
    const searchBResponse = await fetch(`${baseUrl}/api/v2/customers?search=Unique Search Test`, {
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId
      }
    })

    expect(searchBResponse.status).toBe(200)
    const { data: searchBResults } = await searchBResponse.json()

    // Verify search results are properly isolated
    const searchAIds = searchAResults.map(c => c.entity_id)
    const searchBIds = searchBResults.map(c => c.entity_id)

    expect(searchAIds).toContain(customerA.entity_id)
    expect(searchAIds).not.toContain(customerB.entity_id)
    expect(searchBIds).toContain(customerB.entity_id)
    expect(searchBIds).not.toContain(customerA.entity_id)

    // Clean up Org B customer
    await fetch(`${baseUrl}/api/v2/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'X-Organization-Id': orgBId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        op: "entities",
        p_operation: "DELETE",
        p_data: {
          entity_id: customerB.entity_id,
          entity_type: "CUSTOMER",
          smart_code: "HERA.RETAIL.CUSTOMER.v1",
          organization_id: orgBId
        }
      })
    })
  })
})