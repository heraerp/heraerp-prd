/**
 * Database utility functions for HERA
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Execute a SQL query and return a single value
 * Used for calling stored functions that return a single result
 */
export async function selectValue<T = any>(sql: string, params: any[] = []): Promise<T> {
  // Convert the SQL with params to a function call
  // This is a simplified version - you may need to adjust based on your DB setup
  const { data, error } = await supabase.rpc('exec_sql', {
    query: sql,
    params: params
  })

  if (error) {
    console.error('Database error:', error)
    throw new Error(error.message)
  }

  // Return the first value from the result
  return data?.[0]?.value || data?.[0]?.[Object.keys(data[0])[0]]
}

/**
 * Alternative approach using direct RPC if the functions are exposed
 */
export async function callFunction(
  functionName: string,
  params: Record<string, any>
): Promise<any> {
  const { data, error } = await supabase.rpc(functionName, params)

  if (error) {
    console.error(`Error calling ${functionName}:`, error)
    throw new Error(error.message)
  }

  return data
}

// Alias for RPC calls
export const rpc = callFunction

// Add selectRows and selectRow functions for raw SQL queries
export async function selectRows(sql: string, params: any[] = []): Promise<any[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: sql,
    params: params
  })

  if (error) {
    console.error('Database error:', error)
    throw new Error(error.message)
  }

  return data || []
}

export async function selectRow(sql: string, params: any[] = []): Promise<any> {
  const rows = await selectRows(sql, params)
  return rows[0] || null
}
