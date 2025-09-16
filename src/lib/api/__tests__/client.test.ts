// ================================================================================
// HERA API CLIENT UNIT TESTS
// Smart Code: HERA.API.CLIENT.TEST.v1
// Unit tests for organization-aware API client
// ================================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient, createApiClient } from '../client'

// Mock fetch
global.fetch = vi.fn()
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
} as any

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue(null)
  })

  describe('organization context', () => {
    it('should initialize with demo mode by default', () => {
      const client = new ApiClient({ baseUrl: 'http://localhost:3000' })
      
      expect(client.isDemoMode()).toBe(true)
      expect(client.getOrganizationId()).toBe('e3a9ff9e-bb83-43a8-b062-b85e7a2b4258')
    })

    it('should detect tenant mode from headers', () => {
      vi.spyOn(sessionStorage, 'getItem').mockImplementation((key) => {
        if (key === 'x-hera-org-mode') return 'tenant'
        if (key === 'x-hera-tenant-slug') return 'acme'
        return null
      })
      
      const client = new ApiClient({ baseUrl: 'http://localhost:3000' })
      
      expect(client.isDemoMode()).toBe(false)
    })

    it('should resolve tenant organization', async () => {
      const mockOrg = { id: 'org-123', branding: { companyName: 'Acme Salon' } }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrg
      } as Response)
      
      vi.spyOn(sessionStorage, 'getItem').mockImplementation((key) => {
        if (key === 'x-hera-org-mode') return 'tenant'
        if (key === 'x-hera-tenant-slug') return 'acme'
        return null
      })
      
      const client = new ApiClient({ baseUrl: 'http://localhost:3000' })
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(client.getOrganizationId()).toBe('org-123')
      expect(client.getTenantBranding()).toEqual({ companyName: 'Acme Salon' })
    })
  })

  describe('API calls', () => {
    it('should include organization ID in headers', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      const client = new ApiClient({ 
        baseUrl: 'http://localhost:3000',
        organizationId: 'org-456'
      })
      
      await client.get('/api/test')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Organization-ID': 'org-456'
          })
        })
      )
    })

    it('should auto-inject organization ID in GET params', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      const client = new ApiClient({ 
        baseUrl: 'http://localhost:3000',
        organizationId: 'org-789'
      })
      
      await client.get('/api/entities', { type: 'customer' })
      
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as URL
      expect(calledUrl.searchParams.get('organization_id')).toBe('org-789')
      expect(calledUrl.searchParams.get('type')).toBe('customer')
    })

    it('should auto-inject organization ID in POST body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'entity-123' })
      } as Response)
      
      const client = new ApiClient({ 
        baseUrl: 'http://localhost:3000',
        organizationId: 'org-999'
      })
      
      await client.post('/api/entities', { 
        name: 'Test Customer',
        type: 'customer'
      })
      
      const body = JSON.parse(
        vi.mocked(fetch).mock.calls[0][1]?.body as string
      )
      
      expect(body).toEqual({
        name: 'Test Customer',
        type: 'customer',
        organization_id: 'org-999'
      })
    })

    it('should handle API errors properly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => JSON.stringify({ message: 'Access denied' })
      } as Response)
      
      const client = new ApiClient({ baseUrl: 'http://localhost:3000' })
      
      await expect(client.get('/api/protected')).rejects.toThrow('Access denied')
    })
  })

  describe('demo mode detection', () => {
    it('should identify demo mode correctly', () => {
      vi.spyOn(sessionStorage, 'getItem').mockImplementation((key) => {
        if (key === 'x-hera-org-mode') return 'demo'
        return null
      })
      
      const client = new ApiClient({ baseUrl: 'http://localhost:3000' })
      
      expect(client.isDemoMode()).toBe(true)
    })

    it('should identify tenant mode correctly', () => {
      vi.spyOn(sessionStorage, 'getItem').mockImplementation((key) => {
        if (key === 'x-hera-org-mode') return 'tenant'
        return null
      })
      
      const client = new ApiClient({ baseUrl: 'http://localhost:3000' })
      
      expect(client.isDemoMode()).toBe(false)
    })
  })
})