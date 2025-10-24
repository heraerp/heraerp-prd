/**
 * useUniversalEntityV2 Hook Tests
 *
 * Tests the unified RPC-based entity management hook
 */

import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useUniversalEntityV2 } from '@/hooks/useUniversalEntityV2'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

// Mock HERAAuth
vi.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: () => ({
    organization: { id: 'test-org-id' },
    user: { id: 'test-user-id' }
  })
}))

describe('useUniversalEntityV2', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  // ============================================================================
  // READ Tests
  // ============================================================================

  describe('READ operations', () => {
    it('should fetch entities using hera_entities_crud_v2 RPC', async () => {
      const mockEntities = {
        data: {
          data: [
            {
              id: 'entity-1',
              entity_type: 'STOCK_LEVEL',
              entity_name: 'Stock Level 1',
              smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
              dynamic_fields: {
                quantity: {
                  field_type: 'number',
                  field_value_number: 50,
                  smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
                }
              }
            }
          ]
        }
      }

      ;(supabase.rpc as any).mockResolvedValueOnce(mockEntities)

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL',
            organizationId: 'test-org-id'
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify RPC was called with correct parameters
      expect(supabase.rpc).toHaveBeenCalledWith('hera_entities_crud_v2', {
        p_action: 'READ',
        p_actor_user_id: 'test-user-id',
        p_organization_id: 'test-org-id',
        p_entity: {
          entity_type: 'STOCK_LEVEL'
        },
        p_options: {
          include_dynamic: true,
          include_relationships: false,
          limit: 100,
          offset: 0,
          status_filter: null
        }
      })

      // Verify entities are transformed correctly
      expect(result.current.entities).toHaveLength(1)
      expect(result.current.entities[0]).toMatchObject({
        id: 'entity-1',
        entity_type: 'STOCK_LEVEL',
        entity_name: 'Stock Level 1',
        quantity: 50 // Dynamic field flattened
      })
    })

    it('should include relationships when requested', async () => {
      const mockEntities = {
        data: {
          data: [
            {
              id: 'entity-1',
              entity_type: 'STOCK_LEVEL',
              entity_name: 'Stock Level 1',
              relationships: [
                {
                  relationship_type: 'STOCK_OF_PRODUCT',
                  to_entity_id: 'product-1',
                  smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1'
                }
              ]
            }
          ]
        }
      }

      ;(supabase.rpc as any).mockResolvedValueOnce(mockEntities)

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL',
            filters: { include_relationships: true }
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(supabase.rpc).toHaveBeenCalledWith(
        'hera_entities_crud_v2',
        expect.objectContaining({
          p_options: expect.objectContaining({
            include_relationships: true
          })
        })
      )

      expect(result.current.entities[0].relationships).toBeDefined()
      expect(result.current.entities[0].relationships.STOCK_OF_PRODUCT).toHaveLength(1)
    })
  })

  // ============================================================================
  // CREATE Tests
  // ============================================================================

  describe('CREATE operations', () => {
    it('should create entity with dynamic fields and relationships in single RPC call', async () => {
      const mockCreateResponse = {
        data: {
          data: {
            entity_id: 'new-entity-id'
          }
        }
      }

      ;(supabase.rpc as any)
        .mockResolvedValueOnce({ data: { data: [] } }) // Initial fetch
        .mockResolvedValueOnce(mockCreateResponse) // Create

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL',
            dynamicFields: [
              {
                name: 'quantity',
                type: 'number',
                smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
              }
            ],
            relationships: [
              {
                type: 'STOCK_OF_PRODUCT',
                smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1'
              }
            ]
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Perform create
      await act(async () => {
        await result.current.create({
          entity_type: 'STOCK_LEVEL',
          entity_name: 'Test Stock Level',
          smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
          dynamic_fields: {
            quantity: {
              value: 50,
              type: 'number',
              smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
            }
          },
          relationships: {
            STOCK_OF_PRODUCT: ['product-uuid']
          }
        })
      })

      // Verify single RPC call with all data
      expect(supabase.rpc).toHaveBeenCalledWith('hera_entities_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: 'test-user-id',
        p_organization_id: 'test-org-id',
        p_entity: {
          entity_type: 'STOCK_LEVEL',
          entity_name: 'Test Stock Level',
          entity_code: undefined,
          smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
          metadata: undefined,
          status: 'active'
        },
        p_dynamic: {
          quantity: {
            field_type: 'number',
            field_value_number: 50,
            smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
          }
        },
        p_relationships: [
          {
            to_entity_id: 'product-uuid',
            relationship_type: 'STOCK_OF_PRODUCT',
            smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1'
          }
        ]
      })
    })

    it('should handle create with multiple relationships', async () => {
      const mockCreateResponse = {
        data: {
          data: {
            entity_id: 'new-entity-id'
          }
        }
      }

      ;(supabase.rpc as any)
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce(mockCreateResponse)

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL',
            relationships: [
              {
                type: 'STOCK_OF_PRODUCT',
                smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1'
              },
              {
                type: 'STOCK_AT_LOCATION',
                smart_code: 'HERA.SALON.INV.REL.STOCKATLOCATION.V1'
              }
            ]
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.create({
          entity_type: 'STOCK_LEVEL',
          entity_name: 'Test Stock Level',
          smart_code: 'HERA.SALON.INV.ENTITY.STOCKLEVEL.V1',
          relationships: {
            STOCK_OF_PRODUCT: ['product-uuid'],
            STOCK_AT_LOCATION: ['location-uuid']
          }
        })
      })

      const createCall = (supabase.rpc as any).mock.calls.find(
        call => call[1].p_action === 'CREATE'
      )

      expect(createCall[1].p_relationships).toHaveLength(2)
      expect(createCall[1].p_relationships).toEqual(
        expect.arrayContaining([
          {
            to_entity_id: 'product-uuid',
            relationship_type: 'STOCK_OF_PRODUCT',
            smart_code: 'HERA.SALON.INV.REL.STOCKOFPRODUCT.V1'
          },
          {
            to_entity_id: 'location-uuid',
            relationship_type: 'STOCK_AT_LOCATION',
            smart_code: 'HERA.SALON.INV.REL.STOCKATLOCATION.V1'
          }
        ])
      )
    })
  })

  // ============================================================================
  // UPDATE Tests
  // ============================================================================

  describe('UPDATE operations', () => {
    it('should update entity with dynamic fields in single RPC call', async () => {
      const mockUpdateResponse = {
        data: {
          data: {
            entity_id: 'entity-1'
          }
        }
      }

      ;(supabase.rpc as any)
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce(mockUpdateResponse)

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL',
            dynamicFields: [
              {
                name: 'quantity',
                type: 'number',
                smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
              }
            ]
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.update({
          entity_id: 'entity-1',
          dynamic_patch: {
            quantity: 75
          }
        })
      })

      const updateCall = (supabase.rpc as any).mock.calls.find(
        call => call[1].p_action === 'UPDATE'
      )

      expect(updateCall[1]).toMatchObject({
        p_action: 'UPDATE',
        p_actor_user_id: 'test-user-id',
        p_organization_id: 'test-org-id',
        p_entity: {
          id: 'entity-1'
        },
        p_dynamic: {
          quantity: {
            field_type: 'number',
            field_value_number: 75,
            smart_code: 'HERA.SALON.INV.DYN.QTY.V1'
          }
        }
      })
    })
  })

  // ============================================================================
  // DELETE Tests
  // ============================================================================

  describe('DELETE operations', () => {
    it('should delete entity with audit trail', async () => {
      const mockDeleteResponse = {
        data: {
          success: true
        }
      }

      ;(supabase.rpc as any)
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce(mockDeleteResponse)

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL'
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.delete({
          entity_id: 'entity-1',
          reason: 'Test deletion'
        })
      })

      const deleteCall = (supabase.rpc as any).mock.calls.find(
        call => call[1].p_action === 'DELETE'
      )

      expect(deleteCall[1]).toMatchObject({
        p_action: 'DELETE',
        p_actor_user_id: 'test-user-id',
        p_organization_id: 'test-org-id',
        p_entity: {
          id: 'entity-1'
        },
        p_options: {
          delete_reason: 'Test deletion',
          cascade_delete: false,
          hard_delete: false
        }
      })
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should make only 1 RPC call for create with all data', async () => {
      const mockResponse = {
        data: {
          data: {
            entity_id: 'new-entity-id'
          }
        }
      }

      ;(supabase.rpc as any)
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(
        () =>
          useUniversalEntityV2({
            entity_type: 'STOCK_LEVEL',
            dynamicFields: [
              { name: 'quantity', type: 'number', smart_code: 'TEST.QTY.V1' },
              { name: 'reorder_level', type: 'number', smart_code: 'TEST.REORDER.V1' }
            ],
            relationships: [
              { type: 'STOCK_OF_PRODUCT', smart_code: 'TEST.PRODUCT.V1' },
              { type: 'STOCK_AT_LOCATION', smart_code: 'TEST.LOCATION.V1' }
            ]
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Clear mock to count only create call
      vi.clearAllMocks()

      await act(async () => {
        await result.current.create({
          entity_type: 'STOCK_LEVEL',
          entity_name: 'Test',
          smart_code: 'TEST.V1',
          dynamic_fields: {
            quantity: { value: 50, type: 'number', smart_code: 'TEST.QTY.V1' },
            reorder_level: { value: 10, type: 'number', smart_code: 'TEST.REORDER.V1' }
          },
          relationships: {
            STOCK_OF_PRODUCT: ['prod-1'],
            STOCK_AT_LOCATION: ['loc-1']
          }
        })
      })

      // Verify ONLY 2 RPC calls were made (CREATE + auto-refetch)
      // V1 would make 5+ calls (entity + 2 dynamic fields + 2 relationships)
      expect(supabase.rpc).toHaveBeenCalledTimes(2)
    })
  })
})
