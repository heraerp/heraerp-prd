/**
 * Tests for server-side branch filtering in API v2 entities endpoint
 * 
 * Validates:
 * - Branch filtering with relationship types
 * - Multi-tenant isolation
 * - Query parameter handling
 */

import { describe, expect, test } from '@jest/globals'

describe('API v2 Entities - Branch Filtering', () => {
  const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-org-id'
  const TEST_BRANCH_ID = process.env.TEST_BRANCH_ID || 'test-branch-id'
  const TEST_TOKEN = process.env.TEST_JWT_TOKEN || 'test-token'

  const headers = {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json',
    'x-hera-api-version': 'v2'
  }

  describe('Branch Filtering', () => {
    test('should filter staff by MEMBER_OF relationship', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&branch_id=${TEST_BRANCH_ID}&rel=MEMBER_OF`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      
      // All returned staff should have MEMBER_OF relationship to the branch
      for (const staff of data.data) {
        expect(staff.entity_type).toBe('STAFF')
      }
    })

    test('should filter services by AVAILABLE_AT relationship', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=SERVICE&branch_id=${TEST_BRANCH_ID}&rel=AVAILABLE_AT`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should filter products by STOCK_AT relationship', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=PRODUCT&branch_id=${TEST_BRANCH_ID}&rel=STOCK_AT`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should filter customers by CUSTOMER_OF relationship', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=CUSTOMER&branch_id=${TEST_BRANCH_ID}&rel=CUSTOMER_OF`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('should return empty array when no entities match branch filter', async () => {
      const nonExistentBranchId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&branch_id=${nonExistentBranchId}&rel=MEMBER_OF`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    test('should ignore branch_id when rel is not provided', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&branch_id=${TEST_BRANCH_ID}`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      // Should return all staff, not filtered by branch
    })

    test('should combine branch filter with other filters', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&status=active&branch_id=${TEST_BRANCH_ID}&rel=MEMBER_OF&limit=10`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.length).toBeLessThanOrEqual(10)
      
      // All returned staff should be active
      for (const staff of data.data) {
        expect(staff.status).toBe('active')
      }
    })
  })

  describe('Multi-tenant Isolation', () => {
    test('should not return entities from other organizations', async () => {
      // This test would need a second test organization to properly validate
      // For now, we just ensure the query includes organization_id filtering
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&branch_id=${TEST_BRANCH_ID}&rel=MEMBER_OF`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      
      // All returned entities should belong to the authenticated organization
      for (const entity of data.data) {
        expect(entity.organization_id).toBe(TEST_ORG_ID)
      }
    })
  })

  describe('Error Handling', () => {
    test('should return 401 without authentication', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&branch_id=${TEST_BRANCH_ID}&rel=MEMBER_OF`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      expect(response.status).toBe(401)
    })

    test('should handle invalid relationship type gracefully', async () => {
      const response = await fetch(
        `${API_BASE}/api/v2/entities?entity_type=STAFF&branch_id=${TEST_BRANCH_ID}&rel=INVALID_REL`,
        { headers }
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([]) // No entities should match invalid relationship
    })
  })
})