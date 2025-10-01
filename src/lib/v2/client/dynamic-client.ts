/**
 * V2 Dynamic Data Client
 * Handles dynamic field operations for v2 API
 */

import { fetchV2 } from '../utils/fetchV2'

export const dynamicClientV2 = {
  /**
   * Set dynamic field value
   */
  async setField(data: {
    organization_id: string
    entity_id: string
    field_name: string
    field_value: any
    field_type: 'text' | 'number' | 'boolean' | 'date'
    smart_code: string
  }): Promise<{ data: any | null; error: string | null }> {
    try {
      const response = await fetchV2('/entities/dynamic-data', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.error || 'Failed to set dynamic field' }
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  /**
   * Get dynamic field value
   */
  async getField(entityId: string, fieldName: string, organizationId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const response = await fetchV2(`/entities/dynamic-data?organization_id=${organizationId}&entity_id=${entityId}&field_name=${fieldName}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        return { data: null, error: errorData.error || 'Failed to get dynamic field' }
      }
      
      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}