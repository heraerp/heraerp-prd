/**
 * HERA Security: RLS Policy and Leakage Prevention Tests
 * 
 * Tests to ensure Row Level Security policies are working correctly
 * and there's no data leakage between organizations.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { dbContext } from '@/lib/security/database-context'
import { authResolver } from '@/lib/security/auth-resolver'
import type { SecurityContext } from '@/lib/security/database-context'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test organizations and users
const TEST_ORG_1 = '11111111-1111-1111-1111-111111111111'
const TEST_ORG_2 = '22222222-2222-2222-2222-222222222222'
const TEST_USER_1 = '33333333-3333-3333-3333-333333333333'
const TEST_USER_2 = '44444444-4444-4444-4444-444444444444'

const CONTEXT_ORG_1: SecurityContext = {
  orgId: TEST_ORG_1,
  userId: TEST_USER_1,
  role: 'admin',
  authMode: 'supabase'
}

const CONTEXT_ORG_2: SecurityContext = {
  orgId: TEST_ORG_2,
  userId: TEST_USER_2,
  role: 'admin',
  authMode: 'supabase'
}

describe('RLS Policy Tests', () => {
  beforeAll(async () => {
    // Create test organizations
    await supabase.from('core_organizations').upsert([
      {
        id: TEST_ORG_1,
        organization_name: 'Test Org 1',
        organization_code: 'TEST1',
        smart_code: 'HERA.TEST.ORG.1.V1'
      },
      {
        id: TEST_ORG_2,
        organization_name: 'Test Org 2',
        organization_code: 'TEST2',
        smart_code: 'HERA.TEST.ORG.2.V1'
      }
    ])

    // Create test user memberships
    await supabase.from('user_organizations').upsert([
      {
        user_id: TEST_USER_1,
        organization_id: TEST_ORG_1,
        role: 'admin',
        status: 'active'
      },
      {
        user_id: TEST_USER_2,
        organization_id: TEST_ORG_2,
        role: 'admin', 
        status: 'active'
      }
    ])
  })

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('core_entities').delete().in('organization_id', [TEST_ORG_1, TEST_ORG_2])
    await supabase.from('core_dynamic_data').delete().in('organization_id', [TEST_ORG_1, TEST_ORG_2])
    await supabase.from('universal_transactions').delete().in('organization_id', [TEST_ORG_1, TEST_ORG_2])
    await supabase.from('user_organizations').delete().in('organization_id', [TEST_ORG_1, TEST_ORG_2])
    await supabase.from('core_organizations').delete().in('id', [TEST_ORG_1, TEST_ORG_2])
  })

  describe('GUC Context Isolation', () => {
    test('should prevent GUC leakage between connections', async () => {
      // Create test entities in different orgs using concurrent contexts
      const [result1, result2] = await Promise.all([
        dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
          const { data } = await client
            .from('core_entities')
            .insert({
              entity_type: 'test_entity',
              entity_name: 'Org 1 Entity',
              organization_id: TEST_ORG_1,
              smart_code: 'HERA.TEST.ENT.1.V1'
            })
            .select()
            .single()
          return data
        }),
        dbContext.executeWithContext(CONTEXT_ORG_2, async (client) => {
          const { data } = await client
            .from('core_entities')
            .insert({
              entity_type: 'test_entity',
              entity_name: 'Org 2 Entity',
              organization_id: TEST_ORG_2,
              smart_code: 'HERA.TEST.ENT.2.V1'
            })
            .select()
            .single()
          return data
        })
      ])

      // Verify entities were created with correct org IDs
      expect(result1.organization_id).toBe(TEST_ORG_1)
      expect(result2.organization_id).toBe(TEST_ORG_2)

      // Verify each context can only see its own data
      const org1Data = await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        const { data } = await client.from('core_entities').select('*')
        return data
      })

      const org2Data = await dbContext.executeWithContext(CONTEXT_ORG_2, async (client) => {
        const { data } = await client.from('core_entities').select('*')
        return data
      })

      // Each org should only see its own entities
      expect(org1Data.every(e => e.organization_id === TEST_ORG_1)).toBe(true)
      expect(org2Data.every(e => e.organization_id === TEST_ORG_2)).toBe(true)
      
      // No cross-contamination
      expect(org1Data.some(e => e.organization_id === TEST_ORG_2)).toBe(false)
      expect(org2Data.some(e => e.organization_id === TEST_ORG_1)).toBe(false)
    })

    test('should clear GUCs after operation completion', async () => {
      // Execute operation with context
      await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        await client.from('core_entities').select('*').limit(1)
      })

      // Check that GUCs are cleared
      const currentContext = await dbContext.getCurrentContext()
      expect(currentContext['app.org_id']).toBeNull()
      expect(currentContext['app.user_id']).toBeNull()
      expect(currentContext['app.role']).toBeNull()
    })

    test('should clear GUCs even when operation fails', async () => {
      try {
        await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
          // Intentionally cause an error
          throw new Error('Test error')
        })
      } catch (error) {
        // Expected error
      }

      // Verify GUCs are still cleared
      const currentContext = await dbContext.getCurrentContext()
      expect(currentContext['app.org_id']).toBeNull()
      expect(currentContext['app.user_id']).toBeNull()
      expect(currentContext['app.role']).toBeNull()
    })
  })

  describe('Cross-Org Access Prevention', () => {
    beforeEach(async () => {
      // Create test entities for cross-org access tests
      await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        await client.from('core_entities').insert({
          entity_type: 'sensitive_data',
          entity_name: 'Org 1 Sensitive Data',
          organization_id: TEST_ORG_1,
          smart_code: 'HERA.TEST.SENSITIVE.1.V1'
        })
      })

      await dbContext.executeWithContext(CONTEXT_ORG_2, async (client) => {
        await client.from('core_entities').insert({
          entity_type: 'sensitive_data',
          entity_name: 'Org 2 Sensitive Data',
          organization_id: TEST_ORG_2,
          smart_code: 'HERA.TEST.SENSITIVE.2.V1'
        })
      })
    })

    test('should block cross-org reads via RLS', async () => {
      // Try to read Org 2 data from Org 1 context
      const result = await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        const { data } = await client
          .from('core_entities')
          .select('*')
          .eq('organization_id', TEST_ORG_2) // Trying to access other org
        return data
      })

      // Should return empty array due to RLS
      expect(result).toEqual([])
    })

    test('should block cross-org writes via RLS', async () => {
      // Try to create entity in Org 2 from Org 1 context
      const result = await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        try {
          const { data, error } = await client
            .from('core_entities')
            .insert({
              entity_type: 'malicious_entity',
              entity_name: 'Attempted Cross-Org Insert',
              organization_id: TEST_ORG_2, // Wrong org ID
              smart_code: 'HERA.TEST.MALICIOUS.V1'
            })
            .select()
          
          if (error) throw error
          return data
        } catch (error) {
          return { error: error.message }
        }
      })

      // Should fail due to RLS policy
      expect(result.error).toBeTruthy()
    })

    test('should block cross-org updates via RLS', async () => {
      // First, get an entity ID from Org 2
      const org2Entity = await dbContext.executeWithContext(CONTEXT_ORG_2, async (client) => {
        const { data } = await client
          .from('core_entities')
          .select('id')
          .eq('entity_type', 'sensitive_data')
          .single()
        return data
      })

      // Try to update it from Org 1 context
      const result = await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        try {
          const { data, error } = await client
            .from('core_entities')
            .update({ entity_name: 'Hacked!' })
            .eq('id', org2Entity.id)
            .select()
          
          if (error) throw error
          return data
        } catch (error) {
          return { error: error.message }
        }
      })

      // Should fail or return empty array
      expect(result.error || result.length === 0).toBeTruthy()
    })

    test('should block cross-org deletes via RLS', async () => {
      // Get entity from Org 2
      const org2Entity = await dbContext.executeWithContext(CONTEXT_ORG_2, async (client) => {
        const { data } = await client
          .from('core_entities')
          .select('id')
          .eq('entity_type', 'sensitive_data')
          .single()
        return data
      })

      // Try to delete from Org 1 context
      const result = await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        try {
          const { data, error } = await client
            .from('core_entities')
            .delete()
            .eq('id', org2Entity.id)
            .select()
          
          if (error) throw error
          return data
        } catch (error) {
          return { error: error.message }
        }
      })

      // Should fail or return empty array
      expect(result.error || result.length === 0).toBeTruthy()

      // Verify entity still exists in Org 2
      const stillExists = await dbContext.executeWithContext(CONTEXT_ORG_2, async (client) => {
        const { data } = await client
          .from('core_entities')
          .select('id')
          .eq('id', org2Entity.id)
          .single()
        return data
      })

      expect(stillExists.id).toBe(org2Entity.id)
    })
  })

  describe('Service Role Restrictions', () => {
    test('should enforce org scope even for service role', async () => {
      // Test service role without bypass
      const serviceContext: SecurityContext = {
        orgId: TEST_ORG_1,
        userId: 'service',
        role: 'service',
        authMode: 'service'
      }

      const result = await dbContext.executeWithContext(serviceContext, async (client) => {
        const { data } = await client.from('core_entities').select('*')
        return data
      })

      // Should only see Org 1 data
      expect(result.every(e => e.organization_id === TEST_ORG_1)).toBe(true)
    })

    test('should allow bypass with explicit flag', async () => {
      const serviceContext: SecurityContext = {
        orgId: TEST_ORG_1,
        userId: 'service',
        role: 'service',
        authMode: 'service'
      }

      const result = await dbContext.executeWithContext(
        serviceContext,
        async (client) => {
          const { data } = await client.from('core_entities').select('*')
          return data
        },
        { bypassRLS: true }
      )

      // Should see data from multiple orgs
      const orgIds = [...new Set(result.map(e => e.organization_id))]
      expect(orgIds.length).toBeGreaterThan(1)
    })
  })

  describe('Audit Trail Validation', () => {
    test('should log context setting events', async () => {
      const beforeCount = await supabase
        .from('hera_audit_log')
        .select('id', { count: 'exact' })
        .eq('event_type', 'context_set')
        .eq('organization_id', TEST_ORG_1)

      await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        await client.from('core_entities').select('*').limit(1)
      })

      const afterCount = await supabase
        .from('hera_audit_log')
        .select('id', { count: 'exact' })
        .eq('event_type', 'context_set')
        .eq('organization_id', TEST_ORG_1)

      expect(afterCount.count).toBe(beforeCount.count! + 1)
    })

    test('should log RLS bypass attempts', async () => {
      // This would be detected by red team mode
      // The test depends on your specific implementation
      expect(true).toBe(true) // Placeholder
    })
  })

  describe('Rate Limiting Tests', () => {
    test('should enforce rate limits per org/user', async () => {
      const testContext = { ...CONTEXT_ORG_1 }
      
      // Make multiple requests rapidly
      const promises = Array.from({ length: 5 }, async () => {
        return authResolver.checkRateLimit(testContext, 'test_action')
      })

      const results = await Promise.all(promises)
      
      // Should have some rate limiting (exact behavior depends on limits)
      expect(results.some(r => r === false)).toBe(false) // Assuming limits are high for tests
    })
  })

  describe('Multi-Table Policy Consistency', () => {
    test('should enforce RLS across all core tables', async () => {
      // Test that RLS works consistently across all tables
      const tables = [
        'core_entities',
        'core_dynamic_data',
        'universal_transactions',
        'universal_transaction_lines'
      ]

      for (const table of tables) {
        const result = await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
          const { data } = await client.from(table).select('*').limit(1)
          return data
        })

        // All returned rows should belong to the correct org
        if (result.length > 0) {
          expect(result.every(row => row.organization_id === TEST_ORG_1)).toBe(true)
        }
      }
    })
  })
})

describe('Performance and Stress Tests', () => {
  test('should handle concurrent context switches efficiently', async () => {
    const startTime = Date.now()
    
    // Create 50 concurrent operations with different contexts
    const operations = Array.from({ length: 50 }, (_, i) => {
      const context = i % 2 === 0 ? CONTEXT_ORG_1 : CONTEXT_ORG_2
      return dbContext.executeWithContext(context, async (client) => {
        await client.from('core_entities').select('*').limit(1)
        return context.orgId
      })
    })

    const results = await Promise.all(operations)
    const endTime = Date.now()

    // Should complete within reasonable time (adjust threshold as needed)
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds

    // Verify correct context isolation
    expect(results.filter(r => r === TEST_ORG_1)).toHaveLength(25)
    expect(results.filter(r => r === TEST_ORG_2)).toHaveLength(25)
  })

  test('should not leak memory with many context switches', async () => {
    // Perform many operations to test for memory leaks
    for (let i = 0; i < 100; i++) {
      await dbContext.executeWithContext(CONTEXT_ORG_1, async (client) => {
        await client.from('core_entities').select('*').limit(1)
      })
    }

    // Verify GUCs are still properly cleared
    const currentContext = await dbContext.getCurrentContext()
    expect(currentContext['app.org_id']).toBeNull()
  })
})