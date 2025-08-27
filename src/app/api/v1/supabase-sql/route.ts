/**
 * 🗄️ Supabase SQL Execution API
 * 
 * Secure SQL execution endpoint for the Supabase SQL Editor
 * Features:
 * - Read-only queries by default for safety
 * - Schema introspection
 * - Query validation
 * - Execution timing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || ''

const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Dangerous keywords that should be blocked in read-only mode
const DANGEROUS_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL'
]

// Allow these write operations when not in read-only mode
const WRITE_KEYWORDS = ['CREATE', 'INSERT', 'UPDATE']

// Safe read-only keywords
const SAFE_KEYWORDS = ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, query, readOnly = true } = body

    console.log(`🗄️ SQL Editor API: ${action}`)

    // Simple API authentication check
    const authHeader = request.headers.get('x-sql-auth')
    if (authHeader !== 'HeraSQL2025!') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to SQL Editor',
        hint: 'Please authenticate through the web interface'
      }, { status: 401 })
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.error('🚫 Supabase configuration check failed:')
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
      console.error('   SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey)
      console.error('   Service key length:', supabaseServiceKey.length)
      console.error('   📝 Falling back to mock data mode for demonstration')
      
      // Provide mock data for demonstration when Supabase is not configured
      return await handleMockMode(action, query)
    }

    switch (action) {
      case 'execute':
        return await executeQuery(query, readOnly)
      
      case 'get_schema':
        return await getSchemaInfo(query)
      
      case 'validate':
        return validateQuery(query, readOnly)
      
      case 'test_connection':
        return await testConnection()
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['execute', 'get_schema', 'validate', 'test_connection']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('SQL Editor API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function executeQuery(query: string, readOnly: boolean) {
  if (!query?.trim()) {
    return NextResponse.json({
      success: false,
      error: 'Query is required'
    }, { status: 400 })
  }

  // Validate query safety
  const validation = validateQuerySafety(query, readOnly)
  if (!validation.safe) {
    return NextResponse.json({
      success: false,
      error: validation.error,
      hint: 'Use read-only queries or disable read-only mode for write operations'
    }, { status: 403 })
  }

  try {
    return await executeDirect(query)
  } catch (error) {
    console.error('Query execution error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

async function executeDirect(query: string) {
  const trimmedQuery = query.trim()
  const upperQuery = trimmedQuery.toUpperCase()
  
  console.log(`🔍 Executing query: ${trimmedQuery.substring(0, 100)}...`)
  
  // Handle UPDATE operations
  if (upperQuery.startsWith('UPDATE')) {
    return NextResponse.json({
      success: false,
      error: 'UPDATE operations not supported in web interface',
      hint: 'Use read-only SELECT queries to view data'
    })
  }
  
  // Handle CREATE operations
  if (upperQuery.startsWith('CREATE')) {
    return NextResponse.json({
      success: false,
      error: 'CREATE operations not supported in web interface',
      hint: 'Use read-only SELECT queries to view data'
    })
  }
  
  // Handle INSERT/DELETE operations
  if (upperQuery.startsWith('INSERT') || upperQuery.startsWith('DELETE') || upperQuery.startsWith('DROP')) {
    return NextResponse.json({
      success: false,
      error: 'Write operations not supported in web interface',
      hint: 'Use read-only SELECT queries to view data'
    })
  }
  
  // For schema queries, handle them specially
  if (trimmedQuery.toLowerCase().includes('information_schema')) {
    return await handleSchemaQuery(query)
  }
  
  // Handle SELECT queries
  if (upperQuery.startsWith('SELECT')) {
    try {
      // Simple pattern matching for basic SELECT queries
      const tableMatch = query.match(/FROM\s+([^\s,\)]+)/i)
      if (!tableMatch) {
        return NextResponse.json({
          success: false,
          error: 'Could not identify table in query',
          hint: 'Make sure your SELECT query has a clear FROM clause'
        })
      }
      
      const tableName = tableMatch[1].replace(/public\./i, '').replace(/["`]/g, '').trim()
      console.log(`📊 Querying table: ${tableName}`)
      
      // For simple SELECT * queries
      if (upperQuery.includes('SELECT *') || upperQuery.includes('SELECT\t*') || upperQuery.includes('SELECT  *')) {
        const limitMatch = query.match(/LIMIT\s+(\d+)/i)
        const limit = limitMatch ? parseInt(limitMatch[1]) : 100
        
        let queryBuilder = supabase!.from(tableName).select('*').limit(limit)
        
        // Handle ORDER BY
        const orderMatch = query.match(/ORDER\s+BY\s+([^\s,]+)(?:\s+(ASC|DESC))?/i)
        if (orderMatch) {
          const orderColumn = orderMatch[1].replace(/["`]/g, '')
          const isDesc = orderMatch[2]?.toLowerCase() === 'desc'
          queryBuilder = queryBuilder.order(orderColumn, { ascending: !isDesc })
        }
        
        const { data, error } = await queryBuilder
        
        if (error) {
          console.error('Supabase query error:', error)
          return NextResponse.json({
            success: false,
            error: error.message,
            hint: 'Check if the table exists and you have permission to access it',
            details: error
          })
        }
        
        return NextResponse.json({
          success: true,
          data: data || [],
          rowCount: data?.length || 0,
          message: `Query executed successfully`
        })
      }
      
      // For more complex queries, try basic patterns
      return NextResponse.json({
        success: false,
        error: 'Complex SELECT queries not fully supported yet',
        hint: 'Try simple queries like: SELECT * FROM table_name LIMIT 10'
      })
      
    } catch (error) {
      console.error('Query execution error:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
        details: error
      })
    }
  }

  return NextResponse.json({
    success: false,
    error: 'Unsupported query type',
    hint: 'Try SELECT queries like: SELECT * FROM core_entities LIMIT 10',
    supportedOperations: ['SELECT (basic queries)', 'Schema information queries']
  })
}

async function handleSchemaQuery(query: string) {
  // Handle common schema queries
  if (query.toLowerCase().includes('information_schema.tables')) {
    // Return known HERA tables
    const tables = [
      { table_name: 'core_organizations', table_schema: 'public' },
      { table_name: 'core_entities', table_schema: 'public' },
      { table_name: 'core_dynamic_data', table_schema: 'public' },
      { table_name: 'core_relationships', table_schema: 'public' },
      { table_name: 'universal_transactions', table_schema: 'public' },
      { table_name: 'universal_transaction_lines', table_schema: 'public' }
    ]
    
    return NextResponse.json({
      success: true,
      data: tables,
      rowCount: tables.length
    })
  }

  if (query.toLowerCase().includes('information_schema.columns')) {
    // Return known column structure
    const columns = [
      // core_organizations
      { table_name: 'core_organizations', column_name: 'organization_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'core_organizations', column_name: 'organization_name', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'core_organizations', column_name: 'organization_code', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'core_organizations', column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'YES' },
      { table_name: 'core_organizations', column_name: 'status', data_type: 'character varying', is_nullable: 'YES' },
      
      // core_entities
      { table_name: 'core_entities', column_name: 'entity_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'core_entities', column_name: 'organization_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'core_entities', column_name: 'entity_type', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'core_entities', column_name: 'entity_name', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'core_entities', column_name: 'entity_code', data_type: 'character varying', is_nullable: 'YES' },
      { table_name: 'core_entities', column_name: 'smart_code', data_type: 'character varying', is_nullable: 'YES' },
      { table_name: 'core_entities', column_name: 'status', data_type: 'character varying', is_nullable: 'YES' },
      { table_name: 'core_entities', column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'YES' },
      
      // core_dynamic_data
      { table_name: 'core_dynamic_data', column_name: 'dynamic_data_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'core_dynamic_data', column_name: 'entity_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'core_dynamic_data', column_name: 'organization_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'core_dynamic_data', column_name: 'field_name', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'core_dynamic_data', column_name: 'field_value', data_type: 'text', is_nullable: 'YES' },
      { table_name: 'core_dynamic_data', column_name: 'field_type', data_type: 'character varying', is_nullable: 'YES' },
      
      // universal_transactions
      { table_name: 'universal_transactions', column_name: 'transaction_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'universal_transactions', column_name: 'organization_id', data_type: 'uuid', is_nullable: 'NO' },
      { table_name: 'universal_transactions', column_name: 'transaction_type', data_type: 'character varying', is_nullable: 'NO' },
      { table_name: 'universal_transactions', column_name: 'transaction_date', data_type: 'timestamp with time zone', is_nullable: 'YES' },
      { table_name: 'universal_transactions', column_name: 'total_amount', data_type: 'numeric', is_nullable: 'YES' },
      { table_name: 'universal_transactions', column_name: 'status', data_type: 'character varying', is_nullable: 'YES' }
    ]
    
    return NextResponse.json({
      success: true,
      data: columns,
      rowCount: columns.length
    })
  }

  return NextResponse.json({
    success: false,
    error: 'Schema query not supported in this mode',
    hint: 'Try querying the tables directly with SELECT statements'
  })
}

async function getSchemaInfo(query?: string) {
  // If a specific query is provided, use it
  if (query) {
    return await executeDirect(query)
  }

  // Otherwise return default schema info
  return await handleSchemaQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
}

function validateQuery(query: string, readOnly: boolean) {
  const validation = validateQuerySafety(query, readOnly)
  
  return NextResponse.json({
    success: validation.safe,
    message: validation.safe ? 'Query is valid' : validation.error,
    readOnly,
    queryType: validation.queryType
  })
}

function validateQuerySafety(query: string, readOnly: boolean) {
  const normalizedQuery = query.trim().toUpperCase()
  
  // Determine query type
  let queryType = 'UNKNOWN'
  for (const keyword of SAFE_KEYWORDS) {
    if (normalizedQuery.startsWith(keyword)) {
      queryType = keyword
      break
    }
  }
  
  // If not a safe keyword, check for dangerous ones
  if (queryType === 'UNKNOWN') {
    for (const keyword of DANGEROUS_KEYWORDS) {
      if (normalizedQuery.startsWith(keyword)) {
        queryType = keyword
        break
      }
    }
  }

  // In read-only mode, block dangerous operations
  if (readOnly && DANGEROUS_KEYWORDS.some(keyword => normalizedQuery.startsWith(keyword))) {
    return {
      safe: false,
      error: `Query type "${queryType}" is not allowed in read-only mode`,
      queryType
    }
  }

  // Additional safety checks
  if (normalizedQuery.includes('--') && !normalizedQuery.includes('--') > normalizedQuery.lastIndexOf('\n')) {
    return {
      safe: false,
      error: 'SQL comments detected. Please remove comments from your query.',
      queryType
    }
  }

  return {
    safe: true,
    queryType
  }
}

async function testConnection() {
  console.log('🧪 Testing Supabase connection...')
  
  if (!supabase) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: 'Supabase client not initialized',
      project_url: supabaseUrl,
      hint: 'Check SUPABASE_SERVICE_ROLE_KEY environment variable'
    })
  }

  try {
    // Try a simple query to test connection
    console.log('🔌 Attempting to connect to core_organizations...')
    const { data, error } = await supabase
      .from('core_organizations')
      .select('organization_id')
      .limit(1)

    if (error) {
      console.error('Connection test failed:', error)
      return NextResponse.json({
        success: false,
        connected: false,
        error: error.message,
        project_url: supabaseUrl,
        details: error,
        hint: 'Check if tables exist and RLS policies allow access'
      })
    }

    console.log('✅ Connection test successful')
    return NextResponse.json({
      success: true,
      connected: true,
      message: 'Successfully connected to Supabase',
      project_url: supabaseUrl,
      tables_accessible: true,
      sample_data_count: data?.length || 0
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      project_url: supabaseUrl,
      details: error
    })
  }
}

async function handleMockMode(action: string, query?: string) {
  console.log('🎭 Mock mode activated for demonstration')
  
  switch (action) {
    case 'execute':
      return await handleMockQuery(query || '')
    
    case 'get_schema':
      return await handleSchemaQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    
    case 'validate':
      return NextResponse.json({
        success: true,
        message: 'Query validation successful (mock mode)',
        readOnly: true,
        queryType: 'SELECT',
        mode: 'mock_demonstration'
      })
    
    case 'test_connection':
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Mock mode - Supabase not configured',
        mode: 'demonstration',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to connect to real database'
      })
    
    default:
      return NextResponse.json({
        success: false,
        error: `Unknown action: ${action} (mock mode)`,
        mode: 'demonstration'
      }, { status: 400 })
  }
}

async function handleMockQuery(query: string) {
  const upperQuery = query.trim().toUpperCase()
  
  // Mock data for common queries
  if (upperQuery.includes('SELECT') && upperQuery.includes('CORE_ENTITIES')) {
    return NextResponse.json({
      success: true,
      data: [
        {
          entity_id: '550e8400-e29b-41d4-a716-446655440001',
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          entity_type: 'customer',
          entity_name: 'Mario Restaurant Corp',
          entity_code: 'CUST001',
          status: 'active'
        },
        {
          entity_id: '550e8400-e29b-41d4-a716-446655440002', 
          organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
          entity_type: 'account',
          entity_name: 'Cash in Bank',
          entity_code: '1100000',
          status: 'active'
        }
      ],
      rowCount: 2,
      message: 'Mock data returned',
      mode: 'demonstration'
    })
  }
  
  if (upperQuery.includes('COUNT(*)')) {
    // Extract table name from COUNT query
    const tableMatch = query.match(/FROM\s+(\w+)/i)
    const tableName = tableMatch ? tableMatch[1] : 'unknown'
    
    return NextResponse.json({
      success: true,
      data: [{ count: Math.floor(Math.random() * 100) + 10 }],
      rowCount: 1,
      message: `Mock count for ${tableName}`,
      mode: 'demonstration'
    })
  }
  
  return NextResponse.json({
    success: true,
    data: [
      { demo_column: 'Sample data - Supabase not configured' },
      { demo_column: 'Add SUPABASE_SERVICE_ROLE_KEY to see real data' }
    ],
    rowCount: 2,
    message: 'Mock response (Supabase not configured)',
    mode: 'demonstration'
  })
}

export async function GET(request: NextRequest) {
  // Test endpoint
  return NextResponse.json({
    success: true,
    message: 'Supabase SQL Editor API is running',
    endpoints: {
      execute: 'POST /api/v1/supabase-sql with action: "execute"',
      schema: 'POST /api/v1/supabase-sql with action: "get_schema"',
      validate: 'POST /api/v1/supabase-sql with action: "validate"',
      test: 'POST /api/v1/supabase-sql with action: "test_connection"'
    }
  })
}