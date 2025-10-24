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
      params: Object.keys(body),
      p_action: body.p_action,
      p_options: body.p_options,
      include_dynamic: body.p_options?.include_dynamic,
      include_relationships: body.p_options?.include_relationships,
      fullBody: body
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
      resultCount: Array.isArray(data) ? data.length : 'single result',
      dataType: typeof data,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
      hasItems: !!(data as any)?.items,
      hasData: !!(data as any)?.data,
      itemsCount: (data as any)?.items?.length || (data as any)?.data?.length || 0,
      sampleData: data,
      // 🔍 DEEP DIVE: Check if dynamic_data exists in nested structure
      firstListItem: (data as any)?.data?.list?.[0],
      firstListItemKeys: (data as any)?.data?.list?.[0] ? Object.keys((data as any).data.list[0]) : null,
      hasDynamicDataInFirst: !!(data as any)?.data?.list?.[0]?.dynamic_data
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
