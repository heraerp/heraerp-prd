/**
 * Test helpers for mocking Supabase and other dependencies
 */

export interface MockChain {
  select: jest.Mock
  eq: jest.Mock
  in: jest.Mock
  ilike: jest.Mock
  gte: jest.Mock
  lte: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  single: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  or: jest.Mock
  neq: jest.Mock
  is: jest.Mock
  not: jest.Mock
}

export function createMockSupabaseChain(): MockChain {
  const mockChain: MockChain = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    ilike: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    or: jest.fn(),
    neq: jest.fn(),
    is: jest.fn(),
    not: jest.fn()
  }

  // Make each method return the chain for chaining, except terminal methods
  const terminalMethods = ['single', 'limit']
  Object.keys(mockChain).forEach(key => {
    if (!terminalMethods.includes(key)) {
      ;(mockChain as any)[key].mockReturnThis()
    }
  })

  return mockChain
}

export function createMockSupabase() {
  const mockChain = createMockSupabaseChain()

  const mockSupabase = {
    from: jest.fn((tableName: string) => {
      // Return a fresh chain for each table
      return mockChain
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      })
    },
    rpc: jest.fn(),
    storage: {
      from: jest.fn()
    }
  }

  return { mockSupabase, mockChain }
}

export function setupSupabaseMocks() {
  const { mockSupabase, mockChain } = createMockSupabase()

  // Mock both versions of Supabase
  jest.doMock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => mockSupabase)
  }))

  jest.doMock('@supabase/ssr', () => ({
    createServerClient: jest.fn(() => mockSupabase)
  }))

  return { mockSupabase, mockChain }
}

// Helper to set up a successful query response
export function mockSuccessfulQuery(mockChain: MockChain, data: any) {
  // For limit queries (lists)
  mockChain.limit.mockImplementation(() => Promise.resolve({ data, error: null }))
  // For single queries
  mockChain.single.mockImplementation(() =>
    Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error: null })
  )
  // Also handle direct resolution for chains that might not use limit/single
  mockChain.eq.mockImplementation(() => Promise.resolve({ data, error: null }))
  mockChain.select.mockImplementation(() => mockChain)
  mockChain.order.mockImplementation(() => mockChain)
}

// Helper to set up an error response
export function mockErrorQuery(mockChain: MockChain, error: string) {
  mockChain.limit.mockImplementation(() =>
    Promise.resolve({ data: null, error: { message: error } })
  )
  mockChain.single.mockImplementation(() =>
    Promise.resolve({ data: null, error: { message: error } })
  )
}

// Helper to reset all mocks
export function resetSupabaseMocks() {
  jest.clearAllMocks()
  jest.resetModules()
}

// Helper for complex multi-table queries
export function createMockSupabaseMultiTable() {
  const chains = new Map<string, MockChain>()

  const mockSupabase = {
    from: jest.fn((tableName: string) => {
      if (!chains.has(tableName)) {
        chains.set(tableName, createMockSupabaseChain())
      }
      return chains.get(tableName)!
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null
      })
    },
    rpc: jest.fn(),
    storage: {
      from: jest.fn()
    }
  }

  return { mockSupabase, chains }
}
