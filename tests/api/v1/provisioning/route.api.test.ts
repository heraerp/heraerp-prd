/**
 * Tests for HERA Provisioning API
 * Tests tenant provisioning, module management, and subdomain operations
 */

import { NextRequest } from 'next/server'
import { createMockSupabase } from '@/test/helpers'

// Mock dependencies before importing route
jest.mock('@/lib/middleware/tenant-resolver', () => ({
  resolveTenant: jest.fn()
}))

import { POST, PUT, DELETE, GET } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock services
jest.mock('@/lib/services/provisioning', () => ({
  provisioningService: {
    checkSubdomainAvailability: jest.fn(),
    provisionTenant: jest.fn(),
    deprovisionTenant: jest.fn(),
    getTenantInfo: jest.fn()
  }
}))

jest.mock('@/lib/services/entitlements', () => ({
  entitlementsService: {
    grantModuleAccess: jest.fn(),
    revokeModuleAccess: jest.fn()
  }
}))

import { provisioningService } from '@/lib/services/provisioning'
import { entitlementsService } from '@/lib/services/entitlements'

import { resolveTenant } from '@/lib/middleware/tenant-resolver'

describe('Provisioning API', () => {
  let mockSupabase: any
  let mockChain: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset service mocks
    ;(provisioningService.checkSubdomainAvailability as jest.Mock).mockReset()
    ;(provisioningService.provisionTenant as jest.Mock).mockReset()
    ;(provisioningService.deprovisionTenant as jest.Mock).mockReset()
    ;(provisioningService.getTenantInfo as jest.Mock).mockReset()
    ;(entitlementsService.grantModuleAccess as jest.Mock).mockReset()
    ;(entitlementsService.revokeModuleAccess as jest.Mock).mockReset()
    
    // Create fresh mocks
    const mocks = createMockSupabase()
    mockSupabase = mocks.mockSupabase
    mockChain = mocks.mockChain
    
    // Ensure createClient returns our mock
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn(() => mockSupabase)
    }))
  })

  describe('POST - Provision Tenant', () => {
    it('should successfully provision a new tenant with modules', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'admin@heraerp.com' } }
      })

      // Mock successful provisioning
      const mockResult = {
        organization: {
          id: 'org-123',
          organization_name: 'SK Cuts',
          organization_code: 'SKCUTS'
        },
        owner: {
          id: 'owner-123',
          email: 'owner@skcuts.com'
        },
        modules: ['HERA.SALON.POS.MODULE.v1']
      }
      ;(provisioningService.provisionTenant as jest.Mock).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationName: 'SK Cuts',
          organizationCode: 'SKCUTS',
          subdomain: 'skcuts',
          industryType: 'salon',
          country: 'US',
          ownerEmail: 'owner@skcuts.com',
          ownerName: 'Sarah Kim',
          modules: ['HERA.SALON.POS.MODULE.v1'],
          trialDays: 30
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResult)
      expect(provisioningService.provisionTenant).toHaveBeenCalledWith({
        organizationName: 'SK Cuts',
        organizationCode: 'SKCUTS',
        subdomain: 'skcuts',
        industryType: 'salon',
        country: 'US',
        ownerEmail: 'owner@skcuts.com',
        ownerName: 'Sarah Kim',
        modules: ['HERA.SALON.POS.MODULE.v1'],
        trialDays: 30
      })
    })

    it('should fail without authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationName: 'Test Org'
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should validate required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required fields
          subdomain: 'test'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('PUT - Module Management', () => {
    it('should grant module access to organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      ;(entitlementsService.grantModuleAccess as jest.Mock).mockResolvedValue({
        success: true,
        moduleAccess: {
          organizationId: 'org-123',
          moduleCode: 'HERA.CRM.CORE.MODULE.v1',
          grantedAt: new Date().toISOString()
        }
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'grant',
          organizationId: 'org-123',
          moduleCode: 'HERA.CRM.CORE.MODULE.v1'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(entitlementsService.grantModuleAccess).toHaveBeenCalledWith(
        'org-123',
        'HERA.CRM.CORE.MODULE.v1'
      )
    })

    it('should revoke module access from organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      ;(entitlementsService.revokeModuleAccess as jest.Mock).mockResolvedValue({
        success: true
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'revoke',
          organizationId: 'org-123',
          moduleCode: 'HERA.CRM.CORE.MODULE.v1'
        })
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(entitlementsService.revokeModuleAccess).toHaveBeenCalledWith(
        'org-123',
        'HERA.CRM.CORE.MODULE.v1'
      )
    })
  })

  describe('DELETE - Deprovision Tenant', () => {
    it('should deprovision tenant successfully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      // Mock organization membership check
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { role: 'owner' }
      })

      ;(provisioningService.deprovisionTenant as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Tenant deprovisioned successfully'
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning?organizationId=org-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(provisioningService.deprovisionTenant).toHaveBeenCalledWith('org-123')
    })

    it('should prevent non-owners from deprovisioning', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      // Mock non-owner membership
      mockSupabase.from().select().eq().eq().single.mockResolvedValue({
        data: { role: 'member' }
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning?organizationId=org-123', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Only organization owners can deprovision')
    })
  })

  describe('GET - Check Subdomain / Get Tenant Info', () => {
    it('should check subdomain availability', async () => {
      ;(provisioningService.checkSubdomainAvailability as jest.Mock).mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/v1/provisioning?action=check&subdomain=newbusiness', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.available).toBe(true)
      expect(provisioningService.checkSubdomainAvailability).toHaveBeenCalledWith('newbusiness')
    })

    it('should validate subdomain format', async () => {
      const request = new NextRequest('http://localhost/api/v1/provisioning?action=check&subdomain=Invalid_Subdomain!', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid subdomain format')
    })

    it('should get tenant info by subdomain', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const mockTenantInfo = {
        organization: {
          id: 'org-123',
          name: 'SK Cuts',
          subdomain: 'skcuts'
        },
        modules: ['HERA.SALON.POS.MODULE.v1'],
        users: 5,
        status: 'active'
      }

      ;(provisioningService.getTenantInfo as jest.Mock).mockResolvedValue(mockTenantInfo)

      const request = new NextRequest('http://localhost/api/v1/provisioning?subdomain=skcuts', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockTenantInfo)
      expect(provisioningService.getTenantInfo).toHaveBeenCalledWith('skcuts')
    })
  })

  describe('Error Handling', () => {
    it('should handle provisioning service errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      ;(provisioningService.provisionTenant as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationName: 'Test Org',
          organizationCode: 'TEST',
          subdomain: 'test',
          industryType: 'general',
          country: 'US',
          ownerEmail: 'test@example.com',
          ownerName: 'Test Owner'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database connection failed')
    })

    it('should handle invalid JSON in request body', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })

      const request = new NextRequest('http://localhost/api/v1/provisioning', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json'
        },
        body: 'Invalid JSON'
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})