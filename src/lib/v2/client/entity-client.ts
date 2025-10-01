/**
 * V2 Entity Client
 * Handles entity operations for v2 API
 */

import { fetchV2 } from '../utils/fetchV2'

import type { EntityCreateRequest, EntityResponse, EntityListResponse } from '../types'

export const entityClientV2 = {
  /**
   * Create a new entity
   */
  async create(data: EntityCreateRequest): Promise<{ data: EntityResponse | null; error: string | null }> {
    try {
      const response = await fetchV2('/entities', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.error || 'Failed to create entity' }
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  /**
   * Get entity by ID
   */
  async get(entityId: string, organizationId: string): Promise<{ data: EntityResponse | null; error: string | null }> {
    try {
      const response = await fetchV2(`/entities?organization_id=${organizationId}&entity_id=${entityId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.error || 'Failed to get entity' }
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  /**
   * List entities with filters
   */
  async list(params: {
    organization_id: string
    entity_type?: string
    smart_code_prefix?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: EntityListResponse | null; error: string | null }> {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
      
      const response = await fetchV2(`/entities?${queryParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.error || 'Failed to list entities' }
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  /**
   * Update entity
   */
  async update(entityId: string, data: Partial<EntityCreateRequest>): Promise<{ data: EntityResponse | null; error: string | null }> {
    try {
      const response = await fetchV2(`/entities/${entityId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.error || 'Failed to update entity' }
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  /**
   * Delete entity
   */
  async delete(entityId: string, organizationId: string): Promise<{ data: boolean; error: string | null }> {
    try {
      const response = await fetchV2(`/entities/${entityId}?organization_id=${organizationId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: false, error: errorData.error || 'Failed to delete entity' }
      }
      
      return { data: true, error: null }
    } catch (error) {
      return { data: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}