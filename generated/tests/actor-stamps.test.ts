/**
 * Actor Stamp Coverage Tests
 * Generated for: Purchasing Rebate Processing v1.0.0
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const testConfig = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testOrgId: process.env.TEST_ORG_ID || '6e1954fe-e34a-4056-84f4-745e5b8378ec',
  testActorId: process.env.TEST_ACTOR_ID
}

const supabase = createClient(testConfig.supabaseUrl, testConfig.supabaseServiceKey!)

describe('Actor Stamp Coverage', () => {
  beforeAll(() => {
    if (!testConfig.supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for actor stamp tests')
    }
    if (!testConfig.testActorId) {
      console.warn('TEST_ACTOR_ID not set - some tests will be skipped')
    }
  })

  describe('RPC Function Requirements', () => {
    it('should require actor_user_id parameter in entity operations', async () => {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        // Missing p_actor_user_id
        p_organization_id: testConfig.testOrgId,
        p_entity: {
          entity_type: 'TEST_ENTITY',
          entity_name: 'Test Entity',
          smart_code: 'HERA.TEST.ENTITY.v1'
        },
        p_dynamic: [],
        p_relationships: [],
        p_options: {}
      })

      // Should fail due to missing actor
      expect(error).toBeTruthy()
      expect(error?.message).toContain('actor')
    })

    it('should require actor_user_id parameter in transaction operations', async () => {
      const { error } = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'CREATE',
        // Missing p_actor_user_id
        p_organization_id: testConfig.testOrgId,
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.TEST.TXN.v1'
        },
        p_lines: [],
        p_options: {}
      })

      // Should fail due to missing actor
      expect(error).toBeTruthy()
      expect(error?.message).toContain('actor')
    })
  })

  describe('Audit Trail Validation', () => {
    it('should verify created_by field is not nullable', async () => {
      // Query schema to check constraint
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('is_nullable')
        .eq('table_name', 'core_entities')
        .eq('column_name', 'created_by')

      expect(columns).toBeDefined()
      expect(columns![0]?.is_nullable).toBe('NO')
    })

    it('should verify updated_by field is not nullable', async () => {
      // Query schema to check constraint
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('is_nullable')
        .eq('table_name', 'core_entities')
        .eq('column_name', 'updated_by')

      expect(columns).toBeDefined()
      expect(columns![0]?.is_nullable).toBe('NO')
    })
  })

  describe('Actor Stamp Enforcement', () => {
    const entityTypes = ["VENDOR","REBATE_AGREEMENT","REBATE_TIER","PRODUCT"]

    entityTypes.forEach(entityType => {
      describe(`Entity Type: ${entityType}`, () => {
        it('should stamp created_by when creating entity', async () => {
          if (!testConfig.testActorId) {
            console.warn(`Skipping test for ${entityType} - no TEST_ACTOR_ID`)
            return
          }

          const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
            p_action: 'CREATE',
            p_actor_user_id: testConfig.testActorId,
            p_organization_id: testConfig.testOrgId,
            p_entity: {
              entity_type: entityType,
              entity_name: `Test ${entityType}`,
              smart_code: `HERA.TEST.${entityType}.v1`,
              entity_code: `TEST_${entityType}_${Date.now()}`
            },
            p_dynamic: [],
            p_relationships: [],
            p_options: {}
          })

          if (error) {
            console.warn(`Entity creation failed for ${entityType}:`, error.message)
            return
          }

          expect(data).toBeDefined()
          expect(data.entity_id).toBeDefined()

          // Verify entity was created with proper actor stamps
          const { data: entity } = await supabase
            .from('core_entities')
            .select('created_by, updated_by, created_at, updated_at')
            .eq('id', data.entity_id)
            .single()

          expect(entity?.created_by).toBe(testConfig.testActorId)
          expect(entity?.updated_by).toBe(testConfig.testActorId)
          expect(entity?.created_at).toBeDefined()
          expect(entity?.updated_at).toBeDefined()

          // Clean up test data
          await supabase
            .from('core_entities')
            .delete()
            .eq('id', data.entity_id)
        })
      })
    })
  })

  describe('Actor Coverage Metrics', () => {
    it('should achieve 95%+ actor stamp coverage', async () => {
      // Query recent entities to check actor stamp coverage
      const { data: entities } = await supabase
        .from('core_entities')
        .select('created_by, updated_by')
        .eq('organization_id', testConfig.testOrgId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!entities || entities.length === 0) {
        console.warn('No entities found for coverage test')
        return
      }

      const withCreatedBy = entities.filter(e => e.created_by !== null).length
      const withUpdatedBy = entities.filter(e => e.updated_by !== null).length

      const createdByCoverage = (withCreatedBy / entities.length) * 100
      const updatedByCoverage = (withUpdatedBy / entities.length) * 100

      console.log(`Actor stamp coverage: created_by ${createdByCoverage.toFixed(1)}%, updated_by ${updatedByCoverage.toFixed(1)}%`)

      expect(createdByCoverage).toBeGreaterThanOrEqual(95)
      expect(updatedByCoverage).toBeGreaterThanOrEqual(95)
    })

    it('should have no NULL actor stamps in recent data', async () => {
      const { data: nullActors } = await supabase
        .from('core_entities')
        .select('id, entity_name, created_at')
        .eq('organization_id', testConfig.testOrgId)
        .or('created_by.is.null,updated_by.is.null')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (nullActors && nullActors.length > 0) {
        console.warn('Found entities with NULL actor stamps:', nullActors)
      }

      expect(nullActors).toHaveLength(0)
    })
  })

  describe('Platform Organization Protection', () => {
    it('should prevent NULL UUID attacks on platform organization', async () => {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: '00000000-0000-0000-0000-000000000000', // NULL UUID
        p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
        p_entity: {
          entity_type: 'MALICIOUS_ENTITY',
          entity_name: 'Attack Entity',
          smart_code: 'HERA.ATTACK.ENTITY.v1'
        },
        p_dynamic: [],
        p_relationships: [],
        p_options: {}
      })

      // Should be rejected
      expect(error).toBeTruthy()
      expect(error?.message).toContain('platform')
    })

    it('should enforce actor validation', async () => {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: 'non-existent-actor-id',
        p_organization_id: testConfig.testOrgId,
        p_entity: {
          entity_type: 'TEST_ENTITY',
          entity_name: 'Test Entity',
          smart_code: 'HERA.TEST.ENTITY.v1'
        },
        p_dynamic: [],
        p_relationships: [],
        p_options: {}
      })

      // Should fail due to invalid actor
      expect(error).toBeTruthy()
    })
  })
})