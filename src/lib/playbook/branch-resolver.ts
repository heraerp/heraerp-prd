'use client'

import { universalApi } from '@/lib/universal-api-v2'

/**
 * Resolve a branch entity ID from various sources
 * Returns a valid entity ID or null
 */
export async function resolveBranchEntityId(
  organizationId: string,
  requestedBranchId?: string
): Promise<string | null> {
  try {
    // If a specific branch is requested, validate it exists
    if (requestedBranchId && requestedBranchId !== 'default') {
      // Check if it's a valid UUID pattern
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidPattern.test(requestedBranchId)) {
        // Verify the entity exists
        const entityResponse = await universalApi.getEntity(requestedBranchId)
        if (entityResponse.success && entityResponse.data?.entity_type === 'branch') {
          return requestedBranchId
        }
      }
    }

    // Fall back to organization's default branch
    const orgResponse = await universalApi.getEntity(organizationId)
    if (orgResponse.success && orgResponse.data) {
      const defaultBranchId = orgResponse.data.settings?.salon?.default_branch_entity_id
      if (defaultBranchId) {
        // Verify the default branch exists
        const branchResponse = await universalApi.getEntity(defaultBranchId)
        if (branchResponse.success && branchResponse.data?.entity_type === 'branch') {
          return defaultBranchId
        }
      }
    }

    // No valid branch found
    return null
  } catch (error) {
    console.error('Error resolving branch entity ID:', error)
    return null
  }
}

/**
 * Get branch details for display
 */
export async function getBranchDetails(branchEntityId: string): Promise<{
  id: string
  name: string
  code?: string
} | null> {
  try {
    const response = await universalApi.getEntity(branchEntityId)
    if (response.success && response.data) {
      return {
        id: response.data.id,
        name: response.data.entity_name,
        code: response.data.entity_code
      }
    }
    return null
  } catch (error) {
    console.error('Error getting branch details:', error)
    return null
  }
}
