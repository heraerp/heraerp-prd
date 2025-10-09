/**
 * HERA RPC Client - Simplified wrapper for Supabase RPC calls
 * Provides a consistent interface for calling PostgreSQL functions
 */

import { getSupabase } from '@/lib/supabase'

/**
 * Call a PostgreSQL RPC function with parameters
 * @param functionName - Name of the PostgreSQL function to call
 * @param params - Parameters to pass to the function
 * @param options - Additional options for the RPC call
 * @returns Promise with the RPC result
 */
export async function callRPC(
  functionName: string,
  params: Record<string, any> = {},
  options: { mode?: 'service' | 'user'; timeout?: number } = {}
) {
  try {
    const supabase = getSupabase()
    
    // Call the RPC function with parameters
    const { data, error } = await supabase.rpc(functionName, params)
    
    if (error) {
      console.error(`RPC call failed for ${functionName}:`, error)
      throw new Error(`RPC call failed: ${error.message}`)
    }
    
    return {
      success: true,
      data,
      function_name: functionName,
      execution_time: Date.now()
    }
  } catch (error) {
    console.error(`RPC client error for ${functionName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown RPC error',
      function_name: functionName
    }
  }
}

/**
 * Legacy compatibility function for existing code
 */
export { callRPC as rpcCall }

/**
 * Batch RPC calls - execute multiple RPC functions
 */
export async function batchRPC(
  calls: Array<{ functionName: string; params: Record<string, any> }>
) {
  const results = await Promise.allSettled(
    calls.map(({ functionName, params }) => callRPC(functionName, params))
  )
  
  return results.map((result, index) => ({
    functionName: calls[index].functionName,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value.data : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }))
}

export default { callRPC, batchRPC }