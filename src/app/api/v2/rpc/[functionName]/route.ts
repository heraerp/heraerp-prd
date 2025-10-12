/**
 * Universal RPC Endpoint
 * Allows calling any Postgres RPC function through the API
 * Smart Code: HERA.API.V2.RPC.UNIVERSAL.V1
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ functionName: string }> }
) {
  try {
    // ✅ Next.js 15: Await params before using
    const { functionName } = await params
    const body = await request.json()

    console.log(`[RPC] Calling function: ${functionName}`, {
      params: Object.keys(body)
    })

    // Call the RPC function
    const { data, error } = await supabase.rpc(functionName, body)

    if (error) {
      console.error(`[RPC] Error calling ${functionName}:`, error)
      return NextResponse.json(
        { error: error.message || 'RPC call failed' },
        { status: 400 }
      )
    }

    console.log(`[RPC] Success calling ${functionName}:`, {
      resultCount: Array.isArray(data) ? data.length : 'single result'
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[RPC] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
