/**
 * Universal API v2 - CRUD Tests
 * Testing with Product entity as example
 */

import { NextRequest } from 'next/server'
import { POST, GET, PUT } from '../route'
import { DELETE } from '../[id]/route'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Mock dependencies
jest.mock('@/lib/supabase-service')
jest.mock('@/lib/auth/verify-auth')

const mockSupabase = {
  rpc: jest.fn()
}

const mockAuth = {
  organizationId: 'test-org-123',
  userId: 'test-user-456'
}

describe('Universal API v2 - Product CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSupabaseService as jest.Mock).mockReturnValue(mockSupabase)
    ;(verifyAuth as jest.Mock).mockResolvedValue(mockAuth)
  })

  describe('POST /api/v2/entities - Create Product', () => {
    it('should create a product with dynamic fields', async () => {
      // Mock successful entity creation
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'product-uuid-123',
            entity_type: 'product',
            entity_name: 'Test Shampoo',
            entity_code: 'SHMP-001',
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1'
          }
        }
      })

      // Mock successful dynamic field creation
      mockSupabase.rpc.mockResolvedValue({ data: { success: true } })

      const productData = {
        entity_type: 'product',
        entity_name: 'Test Shampoo',
        entity_code: 'SHMP-001',
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
        metadata: {
          category: 'Hair Care'
        },
        dynamic_fields: {
          price: {
            value: 89.99,
            type: 'number',
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
          },
          brand: {
            value: 'HERA Professional',
            type: 'text',
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/v2/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      const response = await POST(request)
      const result = await response.json()

      // Verify auth was checked
      expect(verifyAuth).toHaveBeenCalledWith(request)

      // Verify entity creation RPC was called correctly
      expect(mockSupabase.rpc).toHaveBeenCalledWith('hera_entity_upsert_v1', {
        p_org_id: 'test-org-123',
        p_entity_type: 'product',
        p_entity_name: 'Test Shampoo',
        p_smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
        p_entity_code: 'SHMP-001',
        p_metadata: { category: 'Hair Care' }
      })

      // Verify dynamic fields were created
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'hera_dynamic_data_set_v1',
        expect.objectContaining({
          p_organization_id: 'test-org-123',
          p_entity_id: 'product-uuid-123',
          p_field_name: 'price',
          p_field_type: 'number',
          p_field_value_number: 89.99,
          p_smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
        })
      )

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'hera_dynamic_data_set_v1',
        expect.objectContaining({
          p_field_name: 'brand',
          p_field_type: 'text',
          p_field_value_text: 'HERA Professional'
        })
      )

      // Verify response
      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.data.entity_id).toBe('product-uuid-123')
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        entity_type: 'product'
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/v2/entities', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid entity data')
      expect(result.details).toBeDefined()
    })

    it('should handle unauthorized access', async () => {
      ;(verifyAuth as jest.Mock).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/v2/entities', {
        method: 'POST',
        body: JSON.stringify({ entity_type: 'product' })
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('GET /api/v2/entities - Read Products', () => {
    it('should fetch products with dynamic data', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          entities: [
            {
              id: 'product-1',
              entity_type: 'product',
              entity_name: 'Shampoo',
              entity_code: 'SHMP-001',
              smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
              dynamic_data: {
                price: 89.99,
                brand: 'HERA Pro'
              }
            },
            {
              id: 'product-2',
              entity_type: 'product',
              entity_name: 'Conditioner',
              entity_code: 'COND-001',
              smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
              dynamic_data: {
                price: 79.99,
                brand: 'HERA Pro'
              }
            }
          ],
          total_count: 2
        }
      })

      const request = new NextRequest(
        'http://localhost:3000/api/v2/entities?entity_type=product&limit=10'
      )

      const response = await GET(request)
      const result = await response.json()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('hera_entity_read_v1', {
        p_organization_id: 'test-org-123',
        p_entity_id: null,
        p_entity_type: 'product',
        p_status: 'active',
        p_include_relationships: false,
        p_include_dynamic_data: true,
        p_limit: 10,
        p_offset: 0
      })

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].entity_name).toBe('Shampoo')
      expect(result.data[0].dynamic_data.price).toBe(89.99)
      expect(result.pagination.total).toBe(2)
    })

    it('should handle empty results', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          entities: [],
          total_count: 0
        }
      })

      const request = new NextRequest('http://localhost:3000/api/v2/entities?entity_type=product')

      const response = await GET(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('PUT /api/v2/entities - Update Product', () => {
    it('should update product and dynamic fields', async () => {
      // Mock successful entity update
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true }
      })

      // Mock successful dynamic field updates
      mockSupabase.rpc.mockResolvedValue({ data: { success: true } })

      const updateData = {
        entity_id: 'product-uuid-123',
        entity_type: 'product',
        entity_name: 'Updated Shampoo',
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
        dynamic_fields: {
          price: {
            value: 99.99,
            type: 'number',
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/v2/entities', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const result = await response.json()

      // Verify entity update
      expect(mockSupabase.rpc).toHaveBeenCalledWith('hera_entity_upsert_v1', {
        p_org_id: 'test-org-123',
        p_entity_id: 'product-uuid-123',
        p_entity_type: 'product',
        p_entity_name: 'Updated Shampoo',
        p_smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
        p_entity_code: undefined,
        p_metadata: undefined
      })

      // Verify dynamic field update
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'hera_dynamic_data_set_v1',
        expect.objectContaining({
          p_organization_id: 'test-org-123',
          p_entity_id: 'product-uuid-123',
          p_field_name: 'price',
          p_field_value_number: 99.99
        })
      )

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })
  })

  describe('DELETE /api/v2/entities/[id] - Delete Product', () => {
    it('should soft delete product by default', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          deleted_count: 1
        }
      })

      const request = new NextRequest('http://localhost:3000/api/v2/entities/product-uuid-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'product-uuid-123' } })
      const result = await response.json()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('hera_entity_delete_v1', {
        p_organization_id: 'test-org-123',
        p_entity_id: 'product-uuid-123',
        p_hard_delete: false,
        p_cascade: true
      })

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Entity archived successfully')
    })

    it('should handle hard delete when specified', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          deleted_count: 1
        }
      })

      const request = new NextRequest(
        'http://localhost:3000/api/v2/entities/product-uuid-123?hard_delete=true',
        { method: 'DELETE' }
      )

      const response = await DELETE(request, { params: { id: 'product-uuid-123' } })
      const result = await response.json()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('hera_entity_delete_v1', {
        p_organization_id: 'test-org-123',
        p_entity_id: 'product-uuid-123',
        p_hard_delete: true,
        p_cascade: true
      })

      expect(result.message).toBe('Entity permanently deleted')
    })

    it('should validate UUID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/entities/invalid-id', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'invalid-id' } })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid entity ID')
    })
  })
})
