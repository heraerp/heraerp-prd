/**
 * Enhanced API client that replaces cookie-dependent calls
 * Drop-in replacement for existing API calls with Bearer token support
 */

import { bearerApi, getCurrentUser } from './bearer-api'

/**
 * Enhanced API client for HERA v2.2 with Bearer token support
 * This can gradually replace existing API calls
 */
export class HERAApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' ? 'https://heraerp.com' : ''
  }

  /**
   * Replace existing fetch calls with Bearer-enabled versions
   */
  async fetch(path: string, options: RequestInit = {}) {
    return bearerApi.get(path)
  }

  /**
   * Universal API v2 methods with Bearer authentication
   */
  async entities(params: {
    entity_type?: string
    organization_id?: string
    limit?: number
  }) {
    return bearerApi.get('/api/v2/entities', params)
  }

  async createEntity(data: any) {
    return bearerApi.post('/api/v2/entities', data)
  }

  async updateEntity(id: string, data: any) {
    return bearerApi.put(`/api/v2/entities/${id}`, data)
  }

  async deleteEntity(id: string) {
    return bearerApi.delete(`/api/v2/entities/${id}`)
  }

  /**
   * Transaction operations
   */
  async transactions(params: any) {
    return bearerApi.get('/api/v2/transactions', params)
  }

  async createTransaction(data: any) {
    return bearerApi.post('/api/v2/transactions', data)
  }

  /**
   * Dynamic data operations
   */
  async dynamicData(entityId: string) {
    return bearerApi.get(`/api/v2/dynamic-data`, { entity_id: entityId })
  }

  async setDynamicData(data: any) {
    return bearerApi.post('/api/v2/dynamic-data', data)
  }

  /**
   * Relationship operations
   */
  async relationships(params: any) {
    return bearerApi.get('/api/v2/relationships', params)
  }

  async createRelationship(data: any) {
    return bearerApi.post('/api/v2/relationships', data)
  }

  /**
   * Debug and introspection
   */
  async debugSession() {
    return bearerApi.get('/api/v2/debug/session')
  }

  async getCurrentUser() {
    return getCurrentUser()
  }

  /**
   * Authentication helpers
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      return !!user.session?.access_token
    } catch {
      return false
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const user = await getCurrentUser()
    const token = user.session?.access_token
    
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }
}

// Export singleton instance
export const heraApi = new HERAApiClient()

// Export convenience methods
export const {
  entities,
  createEntity,
  updateEntity,
  deleteEntity,
  transactions,
  createTransaction,
  dynamicData,
  setDynamicData,
  relationships,
  createRelationship,
  debugSession,
  isAuthenticated,
  getAuthHeaders
} = heraApi