/**
 * Supabase Functions Client
 * Wrapper for calling Supabase Edge Functions
 */

import { getSupabase } from './client'

export interface FunctionCallOptions {
  mode?: 'rpc' | 'edge'
  timeout?: number
}

export async function callFunction(
  functionName: string,
  params: Record<string, any> = {},
  options: FunctionCallOptions = {}
) {
  try {
    const supabase = getSupabase()
    
    if (options.mode === 'rpc') {
      // Call RPC function
      const { data, error } = await supabase.rpc(functionName, params)
      
      if (error) {
        console.error(`RPC function ${functionName} failed:`, error)
        return { success: false, error: error.message, data: null }
      }
      
      return { success: true, data, error: null }
    } else {
      // Call Edge function
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params
      })
      
      if (error) {
        console.error(`Edge function ${functionName} failed:`, error)
        return { success: false, error: error.message, data: null }
      }
      
      return { success: true, data, error: null }
    }
  } catch (error) {
    console.error(`Function ${functionName} call failed:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null 
    }
  }
}