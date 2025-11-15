/**
 * HERA Universal Tile System - Resolved Tiles API Integration Tests
 * End-to-end testing of the resolved tiles endpoint and data flow
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v2/workspaces/[workspaceId]/tiles/resolved/route'

// Mock environment variables
const MOCK_SUPABASE_URL = 'https://test.supabase.co'
const MOCK_SUPABASE_KEY = 'mock-service-role-key'
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_WORKSPACE_ID = '00000000-0000-0000-0000-000000000002'
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000003'

// Mock Supabase client
const mockSupabaseData = {
  workspaceQuery: [
    {
      id: MOCK_WORKSPACE_ID,
      entity_name: 'Test Workspace',
      entity_type: 'APP_WORKSPACE',
      organization_id: MOCK_ORG_ID,
      created_by: MOCK_USER_ID
    }
  ],
  templatesQuery: [
    {
      id: 'template-1',
      entity_name: 'Entities Template',
      entity_type: 'APP_TILE_TEMPLATE',
      organization_id: MOCK_ORG_ID,
      template_data: {
        tileType: 'ENTITIES',
        operationCategory: 'data_management',
        ui: {
          title: 'Entity Management',
          subtitle: 'Manage entity records',
          icon: 'Database',
          color: '#3B82F6'
        },
        layout: {
          size: 'medium',
          position: 1
        },
        conditions: [],
        stats: [
          {
            statId: 'total-entities',
            label: 'Total Entities',
            query: {
              table: 'core_entities',
              operation: 'count',
              conditions: []
            },
            format: 'number',
            isPrivate: false
          }
        ],
        actions: [
          {
            actionId: 'view-entities',
            label: 'View All',
            icon: 'Eye',
            actionType: 'NAVIGATE',
            isPrimary: true,
            requiresConfirmation: false,
            requiresPermission: false,
            route: '/entities',
            parameters: {}
          }
        ]
      }
    }
  ],
  tilesQuery: [
    {
      id: 'tile-1',
      entity_name: 'Customer Entities',
      entity_type: 'APP_WORKSPACE_TILE',
      organization_id: MOCK_ORG_ID,
      enabled: true,
      template_id: 'template-1',
      workspace_id: MOCK_WORKSPACE_ID,
      tile_data: {
        ui: {
          title: 'Customer Records',
          subtitle: 'Manage customer data'
        },
        layout: {
          size: 'large'
        },
        conditions: [
          {
            field: 'user.role',
            operator: 'equals',
            value: 'admin'
          }
        ],
        stats: [
          {
            statId: 'total-entities',
            label: 'Total Customers',
            query: {
              table: 'core_entities',
              operation: 'count',
              conditions: [
                { field: 'entity_type', operator: 'equals', value: 'CUSTOMER' }
              ]
            },
            format: 'number',
            isPrivate: false
          }
        ],
        actions: [
          {
            actionId: 'view-entities',
            label: 'View Customers',
            icon: 'Eye',
            actionType: 'NAVIGATE',
            isPrimary: true,
            requiresConfirmation: false,
            requiresPermission: false,
            route: '/customers',
            parameters: { type: 'CUSTOMER' }
          }
        ]
      }
    }
  ]
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn()
}

// Mock Next.js request
function createMockRequest(params: { workspaceId: string }, searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL(`http://localhost/api/v2/workspaces/${params.workspaceId}/tiles/resolved`)
  
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return new NextRequest(url, {
    method: 'GET',
    headers: {
      'authorization': `Bearer mock-jwt-token`,
      'x-organization-id': MOCK_ORG_ID
    }
  })
}

// Mock module imports
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabase)
}))

vi.mock('@/lib/tiles/dsl-evaluator', () => ({
  DSLEvaluator: vi.fn().mockImplementation(() => ({
    evaluateConditions: vi.fn().mockReturnValue(true),
    resolveValue: vi.fn().mockImplementation((value) => value)
  }))
}))

describe('Resolved Tiles API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock responses
    mockSupabase.single.mockImplementation(() => {
      return Promise.resolve({
        data: mockSupabaseData.workspaceQuery[0],
        error: null
      })
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/v2/workspaces/[workspaceId]/tiles/resolved', () => {
    it('successfully returns resolved tiles for valid workspace', async () => {
      // Mock database responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
            // Template query
            return {
              ...mockSupabase,
              single: () => Promise.resolve({ data: null, error: null }),
              then: (callback: any) => callback({
                data: mockSupabaseData.templatesQuery,
                error: null
              })
            }
          } else if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('tile_data'))) {
            // Tiles query
            return {
              ...mockSupabase,
              single: () => Promise.resolve({ data: null, error: null }),
              then: (callback: any) => callback({
                data: mockSupabaseData.tilesQuery,
                error: null
              })
            }
          } else {
            // Workspace query
            return {
              ...mockSupabase,
              single: () => Promise.resolve({
                data: mockSupabaseData.workspaceQuery[0],
                error: null
              })
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tiles).toBeDefined()
      expect(Array.isArray(data.tiles)).toBe(true)
      expect(data.tiles).toHaveLength(1)

      const tile = data.tiles[0]
      expect(tile.tileId).toBe('tile-1')
      expect(tile.workspaceId).toBe(MOCK_WORKSPACE_ID)
      expect(tile.templateId).toBe('template-1')
      expect(tile.tileType).toBe('ENTITIES')
      expect(tile.enabled).toBe(true)
      
      // Check merged UI properties
      expect(tile.ui.title).toBe('Customer Records') // Overridden from workspace tile
      expect(tile.ui.subtitle).toBe('Manage customer data') // Overridden from workspace tile
      expect(tile.ui.icon).toBe('Database') // Inherited from template
      expect(tile.ui.color).toBe('#3B82F6') // Inherited from template
      
      // Check merged layout
      expect(tile.layout.size).toBe('large') // Overridden from workspace tile
      expect(tile.layout.position).toBe(1) // Inherited from template
      
      // Check merged stats
      expect(tile.stats).toHaveLength(1)
      expect(tile.stats[0].statId).toBe('total-entities')
      expect(tile.stats[0].label).toBe('Total Customers') // Overridden
      
      // Check merged actions
      expect(tile.actions).toHaveLength(1)
      expect(tile.actions[0].actionId).toBe('view-entities')
      expect(tile.actions[0].label).toBe('View Customers') // Overridden
      expect(tile.actions[0].route).toBe('/customers') // Overridden
      expect(tile.actions[0].parameters).toEqual({ type: 'CUSTOMER' }) // Overridden
    })

    it('returns 404 when workspace not found', async () => {
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({
          data: null,
          error: { message: 'Workspace not found', code: 'PGRST116' }
        })
      })

      const request = createMockRequest(
        { workspaceId: 'nonexistent-workspace' },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: 'nonexistent-workspace' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('WORKSPACE_NOT_FOUND')
    })

    it('returns 400 when organization_id is missing', async () => {
      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID }
        // No organization_id in searchParams
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('MISSING_ORGANIZATION_ID')
    })

    it('filters tiles based on conditions', async () => {
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const mockEvaluator = new DSLEvaluator()
      
      // Mock evaluateConditions to return false (tile should be filtered out)
      vi.mocked(mockEvaluator.evaluateConditions).mockReturnValue(false)

      // Setup database responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: mockSupabaseData.templatesQuery, error: null })
              } else {
                return callback({ data: mockSupabaseData.tilesQuery, error: null })
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tiles).toHaveLength(0) // Tile filtered out due to condition
    })

    it('handles disabled tiles correctly', async () => {
      const disabledTile = {
        ...mockSupabaseData.tilesQuery[0],
        enabled: false
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: mockSupabaseData.templatesQuery, error: null })
              } else {
                return callback({ data: [disabledTile], error: null })
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tiles).toHaveLength(0) // Disabled tile filtered out
    })

    it('handles templates without matching workspace tiles', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: mockSupabaseData.templatesQuery, error: null })
              } else {
                return callback({ data: [], error: null }) // No workspace tiles
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tiles).toHaveLength(0) // No tiles without workspace instances
    })

    it('handles database connection errors', async () => {
      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({
          data: null,
          error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
        })
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATABASE_ERROR')
    })

    it('includes metadata in response', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: mockSupabaseData.templatesQuery, error: null })
              } else {
                return callback({ data: mockSupabaseData.tilesQuery, error: null })
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata).toBeDefined()
      expect(data.metadata.workspaceId).toBe(MOCK_WORKSPACE_ID)
      expect(data.metadata.organizationId).toBe(MOCK_ORG_ID)
      expect(data.metadata.totalTiles).toBe(1)
      expect(data.metadata.enabledTiles).toBe(1)
      expect(typeof data.metadata.executionTime).toBe('number')
    })

    it('sorts tiles by position correctly', async () => {
      const multipleTemplates = [
        {
          ...mockSupabaseData.templatesQuery[0],
          id: 'template-1',
          template_data: {
            ...mockSupabaseData.templatesQuery[0].template_data,
            layout: { size: 'medium', position: 3 }
          }
        },
        {
          ...mockSupabaseData.templatesQuery[0],
          id: 'template-2',
          template_data: {
            ...mockSupabaseData.templatesQuery[0].template_data,
            tileType: 'ANALYTICS',
            layout: { size: 'medium', position: 1 }
          }
        }
      ]

      const multipleTiles = [
        {
          ...mockSupabaseData.tilesQuery[0],
          id: 'tile-1',
          template_id: 'template-1',
          tile_data: {
            ...mockSupabaseData.tilesQuery[0].tile_data,
            layout: { position: 3 }
          }
        },
        {
          ...mockSupabaseData.tilesQuery[0],
          id: 'tile-2',
          template_id: 'template-2',
          tile_data: {
            ...mockSupabaseData.tilesQuery[0].tile_data,
            layout: { position: 1 }
          }
        }
      ]

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: multipleTemplates, error: null })
              } else {
                return callback({ data: multipleTiles, error: null })
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tiles).toHaveLength(2)
      expect(data.tiles[0].layout.position).toBe(1) // Should be first
      expect(data.tiles[1].layout.position).toBe(3) // Should be second
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed tile data gracefully', async () => {
      const malformedTile = {
        ...mockSupabaseData.tilesQuery[0],
        tile_data: null // Malformed data
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: mockSupabaseData.templatesQuery, error: null })
              } else {
                return callback({ data: [malformedTile], error: null })
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tiles).toHaveLength(0) // Malformed tile filtered out
    })

    it('handles templates with missing data gracefully', async () => {
      const templateWithoutData = {
        ...mockSupabaseData.templatesQuery[0],
        template_data: null
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            single: () => Promise.resolve({
              data: mockSupabaseData.workspaceQuery[0],
              error: null
            }),
            then: (callback: any) => {
              if (mockSupabase.select.mock.calls.some(call => call[0]?.includes('template_data'))) {
                return callback({ data: [templateWithoutData], error: null })
              } else {
                return callback({ data: mockSupabaseData.tilesQuery, error: null })
              }
            }
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tiles).toHaveLength(0) // Template without data produces no tiles
    })

    it('validates organization_id in workspace', async () => {
      const workspaceInDifferentOrg = {
        ...mockSupabaseData.workspaceQuery[0],
        organization_id: 'different-org-id'
      }

      mockSupabase.single.mockImplementation(() => {
        return Promise.resolve({
          data: workspaceInDifferentOrg,
          error: null
        })
      })

      const request = createMockRequest(
        { workspaceId: MOCK_WORKSPACE_ID },
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { workspaceId: MOCK_WORKSPACE_ID } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('ACCESS_DENIED')
    })
  })
})