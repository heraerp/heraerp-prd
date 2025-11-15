/**
 * HERA Universal Tile System - Tile Stats API Integration Tests
 * End-to-end testing of tile statistics endpoint and query execution
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v2/tiles/[tileId]/stats/route'

// Mock data
const MOCK_ORG_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_TILE_ID = '00000000-0000-0000-0000-000000000002'
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000003'

const mockTileConfig = {
  tileId: MOCK_TILE_ID,
  workspaceId: 'workspace-1',
  templateId: 'template-1',
  tileType: 'ENTITIES',
  operationCategory: 'data_management',
  enabled: true,
  
  ui: {
    title: 'Customer Analytics',
    subtitle: 'Customer data insights',
    icon: 'BarChart3',
    color: '#10B981'
  },
  
  layout: {
    size: 'medium',
    position: 1
  },
  
  conditions: [],
  
  stats: [
    {
      statId: 'total-customers',
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
    },
    {
      statId: 'revenue-ytd',
      label: 'Revenue YTD',
      query: {
        table: 'universal_transactions',
        operation: 'sum',
        field: 'total_amount',
        conditions: [
          { field: 'transaction_type', operator: 'equals', value: 'SALE' },
          { field: 'transaction_date', operator: 'date_after', value: '{{year_start}}' }
        ]
      },
      format: 'currency',
      isPrivate: false
    },
    {
      statId: 'conversion-rate',
      label: 'Conversion Rate',
      query: {
        table: 'core_entities',
        operation: 'custom',
        customQuery: `
          SELECT 
            (COUNT(*) FILTER (WHERE entity_type = 'CUSTOMER') * 100.0 / 
             NULLIF(COUNT(*) FILTER (WHERE entity_type = 'LEAD'), 0)) as value
          FROM core_entities 
          WHERE organization_id = $1
        `,
        conditions: []
      },
      format: 'percentage',
      isPrivate: false
    }
  ],
  
  actions: []
}

const mockQueryResults = {
  'total-customers': [{ count: 1250 }],
  'revenue-ytd': [{ sum: 485750.25 }],
  'conversion-rate': [{ value: 23.4 }]
}

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn()
}

// Mock modules
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue(mockSupabase)
}))

vi.mock('@/lib/tiles/use-resolved-tiles', () => ({
  getResolvedTileConfig: vi.fn().mockResolvedValue(mockTileConfig)
}))

vi.mock('@/lib/tiles/dsl-evaluator', () => ({
  DSLEvaluator: vi.fn().mockImplementation(() => ({
    resolveValue: vi.fn().mockImplementation((value, context) => {
      if (value === '{{year_start}}') return '2024-01-01T00:00:00Z'
      if (value === '{{current_time}}') return '2024-12-15T10:30:00Z'
      return value
    }),
    evaluateConditions: vi.fn().mockReturnValue(true)
  }))
}))

// Mock request helper
function createMockRequest(
  method: 'GET' | 'POST',
  params: { tileId: string },
  body?: any,
  searchParams: Record<string, string> = {}
): NextRequest {
  const url = new URL(`http://localhost/api/v2/tiles/${params.tileId}/stats`)
  
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const options: RequestInit = {
    method,
    headers: {
      'authorization': `Bearer mock-jwt-token`,
      'x-organization-id': MOCK_ORG_ID,
      'content-type': 'application/json'
    }
  }

  if (body && method === 'POST') {
    options.body = JSON.stringify(body)
  }

  return new NextRequest(url, options)
}

describe('Tile Stats API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default Supabase mocks
    mockSupabase.single.mockResolvedValue({
      data: { id: MOCK_TILE_ID },
      error: null
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/v2/tiles/[tileId]/stats', () => {
    it('successfully executes and returns formatted statistics', async () => {
      // Mock query execution
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'core_entities') {
          return {
            ...mockSupabase,
            then: (callback: any) => callback({
              data: mockQueryResults['total-customers'],
              error: null
            })
          }
        } else if (table === 'universal_transactions') {
          return {
            ...mockSupabase,
            then: (callback: any) => callback({
              data: mockQueryResults['revenue-ytd'],
              error: null
            })
          }
        }
        return mockSupabase
      })

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.stats)).toBe(true)
      expect(data.stats).toHaveLength(2) // Regular queries (excluding custom)

      // Check formatted results
      const totalCustomersStat = data.stats.find((s: any) => s.statId === 'total-customers')
      expect(totalCustomersStat).toBeDefined()
      expect(totalCustomersStat.value).toBe(1250)
      expect(totalCustomersStat.formattedValue).toBe('1,250')
      expect(totalCustomersStat.format).toBe('number')
      expect(typeof totalCustomersStat.executionTime).toBe('number')

      const revenueStat = data.stats.find((s: any) => s.statId === 'revenue-ytd')
      expect(revenueStat).toBeDefined()
      expect(revenueStat.value).toBe(485750.25)
      expect(revenueStat.formattedValue).toBe('$485,750.25')
      expect(revenueStat.format).toBe('currency')
    })

    it('handles custom queries with RPC calls', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockQueryResults['conversion-rate'],
        error: null
      })

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'execute_custom_stat_query',
        expect.objectContaining({
          p_query: expect.stringContaining('SELECT'),
          p_organization_id: MOCK_ORG_ID
        })
      )

      const conversionStat = data.stats.find((s: any) => s.statId === 'conversion-rate')
      expect(conversionStat).toBeDefined()
      expect(conversionStat.value).toBe(23.4)
      expect(conversionStat.formattedValue).toBe('23.4%')
      expect(conversionStat.format).toBe('percentage')
    })

    it('applies context filters from query parameters', async () => {
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        then: (callback: any) => callback({
          data: [{ count: 150 }], // Different result with filters
          error: null
        })
      }))

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { 
          organization_id: MOCK_ORG_ID,
          timeRange: 'last_30_days',
          filterBy: 'status:active'
        }
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Should pass context to DSL evaluator for variable resolution
      const { DSLEvaluator } = await import('@/lib/tiles/dsl-evaluator')
      const evaluatorInstance = new DSLEvaluator()
      expect(evaluatorInstance.resolveValue).toHaveBeenCalled()
    })

    it('handles query execution errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        then: (callback: any) => callback({
          data: null,
          error: { message: 'Query execution failed', code: 'QUERY_ERROR' }
        })
      }))

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Should return partial results with error indicators
      const statsWithErrors = data.stats.filter((s: any) => s.error)
      expect(statsWithErrors.length).toBeGreaterThan(0)
      
      statsWithErrors.forEach((stat: any) => {
        expect(stat.error).toMatchObject({
          code: expect.any(String),
          message: expect.any(String)
        })
        expect(stat.value).toBe(null)
        expect(stat.formattedValue).toBe('Error')
      })
    })

    it('returns 404 when tile not found', async () => {
      const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
      vi.mocked(getResolvedTileConfig).mockResolvedValue(null)

      const request = createMockRequest(
        'GET',
        { tileId: 'nonexistent-tile' },
        undefined,
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { tileId: 'nonexistent-tile' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('TILE_NOT_FOUND')
    })

    it('returns 400 when organization_id is missing', async () => {
      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID }
        // No organization_id in searchParams
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('MISSING_ORGANIZATION_ID')
    })

    it('includes execution metadata in response', async () => {
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        then: (callback: any) => callback({
          data: [{ count: 100 }],
          error: null
        })
      }))

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { organization_id: MOCK_ORG_ID }
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata).toBeDefined()
      expect(data.metadata.tileId).toBe(MOCK_TILE_ID)
      expect(data.metadata.organizationId).toBe(MOCK_ORG_ID)
      expect(typeof data.metadata.executionTime).toBe('number')
      expect(typeof data.metadata.totalStats).toBe('number')
      expect(typeof data.metadata.successfulStats).toBe('number')
      expect(typeof data.metadata.failedStats).toBe('number')
    })
  })

  describe('POST /api/v2/tiles/[tileId]/stats (Refresh)', () => {
    it('successfully refreshes stats and invalidates cache', async () => {
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        then: (callback: any) => callback({
          data: [{ count: 1300 }], // Updated count
          error: null
        })
      }))

      const request = createMockRequest(
        'POST',
        { tileId: MOCK_TILE_ID },
        {
          organization_id: MOCK_ORG_ID,
          forceRefresh: true
        }
      )

      const response = await POST(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.refreshed).toBe(true)
      expect(Array.isArray(data.stats)).toBe(true)

      // Should show updated results
      const stat = data.stats[0]
      expect(stat.value).toBe(1300)
      expect(stat.formattedValue).toBe('1,300')
    })

    it('handles partial refresh when some queries fail', async () => {
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        return {
          ...mockSupabase,
          then: (callback: any) => {
            if (callCount === 1) {
              // First query succeeds
              return callback({ data: [{ count: 500 }], error: null })
            } else {
              // Second query fails
              return callback({ data: null, error: { message: 'Timeout' } })
            }
          }
        }
      })

      const request = createMockRequest(
        'POST',
        { tileId: MOCK_TILE_ID },
        {
          organization_id: MOCK_ORG_ID,
          forceRefresh: true
        }
      )

      const response = await POST(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.refreshed).toBe(true)
      
      // Should have mix of successful and failed stats
      const successfulStats = data.stats.filter((s: any) => !s.error)
      const failedStats = data.stats.filter((s: any) => s.error)
      
      expect(successfulStats.length).toBeGreaterThan(0)
      expect(failedStats.length).toBeGreaterThan(0)
    })

    it('validates request body', async () => {
      const request = createMockRequest(
        'POST',
        { tileId: MOCK_TILE_ID },
        {} // Missing required fields
      )

      const response = await POST(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_REQUEST_BODY')
    })
  })

  describe('Performance and Caching', () => {
    it('executes queries in parallel for better performance', async () => {
      const queryTimes: number[] = []
      
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        then: async (callback: any) => {
          const startTime = Date.now()
          // Simulate query execution time
          await new Promise(resolve => setTimeout(resolve, 50))
          queryTimes.push(Date.now() - startTime)
          
          return callback({ data: [{ count: 100 }], error: null })
        }
      }))

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { organization_id: MOCK_ORG_ID }
      )

      const startTime = Date.now()
      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const totalTime = Date.now() - startTime

      expect(response.status).toBe(200)
      
      // Total time should be less than sum of individual queries (parallel execution)
      const sumOfQueryTimes = queryTimes.reduce((sum, time) => sum + time, 0)
      expect(totalTime).toBeLessThan(sumOfQueryTimes * 0.8) // Allow some overhead
    })

    it('includes cache information in metadata', async () => {
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        then: (callback: any) => callback({
          data: [{ count: 100 }],
          error: null
        })
      }))

      const request = createMockRequest(
        'GET',
        { tileId: MOCK_TILE_ID },
        undefined,
        { 
          organization_id: MOCK_ORG_ID,
          useCache: 'true'
        }
      )

      const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.metadata.cached).toBeDefined()
      expect(typeof data.metadata.cached).toBe('boolean')
    })
  })

  describe('Different Query Operations', () => {
    const operationTests = [
      {
        operation: 'sum',
        field: 'total_amount',
        expectedResult: { sum: 125000.50 },
        expectedValue: 125000.50
      },
      {
        operation: 'avg',
        field: 'total_amount',
        expectedResult: { avg: 850.25 },
        expectedValue: 850.25
      },
      {
        operation: 'min',
        field: 'total_amount',
        expectedResult: { min: 10.00 },
        expectedValue: 10.00
      },
      {
        operation: 'max',
        field: 'total_amount',
        expectedResult: { max: 5000.00 },
        expectedValue: 5000.00
      },
      {
        operation: 'count_distinct',
        field: 'entity_type',
        expectedResult: { count: 5 },
        expectedValue: 5
      }
    ]

    operationTests.forEach(({ operation, field, expectedResult, expectedValue }) => {
      it(`handles ${operation} operation correctly`, async () => {
        const mockTileWithOperation = {
          ...mockTileConfig,
          stats: [
            {
              statId: `test-${operation}`,
              label: `Test ${operation}`,
              query: {
                table: 'universal_transactions',
                operation,
                field: field,
                conditions: []
              },
              format: operation === 'count_distinct' ? 'number' : 'currency',
              isPrivate: false
            }
          ]
        }

        const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
        vi.mocked(getResolvedTileConfig).mockResolvedValue(mockTileWithOperation)

        mockSupabase.from.mockImplementation(() => ({
          ...mockSupabase,
          then: (callback: any) => callback({
            data: [expectedResult],
            error: null
          })
        }))

        const request = createMockRequest(
          'GET',
          { tileId: MOCK_TILE_ID },
          undefined,
          { organization_id: MOCK_ORG_ID }
        )

        const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.stats).toHaveLength(1)
        expect(data.stats[0].value).toBe(expectedValue)
      })
    })
  })

  describe('Value Formatting', () => {
    const formatTests = [
      {
        format: 'currency',
        value: 1234.56,
        expectedFormatted: '$1,234.56'
      },
      {
        format: 'number',
        value: 1234567,
        expectedFormatted: '1,234,567'
      },
      {
        format: 'percentage',
        value: 0.1234,
        expectedFormatted: '12.34%'
      },
      {
        format: 'duration',
        value: 3661, // seconds
        expectedFormatted: '1h 1m 1s'
      },
      {
        format: 'relative_time',
        value: '2024-01-15T10:00:00Z',
        expectedFormatted: '5 days ago'
      }
    ]

    formatTests.forEach(({ format, value, expectedFormatted }) => {
      it(`formats ${format} values correctly`, async () => {
        const mockResult = format === 'currency' ? { sum: value } : 
                          format === 'number' ? { count: value } :
                          format === 'percentage' ? { avg: value } :
                          { value }

        mockSupabase.from.mockImplementation(() => ({
          ...mockSupabase,
          then: (callback: any) => callback({
            data: [mockResult],
            error: null
          })
        }))

        const mockTileWithFormat = {
          ...mockTileConfig,
          stats: [
            {
              statId: 'format-test',
              label: `${format} Test`,
              query: {
                table: 'core_entities',
                operation: 'count',
                conditions: []
              },
              format,
              isPrivate: false
            }
          ]
        }

        const { getResolvedTileConfig } = await import('@/lib/tiles/use-resolved-tiles')
        vi.mocked(getResolvedTileConfig).mockResolvedValue(mockTileWithFormat)

        const request = createMockRequest(
          'GET',
          { tileId: MOCK_TILE_ID },
          undefined,
          { organization_id: MOCK_ORG_ID }
        )

        const response = await GET(request, { params: { tileId: MOCK_TILE_ID } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.stats[0].formattedValue).toBe(expectedFormatted)
      })
    })
  })
})