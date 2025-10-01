/**
 * Universal Entity Hook - Test Suite
 * Testing with Product entity CRUD operations
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUniversalEntity } from '../useUniversalEntity'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { ReactNode } from 'react'

// Mock auth hook
jest.mock('@/components/auth/HERAAuthProvider')

// Mock fetch
global.fetch = jest.fn()

const mockAuth = {
  organization: {
    id: 'test-org-123',
    name: 'Test Organization'
  }
}

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useUniversalEntity Hook - Product CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useHERAAuth as jest.Mock).mockReturnValue(mockAuth)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Reading Products', () => {
    it('should fetch products with pagination', async () => {
      const mockProducts = {
        success: true,
        data: [
          {
            id: 'product-1',
            entity_type: 'product',
            entity_name: 'Shampoo',
            entity_code: 'SHMP-001',
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
            dynamic_data: {
              price: 79.99,
              brand: 'HERA Pro'
            }
          }
        ],
        pagination: {
          total: 2,
          limit: 100,
          offset: 0
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.entities).toEqual([])

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.entities).toHaveLength(2)
      expect(result.current.entities[0].entity_name).toBe('Shampoo')
      expect(result.current.pagination?.total).toBe(2)
      expect(result.current.error).toBeUndefined()

      // Verify fetch was called correctly
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/entities?entity_type=product')
      )
    })

    it('should handle fetch errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch' })
      })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to fetch entities')
      expect(result.current.entities).toEqual([])
    })
  })

  describe('Creating Products', () => {
    it('should create a product with dynamic fields', async () => {
      const newProduct = {
        entity_type: 'product',
        entity_name: 'New Shampoo',
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
        dynamic_fields: {
          price: {
            value: 99.99,
            type: 'number' as const,
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
          },
          brand: {
            value: 'HERA Premium',
            type: 'text' as const,
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1'
          }
        }
      }

      const mockResponse = {
        success: true,
        data: {
          entity_id: 'new-product-123',
          ...newProduct
        }
      }

      // Mock initial fetch
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })
        // Mock create request
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })
        // Mock refetch after create
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [mockResponse.data], 
            pagination: { total: 1 } 
          })
        })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Create product
      const created = await result.current.create(newProduct)

      expect(created.success).toBe(true)
      expect(created.data.entity_id).toBe('new-product-123')

      // Verify POST request
      expect(fetch).toHaveBeenCalledWith(
        '/api/v2/entities',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newProduct)
        })
      )

      // Verify refetch was triggered
      await waitFor(() => {
        expect(result.current.entities).toHaveLength(1)
      })
    })

    it('should handle creation errors', async () => {
      const newProduct = {
        entity_type: 'product',
        entity_name: 'Bad Product',
        smart_code: 'INVALID_CODE'
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid smart code format' })
        })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Attempt to create with bad data
      await expect(result.current.create(newProduct)).rejects.toThrow(
        'Invalid smart code format'
      )
    })
  })

  describe('Updating Products', () => {
    it('should update product fields', async () => {
      const updateData = {
        entity_id: 'product-123',
        entity_name: 'Updated Shampoo',
        dynamic_fields: {
          price: {
            value: 109.99,
            type: 'number' as const,
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
          }
        }
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Updated' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.update(updateData)

      expect(fetch).toHaveBeenCalledWith(
        '/api/v2/entities',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      )
    })
  })

  describe('Deleting/Archiving Products', () => {
    it('should archive product (soft delete)', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [{ id: 'product-123' }], pagination: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Archived' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.archive('product-123')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/entities/product-123?hard_delete=false'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    it('should hard delete product', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Permanently deleted' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [], pagination: {} })
        })

      const { result } = renderHook(
        () => useUniversalEntity({ entity_type: 'product' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await result.current.delete({ entity_id: 'product-123', hard_delete: true })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v2/entities/product-123?hard_delete=true'),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('Hook Configuration', () => {
    it('should respect filter configuration', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], pagination: {} })
      })

      renderHook(
        () => useUniversalEntity({ 
          entity_type: 'product',
          filters: {
            status: 'archived',
            limit: 50,
            offset: 10,
            include_dynamic: false
          }
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })

      const url = (fetch as jest.Mock).mock.calls[0][0]
      expect(url).toContain('status=archived')
      expect(url).toContain('limit=50')
      expect(url).toContain('offset=10')
      expect(url).toContain('include_dynamic=false')
    })
  })
})