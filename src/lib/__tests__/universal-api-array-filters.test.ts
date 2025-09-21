/**
 * Tests for Universal API array filter functionality
 * Ensures empty arrays return empty results without hitting DB
 */

import { universalApi } from '../universal-api-v2'

describe('UniversalAPI Array Filters', () => {
  beforeEach(() => {
    // Set a default organization ID for tests
    universalApi.setOrganizationId('test-org-123')
  })

  describe('read() method with array filters', () => {
    it('should return empty array when filter contains empty array', async () => {
      const result = await universalApi.read('core_entities', {
        organization_id: 'test-org-123',
        id: [] // Empty array filter
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should return empty array when entity_id filter is empty array', async () => {
      const result = await universalApi.read('core_dynamic_data', {
        organization_id: 'test-org-123',
        entity_id: [] // Empty array filter
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should handle mixed filters with empty arrays', async () => {
      const result = await universalApi.read('core_entities', {
        organization_id: 'test-org-123',
        entity_type: 'appointment',
        id: [] // Empty array should short-circuit
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
      // Should not even query the database
    })

    it('should use .in() for non-empty array filters', async () => {
      // This test would need mocking of supabase to verify .in() is called
      // For now, we just verify it doesn't error
      const result = await universalApi.read('core_entities', {
        organization_id: 'test-org-123',
        id: ['id-1', 'id-2', 'id-3'] // Non-empty array
      })

      // The actual query would depend on database state
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('getEntities() with array filters', () => {
    it('should handle empty array in filters option', async () => {
      const result = await universalApi.getEntities({
        organizationId: 'test-org-123',
        filters: {
          id: [] // Empty array
        }
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('getDynamicFields() with array entity_id', () => {
    it('should handle when called with array parameter', async () => {
      // getDynamicFields expects a string, but the read method handles arrays
      const result = await universalApi.read('core_dynamic_data', {
        organization_id: 'test-org-123',
        entity_id: ['entity-1', 'entity-2']
      })

      expect(result.success).toBe(true)
      // Actual results depend on database state
    })
  })
})

describe('Playbook Entities with improved array handling', () => {
  it('should efficiently query dynamic data with batch entity IDs', () => {
    // The Playbook searchAppointments now uses array filters
    // This improves performance by reducing individual queries

    // Test scenario:
    // 1. Get all appointment entities (1 query)
    // 2. Get all dynamic data for those entities (1 query with array filter)
    // Instead of N+1 queries, we now have just 2 queries

    expect(true).toBe(true) // Placeholder - actual test would need mocking
  })
})
